const express = require('express')
const router = express.Router()
const db = require('../../../db')
const Document = require('../../../models/Documents')
const Customer = require('../../../models/Customer')
const Transaction = require('../../../models/Transaction')
const DocItems = require('../../../models/DocumentItem')
const CashRegister = require('../../../models/CashRegister')
const { updateProductHistory, updateShopBalance } = require('./_helpers')

function formatDate3(timestamp) {
    const d = new Date(timestamp)
    return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
}

router.post('/', async (req, res) => {
    let { paidamount, splitedPayments, totalSum, currentTime, user, customer, selectedShop, selectedBill, total, date } = req.body
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
            await updateProductHistory(itemsList, user, -1, 'loss', conn)

            let NewTransaction = null
            if (customer) {
                const customerId = customer._id || customer.id
                NewTransaction = await Transaction.save({
                    currentCustomer: customer,
                    date: fdate, transactionType: 'bonus', amount: totalSum,
                    trnsType: 'plus', oldBalance: customer.balance,
                    newBalance: customer.balance + Number(totalSum),
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

            const customerId = customer ? (customer._id || customer.id) : null
            const allEntries = [
                ...splitedPayments.map(p => ({ user, customer: customerId, date: fdate, type: 'Bonus', method: p.name, amount: p.amount, shop: selectedShop, document: docId })),
                { user, customer: customerId, date: fdate, type: 'Loss', method: 'Debit', amount: total.costexpense, shop: selectedShop, document: docId },
            ]
            await CashRegister.insertMany(allEntries, conn)
            await updateShopBalance(selectedShop, conn)
        })

        res.json({ success: true })
    } catch (error) {
        console.error('Error in FinalizeLoss:', error)
        try {
            await Document.findOneAndUpdate({ id: docId, status: 'processing' }, { status: 'pending' })
        } catch (rb) { console.error('Rollback failed:', rb) }
        res.status(500).json({ success: false, message: error.message })
    }
})

module.exports = router
