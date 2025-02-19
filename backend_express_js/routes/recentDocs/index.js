const express = require('express')
const router = express.Router()

router.use('/getrecentdocs',require('./GetRecentDocs'))
router.use('/deletedoc',require('./DeleteDoc'))
router.use('/reverseprocess',require('./ReverseProcess'))

module.exports = router