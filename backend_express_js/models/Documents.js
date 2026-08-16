const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const q = (conn, sql, vals) => conn ? conn.query(sql, vals) : db.query(sql, vals)

function _parse(row) {
    if (!row) return null
    if (typeof row.payment === 'string') try { row.payment = JSON.parse(row.payment) } catch (_) { row.payment = [] }
    row._id        = row.id
    row.subtotal   = row.subtotal   != null ? parseFloat(row.subtotal)   : 0
    row.discount   = row.discount   != null ? parseFloat(row.discount)   : 0
    row.totalamount = row.totalamount != null ? parseFloat(row.totalamount) : 0
    row.amountpaid = row.amountpaid != null ? parseFloat(row.amountpaid) : 0
    return row
}

async function _populateCustomer(row) {
    if (!row || !row.customer) return row
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [row.customer])
    if (rows[0]) { rows[0]._id = rows[0].id; row.customer = rows[0] }
    return row
}

async function _populateCustomerGroup(row) {
    if (!row || !row.customerGroup) return row
    const CustomerGroup = require('./CustomerGroup')
    row.customerGroup = await CustomerGroup.findById(row.customerGroup)
    return row
}

function _buildWhere(filter) {
    const conditions = []
    const vals = []
    for (const [k, v] of Object.entries(filter)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            if (v.$in) { conditions.push(`\`${k}\` IN (?)`); vals.push(v.$in) }
            else       { conditions.push(`\`${k}\` = ?`);    vals.push(v) }
        } else {
            conditions.push(`\`${k}\` = ?`); vals.push(v)
        }
    }
    return { conditions, vals }
}

const Document = {
    find(filter = {}, options = {}, conn) {
        // Return _Chainable immediately (synchronously) so .populate() can be
        // chained before the query runs.  The DB query is deferred to .then().
        return _Chainable(filter, conn)
    },

    async findById(id, conn) {
        const [rows] = await q(conn, 'SELECT * FROM documents WHERE id = ?', [id])
        return rows[0] ? _parse(rows[0]) : null
    },

    async findOne(filter = {}, conn) {
        const keys = Object.keys(filter)
        let sql = 'SELECT * FROM documents'
        let vals = []
        if (keys.length > 0) {
            const { conditions, vals: v } = _buildWhere(filter)
            sql += ' WHERE ' + conditions.join(' AND ')
            vals = v
        }
        sql += ' LIMIT 1'
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
        const payment = data.payment !== undefined ? JSON.stringify(data.payment) : null
        await q(conn,
            `INSERT INTO documents
              (id, doctype, user, verifier, status, date, time, customer, customerGroup, linkedShop,
               subtotal, discount, totalamount, payment, amountpaid, transaction, count)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id, data.doctype,
                typeof data.user === 'object' ? (data.user.id || data.user._id) : (data.user || null),
                data.verifier || null,
                data.status, data.date, data.time || '',
                data.customer || null, data.customerGroup || null, data.linkedShop,
                data.subtotal || 0, data.discount || 0, data.totalamount || 0,
                payment, data.amountpaid || 0,
                data.transaction || null, data.count || null,
            ]
        )
        return this.findById(id, conn)
    },

    async findByIdAndUpdate(id, update, conn) {
        const { $unset, ...rest } = update
        const parts = []
        const vals = []
        const s = { ...rest }
        if (s.payment !== undefined && typeof s.payment !== 'string') s.payment = JSON.stringify(s.payment)
        for (const [k, v] of Object.entries(s)) { parts.push(`\`${k}\` = ?`); vals.push(v) }
        if ($unset) {
            for (const k of Object.keys($unset)) parts.push(`\`${k}\` = NULL`)
        }
        if (parts.length === 0) return this.findById(id, conn)
        await q(conn, `UPDATE documents SET ${parts.join(', ')} WHERE id = ?`, [...vals, id])
        return this.findById(id, conn)
    },

    async findByIdAndDelete(id, conn) {
        const row = await this.findById(id, conn)
        await q(conn, 'DELETE FROM documents WHERE id = ?', [id])
        return row
    },
}

function _Chainable(filter, conn) {
    const obj = {
        _filter: filter,
        _conn: conn,
        _popCustomer: false,
        _popGroup: false,

        populate(field) {
            if (field === 'customer') this._popCustomer = true
            if (field === 'customerGroup' || field === 'customerGroup.ids.customerID' || field === 'customerGroup.ids.shopID') this._popGroup = true
            return this
        },

        then(resolve, reject) {
            // Execute the query now that all .populate() calls have been registered
            let sql = 'SELECT * FROM documents'
            let vals = []
            const keys = Object.keys(this._filter)
            if (keys.length > 0) {
                const { conditions, vals: v } = _buildWhere(this._filter)
                sql += ' WHERE ' + conditions.join(' AND ')
                vals = v
            }
            let p = q(this._conn, sql, vals)
                .then(([rows]) => rows.map(_parse))
            if (this._popCustomer) p = p.then(rows => Promise.all(rows.map(_populateCustomer)))
            if (this._popGroup)    p = p.then(rows => Promise.all(rows.map(_populateCustomerGroup)))
            return p.then(resolve, reject)
        },
    }
    return obj
}

module.exports = Document
