const express = require('express')
const router = express.Router()
const DocItems = require('../../../models/DocumentItem')
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

            const allEntries = await DocItems.find({ product: product._id })
                .populate('document')
                .sort({ createdAt: 1 })

            // Delete orphan entries whose parent document was deleted (old glitches)
            const orphanIds = allEntries.filter(e => !e.document).map(e => e._id)
            if (orphanIds.length > 0) {
                await DocItems.deleteMany({ _id: { $in: orphanIds } })
                totalOrphansDeleted += orphanIds.length
            }

            const entries = allEntries.filter(e => e.document)

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
                await DocItems.findByIdAndUpdate(entry._id, {
                    $set: { 'productData.onHand': onHandBefore }
                })
                totalEntriesProcessed++
            }

            await Product.findByIdAndUpdate(product._id, { onHand: runningOnHand })
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
