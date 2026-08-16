const express = require('express')
const router = express.Router()
const StockAdjustRequest = require('../../../models/StockAdjustRequest')
const Product = require('../../../models/Product')

router.post('/', async (req, res) => {
    const { productId, adjustType, qty, reason, requestedBy } = req.body

    if (!productId || !adjustType || !qty || !requestedBy) {
        return res.status(400).json({ error: 'Missing required fields' })
    }

    try {
        const product = await Product.findById(productId)
        if (!product) return res.status(404).json({ error: 'Product not found' })

        const onHandBefore = product.onHand
        const onHandAfter = adjustType === 'increase'
            ? onHandBefore + Number(qty)
            : onHandBefore - Number(qty)

        const request = await StockAdjustRequest.save({
            product: productId,
            productName: product.name,
            adjustType,
            qty: Number(qty),
            onHandBefore,
            onHandAfter,
            reason: reason || '',
            requestedBy,
        })
        res.json({ success: true, request })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router
