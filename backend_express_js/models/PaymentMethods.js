const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const PaymentMethods = {
    async find(filter = {}) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            const [rows] = await db.query('SELECT * FROM paymentmethods')
            return rows
        }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [rows] = await db.query(`SELECT * FROM paymentmethods WHERE ${where}`, Object.values(filter))
        return rows
    },

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM paymentmethods WHERE id = ?', [id])
        if (!rows[0]) return null
        const row = rows[0]
        // attach deleteOne on the instance for legacy usage: paymentMethod.deleteOne()
        row.deleteOne = async () => {
            await db.query('DELETE FROM paymentmethods WHERE id = ?', [row.id])
            return { deletedCount: 1 }
        }
        row.save = async () => {
            const { deleteOne: _d, save: _s, ...data } = row
            const keys2 = Object.keys(data)
            const set = keys2.filter(k => k !== 'id').map(k => `\`${k}\` = ?`).join(', ')
            const vals = keys2.filter(k => k !== 'id').map(k => data[k])
            await db.query(`UPDATE paymentmethods SET ${set} WHERE id = ?`, [...vals, row.id])
            return PaymentMethods.findById(row.id)
        }
        return row
    },

    async findOne(filter = {}) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            const [rows] = await db.query('SELECT * FROM paymentmethods LIMIT 1')
            return rows[0] || null
        }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [rows] = await db.query(`SELECT * FROM paymentmethods WHERE ${where} LIMIT 1`, Object.values(filter))
        return rows[0] || null
    },

    async save(data) {
        const id = data.id || uuidv4()
        await db.query(
            'INSERT INTO paymentmethods (id, name, description, shop, iscustomerrequired, enabled, bills) VALUES (?,?,?,?,?,?,?)',
            [id, data.name, data.description || '', data.shop, data.iscustomerrequired ? 1 : 0, data.enabled !== false ? 1 : 0, data.bills || 0]
        )
        return this.findById(id)
    },

    async findByIdAndUpdate(id, update) {
        const keys = Object.keys(update)
        if (keys.length === 0) return this.findById(id)
        const set = keys.map(k => `\`${k}\` = ?`).join(', ')
        await db.query(`UPDATE paymentmethods SET ${set} WHERE id = ?`, [...Object.values(update), id])
        return this.findById(id)
    },
}

module.exports = PaymentMethods
