const express = require("express");
const router = express.Router();
const alphaController = require("../controllers/alphaController");

router.get("/", alphaController.getAllAlphas);
router.post("/", alphaController.createAlpha);
router.get("/alphaid/:alphaId", alphaController.getAlphaById);
router.put("/:alphaId", alphaController.updateAlpha);
router.delete("/:alphaId", alphaController.deleteAlpha);
router.get("/ejstest", (req, res) => {
    res.render("alphaView", {message: "EJS is working on the alpha router."})
});

module.exports = router;