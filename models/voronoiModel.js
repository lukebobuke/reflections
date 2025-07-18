const db = require("./db");

const createVoronoiPattern = async (userId, patternData) => {
    const result = await db.query(
        "INSERT INTO voronoi_patterns (user_id, pattern_data) VALUES ($1, $2) RETURNING *",
        [userId, patternData]
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

const updateVoronoiPattern = async (patternId, updatedData) => {
    const result = await db.query(
        "UPDATE voronoi_patterns SET pattern_data = $1 WHERE id = $2 RETURNING *",
        [updatedData, patternId]
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
