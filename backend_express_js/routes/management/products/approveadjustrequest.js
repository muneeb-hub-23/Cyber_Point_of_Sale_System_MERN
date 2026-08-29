const express = require('express')
const router = express.Router()
const db = require('../../../db')
const StockAdjustRequest = require('../../../models/StockAdjustRequest')
const Product = require('../../../models/Product')

router.post('/', async (req, res) => {
    const { requestId, reviewedBy, reviewNote } = req.body

    if (!requestId) return res.status(400).json({ error: 'requestId is required' })

    try {
        const newOnHand = await db.withTransaction(async (conn) => {
            const request = await StockAdjustRequest.findById(requestId, conn)
            if (!request) throw Object.assign(new Error('Request not found'), { status: 404 })
            if (request.status !== 'pending') throw Object.assign(new Error('Request already reviewed'), { status: 400 })

            const product = await Product.findById(request.product, conn)
            if (!product) throw Object.assign(new Error('Product not found'), { status: 404 })

            const delta = request.adjustType === 'increase' ? Number(request.qty) : -Number(request.qty)

            const updatedProduct = await Product.findByIdAndUpdate(
                request.product,
                { $inc: { onHand: delta } },
                conn
            )

            request.status = 'approved'
            request.reviewedBy = reviewedBy || null
            request.reviewNote = reviewNote || ''
            request.onHandAfter = updatedProduct.onHand
            await request.save()

            return updatedProduct.onHand
        })

        res.json({ success: true, newOnHand })
    } catch (err) {
        console.error('[ApproveAdjustRequest] ERROR:', err.message, err.stack)
        res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
    }
})

module.exports = router
