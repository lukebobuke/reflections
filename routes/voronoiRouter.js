/** @format */

const express = require("express");
const voronoiRouter = express.Router();
const voronoiController = require("../controllers/voronoiController");
const requireAuth = require("../middleware/requireAuth");

voronoiRouter.post("/", requireAuth, voronoiController.createVoronoiPattern);

voronoiRouter.get("/", voronoiController.getVoronoiPatternByUserId);

voronoiRouter.put("/", requireAuth, voronoiController.updateVoronoiPattern);

voronoiRouter.delete("/", requireAuth, voronoiController.deleteVoronoiPattern);

module.exports = voronoiRouter;
