const express = require('express')
const router = express.Router()

router.use('/sales',require('./sales/index'))
router.use('/detailed',require('./detailed/index'))
router.use('/latepayments',require('./latepayments/index'))
router.use('/productsales',require('./productsales/index'))
router.use('/suppliersales',require('./suppliersales/index'))
router.use('/purchases',require('./purchases/index'))
router.use('/supplierpurchases',require('./supplierpurchases/index'))

module.exports = router