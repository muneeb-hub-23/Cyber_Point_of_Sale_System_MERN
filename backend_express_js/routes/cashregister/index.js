const express = require('express')
const router = express.Router()

router.use('/getentries',require('./getentries'))
router.use('/deleteentry',require('./deleteentry'))
router.use('/addentry',require('./addentry'))

module.exports = router