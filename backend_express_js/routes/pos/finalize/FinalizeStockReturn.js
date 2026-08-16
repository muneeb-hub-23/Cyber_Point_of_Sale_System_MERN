const express = require('express')
const router = express.Router()
const db = require('../../../db')
const Document = require('../../../models/Documents')
const Customer = require('../../../models/Customer')
const Transaction = require('../../../models/Transaction')
const DocItems = require('../../../models/DocumentItem')
const { updateProductHistory, updateShopBalance, insertCashRegisterEntries } = require('./_helpers')

function formatDate3(timestamp) {
    const d = new Date(timestamp)
    return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
}

router.post('/', async (req, res) => {
    let { paidamount, splitedPayments, totalSum, currentTime, user, customer, selectedShop, selectedBill, total, date } = req.body

    if (!selectedBill || !total || !date || typeof paidamount === 'undefined' || !splitedPayments) {
        return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const docId = selectedBill._id || selectedBill.id
    const fdate = formatDate3(date)

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
            const itemsList = await DocItems.find({ document: docId }, conn)
            if (!itemsList || itemsList.length === 0) {
                throw new Error('No items found for this document')
            }

            await updateProductHistory(itemsList, user, -1, 'stockreturn', conn)

            let NewTransaction = null
            if (customer) {
                const customerId = customer._id || customer.id
                const currentCustomer = await Customer.findById(customerId, conn)
                if (!currentCustomer) throw new Error('Customer not found')

                NewTransaction = await Transaction.save({
                    currentCustomer: customer,
                    date: fdate, transactionType: 'stockreturn', amount: totalSum,
                    trnsType: 'plus', oldBalance: currentCustomer.balance,
                    newBalance: currentCustomer.balance + totalSum,
                }, conn)
                await Customer.findByIdAndUpdate(customerId, { $inc: { balance: parseFloat(Number(totalSum).toFixed(2)) } }, conn)
            }

            await Document.findByIdAndUpdate(docId, {
                status: 'processed', date: fdate, time: currentTime,
                customer: customer ? (customer._id || customer.id) : null,
                subtotal: total.costexpense, discount: total.discount,
                totalamount: total.costexpense - total.discount,
                payment: splitedPayments, amountpaid: paidamount,
                ...(NewTransaction ? { transaction: NewTransaction.id } : {}),
            }, conn)

            if (splitedPayments.length > 0) {
                await insertCashRegisterEntries(splitedPayments, selectedShop, customer ? (customer._id || customer.id) : null, fdate, user, 'StockReturn', docId, conn)
            }
            await updateShopBalance(selectedShop, conn)
        })

        res.json({ success: true })
    } catch (error) {
        console.error('Error in FinalizeStockReturn:', error)
        try {
            await Document.findOneAndUpdate({ id: docId, status: 'processing' }, { status: 'pending' })
        } catch (rb) { console.error('Rollback failed:', rb) }
        res.status(500).json({ success: false, message: error.message })
    }
})

module.exports = router
