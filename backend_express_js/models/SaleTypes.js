const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const SaleTypes = {
    async find(filter = {}) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            const [rows] = await db.query('SELECT * FROM saletypes')
            return rows
        }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [rows] = await db.query(`SELECT * FROM saletypes WHERE ${where}`, Object.values(filter))
        return rows
    },

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM saletypes WHERE id = ?', [id])
        return rows[0] || null
    },

    async save(data) {
        const id = data.id || uuidv4()
        await db.query(
            'INSERT INTO saletypes (id, name, description, shop) VALUES (?,?,?,?)',
            [id, data.name, data.description || null, data.shop]
        )
        return this.findById(id)
    },

    async findByIdAndUpdate(id, update) {
        const keys = Object.keys(update)
        if (keys.length === 0) return this.findById(id)
        const set = keys.map(k => `\`${k}\` = ?`).join(', ')
        await db.query(`UPDATE saletypes SET ${set} WHERE id = ?`, [...Object.values(update), id])
        return this.findById(id)
    },

    async findByIdAndDelete(id) {
        const row = await this.findById(id)
        await db.query('DELETE FROM saletypes WHERE id = ?', [id])
        return row
    },
}

module.exports = SaleTypes
