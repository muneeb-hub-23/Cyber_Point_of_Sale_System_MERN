const express = require('express')
const router = express.Router()
const db = require('../../../db')
const CashRegister = require('../../../models/CashRegister')
const Document = require('../../../models/Documents')
const Customer = require('../../../models/Customer')
const Product = require('../../../models/Product')
const ProductHistory = require('../../../models/ProductHistory')
const Transaction = require('../../../models/Transaction')
const Shop = require('../../../models/Shop')
const DocItem = require('../../../models/DocumentItem')

function formatDate3(timestamp) {
    const date = new Date(timestamp)
    return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`
}

router.post('/', async (req, res) => {
    let { paidamount, splitedPayments, totalSum, currentTime, user, customer, selectedShop, selectedBill, total, date } = req.body
    const docId = selectedBill._id || selectedBill.id
    const fdate = formatDate3(date)

    // ── Idempotency guard ────────────────────────────────────────────────────
    const existingDoc = await Document.findById(docId)
    if (!existingDoc) return res.status(404).json({ success: false, message: 'Document not found' })
    if (existingDoc.status === 'processed') return res.json({ success: true, alreadyProcessed: true })

    const claimed = await Document.findOneAndUpdate(
        { id: docId, status: { $in: ['open', 'draw', 'pending'] } },
        { status: 'processing' }
    )
    if (!claimed) return res.status(409).json({ success: false, message: 'Document is already being processed or was already finalized' })

    try {
        await db.withTransaction(async (conn) => {
            const itemsList = await DocItem.find({ document: docId }, conn)
            const productIds = itemsList.map(item => item.product)
            const products = await Product.find({ id: { $in: productIds } }, conn)
            const bulkOps = []

            for (const match of itemsList) {
                const product = products.find(p => p.id === match.product)
                if (product) {
                    await ProductHistory.save({ ...product, modifiedby: user, productId: product.id, docType: 'purchase' }, conn)
                    bulkOps.push({
                        updateOne: {
                            filter: { id: match.product },
                            update: {
                                $inc: { onHand: match.qty },
                                ...(customer ? { suplier: customer._id || customer.id } : {}),
                            },
                        },
                    })
                }
            }
            await Product.bulkWrite(bulkOps, conn)

            let NewTransaction = null
            if (customer) {
                const customerId = customer._id || customer.id
                NewTransaction = await Transaction.save({
                    currentCustomer: customer,
                    date: fdate, transactionType: 'malllia', amount: totalSum,
                    trnsType: 'minus', oldBalance: customer.balance,
                    newBalance: customer.balance - totalSum,
                }, conn)
                await Customer.findByIdAndUpdate(customerId, { $inc: { balance: -(parseFloat(Number(totalSum).toFixed(2))) } }, conn)
            }

            await Document.findByIdAndUpdate(docId, {
                status: 'processed', date: fdate, time: currentTime,
                customer: customer ? (customer._id || customer.id) : null,
                subtotal: total.costexpense, discount: total.discount,
                totalamount: total.costexpense - total.discount,
                payment: splitedPayments, amountpaid: paidamount,
                ...(NewTransaction ? { transaction: NewTransaction.id } : {}),
            }, conn)

            const entries = splitedPayments.map(p => ({
                user, customer: customer ? (customer._id || customer.id) : null,
                date: fdate, type: 'Purchase', method: p.name, amount: p.amount,
                shop: selectedShop,
            }))
            await CashRegister.insertMany(entries, conn)

            const shopCustomers = await Customer.find({ linkedShop: selectedShop }, conn)
            let lenehain = 0, denehain = 0
            shopCustomers.forEach(c => { if (c.balance >= 0) lenehain += c.balance; else denehain += Math.abs(c.balance) })
            await Shop.findByIdAndUpdate(selectedShop, {
                lenehain: parseFloat(lenehain).toFixed(2),
                denehain: parseFloat(denehain).toFixed(2),
            }, conn)
        })

        res.json({ success: true })
    } catch (error) {
        console.error('Error in FinalizePurchase:', error)
        try {
            await Document.findOneAndUpdate({ id: docId, status: 'processing' }, { status: 'pending' })
        } catch (rb) { console.error('Rollback failed:', rb) }
        res.status(500).json({ success: false, message: error.message })
    }
})

module.exports = router
