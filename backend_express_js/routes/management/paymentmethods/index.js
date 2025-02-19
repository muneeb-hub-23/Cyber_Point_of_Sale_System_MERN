const express = require('express')
const router = express.Router()

router.use('/addpaymentmethod',require('./addpaymentmethod'))
router.use('/modifypaymentmethod',require('./modifypaymentmethod'))
router.use('/deletepaymentmethod',require('./deletepaymentmethod'))
router.use('/getpaymentmethods',require('./getpaymentmethod'))
router.use('/getpaymentmethodbyid',require('./getpaymentmethodbyid'))


module.exports = router