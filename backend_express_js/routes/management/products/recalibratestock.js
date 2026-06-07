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
        let allEntries = await DocItems.find({ product: id })
            .populate('document')
            .sort({ createdAt: 1 })

        // Delete orphan entries whose parent document was deleted (old glitches)
        const orphanIds = allEntries.filter(e => !e.document).map(e => e._id)
        if (orphanIds.length > 0) {
            await DocItems.deleteMany({ _id: { $in: orphanIds } })
        }

        const entries = allEntries.filter(e => e.document)

        if (!entries || entries.length === 0) {
            await Product.findByIdAndUpdate(id, { onHand: 0 })
            return res.json({ message: 'No valid entries — stock set to 0', finalOnHand: 0, entriesProcessed: 0, orphansDeleted: orphanIds.length })
        }

        let runningOnHand = 0

        for (let entry of entries) {
            const doctype = entry.document.doctype
            const isAddition = doctype === 'purchase' || doctype === 'refund'

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
            entriesProcessed: entries.length,
            orphansDeleted: orphanIds.length
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router
