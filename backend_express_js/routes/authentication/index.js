const express = require('express')
const router = express.Router()


router.use('/login',require('./login'))
router.use('/loginbyfaceid',require('./loginByFaceID'))
router.use('/verify',require('./verify'))

module.exports = router