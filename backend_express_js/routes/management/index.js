const express = require('express')
const router = express.Router()


router.use('/categories',require('./categories/index'))
router.use('/products',require('./products/index'))
router.use('/paymentmethods',require('./paymentmethods/index'))
router.use('/saletypes',require('./saletypes/index'))


module.exports = router