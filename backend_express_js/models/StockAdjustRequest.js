const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const StockAdjustRequest = {
    async find(filter = {}) {
        const keys = Object.keys(filter)
        let sql = 'SELECT * FROM stockadjustrequests'
        let vals = []
        if (keys.length > 0) {
            const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
            sql += ' WHERE ' + where
            vals = Object.values(filter)
        }
        sql += ' ORDER BY createdAt DESC'
        const [rows] = await db.query(sql, vals)
        // Attach populate stub — we return plain objects; callers can populate inline
        return rows.map(_attach)
    },

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM stockadjustrequests WHERE id = ?', [id])
        return rows[0] ? _attach(rows[0]) : null
    },

    async save(data) {
        const id = data.id || uuidv4()
        await db.query(
            `INSERT INTO stockadjustrequests
              (id, product, productName, adjustType, qty, onHandBefore, onHandAfter, reason, requestedBy, status, reviewedBy, reviewNote)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [id, data.product, data.productName, data.adjustType, data.qty,
             data.onHandBefore, data.onHandAfter, data.reason || '',
             data.requestedBy, data.status || 'pending',
             data.reviewedBy || null, data.reviewNote || '']
        )
        return this.findById(id)
    },
}

function _attach(row) {
    if (!row) return null
    row._id = row.id
    // Chainable .populate() stub — returns self (population done in routes)
    row.populate = () => row
    // Instance .save() for mutation patterns like request.status = 'approved'; await request.save()
    row.save = async () => {
        const { save: _s, populate: _p, _id, ...data } = row
        const keys = Object.keys(data).filter(k => k !== 'id')
        const set = keys.map(k => `\`${k}\` = ?`).join(', ')
        await db.query(`UPDATE stockadjustrequests SET ${set} WHERE id = ?`, [...keys.map(k => data[k]), row.id])
        return StockAdjustRequest.findById(row.id)
    }
    return row
}

module.exports = StockAdjustRequest
