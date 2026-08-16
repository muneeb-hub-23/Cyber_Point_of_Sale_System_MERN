const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const q = (conn, sql, vals) => conn ? conn.query(sql, vals) : db.query(sql, vals)

const History = {
    async find(filter = {}, conn) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            const [rows] = await q(conn, 'SELECT * FROM history', [])
            return rows
        }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [rows] = await q(conn, `SELECT * FROM history WHERE ${where}`, Object.values(filter))
        return rows
    },

    async save(data, conn) {
        const id = data.id || uuidv4()
        await q(conn, 'INSERT INTO history (id, shopName, lenehain, denehain) VALUES (?,?,?,?)',
            [id, data.shopName || null, data.lenehain || null, data.denehain || null])
        const [rows] = await q(conn, 'SELECT * FROM history WHERE id = ?', [id])
        return rows[0] || null
    },
}

module.exports = History
