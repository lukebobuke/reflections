/** @format */

const voronoiModel = require("../models/voronoiModel");

const createVoronoiPattern = async (req, res) => {
	try {
		const userId = req.user.id;
		const { rotationCount, points } = req.body;

		// DEBUG: Log what we're receiving
		console.log("createVoronoiPattern received:", {
			userId,
			rotationCount,
			points,
			pointsType: typeof points,
			isArray: Array.isArray(points),
		});

		const newPattern = await voronoiModel.createVoronoiPattern(userId, rotationCount, points);
		res.status(201).json(newPattern);
	} catch (error) {
		console.error("Error creating Voronoi pattern:", error);
		res.status(500).send("Internal Server Error");
	}
};

const getVoronoiPatternById = async (req, res) => {
	try {
		const patternId = req.params.patternId;
		const pattern = await voronoiModel.getVoronoiPatternById(patternId);
		if (!pattern) {
			return res.status(404).send("Pattern not found");
		}
		res.json(pattern);
	} catch (error) {
		console.error("Error fetching Voronoi pattern:", error);
		res.status(500).send("Internal Server Error");
	}
};

const getVoronoiPatternByUserId = async (req, res) => {
	try {
		const userId = req.user.id;
		const pattern = await voronoiModel.getVoronoiPatternByUserId(userId);
		if (!pattern) {
			return res.status(404).send("Pattern not found for user");
		}
		res.json(pattern);
	} catch (error) {
		console.error("Error fetching Voronoi pattern by user ID:", error);
		res.status(500).send("Internal Server Error");
	}
};

const updateVoronoiPattern = async (req, res) => {
	try {
		const userId = req.user.id;
		const { rotationCount, points } = req.body; // Extract the specific fields
		console.log("updateVoronoiPattern received:", {
			userId,
			rotationCount,
			points,
			pointsType: typeof points,
			isArray: Array.isArray(points),
		});
		const updatedPattern = await voronoiModel.updateVoronoiPattern(userId, rotationCount, points);
		if (!updatedPattern) {
			return res.status(404).send("Pattern not found");
		}
		res.json(updatedPattern);
	} catch (error) {
		console.error("Error updating Voronoi pattern:", error);
		res.status(500).send("Internal Server Error");
	}
};

const deleteVoronoiPattern = async (req, res) => {
	try {
		const userId = req.user.id;
		await voronoiModel.deleteVoronoiPattern(userId);
		res.status(204).send();
	} catch (error) {
		console.error("Error deleting Voronoi pattern:", error);
		res.status(500).send("Internal Server Error");
	}
};

module.exports = {
	createVoronoiPattern,
	getVoronoiPatternById,
	getVoronoiPatternByUserId,
	updateVoronoiPattern,
	deleteVoronoiPattern,
};
