const express = require('express');
const router = express.Router()
const multer  = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage})
const { buildQueryAndOptions } = require('./utils/queryUtils');

const ctrlAlbums = require('./controllers/albums');
router.get('/albums', buildQueryAndOptions, ctrlAlbums.getAlbums)
router.post('/album-csv', upload.single("file"), ctrlAlbums.uploadCSV)
router.post('/albums', ctrlAlbums.createAlbum)

const ctrlAuth = require('./controllers/auth');
router.get('/login', ctrlAuth.login)
router.get('/callback', ctrlAuth.callback)

const ctrlMisc = require('./controllers/misc');
router.put('/albums/spotify-data', ctrlMisc.spotifyData)


module.exports = router
