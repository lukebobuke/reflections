/** @format */

const express = require("express");
const sculptureRouter = express.Router();
const sculptureController = require("../controllers/sculptureController");

// POST /api/sculptures - Create new sculpture
sculptureRouter.post("/", sculptureController.createSculpture);

// POST /api/sculptures/mark-first-sculpture - Flag session so first-sculpture guide shows on reload
sculptureRouter.post("/mark-first-sculpture", (req, res) => {
	if (req.session) {
		req.session.isFirstSculpture = true;
		req.session.save(() => {});
	}
	res.json({ ok: true });
});

// GET /api/sculptures/feed - Get public feed of completed sculptures
sculptureRouter.get("/feed", sculptureController.readPublicFeed);

// GET /api/sculptures/model/:sculptureId - Proxy GLB from Meshy CDN (bypasses CORS, cached 1hr)
sculptureRouter.get("/model/:sculptureId", sculptureController.getPublicModel);

// GET /api/sculptures - Get all sculptures for current user
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
