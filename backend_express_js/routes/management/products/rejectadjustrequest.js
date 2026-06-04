const express = require('express')
const router = express.Router()
const StockAdjustRequest = require('../../../models/StockAdjustRequest')

router.post('/', async (req, res) => {
    const { requestId, reviewedBy, reviewNote } = req.body

    if (!requestId) return res.status(400).json({ error: 'requestId is required' })

    try {
        const request = await StockAdjustRequest.findById(requestId)
        if (!request) return res.status(404).json({ error: 'Request not found' })
        if (request.status !== 'pending') return res.status(400).json({ error: 'Request already reviewed' })

        request.status = 'rejected'
        request.reviewedBy = reviewedBy || null
        request.reviewNote = reviewNote || ''
        await request.save()

        res.json({ success: true })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router
