const express = require('express');
const router = express.Router()
const multer  = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage})
const { buildQueryAndOptions } = require('./utils/queryUtils');
const ctrlAlbums = require('./controllers/albums');
const ctrlAuth = require('./controllers/auth');
const ctrlMisc = require('./controllers/misc');

// misc routes
router.put('/albums/spotify-data', ctrlAuth.authorize, ctrlMisc.spotifyData)
router.get('/albums/genres', ctrlMisc.getGenres)

// album routes
router.get('/albums', buildQueryAndOptions, ctrlAlbums.getAlbums)
router.get('/albums/:_id', buildQueryAndOptions, ctrlAlbums.getAlbum)
router.post('/album-csv', ctrlAuth.authorize, upload.single("file"), ctrlAlbums.uploadCSV)
router.post('/albums', ctrlAuth.authorize, ctrlAlbums.createAlbum)
router.put('/albums/:_id', ctrlAuth.authorize, ctrlAlbums.updateAlbum)

// auth routes and middleware
router.get('/auth-login', ctrlAuth.authLogin)
router.get('/callback', ctrlAuth.callback)
router.put('/login', ctrlAuth.login)
router.post('/register', ctrlAuth.signup)
router.get('/refresh', ctrlAuth.refresh)


module.exports = router
