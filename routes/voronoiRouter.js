/** @format */

const express = require("express");
const voronoiRouter = express.Router();
const voronoiController = require("../controllers/voronoiController");

voronoiRouter.post("/", voronoiController.createVoronoiPattern);

voronoiRouter.get("/", voronoiController.getVoronoiPatternByUserId);

voronoiRouter.put("/", voronoiController.updateVoronoiPattern);

voronoiRouter.delete("/", voronoiController.deleteVoronoiPattern);

module.exports = voronoiRouter;
