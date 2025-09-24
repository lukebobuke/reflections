/** @format */

const db = require("./db");

// ----------------------------------------------------------------------------------------------------
// #region Create Operations
// ----------------------------------------------------------------------------------------------------
const createSculpture = async (userId, sculptureData) => {
	const values = [
		userId,
		sculptureData.prompt,
		sculptureData.artStyle || "realistic",
		sculptureData.meshyTaskId,
		sculptureData.refineTaskId || null,
		sculptureData.modelUrl,
		sculptureData.thumbnailUrl,
		sculptureData.status,
		sculptureData.fileSize || null,
	];
	const query = `
		INSERT INTO sculptures (user_id, prompt, art_style, meshy_task_id, refine_task_id, model_url, thumbnail_url, status, file_size)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING *
	`;
	const result = await db.query(query, values);
	return result.rows[0];
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Read Operations
// ----------------------------------------------------------------------------------------------------
const getSculpturesByUserId = async (userId) => {
	const query = `SELECT * FROM sculptures WHERE user_id = $1`;
	const result = await db.query(query, [userId]);
	return result.rows;
};

const getSculptureById = async (sculptureId) => {
	const query = `SELECT * FROM sculptures WHERE id = $1`;
	const result = await db.query(query, [sculptureId]);
	return result.rows[0];
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Update Operations
// ----------------------------------------------------------------------------------------------------
const updateSculptureStatus = async (sculptureId, status, modelUrl = null, thumbnailUrl = null) => {
	const query = `
		UPDATE sculptures 
		SET status = $1, model_url = $2, thumbnail_url = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4 
		RETURNING *
	`;
	const result = await db.query(query, [status, modelUrl, thumbnailUrl, sculptureId]);
	return result.rows[0];
};

const updateSculpture = async (sculptureId, updateData) => {
	const fields = [];
	const values = [];
	let paramCount = 1;

	// Dynamically build update query based on provided fields
	Object.entries(updateData).forEach(([key, value]) => {
		if (value !== undefined) {
			fields.push(`${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = $${paramCount}`);
			values.push(value);
			paramCount++;
		}
	});

	if (fields.length === 0) {
		throw new Error("No fields to update");
	}

	fields.push(`updated_at = CURRENT_TIMESTAMP`);
	values.push(sculptureId);

	const query = `
		UPDATE sculptures 
		SET ${fields.join(", ")}
		WHERE id = $${paramCount}
		RETURNING *
	`;

	const result = await db.query(query, values);
	return result.rows[0];
};

const incrementDownloadCount = async (sculptureId) => {
	const query = `
		UPDATE sculptures 
		SET download_count = download_count + 1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 
		RETURNING *
	`;
	const result = await db.query(query, [sculptureId]);
	return result.rows[0];
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Delete Operations
// ----------------------------------------------------------------------------------------------------
const deleteSculpture = async (sculptureId) => {
	const query = `DELETE FROM sculptures WHERE id = $1 RETURNING *`;
	const result = await db.query(query, [sculptureId]);
	return result.rows[0];
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

module.exports = {
	createSculpture,
	getSculpturesByUserId,
	updateSculptureStatus,
	getSculptureById,
	updateSculpture,
	deleteSculpture,
	incrementDownloadCount,
};
