const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
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

router.get('/', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const total = COLLECTIONS.length
    const startTime = Date.now()
    const data = {}

    try {
        for (let i = 0; i < COLLECTIONS.length; i++) {
            const { key, Model, label } = COLLECTIONS[i]
            data[key] = await Model.find()

            const done = i + 1
            const elapsed = Math.round((Date.now() - startTime) / 1000)
            const avgPerStep = elapsed / done
            const remaining = Math.round(avgPerStep * (total - done))

            send(res, {
                step: done,
                total,
                percent: Math.round((done / total) * 100),
                label: `Reading: ${label}`,
                elapsed,
                remaining,
                done: false,
            })
        }

        const token = jwt.sign(data, 'Hello@123')

        const backupFolder = path.join(__dirname, '../../database_files')
        if (!fs.existsSync(backupFolder)) fs.mkdirSync(backupFolder, { recursive: true })

        const currentDateTime = new Date().toISOString().replace(/:/g, '-')
        const fileName = `backup_${currentDateTime}.txt`
        const filePath = path.join(backupFolder, fileName)
        fs.writeFileSync(filePath, token)

        const elapsed = Math.round((Date.now() - startTime) / 1000)
        send(res, { step: total, total, percent: 100, label: 'Backup saved successfully!', elapsed, remaining: 0, done: true, fileName })
    } catch (err) {
        console.error(err)
        send(res, { error: true, message: err.message || 'Backup failed' })
    } finally {
        res.end()
    }
})

module.exports = router