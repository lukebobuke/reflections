const voronoiModel = require("../models/voronoiModel");

const createVoronoiPattern = async (req, res) => {
    try {
        const userId = req.user.id;
        const patternData = req.body; // Assuming the pattern data is sent in the request body
        const newPattern = await voronoiModel.createVoronoiPattern(userId, patternData);
        res.status(201).json(newPattern);
    } catch (error) {
        console.error("Error creating Voronoi pattern:", error);
        res.status(500).send("Internal Server Error");
    }
};

const getVoronoiPatternById = async (req, res) => {
    try {
        const patternId = req.params.patternId;
        const pattern = await voronoiModel.getVoronoiPatternById(patternId);
        if (!pattern) {
            return res.status(404).send("Pattern not found");
        }
        res.status(200).json(pattern);
    } catch (error) {
        console.error("Error fetching Voronoi pattern:", error);
        res.status(500).send("Internal Server Error");
    }
};

const updateVoronoiPattern = async (req, res) => {
    try {
        const patternId = req.params.patternId;
        const updatedData = req.body;
        const updatedPattern = await voronoiModel.updateVoronoiPattern(patternId, updatedData);
        if (!updatedPattern) {
            return res.status(404).send("Pattern not found");
        }
        res.status(200).json(updatedPattern);
    } catch (error) {
        console.error("Error updating Voronoi pattern:", error);
        res.status(500).send("Internal Server Error");
    }
};

const deleteVoronoiPattern = async (req, res) => {
    try {
        const patternId = req.params.patternId;
        await voronoiModel.deleteVoronoiPattern(patternId);
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting Voronoi pattern:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    createVoronoiPattern,
    getVoronoiPatternById,
    updateVoronoiPattern,
    deleteVoronoiPattern
};
