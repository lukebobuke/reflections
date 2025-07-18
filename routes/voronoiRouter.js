const express = require('express');
const voronoiRouter = express.Router();
const voronoiController = require('../controllers/voronoiController');

voronoiRouter.post('/', voronoiController.createVoronoiPattern);

voronoiRouter.get('/:patternId', voronoiController.getVoronoiPatternById);

voronoiRouter.put('/:patternId', voronoiController.updateVoronoiPattern);

voronoiRouter.delete('/:patternId', voronoiController.deleteVoronoiPattern);

module.exports = voronoiRouter;
