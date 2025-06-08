const express = require("express");
const router = express.Router();
const betaController = require("../controllers/betaController");

router.get("/", betaController.getAllBetas);
router.post("/", betaController.createBeta);
router.get("/:betaId", betaController.getBetaById);
router.put("/:betaId", betaController.updateBeta);
router.delete("/:betaId", betaController.deleteBeta);

module.exports = router;