const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const q = (conn, sql, vals) => conn ? conn.query(sql, vals) : db.query(sql, vals)

function _parse(row) {
    if (!row) return null
    if (typeof row.currentCustomer === 'string') try { row.currentCustomer = JSON.parse(row.currentCustomer) } catch (_) {}
    row._id       = row.id
    row.amount     = row.amount     != null ? parseFloat(row.amount)     : null
    row.oldBalance = row.oldBalance != null ? parseFloat(row.oldBalance) : null
    row.newBalance = row.newBalance != null ? parseFloat(row.newBalance) : null
    // Ensure nested customer balances are also numbers
    if (row.currentCustomer && typeof row.currentCustomer === 'object') {
        if (row.currentCustomer.balance  != null) row.currentCustomer.balance  = parseFloat(row.currentCustomer.balance)
        if (row.currentCustomer.leneHain != null) row.currentCustomer.leneHain = parseFloat(row.currentCustomer.leneHain)
        if (row.currentCustomer.deneHain != null) row.currentCustomer.deneHain = parseFloat(row.currentCustomer.deneHain)
    }
    return row
}

const Transaction = {
    async find(filter = {}, conn) {
        let sql = 'SELECT * FROM transactions'
        let vals = []
        const keys = Object.keys(filter)
        if (keys.length > 0) {
            const conditions = []
            for (const [k, v] of Object.entries(filter)) {
                if (v && typeof v === 'object' && !Array.isArray(v)) {
                    if (v.$gte !== undefined && v.$lte !== undefined) {
                        conditions.push(`\`${k}\` BETWEEN ? AND ?`); vals.push(v.$gte, v.$lte)
                    } else if (v.$ne !== undefined) {
                        conditions.push(`\`${k}\` != ?`); vals.push(v.$ne)
                    }
                } else if (k === 'currentCustomer._id') {
                    conditions.push(`JSON_UNQUOTE(JSON_EXTRACT(currentCustomer, '$._id')) = ?`); vals.push(v)
                } else if (k === 'currentCustomer.linkedShop') {
                    conditions.push(`JSON_UNQUOTE(JSON_EXTRACT(currentCustomer, '$.linkedShop')) = ?`); vals.push(v)
                } else {
                    conditions.push(`\`${k}\` = ?`); vals.push(v)
                }
            }
            sql += ' WHERE ' + conditions.join(' AND ')
        }
        const [rows] = await q(conn, sql, vals)
        return rows.map(_parse)
    },

    async findById(id, conn) {
        const [rows] = await q(conn, 'SELECT * FROM transactions WHERE id = ?', [id])
        return rows[0] ? _parse(rows[0]) : null
    },

    async findOne(filter = {}, conn) {
        const keys = Object.keys(filter)
        let sql = 'SELECT * FROM transactions'
        let vals = []
        if (keys.length > 0) {
            const conditions = []
            for (const [k, v] of Object.entries(filter)) {
                if (v && typeof v === 'object' && !Array.isArray(v)) {
                    if (v.$ne !== undefined) { conditions.push(`\`${k}\` != ?`); vals.push(v.$ne) }
                    else                     { conditions.push(`\`${k}\` = ?`);  vals.push(v) }
                } else if (k === 'currentCustomer._id') {
                    conditions.push(`JSON_UNQUOTE(JSON_EXTRACT(currentCustomer, '$._id')) = ?`); vals.push(v)
                } else {
                    conditions.push(`\`${k}\` = ?`); vals.push(v)
                }
            }
            sql += ' WHERE ' + conditions.join(' AND ')
        }
        sql += ' ORDER BY createdAt DESC LIMIT 1'
        const [rows] = await q(conn, sql, vals)
        return rows[0] ? _parse(rows[0]) : null
    },

    async findOneAndUpdate(filter, update, conn) {
        const row = await this.findOne(filter, conn)
        if (!row) return null
        await this.findByIdAndUpdate(row.id, update, conn)
        return _parse(row)
    },

    async save(data, conn) {
        const id = data.id || uuidv4()
        const currentCustomer = typeof data.currentCustomer !== 'string'
            ? JSON.stringify(data.currentCustomer)
            : data.currentCustomer
        await q(conn,
            `INSERT INTO transactions
              (id, currentCustomer, user, date, transactionType, method, amount, trnsType,
               oldBalance, newBalance, transactionCollectedFrom, daysToClear, remarks,
               warning_date, warning_resolved, warning_relation, deleting)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id, currentCustomer,
                typeof data.user === 'object' ? (data.user?.id || data.user?._id) : (data.user || null),
                data.date || null, data.transactionType || null, data.method || null,
                data.amount || null, data.trnsType || null,
                data.oldBalance || null, data.newBalance || null,
                data.transactionCollectedFrom || 'counter',
                data.daysToClear || 0, data.remarks || '',
                data.warning?.date || 0,
                data.warning?.resolved !== false ? 1 : 0,
                data.warning?.relation || '',
                0,
            ]
        )
        return this.findById(id, conn)
    },

    async findByIdAndUpdate(id, update, conn) {
        const parts = []
        const vals = []
        for (const [k, v] of Object.entries(update)) {
            if (k.startsWith('$')) continue
            parts.push(`\`${k}\` = ?`); vals.push(v)
        }
        if (parts.length === 0) return this.findById(id, conn)
        await q(conn, `UPDATE transactions SET ${parts.join(', ')} WHERE id = ?`, [...vals, id])
        return this.findById(id, conn)
    },

    async findByIdAndDelete(id, conn) {
        const row = await this.findById(id, conn)
        if (!row) return null
        await q(conn, 'DELETE FROM transactions WHERE id = ?', [id])
        return row
    },

    async deleteOne(filter, conn) {
        const keys = Object.keys(filter)
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [result] = await q(conn, `DELETE FROM transactions WHERE ${where}`, Object.values(filter))
        return { deletedCount: result.affectedRows }
    },

    async deleteMany(filter, conn) {
        const keys = Object.keys(filter)
        const conditions = []
        const vals = []
        for (const [k, v] of Object.entries(filter)) {
            if (k === 'currentCustomer.linkedShop') {
                conditions.push(`JSON_UNQUOTE(JSON_EXTRACT(currentCustomer, '$.linkedShop')) = ?`); vals.push(v)
            } else {
                conditions.push(`\`${k}\` = ?`); vals.push(v)
            }
        }
        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
        const [result] = await q(conn, `DELETE FROM transactions ${where}`, vals)
        return { deletedCount: result.affectedRows }
    },
}

module.exports = Transaction
