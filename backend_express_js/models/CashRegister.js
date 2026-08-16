const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const q = (conn, sql, vals) => conn ? conn.query(sql, vals) : db.query(sql, vals)

function _parse(row) {
    if (!row) return null
    row._id = row.id
    return row
}

async function _populateCustomer(row) {
    if (!row || !row.customer) return row
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [row.customer])
    if (rows[0]) { rows[0]._id = rows[0].id; row.customer = rows[0] }
    return row
}

async function _populateUser(row) {
    if (!row || !row.user) return row
    const [rows] = await db.query('SELECT id, username, email, job, profilepicture FROM users WHERE id = ?', [row.user])
    if (rows[0]) { rows[0]._id = rows[0].id; row.user = rows[0] }
    return row
}

const CashRegister = {
    find(filter = {}, conn) {
        // Synchronously return _Chainable so .populate() can be chained before the query runs
        return _Chainable(filter, conn)
    },

    async findById(id, conn) {
        const [rows] = await q(conn, 'SELECT * FROM cashregister WHERE id = ?', [id])
        return rows[0] ? _parse(rows[0]) : null
    },

    async findOne(filter = {}, conn) {
        const keys = Object.keys(filter)
        let sql = 'SELECT * FROM cashregister'
        let vals = []
        if (keys.length > 0) {
            const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
            sql += ' WHERE ' + where
            vals = Object.values(filter).map(v => typeof v === 'object' ? (v.id || v._id || v) : v)
        }
        sql += ' LIMIT 1'
        const [rows] = await q(conn, sql, vals)
        return rows[0] ? _parse(rows[0]) : null
    },

    async save(data, conn) {
        const id = data.id || uuidv4()
        const customerId = data.customer ? (typeof data.customer === 'object' ? (data.customer.id || data.customer._id) : data.customer) : null
        const shopId     = data.shop     ? (typeof data.shop     === 'object' ? (data.shop.id     || data.shop._id)     : data.shop)     : null
        const docId      = data.document ? (typeof data.document === 'object' ? (data.document.id || data.document._id) : data.document) : null
        const userId     = data.user     ? (typeof data.user     === 'object' ? (data.user.id     || data.user._id)     : data.user)     : null
        await q(conn,
            `INSERT INTO cashregister
              (id, user, customer, shop, document, date, type, method, amount, category, givento, transactionCollectedFrom)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id, userId, customerId, shopId, docId,
                data.date, data.type, data.method,
                data.amount || 0,
                data.category || 'calculate',
                data.givento || '',
                data.transactionCollectedFrom || 'counter',
            ]
        )
        return this.findById(id, conn)
    },

    async insertMany(items, conn) {
        for (const item of items) {
            await this.save(item, conn)
        }
    },

    async deleteMany(filter, conn) {
        const keys = Object.keys(filter)
        if (keys.length === 0) return { deletedCount: 0 }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const vals = Object.values(filter).map(v => typeof v === 'object' ? (v.id || v._id || v) : v)
        const [result] = await q(conn, `DELETE FROM cashregister WHERE ${where}`, vals)
        return { deletedCount: result.affectedRows }
    },

    async findOneAndDelete(filter, conn) {
        const row = await this.findOne(filter, conn)
        if (!row) return null
        await q(conn, 'DELETE FROM cashregister WHERE id = ?', [row.id])
        return row
    },
}

function _Chainable(filter, conn) {
    const obj = {
        _filter: filter,
        _conn: conn,
        _popCustomer: false,
        _popUser: false,

        populate(field) {
            if (field === 'customer') this._popCustomer = true
            if (field === 'user')     this._popUser     = true
            return this
        },

        then(resolve, reject) {
            // Build and execute query now that all .populate() calls are registered
            let sql = 'SELECT * FROM cashregister'
            let vals = []
            const keys = Object.keys(this._filter)
            if (keys.length > 0) {
                const conditions = []
                for (const [k, v] of Object.entries(this._filter)) {
                    if (v && typeof v === 'object' && !Array.isArray(v)) {
                        if (v.$in) {
                            if (v.$in.length === 0) { conditions.push('1 = 0') }
                            else { conditions.push(`\`${k}\` IN (?)`); vals.push(v.$in) }
                        } else { conditions.push(`\`${k}\` = ?`);    vals.push(v) }
                    } else {
                        conditions.push(`\`${k}\` = ?`)
                        vals.push(typeof v === 'object' ? (v.id || v._id || v) : v)
                    }
                }
                sql += ' WHERE ' + conditions.join(' AND ')
            }
            let p = q(this._conn, sql, vals)
                .then(([rows]) => rows.map(_parse))
            if (this._popCustomer) p = p.then(rows => Promise.all(rows.map(_populateCustomer)))
            if (this._popUser)     p = p.then(rows => Promise.all(rows.map(_populateUser)))
            return p.then(resolve, reject)
        },
    }
    return obj
}

module.exports = CashRegister
