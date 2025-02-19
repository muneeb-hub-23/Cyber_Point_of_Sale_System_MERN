const express = require('express')
const router = express.Router()


router.use('/khataentry',require('./KhataEntry'))


module.exports = router