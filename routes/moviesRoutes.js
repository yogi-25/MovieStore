const express = require('express');
const { getMoviesByCastMember } = require('../controllers/moviesController');
const { getMoviesByGenre } = require('../controllers/moviesController');
const { getMovieDetailsByMovieId } = require('../controllers/moviesController');
const { addMovie } = require('../controllers/moviesController');
const { removeCastMember } = require('../controllers/moviesController');
const { getMovieByTitle } = require('../controllers/moviesController');


const router = express.Router();

router.get('/movies/title/:title', getMovieByTitle);
router.get('/movies/cast/:castMember', getMoviesByCastMember);
router.get('/movies/genre/:genre', getMoviesByGenre);
router.get('/movies/details/:movieId', getMovieDetailsByMovieId);
router.post('/movies/add', addMovie);
router.post('/movies/:movieId/cast/remove', removeCastMember);

module.exports = router;
