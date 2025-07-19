/** @format */

const db = require("./db");

// ----------------------------------------------------------------------------------------------------
// #region Create Shard
// ----------------------------------------------------------------------------------------------------
const createShard = async (userId, shardData) => {
	const values = [userId, shardData.spark, shardData.text, shardData.tint, shardData.glow, shardData.point];
	const query = `
        INSERT INTO shards (user_id, spark, text, tint, glow, point)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
	const result = await db.query(query, values);
	return result.rows[0];
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Get Shards By User
// ----------------------------------------------------------------------------------------------------
const getShardsByUserId = async (userId) => {
	const query = `
        SELECT * FROM shards
        WHERE user_id = $1
    `;
	const result = await db.query(query, [userId]);
	return result.rows;
};
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Get Shard By ID
// ----------------------------------------------------------------------------------------------------
const getShardById = async (shardId) => {
	const query = `
        SELECT * FROM shards
        WHERE id = $1
    `;
	const values = [shardId];
	const result = await db.query(query, values);
	if (!result.rows || result.rows.length === 0) {
		throw new Error("Shard not found");
	}
	return result.rows[0];
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Validate Shard User
// ----------------------------------------------------------------------------------------------------
const validateShardUser = async (shardId, userId) => {
	const query = `
        SELECT * FROM shards
        WHERE id = $1 AND user_id = $2
    `;
	const values = [shardId, userId];
	const result = await db.query(query, values);
	if (!result.rows || result.rows.length === 0) {
		throw new Error("Shard not found or does not belong to user");
	}
	return result.rows[0];
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Edit Shard
// ----------------------------------------------------------------------------------------------------
const editShard = async (shardId, shardData) => {
	const query = `
        UPDATE shards
        SET spark = $1, text = $2, tint = $3, glow = $4
        WHERE id = $5
        RETURNING *
    `;
	const values = [shardData.spark, shardData.text, shardData.tint, shardData.glow, shardId];
	const result = await db.query(query, values);
	if (!result.rows || result.rows.length === 0) {
		throw new Error("Shard not found");
	}
	return result.rows[0];
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Delete Shard
// ----------------------------------------------------------------------------------------------------
const deleteShard = async (shardId) => {
	const query = `
        DELETE FROM shards
        WHERE id = $1
        RETURNING *
    `;
	const values = [shardId];
	const result = await db.query(query, values);
	return result.rows[0]; // Return the deleted shard (or undefined if not found)
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Tarnish Shard
// ----------------------------------------------------------------------------------------------------
const tarnishShard = async (shardId) => {
	const query = `
        UPDATE shards
        SET tarnished = TRUE
        WHERE id = $1
        RETURNING *
    `;
	const values = [shardId];
	const result = await db.query(query, values);
	if (!result.rows || result.rows.length === 0) {
		throw new Error("Shard not found");
	}
	return result.rows[0];
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

module.exports = {
	getShardsByUserId,
	getShardById,
	validateShardUser,
	createShard,
	deleteShard,
	editShard,
	tarnishShard,
};
