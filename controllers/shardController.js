/** @format */

/** @format */

const shardModel = require("../models/shardModel");
const sculptureModel = require("../models/sculptureModel");

// ----------------------------------------------------------------------------------------------------
// #region Render
// ----------------------------------------------------------------------------------------------------
const renderShardsPage = async (req, res) => {
	try {
		// DEBUG: Log req.user to see what's available
		console.log("renderShardsPage req.user:", req.user);

		const user = req.user;
		if (!user || !user.id) {
			return res.redirect("/login");
		}
		const shards = await shardModel.getShardsByUserId(user.id);
		const sculptures = await sculptureModel.getSculpturesByUserId(user.id);
		const hasSculpture = sculptures && sculptures.length > 0;
		res.render("shardsPage", { currentPage: "Mosaic", shards, user, hasSculpture, pageTitle: "Mosaic" });
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
	const { spark, text, tint, glow, point } = data;
	if (!spark || typeof spark !== "string") {
		throw new Error("Invalid spark text");
	}
	if (!text || typeof text !== "string") {
		throw new Error("Invalid shard text");
	}
	if (isNaN(tint) || tint < 0 || tint > 8) {
		throw new Error("validateShardData in shardController.js:  Tint must be a number between 0 and 8.");
	}
	if (isNaN(glow) || glow < 0 || glow > 1) {
		throw new Error("validateShardData in shardController.js:  Glow must be a number between 0 and 1.");
	}
	if (isNaN(point) || point < 0 || point > 128) {
		throw new Error("validateShardData in shardController.js:  Point must be a number between 0 and 128.");
	}
	return {
		spark: spark.trim(),
		text: text.trim(),
		tint: parseInt(tint, 10) || 0,
		glow: parseInt(glow, 10) || 0,
		point: parseInt(point, 10) || 0,
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
	const shardData = req.body;
	const validatedShardData = validateShardData(shardData);
	try {
		await shardModel.createShard(userId, validatedShardData);
		const shards = await shardModel.getShardsByUserId(userId);
		// Return the new shard as JSON
		res.json(shards);
	} catch (error) {
		console.error("From shardController, error creating shard:", error);
		res.status(500).json({ error: "createShard: Internal server error" });
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Get Shards API
// ----------------------------------------------------------------------------------------------------
const getShardsAPI = async (req, res) => {
	try {
		const user = req.user;
		if (!user || !user.id) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		const shards = await shardModel.getShardsByUserId(user.id);
		res.json(shards);
	} catch (error) {
		console.error("Error fetching shards:", error);
		res.status(500).json({ error: "Internal Server Error" });
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
	const shardId = req.params.shardId;
	const shardData = req.body;
	const validatedShardData = validateShardData(shardData);
	try {
		await shardModel.validateShardUser(shardId, userId);
		await shardModel.editShard(shardId, validatedShardData);
		const shards = await shardModel.getShardsByUserId(userId);
		res.json(shards);
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
	const shardId = req.params.shardId;
	try {
		await shardModel.validateShardUser(shardId, userId);
		await shardModel.deleteShard(shardId);
		const shards = await shardModel.getShardsByUserId(userId);
		res.json(shards);
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
	getShardsAPI,
	getShardById,
	updateShard,
	deleteShard,
};
