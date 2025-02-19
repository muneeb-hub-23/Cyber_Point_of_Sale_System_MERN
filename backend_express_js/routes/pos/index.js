const express = require('express')
const router = express.Router()

router.use('/documents',require('./documents/index'))
router.use('/documentitems',require('./documentitems/index'))
router.use('/finalize',require('./finalize/index'))
router.use('/expense',require('./expense/index'))
router.use('/copydiscount',require('./copydiscount'))

module.exports = router