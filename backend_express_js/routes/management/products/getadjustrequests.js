const express = require('express')
const router = express.Router()
const StockAdjustRequest = require('../../../models/StockAdjustRequest')

router.get('/', async (req, res) => {
    try {
        const requests = await StockAdjustRequest.find()
            .populate('product', 'name itemCode picture onHand')
            .populate('requestedBy', 'username')
            .populate('reviewedBy', 'username')
            .sort({ createdAt: -1 })
        res.json(requests)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router
