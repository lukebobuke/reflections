/** @format */

const express = require("express");
const sculptureRouter = express.Router();
const sculptureController = require("../controllers/sculptureController");

// POST /api/sculptures - Create new sculpture
sculptureRouter.post("/", sculptureController.createSculpture);

// GET /api/sculptures - Get all sculptures
sculptureRouter.get("/", sculptureController.readSculptures);

// GET /api/sculptures/status/:taskId - Get sculpture status
sculptureRouter.get("/status/:taskId", sculptureController.readSculptureStatus);

// POST /api/sculptures/:sculptureId/refine - Refine sculpture
sculptureRouter.post("/:sculptureId/refine", sculptureController.createRefinedSculpture);

// DELETE /api/sculptures/:sculptureId - Delete sculpture
sculptureRouter.delete("/:sculptureId", sculptureController.deleteSculpture);

// PUT /api/sculptures/:sculptureId/status - Update sculpture status
sculptureRouter.put("/:sculptureId/status", sculptureController.updateSculptureStatus);

module.exports = sculptureRouter;
