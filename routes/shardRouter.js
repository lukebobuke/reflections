/** @format */

const express = require("express");
const shardRouter = express.Router();
const shardController = require("../controllers/shardController");
const requireAuth = require("../middleware/requireAuth");

// Renders the shard page
shardRouter.get("/", shardController.renderShardsPage);

// API endpoint to get user's shards as JSON
shardRouter.get("/api/user-shards", shardController.getShardsAPI);

// Lock the voronoi pattern (stage 2a → 2b transition)
shardRouter.post("/api/lock-pattern", requireAuth, shardController.lockPattern);

// Create a new shard
shardRouter.post("/", requireAuth, shardController.createShard);

// Update a shard
shardRouter.put("/:shardId", requireAuth, shardController.updateShard);

// Delete a shard
shardRouter.delete("/:shardId", requireAuth, shardController.deleteShard);

// Get shard by ID (API)
shardRouter.get("/:shardId", shardController.getShardById);

module.exports = shardRouter;
