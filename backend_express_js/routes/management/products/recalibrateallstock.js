const express = require('express')
const router = express.Router()
const db = require('../../../db')
const Product = require('../../../models/Product')

router.get('/', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

    try {
        const products = await Product.find({})

        if (!products || products.length === 0) {
            send({ type: 'error', message: 'No products found' })
            return res.end()
        }

        const total = products.length
        send({ type: 'start', total })

        let totalEntriesProcessed = 0
        let totalOrphansDeleted = 0
        let productsProcessed = 0

        for (let i = 0; i < products.length; i++) {
            const product = products[i]

            const [allEntries] = await db.query(
                `SELECT di.*, doc.doctype
                 FROM docitems di
                 LEFT JOIN documents doc ON doc.id = di.document
                 WHERE di.product = ?
                 ORDER BY di.createdAt ASC`,
                [product.id]
            )

            const orphanIds = allEntries.filter(e => !e.doctype).map(e => e.id)
            if (orphanIds.length > 0) {
                await db.query(`DELETE FROM docitems WHERE id IN (?)`, [orphanIds])
                totalOrphansDeleted += orphanIds.length
            }

            const entries = allEntries.filter(e => e.doctype)
            let runningOnHand = 0

            for (let entry of entries) {
                const isAddition = entry.doctype === 'purchase' || entry.doctype === 'refund'
                const onHandBefore = runningOnHand
                if (isAddition) { runningOnHand += entry.qty } else { runningOnHand -= entry.qty }

                let productData = {}
                try { productData = JSON.parse(entry.productData || '{}') } catch (_) {}
                productData.onHand = onHandBefore
                await db.query('UPDATE docitems SET productData = ? WHERE id = ?', [JSON.stringify(productData), entry.id])
                totalEntriesProcessed++
            }

            await Product.findByIdAndUpdate(product.id, { onHand: runningOnHand })
            productsProcessed++

            send({
                type: 'progress',
                done: productsProcessed,
                remaining: total - productsProcessed,
                total,
                productName: product.name,
                finalOnHand: runningOnHand,
                orphansDeleted: orphanIds.length
            })
        }

        send({ type: 'done', productsProcessed, entriesProcessed: totalEntriesProcessed, orphansDeleted: totalOrphansDeleted })
        res.end()

    } catch (err) {
        console.error(err)
        send({ type: 'error', message: err.message })
        res.end()
    }
})

module.exports = router
