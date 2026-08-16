const db = require('../db')
const { v4: uuidv4 } = require('uuid')

// Use conn (transaction connection) if provided, else fall back to pool
const q = (conn, sql, vals) => conn ? conn.query(sql, vals) : db.query(sql, vals)

function _parse(row) {
    if (!row) return null
    row._id     = row.id
    row.balance  = parseFloat(row.balance)
    row.leneHain = parseFloat(row.leneHain)
    row.deneHain = parseFloat(row.deneHain)
    return row
}

function _buildWhere(filter) {
    const conditions = []
    const vals = []
    for (const [k, v] of Object.entries(filter)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            if (v.$ne !== undefined) { conditions.push(`\`${k}\` != ?`); vals.push(v.$ne) }
            else if (v.$in)         {
                if (v.$in.length === 0) { conditions.push('1 = 0') }
                else { conditions.push(`\`${k}\` IN (?)`); vals.push(v.$in) }
            }
            else                    { conditions.push(`\`${k}\` = ?`);    vals.push(v) }
        } else {
            conditions.push(`\`${k}\` = ?`); vals.push(v)
        }
    }
    return { conditions, vals }
}

const Customer = {
    async find(filter = {}, conn) {
        const keys = Object.keys(filter)
        let sql = 'SELECT * FROM customers'
        let vals = []
        if (keys.length > 0) {
            const { conditions, vals: v } = _buildWhere(filter)
            sql += ' WHERE ' + conditions.join(' AND ')
            vals = v
        }
        const [rows] = await q(conn, sql, vals)
        return rows.map(_parse)
    },

    async findById(id, conn) {
        const [rows] = await q(conn, 'SELECT * FROM customers WHERE id = ?', [id])
        return rows[0] ? _parse(rows[0]) : null
    },

    async findOne(filter = {}, conn) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            const [rows] = await q(conn, 'SELECT * FROM customers LIMIT 1', [])
            return rows[0] ? _parse(rows[0]) : null
        }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [rows] = await q(conn, `SELECT * FROM customers WHERE ${where} LIMIT 1`, Object.values(filter))
        return rows[0] ? _parse(rows[0]) : null
    },

    async save(data, conn) {
        const id = data.id || uuidv4()
        await q(conn,
            `INSERT INTO customers
              (id, customerName, customerMobileNumber, leneHain, deneHain, balance,
               customerType, customerCnic, customerEmail, customerAddress, linkedShop, status)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.customerName || null,
                data.customerMobileNumber || null,
                data.leneHain || 0,
                data.deneHain || 0,
                data.balance || 0,
                data.customerType || null,
                data.customerCnic || null,
                data.customerEmail || null,
                data.customerAddress || null,
                data.linkedShop,
                data.status !== undefined ? (data.status ? 1 : 0) : 1,
            ]
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
        for (const [k, v] of Object.entries(plainUpdate)) { parts.push(`\`${k}\` = ?`); vals.push(v) }
        for (const [k, v] of Object.entries(incUpdate))   { parts.push(`\`${k}\` = \`${k}\` + ?`); vals.push(v) }
        if (parts.length === 0) return this.findById(id, conn)
        await q(conn, `UPDATE customers SET ${parts.join(', ')} WHERE id = ?`, [...vals, id])
        return this.findById(id, conn)   // already goes through _parse
    },

    async deleteOne(filter, conn) {
        const keys = Object.keys(filter)
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [result] = await q(conn, `DELETE FROM customers WHERE ${where}`, Object.values(filter))
        return { deletedCount: result.affectedRows }
    },

    async deleteMany(filter, conn) {
        const keys = Object.keys(filter)
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [result] = await q(conn, `DELETE FROM customers WHERE ${where}`, Object.values(filter))
        return { deletedCount: result.affectedRows }
    },
}

module.exports = Customer
