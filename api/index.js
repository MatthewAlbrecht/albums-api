const express = require('express');
const router = express.Router()
const multer  = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage})

const ctrlCSV = require('./controllers/csv');
router.post('/album-csv', upload.single("file"), ctrlCSV.uploadCSV)

module.exports = router
