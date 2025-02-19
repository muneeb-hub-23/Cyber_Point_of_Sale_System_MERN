const express = require('express')
const router = express.Router()

router.use('/daily',require('./daily'))


module.exports = router