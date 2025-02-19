const express = require('express')
const router = express.Router()

router.use('/addexpense',require('./addExpense'))
router.use('/getexpense',require('./getExpenseList'))
router.use('/deleteexpense',require('./deleteExpense'))


module.exports = router