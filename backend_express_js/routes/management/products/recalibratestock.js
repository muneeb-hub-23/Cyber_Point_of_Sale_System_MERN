const express = require('express')
const router = express.Router()
const db = require('../../../db')
const Product = require('../../../models/Product')

router.post('/', async (req, res) => {
    const { id } = req.headers

    if (!id) {
        return res.status(400).json({ error: 'Product id is required' })
    }

    try {
        // Fetch all entries for this product joined with document, sorted oldest first
        const [allEntries] = await db.query(
            `SELECT di.*, doc.doctype, doc.status AS docStatus
             FROM docitems di
             LEFT JOIN documents doc ON doc.id = di.document
             WHERE di.product = ?
             ORDER BY di.createdAt ASC`,
            [id]
        )

        // Delete orphan entries whose parent document was deleted
        const orphanIds = allEntries.filter(e => !e.doctype).map(e => e.id)
        if (orphanIds.length > 0) {
            await db.query(`DELETE FROM docitems WHERE id IN (?)`, [orphanIds])
        }

        const entries = allEntries.filter(e => e.doctype)

        if (!entries || entries.length === 0) {
            await Product.findByIdAndUpdate(id, { onHand: 0 })
            return res.json({ message: 'No valid entries — stock set to 0', finalOnHand: 0, entriesProcessed: 0, orphansDeleted: orphanIds.length })
        }

        let runningOnHand = 0

        for (let entry of entries) {
            const isAddition = entry.doctype === 'purchase' || entry.doctype === 'refund'
            const onHandBefore = runningOnHand
            if (isAddition) { runningOnHand += entry.qty } else { runningOnHand -= entry.qty }

            let productData = {}
            try { productData = JSON.parse(entry.productData || '{}') } catch (_) {}
            productData.onHand = onHandBefore
            await db.query('UPDATE docitems SET productData = ? WHERE id = ?', [JSON.stringify(productData), entry.id])
        }

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
