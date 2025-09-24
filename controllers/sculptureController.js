/** @format */

const sculptureModel = require("../models/sculptureModel");

// ----------------------------------------------------------------------------------------------------
// #region Create Sculpture
// ----------------------------------------------------------------------------------------------------
const createSculpture = async (req, res) => {
	try {
		const { prompt, artStyle = "realistic" } = req.body;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: "Authentication required" });
		}

		if (!prompt) {
			return res.status(400).json({ error: "Prompt is required" });
		}

		// Create Meshy preview directly here
		const payload = {
			mode: "preview",
			prompt: prompt,
			art_style: artStyle,
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
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const previewResult = await response.json();

		// Save initial sculpture record
		const sculptureData = {
			prompt,
			meshyTaskId: previewResult.result,
			modelUrl: null,
			thumbnailUrl: null,
			status: "processing",
		};

		const sculpture = await sculptureModel.createSculpture(userId, sculptureData);
		res.json(sculpture);
	} catch (error) {
		console.error("Error creating sculpture:", error);
		res.status(500).json({
			error: "Failed to create sculpture",
			message: error.message,
		});
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Get Sculptures
// ----------------------------------------------------------------------------------------------------
const getSculptures = async (req, res) => {
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
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Get Sculpture Status
// ----------------------------------------------------------------------------------------------------
const getSculptureStatus = async (req, res) => {
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
// #region Refine Sculpture
// ----------------------------------------------------------------------------------------------------
const refineSculpture = async (req, res) => {
	try {
		const { sculptureId } = req.params;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: "Authentication required" });
		}

		// Get the sculpture to get the preview task ID
		const sculpture = await sculptureModel.getSculptureById(sculptureId);

		if (!sculpture || sculpture.userId !== userId) {
			return res.status(404).json({ error: "Sculpture not found" });
		}

		// Start refinement using the existing helper
		const refineResult = await refineMeshyModel(sculpture.meshyTaskId);

		// Update sculpture with refine task ID
		const updatedSculpture = await sculptureModel.updateSculpture(sculptureId, {
			refineTaskId: refineResult.result,
			status: "refining",
		});

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
// #region Delete Sculpture
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
// #region Update Sculpture Status
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
	getSculptures,
	getSculptureStatus,
	refineSculpture,
	deleteSculpture,
	updateSculptureStatus,
};
