/** @format */

const sculptureModel = require("../models/sculptureModel");
const shardModel = require("../models/shardModel");
// Import OpenAI API client
const OpenAI = require("openai");
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// ----------------------------------------------------------------------------------------------------
// #region Generate Prompt
// ----------------------------------------------------------------------------------------------------
async function helperGenerateSculpturePrompt(userId) {
	console.log("helperGenerateSculpturePrompt: Fetching shards for user", userId);
	const shards = await shardModel.getShardsByUserId(userId);
	if (!shards || shards.length === 0) {
		console.log("helperGenerateSculpturePrompt: No shards found for user", userId);
		return null;
	}
	console.log("helperGenerateSculpturePrompt: Assembling shards into prompt");
	let assembledShards = shards
		.filter((shard) => shard.text && shard.text.trim() && shard.spark && shard.spark.trim())
		.map((shard) => `Q: ${shard.spark.trim()}\nA: ${shard.text.trim()}`)
		.join("\n\n");

	const personalityPrompt = `Pretend that you are an expert psychologist and create a personality analysis regarding strengths, weaknesses, and character traits with the response being 600 characters or less from the following questions and answers:\n${assembledShards}`;

	let personalityAnalysis = "";
	try {
		console.log("helperGenerateSculpturePrompt: Sending prompt to OpenAI");
		const response = await openai.chat.completions.create({
			model: "gpt-5-nano",
			messages: [{ role: "user", content: personalityPrompt }],
		});
		personalityAnalysis = response.choices[0].message.content;
		console.log("helperGenerateSculpturePrompt: Received personality analysis from OpenAI");
	} catch (apiError) {
		console.error("OpenAI API error:", apiError);
		personalityAnalysis = "Error generating personality analysis.";
	}

	// Compute dominant shard tint (most frequent non-zero tint value)
	const tintColorNames = {
		1: "white and pearl",
		2: "warm red and crimson",
		3: "amber and orange",
		4: "golden yellow",
		5: "emerald green",
		6: "sapphire blue",
		7: "deep indigo and violet",
		8: "amethyst and violet",
	};
	const tintCounts = {};
	shards.forEach((shard) => {
		const t = parseInt(shard.tint) || 0;
		if (t > 0) tintCounts[t] = (tintCounts[t] || 0) + 1;
	});
	const tintEntries = Object.entries(tintCounts);
	let colorModifier = "";
	if (tintEntries.length > 0) {
		const dominantTint = tintEntries.sort((a, b) => b[1] - a[1])[0][0];
		colorModifier = `, tinted with ${tintColorNames[dominantTint]} hues`;
	}

	const sculpturePrompt = `Abstract glass sculpture: transparent crystalline glass, clear refractive facets, glass-like translucency, light-bending surfaces${colorModifier}. Personality-driven form: ${personalityAnalysis}`;

	console.log("helperGenerateSculpturePrompt: Final sculpture prompt assembled");
	return {
		prompt: sculpturePrompt,
		personalityAnalysis: personalityAnalysis,
	};
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Create
// ----------------------------------------------------------------------------------------------------
const createSculpture = async (req, res) => {
	try {
		console.log("createSculpture: Starting sculpture creation");
		const userId = req.user?.id;

		if (!userId) {
			console.log("createSculpture: No userId found, authentication required");
			return res.status(401).json({ error: "Authentication required" });
		}

		const promptData = await helperGenerateSculpturePrompt(userId);

		if (!promptData) {
			console.log("createSculpture: No prompt generated, cannot proceed");
			return res.status(400).json({ error: "Unable to generate sculpture prompt. Please add some journal entries first." });
		}

		const { prompt: sculpturePrompt, personalityAnalysis } = promptData;

		console.log("createSculpture: Sending preview request to Meshy");
		const payload = {
			mode: "preview",
			prompt: sculpturePrompt,
			negative_prompt: "opaque, painted, matte, ceramic, plastic, solid color, metallic, rubber, monochromatic, grey, gray, silver",
			art_style: "realistic",
			should_remesh: true,
		};

		const response = await fetch("https://api.meshy.ai/openapi/v2/text-to-3d", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("createSculpture: Meshy API error", response.status, errorText);
			return res.status(response.status).json({
				error: `Meshy API error: ${response.status}`,
				message: errorText,
			});
		}

		const previewResult = await response.json();
		console.log("createSculpture: Meshy preview task started, taskId:", previewResult.result);

		// Save sculpture record immediately with status "processing"
		console.log("createSculpture: Saving sculpture record to database");
		const sculptureData = {
			prompt: sculpturePrompt,
			personalityAnalysis: personalityAnalysis,
			meshyTaskId: previewResult.result,
			refineTaskId: null,
			modelUrl: null,
			thumbnailUrl: null,
			status: "processing",
		};

		const sculpture = await sculptureModel.createSculpture(userId, sculptureData);
		console.log("createSculpture: Sculpture record saved, id:", sculpture.id);

		// Start background polling (fire and forget - don't await)
		pollSculptureTasksInBackground(sculpture.id, previewResult.result).catch((err) => {
			console.error("Background polling error for sculpture", sculpture.id, ":", err);
		});

		// Return immediately to client
		res.json(sculpture);
	} catch (error) {
		console.error("Error creating sculpture:", error);
		res.status(500).json({
			error: "Failed to create sculpture",
			message: error.message,
		});
	}
};

const createRefinedSculpture = async (req, res) => {
	try {
		console.log("createRefinedSculpture: Starting refinement for sculpture", req.params.sculptureId);
		const { sculptureId } = req.params;
		const userId = req.user?.id;

		if (!userId) {
			console.log("createRefinedSculpture: No userId found, authentication required");
			return res.status(401).json({ error: "Authentication required" });
		}

		const sculpture = await sculptureModel.getSculptureById(sculptureId);

		if (!sculpture || sculpture.user_id !== userId) {
			console.log("createRefinedSculpture: Sculpture not found or user mismatch");
			return res.status(404).json({ error: "Sculpture not found" });
		}

		console.log("createRefinedSculpture: Sending refine request to Meshy");
		const refineResult = await refineMeshyModel(sculpture.meshyTaskId);

		console.log("createRefinedSculpture: Updating sculpture record with refineTaskId");
		const updatedSculpture = await sculptureModel.updateSculpture(sculptureId, {
			refineTaskId: refineResult.result,
			status: "refining",
		});

		console.log("createRefinedSculpture: Refinement started for sculpture", sculptureId);
		res.json(updatedSculpture);
	} catch (error) {
		console.error("Error refining sculpture:", error);
		res.status(500).json({
			error: "Failed to refine sculpture",
			message: error.message,
		});
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Read
// ----------------------------------------------------------------------------------------------------
const readSculptures = async (req, res) => {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: "Authentication required" });
		}

		const sculptures = await sculptureModel.getSculpturesByUserId(userId);
		res.json(sculptures);
	} catch (error) {
		console.error("Error fetching sculptures:", error);
		res.status(500).json({ error: "Failed to fetch sculptures" });
	}
};

