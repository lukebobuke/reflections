/** @format */

const shardModel = require("../models/shardModel");
const sculptureModel = require("../models/sculptureModel");
const voronoiModel = require("../models/voronoiModel");

// ----------------------------------------------------------------------------------------------------
// #region Render
// ----------------------------------------------------------------------------------------------------
const renderShardsPage = async (req, res) => {
	try {
		const user = req.user;
		if (!user || !user.id) {
			return res.redirect("/login");
		}

		const shards = await shardModel.getShardsByUserId(user.id);
		const sculptures = await sculptureModel.getSculpturesByUserId(user.id);
		const hasSculpture = sculptures && sculptures.length > 0;

		// Determine if the voronoi pattern has been saved (locked)
		let patternLocked = false;
		try {
			const pattern = await voronoiModel.getVoronoiPatternByUserId(user.id);
			// Pattern is locked once it has been explicitly saved by the user
			// We store a "locked" flag in the DB as rotation_count >= 0 and points exist
			// More precisely: pattern exists AND user has moved past stage 2a
			// We use session flag to track this
			patternLocked = !!(pattern && req.session.patternLocked);
		} catch (e) {
			patternLocked = false;
		}

		// Determine stage
		// Stage 2: logged in, no sculpture yet
		// Stage 3: has sculpture
		const stage = hasSculpture ? "3" : "2";

		// isNewSignup: set by signup flow, consumed once
		const isNewSignup = req.session.isNewSignup || false;
		if (isNewSignup) {
			req.session.isNewSignup = false;
		}

		// isFirstSculpture: set when sculpture is first completed
		const isFirstSculpture = req.session.isFirstSculpture || false;
		if (isFirstSculpture) {
			req.session.isFirstSculpture = false;
		}

		res.render("shardsPage", {
			currentPage: "Vault",
			pageTitle: "Vault",
			shards,
			user,
			hasSculpture,
			stage,
			patternLocked,
			isNewSignup,
			isFirstSculpture,
		});
	} catch (error) {
		console.error("Error rendering shards page:", error);
		res.status(500).send("Internal Server Error");
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Lock Pattern
// ----------------------------------------------------------------------------------------------------
const lockPattern = async (req, res) => {
	try {
		const user = req.user;
		if (!user || !user.id) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		req.session.patternLocked = true;
		req.session.save((err) => {
			if (err) console.error("Session save error on lockPattern:", err);
		});
		res.json({ success: true });
	} catch (error) {
		console.error("Error locking pattern:", error);
		res.status(500).json({ error: "Internal Server Error" });
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
		throw new Error("Tint must be a number between 0 and 8.");
	}
	if (isNaN(glow) || glow < 0 || glow > 1) {
		throw new Error("Glow must be a number between 0 and 1.");
	}
	if (isNaN(point) || point < 0 || point > 128) {
		throw new Error("Point must be a number between 0 and 128.");
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
// #region Get Shard By ID (API)
// ----------------------------------------------------------------------------------------------------
const getShardById = async (req, res) => {
	try {
		const shard = await shardModel.getShardById(req.params.shardId);
		res.json(shard);
	} catch (error) {
		console.error("Error fetching shard by ID:", error);
		res.status(404).json({ error: "Shard not found" });
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

// ----------------------------------------------------------------------------------------------------
// #region Fetch User Model from Meshy
// ----------------------------------------------------------------------------------------------------
const fetchUserModel = async (req, res) => {
	try {
		const user = req.user;
		if (!user || !user.id) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		const sculptures = await sculptureModel.getSculpturesByUserId(user.id);
		const url = sculptures && sculptures.length > 0 ? sculptures[0].model_url : null;
		if (!url) {
			return res.status(404).json({ error: "No model URL found for user" });
		}
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0",
				Accept: "application/octet-stream,*/*",
				Referer: url,
			},
		});
		if (!response.ok) {
			return res.status(502).send("Failed to fetch remote model: " + response.status);
		}
		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const contentType = response.headers.get("content-type");
		if (url.endsWith(".glb") || (contentType && contentType.includes("application/octet-stream"))) {
			res.set("Content-Type", "model/gltf-binary");
		} else {
			res.set("Content-Type", contentType || "application/octet-stream");
		}
		res.send(buffer);
	} catch (error) {
		console.error("Error fetching user model from Meshy:", error);
		res.status(500).send("Error fetching user model");
	}
};
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

module.exports = {
	renderShardsPage,
	lockPattern,
	createShard,
	getShardsByUserId,
	getShardsAPI,
	getShardById,
	updateShard,
	deleteShard,
	fetchUserModel,
};
