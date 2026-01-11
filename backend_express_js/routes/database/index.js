const express = require('express')
const router = express.Router()


router.use('/backupdatabase',require('./sendBackupEmail'))


module.exports = router