const db = require("./db");

const createVoronoiPattern = async (userId, rotationCount, points) => {
    const result = await db.query(
        "INSERT INTO voronoi_patterns (user_id, rotation_count, points) VALUES ($1, $2, $3) RETURNING *",
        [userId, rotationCount, points]
    );
    return result.rows[0];
};

const getVoronoiPatternById = async (patternId) => {
    const result = await db.query(
        "SELECT * FROM voronoi_patterns WHERE id = $1",
        [patternId]
    );
    return result.rows[0];
};

const updateVoronoiPattern = async (patternId, updatedRotationCount, updatedPoints) => {
    const result = await db.query(
        "UPDATE voronoi_patterns SET rotation_count = $1, points = $2 WHERE id = $3 RETURNING *",
        [updatedRotationCount, updatedPoints, patternId]
    );
    return result.rows[0];
};

const deleteVoronoiPattern = async (patternId) => {
    await db.query(
        "DELETE FROM voronoi_patterns WHERE id = $1",
        [patternId]
    );
};

module.exports = {
    createVoronoiPattern,
    getVoronoiPatternById,
    updateVoronoiPattern,
    deleteVoronoiPattern
};


