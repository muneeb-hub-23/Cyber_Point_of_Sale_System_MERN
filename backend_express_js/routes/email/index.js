const express = require('express')
const router = express.Router()


router.use('/sendbackupemail',require('./sendBackupEmail'))
router.use('/restoredata',require('./restoreData'))


module.exports = router