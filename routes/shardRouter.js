/** @format */

const express = require("express");
const shardRouter = express.Router();
const shardController = require("../controllers/shardController");
const requireAuth = require("../middleware/requireAuth");

// Renders the shard page or shard list with user shards
shardRouter.get("/", shardController.renderShardsPage);

// API endpoint to get user's shards as JSON
shardRouter.get("/api/user-shards", shardController.getShardsAPI);

// This route handles the creation of a new shard.
shardRouter.post("/", requireAuth, shardController.createShard);

// This route handles updating a shard by its ID.
shardRouter.put("/:shardId", requireAuth, shardController.updateShard);

// This route handles deleting a shard by its ID.
shardRouter.delete("/:shardId", requireAuth, shardController.deleteShard);

// This route handles fetching a shard by its ID and rendering the shard detail page.
shardRouter.get("/:shardId", shardController.getShardById);

// Exports
module.exports = shardRouter;
