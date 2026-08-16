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
const DocCounter = require('../../../models/DocumentNumber')
const CustomerGroup = require('../../../models/CustomerGroup')

function formatDateToYYYYMMDD(dateString) {
    const date = new Date(dateString)
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
}

router.post('/', async (req, res) => {
    let { user, currentTime, date, selectedBill, customerGroup, finalTotals, balanceTotal } = req.body

    // ── Idempotency guard (outside transaction — just a read) ─────────────────
    const existingDoc = await Document.findById(selectedBill._id)
    if (!existingDoc) return res.status(404).json({ success: false, message: 'Document not found' })
    if (existingDoc.status === 'processed') return res.json({ success: true, alreadyProcessed: true })

    // Claim the document atomically before starting the transaction
    const claimed = await Document.findOneAndUpdate(
        { id: selectedBill._id, status: { $in: ['open', 'draw', 'pending'] } },
        { status: 'processing' }
    )
    if (!claimed) {
        return res.status(409).json({ success: false, message: 'Document is already being processed or was already finalized' })
    }

    try {
        if (customerGroup) {
            customerGroup = await CustomerGroup.findById(customerGroup._id || customerGroup.id)
        }

        await db.withTransaction(async (conn) => {
            let allItems = await DocItem.find({ document: selectedBill._id }, conn)
            const documentsToProcess = []

            for (const shopEntry of balanceTotal) {
                const shop = shopEntry.shop
                const shopId = shop._id || shop.id

                let count = 1
                const xip = await DocCounter.find({}, conn)
                if (xip.length > 0) {
                    await DocCounter.updateMany({}, { $inc: { count: 1 } }, conn)
                    count = xip[0].count
                } else {
                    await DocCounter.save({ count: 1 }, conn)
                }

                const newDocument = await Document.save({
                    doctype: 'sale', status: 'processed',
                    date: selectedBill.date,
                    customerGroup: customerGroup ? (customerGroup._id || customerGroup.id) : null,
                    user, linkedShop: shopId, count,
                }, conn)
                documentsToProcess.push({ ...newDocument, linkedShop: shopId })
            }

            // Re-link items to their per-shop documents
            for (const item of allItems) {
                const productShop = item.product ? item.product.shop : null
                const docForItem = documentsToProcess.find(d => d.linkedShop === productShop || d.linkedShop?.toString() === productShop?.toString())
                if (docForItem) await DocItem.findByIdAndUpdate(item.id, { document: docForItem.id }, conn)
            }

            for (const document of documentsToProcess) {
                const thisShopData = balanceTotal.find(b => {
                    const sid = b.shop._id || b.shop.id
                    return sid === document.linkedShop || sid?.toString() === document.linkedShop?.toString()
                })

                let customer = null
                if (customerGroup?.ids) {
                    const match = customerGroup.ids.find(c => {
                        const cShopId = c.shopID?._id || c.shopID?.id || c.shopID
                        return cShopId === document.linkedShop || cShopId?.toString() === document.linkedShop?.toString()
                    })
                    if (match) customer = match.customerID
                }

                const itemsList = await DocItem.find({ document: document.id }, conn)
                const productIds = itemsList.map(item => item.product)
                const products = await Product.find({ id: { $in: productIds } }, conn)
                const bulkOps = []

                for (const match of itemsList) {
                    const product = products.find(p => p.id === match.product)
                    if (product) {
                        await ProductHistory.save({ ...product, modifiedby: user, productId: product.id, docType: 'sale' }, conn)
                        bulkOps.push({ updateOne: { filter: { id: match.product }, update: { $inc: { onHand: -match.qty } } } })
                    }
                }
                await Product.bulkWrite(bulkOps, conn)

                const debitPayment = thisShopData.shopPayments.find(p => p.name === 'Debit')
                const totalSum = thisShopData.shopPayments.reduce((t, l) => t + (l.name === 'Debit' ? l.amount : 0), 0)

                let NewTransaction = null
                if (customer) {
                    const customerId = customer._id || customer.id
                    const fullCustomer = await Customer.findById(customerId, conn)
                    NewTransaction = await Transaction.save({
                        currentCustomer: fullCustomer || customer,
                        date: formatDateToYYYYMMDD(date),
                        transactionType: 'malldia', amount: totalSum, trnsType: 'plus',
                        oldBalance: (fullCustomer || customer).balance,
                        newBalance: (fullCustomer || customer).balance + totalSum,
                        daysToClear: debitPayment?.daysToClear || 0,
                        remarks: debitPayment?.remarks || '',
                    }, conn)
                    await Customer.findByIdAndUpdate(customerId, { $inc: { balance: totalSum } }, conn)
                }

                await Document.findByIdAndUpdate(document.id, {
                    customer: customer ? (customer._id || customer.id) : null,
                    time: currentTime,
                    subtotal: thisShopData.shopTotalAfterDiscount,
                    discount: thisShopData.cartDiscount,
                    totalamount: thisShopData.shopPayments.reduce((t, l) => t + l.amount, 0),
                    payment: thisShopData.shopPayments,
                    amountpaid: thisShopData.shopPayments.reduce((t, l) => t + l.amount, 0),
                    ...(NewTransaction ? { transaction: NewTransaction.id } : {}),
                }, conn)

                const entries = thisShopData.shopPayments.map(p => ({
                    user, customer: customer ? (customer._id || customer.id) : null,
                    date, type: 'Sale', method: p.name, amount: p.amount,
                    shop: thisShopData.shop._id || thisShopData.shop.id,
                    document: document.id,
                }))
                await CashRegister.insertMany(entries, conn)

                const shopCustomers = await Customer.find({ linkedShop: document.linkedShop }, conn)
                let lenehain = 0, denehain = 0
                shopCustomers.forEach(c => { if (c.balance >= 0) lenehain += c.balance; else denehain += Math.abs(c.balance) })
                await Shop.findByIdAndUpdate(document.linkedShop, {
                    lenehain: parseFloat(lenehain).toFixed(2),
                    denehain: parseFloat(denehain).toFixed(2),
                }, conn)
            }
        })

        res.json({ success: true })
    } catch (error) {
        console.error('[FinalizeSale] ERROR:', error.message, error.stack)
        try {
            await Document.findOneAndUpdate({ id: selectedBill._id, status: 'processing' }, { status: 'pending' })
        } catch (rb) { console.error('[FinalizeSale] Rollback failed:', rb) }
        res.status(500).json({ success: false, message: error.message })
    }
})

module.exports = router
