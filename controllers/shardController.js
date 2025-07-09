/** @format */

const shardModel = require("../models/shardModel");

// ----------------------------------------------------------------------------------------------------
// #region Render
// ----------------------------------------------------------------------------------------------------
const renderShardsPage = async (req, res) => {
	try {
		// DEBUG: Log req.user to see what's available
		console.log("renderShardsPage req.user:", req.user);

		const user = req.user;
		if (!user || !user.id) {
			return res.status(401).send("Unauthorized: No user found.");
		}
		const shards = await shardModel.getShardsByUserId(user.id);
		res.render("shardsPage", { currentPage: "shards", shards, user });
	} catch (error) {
		console.error("Error rendering shards page:", error);
		res.status(500).send("Internal Server Error");
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Validate Shard Data
// ----------------------------------------------------------------------------------------------------
function validateShardData(data) {
	const { text, tint, glow } = data;
	if (!text || typeof text !== "string") {
		throw new Error("Invalid shard text");
	}
	if (isNaN(tint) || tint < 0 || tint > 8) {
		throw new Error("Tint must be a number between 0 and 8.");
	}
	if (isNaN(glow) || glow < 0 || glow > 13) {
		throw new Error("Glow must be a number between 0 and 13.");
	}
	return {
		text: text.trim(),
		tint: parseInt(tint, 10) || 0,
		glow: parseInt(glow, 10) || 0,
	};
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Create Shard
// ----------------------------------------------------------------------------------------------------
const createShard = async (req, res) => {
	const userId = req.user.id;
	const user = req.user;
	const shardData = req.body;
	const validatedShardData = validateShardData(shardData);
	try {
		await shardModel.createShard(userId, validatedShardData);
		// Get updated list
		const shards = await shardModel.getShardsByUserId(userId);
		res.render("partials/shardsList", { currentPage: "shards", shards, user, layout: false });
	} catch (error) {
		console.error("From shardController, error creating shard:", error);
		res.status(500).send("Internal server error");
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Get Shards By User ID
// ----------------------------------------------------------------------------------------------------
const getShardsByUserId = async (userId) => {
	try {
		const shards = await shardModel.getShardsByUserId(userId);
		return shards;
	} catch (error) {
		console.error("Error fetching shards by user ID:", error);
		throw error;
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Get Shard By ID
// ----------------------------------------------------------------------------------------------------
const getShardById = async (shardId) => {
	try {
		const shard = await shardModel.getShardById(shardId);
		return shard;
	} catch (error) {
		console.error("Error fetching shard by ID:", error);
		throw error;
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Update Shard
// ----------------------------------------------------------------------------------------------------
const updateShard = async (req, res) => {
	const userId = req.user.id;
	const user = req.user;
	const shardId = req.params.shardId;
	const shardData = req.body;
	const validatedShardData = validateShardData(shardData);
	try {
		await shardModel.validateShardUser(shardId, userId);
		await shardModel.editShard(shardId, validatedShardData);
		const shards = await shardModel.getShardsByUserId(userId);
		res.render("partials/shardsList", { currentPage: "shards", shards, user, layout: false });
	} catch (error) {
		console.error("From shardController, error updating shard:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Delete Shard
// ----------------------------------------------------------------------------------------------------
const deleteShard = async (req, res) => {
	const userId = req.user.id;
	const user = req.user;
	const shardId = req.params.shardId;
	try {
		await shardModel.validateShardUser(shardId, userId);
		await shardModel.deleteShard(shardId);
		const shards = await shardModel.getShardsByUserId(userId);
		res.render("partials/shardsList", { currentPage: "shards", shards, user, layout: false });
	} catch (error) {
		console.error("From shardController, error deleting shard:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

module.exports = {
	renderShardsPage,
	createShard,
	getShardsByUserId,
	getShardById,
	updateShard,
	deleteShard,
};
