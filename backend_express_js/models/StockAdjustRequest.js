const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const q = (conn, sql, vals) => conn ? conn.query(sql, vals) : db.query(sql, vals)

const StockAdjustRequest = {
    async find(filter = {}, conn) {
        const keys = Object.keys(filter)
        let sql = 'SELECT * FROM stockadjustrequests'
        let vals = []
        if (keys.length > 0) {
            const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
            sql += ' WHERE ' + where
            vals = Object.values(filter)
        }
        sql += ' ORDER BY createdAt DESC'
        const [rows] = await q(conn, sql, vals)
        return rows.map(r => _attach(r, conn))
    },

    async findById(id, conn) {
        const [rows] = await q(conn, 'SELECT * FROM stockadjustrequests WHERE id = ?', [id])
        return rows[0] ? _attach(rows[0], conn) : null
    },

    async save(data, conn) {
        const id = data.id || uuidv4()
        await q(conn,
            `INSERT INTO stockadjustrequests
              (id, product, productName, adjustType, qty, onHandBefore, onHandAfter, reason, requestedBy, status, reviewedBy, reviewNote)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [id, data.product, data.productName, data.adjustType, data.qty,
             data.onHandBefore, data.onHandAfter, data.reason || '',
             data.requestedBy, data.status || 'pending',
             data.reviewedBy || null, data.reviewNote || '']
        )
        return this.findById(id, conn)
    },

    async findByIdAndUpdate(id, update, conn) {
        const keys = Object.keys(update)
        if (keys.length === 0) return this.findById(id, conn)
        const set = keys.map(k => `\`${k}\` = ?`).join(', ')
        const vals = keys.map(k => update[k])
        await q(conn, `UPDATE stockadjustrequests SET ${set} WHERE id = ?`, [...vals, id])
        return this.findById(id, conn)
    },
}

function _attach(row, conn) {
    if (!row) return null
    row._id = row.id
    row.populate = () => row
    row.save = async () => {
        const { save: _s, populate: _p, _id, ...data } = row
        const keys = Object.keys(data).filter(k => k !== 'id')
        const set = keys.map(k => `\`${k}\` = ?`).join(', ')
        await q(conn, `UPDATE stockadjustrequests SET ${set} WHERE id = ?`, [...keys.map(k => data[k]), row.id])
        return StockAdjustRequest.findById(row.id, conn)
    }
    return row
}

module.exports = StockAdjustRequest
