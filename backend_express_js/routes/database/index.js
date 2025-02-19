const express = require('express')
const router = express.Router()


router.use('/sendbackupemail',require('./sendBackupEmail'))


module.exports = router