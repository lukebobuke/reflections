/** @format */

const express = require("express");
const shardRouter = express.Router();
const shardController = require("../controllers/shardController");

//renders the shard page
shardRouter.get("/", shardController.renderShardsPage);

// This route handles the creation of a new shard.
shardRouter.post("/", shardController.createShard);

// This route handles updating a shard by its ID.
shardRouter.put("/:shardId", shardController.updateShard);

// This route handles deleting a shard by its ID.
shardRouter.delete("/:shardId", shardController.deleteShard);

// This route handles fetching a shard by its ID and rendering the shard detail page.
shardRouter.get("/:shardId", shardController.getShardById);

// Exports
module.exports = shardRouter;
// Exports
module.exports = shardRouter;
