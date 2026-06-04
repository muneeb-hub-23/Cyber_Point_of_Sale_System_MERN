const express = require('express')
const router = express.Router()
const DocItems = require('../../../models/DocumentItem')
const Product = require('../../../models/Product')

router.post('/', async (req, res) => {
    const { id } = req.headers

    if (!id) {
        return res.status(400).json({ error: 'Product id is required' })
    }

    try {
        // Fetch all entries for this product, sorted oldest to newest
        let entries = await DocItems.find({ product: id })
            .populate('document')
            .sort({ createdAt: 1 })

        if (!entries || entries.length === 0) {
            return res.status(404).json({ error: 'No entries found for this product' })
        }

        let runningOnHand = 0

        for (let entry of entries) {
            const doctype = entry.document ? entry.document.doctype : null
            const isAddition = doctype === 'purchase' || doctype === 'refund' || doctype === null

            const onHandBefore = runningOnHand

            if (isAddition) {
                runningOnHand += entry.qty
            } else {
                runningOnHand -= entry.qty
            }

            // Update the productData.onHand snapshot stored on this entry
            await DocItems.findByIdAndUpdate(entry._id, {
                $set: { 'productData.onHand': onHandBefore }
            })
        }

        // Update the product's current onHand to the final running total
        await Product.findByIdAndUpdate(id, { onHand: runningOnHand })

        res.json({
            message: 'Stock recalibrated successfully',
            finalOnHand: runningOnHand,
            entriesProcessed: entries.length
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router
