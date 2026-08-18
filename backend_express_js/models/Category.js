const db = require('../db')
const { v4: uuidv4 } = require('uuid')

function _parse(row) {
    if (!row) return null
    row._id = row.id
    return row
}

const Category = {
    async find(filter = {}) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            const [rows] = await db.query('SELECT * FROM categories')
            return rows.map(_parse)
        }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [rows] = await db.query(`SELECT * FROM categories WHERE ${where}`, Object.values(filter))
        return rows.map(_parse)
    },

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id])
        return rows[0] ? _parse(rows[0]) : null
    },

    async findOne(filter = {}) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            const [rows] = await db.query('SELECT * FROM categories LIMIT 1')
            return rows[0] ? _parse(rows[0]) : null
        }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [rows] = await db.query(`SELECT * FROM categories WHERE ${where} LIMIT 1`, Object.values(filter))
        return rows[0] ? _parse(rows[0]) : null
    },

    async save(data) {
        const id = data.id || uuidv4()
        await db.query(
            'INSERT INTO categories (id, name, description, shop, enabled, products) VALUES (?,?,?,?,?,?)',
            [id, data.name, data.description || '', data.shop, data.enabled !== false ? 1 : 0, data.products || 0]
        )
        return this.findById(id)
    },

    async findByIdAndUpdate(id, update) {
        const keys = Object.keys(update)
        if (keys.length === 0) return this.findById(id)
        const set = keys.map(k => `\`${k}\` = ?`).join(', ')
        await db.query(`UPDATE categories SET ${set} WHERE id = ?`, [...Object.values(update), id])
        return this.findById(id)
    },

    async findByIdAndDelete(id) {
        const row = await this.findById(id)
        await db.query('DELETE FROM categories WHERE id = ?', [id])
        return row
    },
}

module.exports = Category