const readSculptureStatus = async (req, res) => {
	try {
		const { taskId } = req.params;
		const status = await getMeshyTaskStatus(taskId);
		res.json(status);
	} catch (error) {
		console.error("Error getting sculpture status:", error);
		res.status(500).json({
			error: "Failed to get sculpture status",
			message: error.message,
		});
	}
};

const readPublicFeed = async (req, res) => {
	try {
		const sculptures = await sculptureModel.getPublicFeed();
		res.json(sculptures);
	} catch (error) {
		console.error("Error fetching public feed:", error);
		res.status(500).json({ error: "Failed to fetch public feed" });
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Update
// ----------------------------------------------------------------------------------------------------
const updateSculptureStatus = async (req, res) => {
	try {
		const { sculptureId } = req.params;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: "Authentication required" });
		}

		const sculpture = await sculptureModel.getSculptureById(sculptureId);

		if (!sculpture || sculpture.user_id !== userId) {
			return res.status(404).json({ error: "Sculpture not found" });
		}

		// Check current task status
		const taskId = sculpture.refineTaskId || sculpture.meshyTaskId;
		const status = await getMeshyTaskStatus(taskId);

		// Update database if task is completed
		if (status.status === "SUCCEEDED") {
			const updateData = {
				status: "completed",
				modelUrl: status.model_urls?.glb,
				thumbnailUrl: status.thumbnail_url,
			};

			const updatedSculpture = await sculptureModel.updateSculpture(sculptureId, updateData);
			res.json(updatedSculpture);
		} else {
			res.json({ ...sculpture, meshyStatus: status });
		}
	} catch (error) {
		console.error("Error updating sculpture status:", error);
		res.status(500).json({
			error: "Failed to update sculpture status",
			message: error.message,
		});
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Delete
// ----------------------------------------------------------------------------------------------------
const deleteSculpture = async (req, res) => {
	try {
		const { sculptureId } = req.params;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: "Authentication required" });
		}

		const sculpture = await sculptureModel.getSculptureById(sculptureId);

		if (!sculpture || sculpture.user_id !== userId) {
			return res.status(404).json({ error: "Sculpture not found" });
		}

		// Delete from Meshy if task is still active
		if (sculpture.meshyTaskId) {
			await deleteMeshyTask(sculpture.meshyTaskId);
		}
		if (sculpture.refineTaskId) {
			await deleteMeshyTask(sculpture.refineTaskId);
		}

		await sculptureModel.deleteSculpture(sculptureId);
		res.json({ message: "Sculpture deleted successfully" });
	} catch (error) {
		console.error("Error deleting sculpture:", error);
		res.status(500).json({
			error: "Failed to delete sculpture",
			message: error.message,
		});
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Background Polling
// ----------------------------------------------------------------------------------------------------
async function pollSculptureTasksInBackground(sculptureId, previewTaskId) {
	try {
		console.log(`[Background Polling ${sculptureId}] Starting preview task polling for taskId:`, previewTaskId);

		// Poll preview task
		let previewStatus;
		let pollAttempts = 0;
		const maxPollAttempts = 60; // 60 attempts × 10s = 10 minutes
		const pollIntervalMs = 10000; // 10 seconds

		while (pollAttempts < maxPollAttempts) {
			await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
			pollAttempts++;

			try {
				previewStatus = await getMeshyTaskStatus(previewTaskId);
				console.log(`[Background Polling ${sculptureId}] Preview poll #${pollAttempts}:`, previewStatus.status);

				if (previewStatus.status === "SUCCEEDED") {
					console.log(`[Background Polling ${sculptureId}] Preview task succeeded, starting refinement`);
					break;
				}

				if (previewStatus.status === "FAILED") {
					console.error(`[Background Polling ${sculptureId}] Preview task failed`);
					await sculptureModel.updateSculpture(sculptureId, { status: "failed" });
					return;
				}
			} catch (pollError) {
				console.error(`[Background Polling ${sculptureId}] Error polling preview status:`, pollError.message);
				// Continue polling on transient errors
			}
		}

		// Check if preview timed out
		if (!previewStatus || previewStatus.status !== "SUCCEEDED") {
			console.error(`[Background Polling ${sculptureId}] Preview task timed out after ${pollAttempts} attempts`);
			await sculptureModel.updateSculpture(sculptureId, { status: "timeout" });
			return;
		}

		// Start refinement
		let refineTaskId;
		try {
			console.log(`[Background Polling ${sculptureId}] Starting refinement`);
			const refineResult = await refineMeshyModel(previewTaskId);
			refineTaskId = refineResult.result;

			// Update database with refine task ID
			await sculptureModel.updateSculpture(sculptureId, {
				refineTaskId: refineTaskId,
				status: "refining",
			});

			console.log(`[Background Polling ${sculptureId}] Refine task started:`, refineTaskId);
		} catch (refineError) {
			console.error(`[Background Polling ${sculptureId}] Error starting refinement:`, refineError);
			await sculptureModel.updateSculpture(sculptureId, { status: "failed" });
			return;
		}

		// Poll refine task
		await new Promise((resolve) => setTimeout(resolve, 5000)); // Initial 5s delay

		let refineStatus;
		let refinePollAttempts = 0;
		const maxRefinePollAttempts = 120; // 120 attempts × 10s = 20 minutes

		while (refinePollAttempts < maxRefinePollAttempts) {
			await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
			refinePollAttempts++;

			try {
				refineStatus = await getMeshyTaskStatus(refineTaskId);
				console.log(`[Background Polling ${sculptureId}] Refine poll #${refinePollAttempts}:`, refineStatus.status);

				if (refineStatus.status === "SUCCEEDED") {
					console.log(`[Background Polling ${sculptureId}] Refine task succeeded`);

					// Update database with final results
					await sculptureModel.updateSculpture(sculptureId, {
						status: "completed",
						modelUrl: refineStatus.model_urls?.glb || null,
						thumbnailUrl: refineStatus.thumbnail_url || null,
					});

					console.log(`[Background Polling ${sculptureId}] Sculpture completed successfully`);
					return;
				}

				if (refineStatus.status === "FAILED") {
					console.error(`[Background Polling ${sculptureId}] Refine task failed`);
					await sculptureModel.updateSculpture(sculptureId, { status: "failed" });
					return;
				}
			} catch (pollError) {
				console.error(`[Background Polling ${sculptureId}] Error polling refine status:`, pollError.message);
				// Continue polling on transient errors
			}
		}

		// Refine timed out
		console.error(`[Background Polling ${sculptureId}] Refine task timed out after ${refinePollAttempts} attempts`);
		await sculptureModel.updateSculpture(sculptureId, { status: "timeout" });
	} catch (error) {
		console.error(`[Background Polling ${sculptureId}] Unexpected error:`, error);
		try {
			await sculptureModel.updateSculpture(sculptureId, { status: "failed" });
		} catch (dbError) {
			console.error(`[Background Polling ${sculptureId}] Failed to update status to failed:`, dbError);
		}
	}
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Public Model Proxy (GLB cache)
// ----------------------------------------------------------------------------------------------------
const glbCache = new Map();
const GLB_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getPublicModel(req, res) {
	try {
		const { sculptureId } = req.params;
		const cached = glbCache.get(sculptureId);
		if (cached && Date.now() - cached.cachedAt < GLB_CACHE_TTL) {
			res.setHeader("Content-Type", cached.contentType);
			res.setHeader("Cache-Control", "public, max-age=3600");
			return res.send(cached.buffer);
		}

		const sculpture = await sculptureModel.getSculptureById(sculptureId);
		if (!sculpture || !sculpture.model_url) {
			return res.status(404).json({ error: "Model not found" });
		}

		const response = await fetch(sculpture.model_url, {
			headers: { "User-Agent": "Mozilla/5.0", Accept: "application/octet-stream,*/*" },
		});
		if (!response.ok) {
			return res.status(response.status).json({ error: "Failed to fetch model from CDN" });
		}

		const contentType = response.headers.get("content-type") || "model/gltf-binary";
		const buffer = Buffer.from(await response.arrayBuffer());
		glbCache.set(sculptureId, { buffer, contentType, cachedAt: Date.now() });

		res.setHeader("Content-Type", contentType);
		res.setHeader("Cache-Control", "public, max-age=3600");
		res.send(buffer);
	} catch (error) {
		console.error("getPublicModel error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Meshy API Helper Functions
// ----------------------------------------------------------------------------------------------------
async function getMeshyTaskStatus(taskId) {
	const response = await fetch(`https://api.meshy.ai/openapi/v2/text-to-3d/${taskId}`, {
		headers: {
			Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return await response.json();
}

async function refineMeshyModel(previewTaskId) {
	const payload = {
		mode: "refine",
		preview_task_id: previewTaskId,
		enable_pbr: true,
	};

	const response = await fetch("https://api.meshy.ai/openapi/v2/text-to-3d", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return await response.json();
}

async function deleteMeshyTask(taskId) {
	const response = await fetch(`https://api.meshy.ai/openapi/v2/text-to-3d/${taskId}`, {
		method: "DELETE",
		headers: {
			Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
		},
	});

	if (!response.ok && response.status !== 404) {
		throw new Error(`Failed to delete Meshy task: ${response.status}`);
	}

	return true;
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

module.exports = {
	createSculpture,
	createRefinedSculpture,
	readSculptures,
	readSculptureStatus,
	readPublicFeed,
	updateSculptureStatus,
	deleteSculpture,
	getPublicModel,
};
