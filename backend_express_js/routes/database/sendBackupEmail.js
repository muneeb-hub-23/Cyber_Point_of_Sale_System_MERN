const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
const db = require('../../db')

const TABLES = [
    { key: 'cashregister',    table: 'cashregister',        label: 'Cash Register' },
    { key: 'category',        table: 'categories',           label: 'Categories' },
    { key: 'counter',         table: 'counters',             label: 'Counters' },
    { key: 'customers',       table: 'customers',            label: 'Customers' },
    { key: 'customersgroups', table: 'customergroups',       label: 'Customer Groups' },
    { key: 'documentitem',    table: 'docitems',             label: 'Document Items' },
    { key: 'documentnumber',  table: 'documentnumbers',      label: 'Document Numbers' },
    { key: 'documents',       table: 'documents',            label: 'Documents' },
    { key: 'history',         table: 'history',              label: 'History' },
    { key: 'paymentmethods',  table: 'paymentmethods',       label: 'Payment Methods' },
    { key: 'products',        table: 'products',             label: 'Products' },
    { key: 'producthistory',  table: 'producthistory',       label: 'Product History' },
    { key: 'saletypes',       table: 'saletypes',            label: 'Sale Types' },
    { key: 'shops',           table: 'shops',                label: 'Shops' },
    { key: 'transactions',    table: 'transactions',         label: 'Transactions' },
    { key: 'users',           table: 'users',                label: 'Users' },
]

const send = (res, payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`)

router.get('/', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const total = TABLES.length
    const startTime = Date.now()
    const data = {}

    try {
        for (let i = 0; i < TABLES.length; i++) {
            const { key, table, label } = TABLES[i]
            const [rows] = await db.query(`SELECT * FROM \`${table}\``)
            data[key] = rows

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
