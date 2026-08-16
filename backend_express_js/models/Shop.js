const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const q = (conn, sql, vals) => conn ? conn.query(sql, vals) : db.query(sql, vals)

function _parse(row) {
    if (!row) return null
    row._id      = row.id
    row.customers = Number(row.customers)
    row.lenehain  = parseFloat(row.lenehain)
    row.denehain  = parseFloat(row.denehain)
    return row
}

const Shop = {
    async find(filter = {}, conn) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            const [rows] = await q(conn, 'SELECT * FROM shops', [])
            return rows.map(_parse)
        }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [rows] = await q(conn, `SELECT * FROM shops WHERE ${where}`, Object.values(filter))
        return rows.map(_parse)
    },

    async findById(id, conn) {
        const [rows] = await q(conn, 'SELECT * FROM shops WHERE id = ?', [id])
        return rows[0] ? _parse(rows[0]) : null
    },

    async findOne(filter = {}, conn) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            const [rows] = await q(conn, 'SELECT * FROM shops LIMIT 1', [])
            return rows[0] ? _parse(rows[0]) : null
        }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [rows] = await q(conn, `SELECT * FROM shops WHERE ${where} LIMIT 1`, Object.values(filter))
        return rows[0] ? _parse(rows[0]) : null
    },

    async save(data, conn) {
        const id = data.id || uuidv4()
        await q(conn,
            'INSERT INTO shops (id, shopName, customers, lenehain, denehain) VALUES (?,?,?,?,?)',
            [id, data.shopName, data.customers || 0, data.lenehain || 0, data.denehain || 0]
        )
        return this.findById(id, conn)
    },

    async findByIdAndUpdate(id, update, conn) {
        const plainUpdate = {}
        const incUpdate = {}
        for (const [k, v] of Object.entries(update)) {
            if (k === '$inc') Object.assign(incUpdate, v)
            else plainUpdate[k] = v
        }
        const parts = []
        const vals = []
        for (const [k, v] of Object.entries(plainUpdate))  { parts.push(`\`${k}\` = ?`);             vals.push(v) }
        for (const [k, v] of Object.entries(incUpdate))    { parts.push(`\`${k}\` = \`${k}\` + ?`); vals.push(v) }
        if (parts.length === 0) return this.findById(id, conn)
        await q(conn, `UPDATE shops SET ${parts.join(', ')} WHERE id = ?`, [...vals, id])
        return this.findById(id, conn)
    },

    async findOneAndUpdate(filter, update, conn) {
        const row = await this.findOne(filter, conn)
        if (!row) return null
        return this.findByIdAndUpdate(row.id, update, conn)
    },

    async deleteOne(filter, conn) {
        const keys = Object.keys(filter)
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [result] = await q(conn, `DELETE FROM shops WHERE ${where}`, Object.values(filter))
        return { deletedCount: result.affectedRows }
    },
}

module.exports = Shop
