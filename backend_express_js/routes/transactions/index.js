const express = require('express')
const router = express.Router()



router.use('/gettransactions',require('./GetTransactions'))
router.use('/deletetransaction',require('./DeleteTransaction'))


module.exports = router