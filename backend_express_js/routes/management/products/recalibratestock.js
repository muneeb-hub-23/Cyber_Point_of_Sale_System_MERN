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

        const docEntries = allEntries.filter(e => e.doctype).map(e => ({ kind: 'docitem', row: e, at: e.createdAt }))

        // Approved stock adjustments move stock too, so they take part in the running total
        const [adjustments] = await db.query(
            `SELECT * FROM stockadjustrequests WHERE product = ? AND status = 'approved'`,
            [id]
        )
        const adjustEntries = adjustments.map(a => ({ kind: 'adjust', row: a, at: a.updatedAt || a.createdAt }))

        const entries = [...docEntries, ...adjustEntries]
            .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

        if (entries.length === 0) {
            await Product.findByIdAndUpdate(id, { onHand: 0 })
            return res.json({ message: 'No valid entries — stock set to 0', finalOnHand: 0, entriesProcessed: 0, adjustmentsProcessed: 0, orphansDeleted: orphanIds.length })
        }

        let runningOnHand = 0

        for (let entry of entries) {
            const onHandBefore = runningOnHand

            if (entry.kind === 'adjust') {
                const qty = Number(entry.row.qty)
                runningOnHand += entry.row.adjustType === 'increase' ? qty : -qty
                await db.query(
                    'UPDATE stockadjustrequests SET onHandBefore = ?, onHandAfter = ? WHERE id = ?',
                    [onHandBefore, runningOnHand, entry.row.id]
                )
                continue
            }

            const isAddition = entry.row.doctype === 'purchase' || entry.row.doctype === 'refund'
            if (isAddition) { runningOnHand += Number(entry.row.qty) } else { runningOnHand -= Number(entry.row.qty) }

            let productData = {}
            try { productData = JSON.parse(entry.row.productData || '{}') } catch (_) {}
            productData.onHand = onHandBefore
            await db.query('UPDATE docitems SET productData = ? WHERE id = ?', [JSON.stringify(productData), entry.row.id])
        }

        await Product.findByIdAndUpdate(id, { onHand: runningOnHand })

        res.json({
            message: 'Stock recalibrated successfully',
            finalOnHand: runningOnHand,
            entriesProcessed: entries.length,
            adjustmentsProcessed: adjustEntries.length,
            orphansDeleted: orphanIds.length
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router
