const express = require('express')
const router = express.Router()

router.use('/sales',require('./sales/index'))
router.use('/detailed',require('./detailed/index'))

module.exports = router