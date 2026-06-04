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
        let productsProcessed = 0

        for (let i = 0; i < products.length; i++) {
            const product = products[i]

            const entries = await DocItems.find({ product: product._id })
                .populate('document')
                .sort({ createdAt: 1 })

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
                finalOnHand: runningOnHand
            })
        }

        send({ type: 'done', productsProcessed, entriesProcessed: totalEntriesProcessed })
        res.end()

    } catch (err) {
        console.error(err)
        send({ type: 'error', message: err.message })
        res.end()
    }
})

module.exports = router
