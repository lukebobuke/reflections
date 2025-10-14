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

	let generatedText = "";
	try {
		console.log("helperGenerateSculpturePrompt: Sending prompt to OpenAI");
		const response = await openai.chat.completions.create({
			model: "gpt-5-nano",
			messages: [{ role: "user", content: personalityPrompt }],
		});
		generatedText = response.choices[0].message.content;
		console.log("helperGenerateSculpturePrompt: Received personality analysis from OpenAI");
	} catch (apiError) {
		console.error("OpenAI API error:", apiError);
		generatedText = "Error generating personality analysis.";
	}
	console.log("helperGenerateSculpturePrompt: Final sculpture prompt assembled");
	return `Create a realistic-looking abstract glass sculpture based on the following personality analysis:\n${generatedText}`;
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
		const sculpturePrompt = await helperGenerateSculpturePrompt(userId);

		if (!userId) {
			console.log("createSculpture: No userId found, authentication required");
			return res.status(401).json({ error: "Authentication required" });
		}

		if (!sculpturePrompt) {
			console.log("createSculpture: No prompt generated, cannot proceed");
			return res.status(400).json({ error: "Prompt is required" });
		}

		console.log("createSculpture: Sending preview request to Meshy");
		const payload = {
			mode: "preview",
			prompt: sculpturePrompt,
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

		// Poll for preview task completion
		let previewStatus;
		let pollAttempts = 0;
		const maxPollAttempts = 30; // e.g. poll for up to 30 * 2s = 60s
		const pollIntervalMs = 30000;

		console.log("createSculpture: Polling Meshy preview task status...");
		while (pollAttempts < maxPollAttempts) {
			previewStatus = await getMeshyTaskStatus(previewResult.result);
			console.log(`createSculpture: Preview status poll #${pollAttempts + 1}:`, previewStatus.status);
			if (previewStatus.status === "SUCCEEDED") break;
			if (previewStatus.status === "FAILED") {
				console.error("createSculpture: Meshy preview task failed");
				break;
			}
			await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
			pollAttempts++;
		}

		let refineTaskId = null;
		let refineStatus = null;
		if (previewStatus && previewStatus.status === "SUCCEEDED") {
			try {
				console.log("createSculpture: Starting refinement with Meshy");
				const refineResult = await refineMeshyModel(previewResult.result);
				refineTaskId = refineResult.result;
				console.log("createSculpture: Meshy refine task started, refineTaskId:", refineTaskId);

				// Add a short delay before polling
				await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds

				// Poll for refine task completion
				let refinePollAttempts = 0;
				const maxRefinePollAttempts = 30;
				const refinePollIntervalMs = 30000;
				console.log("createSculpture: Polling Meshy refine task status...");
				while (refinePollAttempts < maxRefinePollAttempts) {
					try {
						refineStatus = await getMeshyTaskStatus(refineTaskId);
						console.log(`createSculpture: Refine status poll #${refinePollAttempts + 1}:`, refineStatus.status);
						if (refineStatus.status === "SUCCEEDED") break;
						if (refineStatus.status === "FAILED") {
							console.error("createSculpture: Meshy refine task failed");
							break;
						}
					} catch (pollError) {
						console.error("createSculpture: Error polling refine task status (likely not ready yet):", pollError.message);
					}
					await new Promise((resolve) => setTimeout(resolve, refinePollIntervalMs));
					refinePollAttempts++;
				}
			} catch (refineError) {
				console.error("createSculpture: Error starting refinement:", refineError);
			}
		} else {
			console.error("createSculpture: Preview task did not succeed, skipping refinement");
		}

		// Save initial sculpture record
		console.log("createSculpture: Saving sculpture record to database");
		const sculptureData = {
			prompt: sculpturePrompt,
			meshyTaskId: previewResult.result,
			refineTaskId: refineTaskId,
			modelUrl: refineStatus && refineStatus.status === "SUCCEEDED" ? refineStatus.model_urls?.glb : null,
			thumbnailUrl: refineStatus && refineStatus.status === "SUCCEEDED" ? refineStatus.thumbnail_url : null,
			status: refineStatus && refineStatus.status === "SUCCEEDED" ? "completed" : refineTaskId ? "refining" : "processing",
		};

		const sculpture = await sculptureModel.createSculpture(userId, sculptureData);
		console.log("createSculpture: Sculpture record saved, id:", sculpture.id);
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

		if (!sculpture || sculpture.userId !== userId) {
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

		if (!sculpture || sculpture.userId !== userId) {
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

		if (!sculpture || sculpture.userId !== userId) {
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
	updateSculptureStatus,
	deleteSculpture,
};
