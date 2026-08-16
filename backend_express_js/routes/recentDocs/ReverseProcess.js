const express = require('express')
const router = express.Router()
const db = require('../../db')
const Document = require('../../models/Documents')
const DocumentItem = require('../../models/DocumentItem')
const CashRegister = require('../../models/CashRegister')
const Customer = require('../../models/Customer')
const Transaction = require('../../models/Transaction')
const Shop = require('../../models/Shop')
const Product = require('../../models/Product')

router.post('/', async (req, res) => {
    const { docid } = req.headers

    // Atomically claim the document for reversal
    const thisdoc = await Document.findOneAndUpdate(
        { id: docid, status: { $in: ['processed', 'pending', 'open', 'draw'] } },
        { status: 'reversing' }
    )
    if (!thisdoc) {
        const still = await Document.findById(docid)
        if (still?.status === 'reversing') return res.status(409).json({ success: false, message: 'Document is already being reversed' })
        return res.status(404).json({ success: false, message: 'Document not found or already reversed' })
    }

    try {
        const newDoc = await db.withTransaction(async (conn) => {
            const docEntries = await DocumentItem.find({ document: docid }, conn)

            // Reverse stock
            const productUpdates = []
            if (['sale', 'stockreturn', 'loss'].includes(thisdoc.doctype)) {
                for (const entry of docEntries) {
                    productUpdates.push({ updateOne: { filter: { id: entry.product }, update: { $inc: { onHand: Number(entry.qty) } } } })
                }
            } else if (['refund', 'purchase'].includes(thisdoc.doctype)) {
                for (const entry of docEntries) {
                    productUpdates.push({ updateOne: { filter: { id: entry.product }, update: { $inc: { onHand: -Number(entry.qty) } } } })
                }
            }
            if (productUpdates.length) await Product.bulkWrite(productUpdates, conn)

            await CashRegister.deleteMany({ document: docid }, conn)

            const payment = Array.isArray(thisdoc.payment) ? thisdoc.payment : []
            const debit = payment.find(p => p.name === 'Debit')
            if (debit && thisdoc.customer) {
                const balanceAdjustment = ['sale', 'stockreturn', 'loss'].includes(thisdoc.doctype)
                    ? -parseFloat(debit.amount.toFixed(2))
                    : parseFloat(debit.amount.toFixed(2))
                await Customer.findByIdAndUpdate(thisdoc.customer, { $inc: { balance: balanceAdjustment } }, conn)
                if (thisdoc.transaction) await Transaction.deleteOne({ id: thisdoc.transaction }, conn)
            }

            const customersArray = await Customer.find({ linkedShop: thisdoc.linkedShop }, conn)
            let totalLeneHain = 0, totalDeneHain = 0
            customersArray.forEach(c => { if (c.balance > 0) totalLeneHain += c.balance; else totalDeneHain += c.balance })
            await Shop.findByIdAndUpdate(thisdoc.linkedShop, {
                lenehain: parseFloat(totalLeneHain.toFixed(2)),
                denehain: parseFloat(totalDeneHain.toFixed(2)),
            }, conn)

            // Delete original items and document, recreate as pending
            await DocumentItem.deleteMany({ document: docid }, conn)
            await Document.findByIdAndDelete(docid, conn)

            const newDocument = await Document.save({
                doctype: thisdoc.doctype, user: thisdoc.user, status: 'pending',
                date: thisdoc.date, time: thisdoc.time,
                customer: thisdoc.customer || null,
                customerGroup: thisdoc.customerGroup || null,
                linkedShop: thisdoc.linkedShop,
                subtotal: thisdoc.subtotal, discount: thisdoc.discount,
                totalamount: thisdoc.totalamount, payment: thisdoc.payment,
                amountpaid: thisdoc.amountpaid, count: thisdoc.count,
            }, conn)

            for (const entry of docEntries) {
                await DocumentItem.save({
                    document: newDocument.id,
                    productData: entry.productData, product: entry.product,
                    cost: entry.cost, expense: entry.expense, costExpense: entry.costExpense,
                    tax: entry.tax, discount: entry.discount, sale: entry.sale,
                    qty: entry.qty, costamount: entry.costamount, finalprice: entry.finalprice,
                    saleamount: entry.saleamount, user: entry.user,
                }, conn)
            }

            return newDocument
        })

        res.json({ success: true, message: 'Document reversed successfully.' })
    } catch (error) {
        console.error('Error reversing document:', error)
        try {
            await Document.findOneAndUpdate({ id: docid, status: 'reversing' }, { status: 'processed' })
        } catch (rb) { console.error('Rollback failed:', rb) }
        res.status(500).json({ success: false, message: error.message || 'An error occurred while reversing the document.' })
    }
})

module.exports = router
