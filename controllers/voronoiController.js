/** @format */

const voronoiModel = require("../models/voronoiModel");

// Validate and normalize points to ensure they're between -1 and 1
function validateAndNormalizePoints(points) {
	if (!Array.isArray(points)) {
		throw new Error("Points must be an array");
	}

	return points.map((point) => {
		if (!Array.isArray(point) || point.length !== 2) {
			throw new Error("Each point must be an array of two numbers [x, y]");
		}

		const [x, y] = point;
		if (typeof x !== "number" || typeof y !== "number") {
			throw new Error("Point coordinates must be numbers");
		}

		// Clamp values to -1 to 1 range
		const normalizedX = Math.max(-1, Math.min(1, x));
		const normalizedY = Math.max(-1, Math.min(1, y));

		return [normalizedX, normalizedY];
	});
}

const createVoronoiPattern = async (req, res) => {
	try {
		const userId = req.user.id;
		const { rotationCount, points } = req.body;

		console.log("Creating voronoi pattern for user:", userId);
		console.log("Raw input:", { rotationCount, points });

		// Validate rotation count
		if (typeof rotationCount !== "number" || rotationCount < 0 || rotationCount > 12) {
			return res.status(400).json({ error: "Rotation count must be a number between 0 and 12" });
		}

		// Validate and normalize points
		const normalizedPoints = validateAndNormalizePoints(points);
		console.log("Normalized points:", normalizedPoints);

		const pattern = await voronoiModel.createVoronoiPattern(userId, rotationCount, normalizedPoints);
		res.json(pattern);
	} catch (error) {
		console.error("Error creating voronoi pattern:", error);
		res.status(500).json({ error: error.message });
	}
};

const getVoronoiPatternByUserId = async (req, res) => {
	try {
		const userId = req.user.id;
		console.log("Fetching voronoi pattern for user:", userId);

		const pattern = await voronoiModel.getVoronoiPatternByUserId(userId);
		if (!pattern) {
			return res.status(404).json({ error: "No voronoi pattern found for user" });
		}

		res.json(pattern);
	} catch (error) {
		console.error("Error fetching voronoi pattern:", error);
		res.status(500).json({ error: error.message });
	}
};

const updateVoronoiPattern = async (req, res) => {
	try {
		const userId = req.user.id;
		const { rotationCount, points } = req.body;

		console.log("Updating voronoi pattern for user:", userId);
		console.log("Raw input:", { rotationCount, points });

		// Validate rotation count
		if (typeof rotationCount !== "number" || rotationCount < 0 || rotationCount > 12) {
			return res.status(400).json({ error: "Rotation count must be a number between 0 and 12" });
		}

		// Validate and normalize points
		const normalizedPoints = validateAndNormalizePoints(points);
		console.log("Normalized points:", normalizedPoints);

		const pattern = await voronoiModel.updateVoronoiPattern(userId, rotationCount, normalizedPoints);
		res.json(pattern);
	} catch (error) {
		console.error("Error updating voronoi pattern:", error);
		res.status(500).json({ error: error.message });
	}
};

const deleteVoronoiPattern = async (req, res) => {
	try {
		const userId = req.user.id;
		console.log("Deleting voronoi pattern for user:", userId);

		await voronoiModel.deleteVoronoiPattern(userId);
		res.json({ message: "Voronoi pattern deleted successfully" });
	} catch (error) {
		console.error("Error deleting voronoi pattern:", error);
		res.status(500).json({ error: error.message });
	}
};

module.exports = {
	createVoronoiPattern,
	getVoronoiPatternByUserId,
	updateVoronoiPattern,
	deleteVoronoiPattern,
};
