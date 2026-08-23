const express = require('express')
const router = express.Router()
const StockAdjustRequest = require('../../../models/StockAdjustRequest')
const Product = require('../../../models/Product')

router.post('/', async (req, res) => {
    const { requestId, reviewedBy, reviewNote } = req.body

    if (!requestId) return res.status(400).json({ error: 'requestId is required' })

    try {
        const request = await StockAdjustRequest.findById(requestId)
        if (!request) return res.status(404).json({ error: 'Request not found' })
        if (request.status !== 'pending') return res.status(400).json({ error: 'Request already reviewed' })

        const product = await Product.findById(request.product)
        if (!product) return res.status(404).json({ error: 'Product not found' })

        const onHandBefore = Number(product.onHand)
        const qty = Number(request.qty)
        const newOnHand = request.adjustType === 'increase'
            ? onHandBefore + qty
            : onHandBefore - qty

        await Product.findByIdAndUpdate(request.product, { onHand: newOnHand })

        request.status = 'approved'
        request.reviewedBy = reviewedBy || null
        request.reviewNote = reviewNote || ''
        request.onHandBefore = onHandBefore
        request.onHandAfter = newOnHand
        await request.save()

        res.json({ success: true, newOnHand })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router
