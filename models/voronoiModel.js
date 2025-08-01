/** @format */

const db = require("./db");

const createVoronoiPattern = async (userId, rotationCount, points) => {
	// Debug the values being inserted
	console.log("Creating voronoi pattern with:", { userId, rotationCount, points });

	// Validate that points are in normalized format (-1 to 1)
	const validatedPoints = points.map(([x, y]) => {
		const normalizedX = Math.max(-1, Math.min(1, parseFloat(x)));
		const normalizedY = Math.max(-1, Math.min(1, parseFloat(y)));
		return [normalizedX, normalizedY];
	});

	console.log("Validated normalized points:", validatedPoints);

	// Ensure points is stringified for PostgreSQL
	const pointsJson = JSON.stringify(validatedPoints);
	console.log("Stringified points:", pointsJson); // Debug log

	const result = await db.query("INSERT INTO voronoi_patterns (user_id, rotation_count, points) VALUES ($1, $2, $3) RETURNING *", [
		userId,
		rotationCount,
		pointsJson,
	]);
	console.log("Inserted voronoi pattern:", result.rows[0]);
	return result.rows[0];
};

const getVoronoiPatternByUserId = async (userId) => {
	const result = await db.query("SELECT * FROM voronoi_patterns WHERE user_id = $1", [userId]);
	console.log("Fetched voronoi pattern by user ID:", result.rows[0]);
	return result.rows[0];
};

const updateVoronoiPattern = async (userId, updatedRotationCount, updatedPoints) => {
	console.log("Updating voronoi pattern:", { userId, updatedRotationCount, updatedPoints });

	// Validate that points are in normalized format (-1 to 1)
	const validatedPoints = updatedPoints.map(([x, y]) => {
		const normalizedX = Math.max(-1, Math.min(1, parseFloat(x)));
		const normalizedY = Math.max(-1, Math.min(1, parseFloat(y)));
		return [normalizedX, normalizedY];
	});

	console.log("Validated normalized points for update:", validatedPoints);

	const pointsJson = JSON.stringify(validatedPoints);
	console.log("Stringified updated points:", pointsJson); // Debug log

	const result = await db.query("UPDATE voronoi_patterns SET rotation_count = $1, points = $2 WHERE user_id = $3 RETURNING *", [
		updatedRotationCount,
		pointsJson,
		userId,
	]);
	console.log("Updated voronoi pattern:", result.rows[0]);
	return result.rows[0];
};

const deleteVoronoiPattern = async (userId) => {
	await db.query("DELETE FROM voronoi_patterns WHERE user_id = $1", [userId]);
};

module.exports = {
	createVoronoiPattern,
	getVoronoiPatternByUserId,
	updateVoronoiPattern,
	deleteVoronoiPattern,
};
