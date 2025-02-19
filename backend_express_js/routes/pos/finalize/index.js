const express = require('express')
const router = express.Router()

router.use('/finalizepurchase',require('./FinalizePurchase'))
router.use('/finalizesale',require('./FinalizeSale'))
router.use('/finalizerefund',require('./FinalizeRefund'))
router.use('/finalizeloss',require('./FinalizeLoss'))
router.use('/finalizestockreturn',require('./FinalizeStockReturn'))

module.exports = router