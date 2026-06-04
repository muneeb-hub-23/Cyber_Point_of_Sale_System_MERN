const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');
const CashRegister = require('../../models/CashRegister')
const Category = require('../../models/Category')
const Counter = require('../../models/Counter')
const Customer = require('../../models/Customer')
const CustomerGroup = require('../../models/CustomerGroup')
const DocumentItem = require('../../models/DocumentItem')
const DocumentNumber = require('../../models/DocumentNumber')
const Documents = require('../../models/Documents')
const History = require('../../models/History')
const PaymentMethods = require('../../models/PaymentMethods')
const Products = require('../../models/Product')
const ProductHistory = require('../../models/ProductHistory')
const SaleTypes = require('../../models/SaleTypes')
const Shop = require('../../models/Shop')
const Transaction = require('../../models/Transaction')
const Users = require('../../models/User')

const upload = multer({ dest: 'public/uploads/' })

const COLLECTIONS = [
    { key: 'cashregister',    Model: CashRegister,   label: 'Cash Register' },
    { key: 'category',        Model: Category,        label: 'Categories' },
    { key: 'counter',         Model: Counter,         label: 'Counters' },
    { key: 'customers',       Model: Customer,        label: 'Customers' },
    { key: 'customersgroups', Model: CustomerGroup,   label: 'Customer Groups' },
    { key: 'documentitem',    Model: DocumentItem,    label: 'Document Items' },
    { key: 'documentnumber',  Model: DocumentNumber,  label: 'Document Numbers' },
    { key: 'documents',       Model: Documents,       label: 'Documents' },
    { key: 'history',         Model: History,         label: 'History' },
    { key: 'paymentmethods',  Model: PaymentMethods,  label: 'Payment Methods' },
    { key: 'products',        Model: Products,        label: 'Products' },
    { key: 'producthistory',  Model: ProductHistory,  label: 'Product History' },
    { key: 'saletypes',       Model: SaleTypes,       label: 'Sale Types' },
    { key: 'shops',           Model: Shop,            label: 'Shops' },
    { key: 'transactions',    Model: Transaction,     label: 'Transactions' },
    { key: 'users',           Model: Users,           label: 'Users' },
]

const send = (res, payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`)

router.post('/', upload.single('backupFile'), async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const total = COLLECTIONS.length * 2  // delete pass + insert pass
    const startTime = Date.now()
    let step = 0

    const progress = (label) => {
        step++
        const elapsed = Math.round((Date.now() - startTime) / 1000)
        const avgPerStep = step > 0 ? elapsed / step : 0
        const remaining = Math.round(avgPerStep * (total - step))
        send(res, {
            step,
            total,
            percent: Math.round((step / total) * 100),
            label,
            elapsed,
            remaining,
            done: false,
        })
    }

    try {
        const filePath = req.file.path
        const token = await fs.readFile(filePath, 'utf-8')

        let backupData
        try {
            backupData = jwt.verify(token, 'Hello@123')
        } catch (e) {
            send(res, { error: true, message: 'Invalid backup file' })
            res.end(); return
        }

        // Delete pass
        for (const { Model, label } of COLLECTIONS) {
            await Model.deleteMany({})
            progress(`Clearing: ${label}`)
        }

        // Insert pass
        for (const { key, Model, label } of COLLECTIONS) {
            const records = backupData[key]
            if (records && records.length > 0) await Model.insertMany(records)
            progress(`Restoring: ${label}`)
        }

        await fs.unlink(filePath)

        const elapsed = Math.round((Date.now() - startTime) / 1000)
        send(res, { step: total, total, percent: 100, label: 'Database restored successfully!', elapsed, remaining: 0, done: true })
    } catch (err) {
        console.error(err)
        send(res, { error: true, message: err.message || 'Restore failed' })
    } finally {
        res.end()
    }
})

module.exports = router;
