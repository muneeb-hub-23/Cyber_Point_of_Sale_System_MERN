/**
 * Targeted Migration: docitems only
 * ===================================
 * Migrates only the `docitems` collection from MongoDB to MySQL.
 * The collection was incorrectly referenced as `documentitems` in the
 * original migration script — the actual MongoDB collection name is `docitems`.
 *
 * Usage:
 *   node migrate_docitems_only.js
 */

'use strict'

const mongoose = require('mongoose')
const mysql    = require('mysql2/promise')
const dbConfig = require('./config')

const MONGO_URI = 'mongodb://localhost:27017/cyber_khata'
const BATCH_SIZE = 500

// ─── helpers ────────────────────────────────────────────────────────────────

const str  = v => (v == null ? null : String(v))
const num  = v => (v == null ? null : Number(v))
const json = v => {
    if (v == null) return null
    if (typeof v === 'string') return v
    return JSON.stringify(v)
}
const id = v => {
    if (!v) return null
    if (typeof v === 'string') return v
    if (v._id) return String(v._id)
    return String(v)
}

function progress(current, total) {
    process.stdout.write(`\r  ${current} / ${total} (${Math.round(current / total * 100)}%)`)
    if (current === total) process.stdout.write('\n')
}

// Batch insert using INSERT IGNORE (skip duplicates)
async function batchUpsert(pool, table, rows) {
    if (!rows.length) return
    const keys = Object.keys(rows[0]).filter(k => rows[0][k] !== undefined)
    if (!keys.length) return
    const cols = keys.map(k => `\`${k}\``).join(', ')
    const placeholders = `(${keys.map(() => '?').join(', ')})`
    const allPlaceholders = rows.map(() => placeholders).join(', ')
    const vals = rows.flatMap(row => keys.map(k => row[k]))
    await pool.query(
        `INSERT IGNORE INTO \`${table}\` (${cols}) VALUES ${allPlaceholders}`,
        vals
    )
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI)

    console.log('Connecting to MySQL...')
    const pool = await mysql.createPool(dbConfig)

    // Check existing MySQL row count
    const [[{ existingCount }]] = await pool.query(
        'SELECT COUNT(*) AS existingCount FROM `docitems`'
    )
    console.log(`MySQL docitems currently has ${existingCount} rows.`)

    // Define a minimal schema and use the CORRECT collection name: 'docitems'
    const schema = new mongoose.Schema({}, { strict: false })
    const DiM = mongoose.model('DocItemMigrate', schema, 'docitems')

    const total = await DiM.countDocuments()
    console.log(`MongoDB docitems has ${total} documents. Starting migration...`)

    let processed = 0
    const cursor = DiM.find({}).lean().cursor()

    let batch = []
    for await (const d of cursor) {
        batch.push({
            id:          id(d._id),
            document:    id(d.document),
            productData: json(d.productData),
            product:     id(d.product) || 'unknown',
            cost:        num(d.cost) || 0,
            expense:     num(d.expense) || 0,
            costExpense: num(d.costExpense) || 0,
            tax:         num(d.tax) || 0,
            discount:    json(d.discount),
            sale:        num(d.sale) || 0,
            finalprice:  num(d.finalprice),
            qty:         num(d.qty) || 0,
            costamount:  num(d.costamount) || 0,
            saleamount:  num(d.saleamount) || 0,
            user:        id(d.user) || 'system',
            createdAt:   d.createdAt || new Date(),
            updatedAt:   d.updatedAt || new Date(),
        })

        if (batch.length >= BATCH_SIZE) {
            await batchUpsert(pool, 'docitems', batch)
            processed += batch.length
            batch = []
            progress(processed, total)
        }
    }

    // Insert remaining
    if (batch.length > 0) {
        await batchUpsert(pool, 'docitems', batch)
        processed += batch.length
        progress(processed, total)
    }

    // Final count
    const [[{ finalCount }]] = await pool.query(
        'SELECT COUNT(*) AS finalCount FROM `docitems`'
    )
    console.log(`\nDone! MySQL docitems now has ${finalCount} rows (inserted ${finalCount - existingCount} new rows).`)

    await pool.end()
    await mongoose.disconnect()
}

main().catch(err => {
    console.error('Migration failed:', err)
    process.exit(1)
})
