const express = require('express')
const router = express.Router()
const Product = require('../../../models/Product')

router.get('/', async (req, res) => {
    const { itemcode } = req.headers
    if (!itemcode) return res.status(400).json({ error: 'itemcode header required' })
    try {
        const data = await Product.findOne({ itemCode: itemcode })
        if (data) {
            res.json(data)
        } else {
            res.json(null)
        }
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router
