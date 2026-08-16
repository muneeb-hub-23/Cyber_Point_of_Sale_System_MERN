const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const q = (conn, sql, vals) => conn ? conn.query(sql, vals) : db.query(sql, vals)

function _parse(row) {
    if (!row) return null
    if (typeof row.productData === 'string') try { row.productData = JSON.parse(row.productData) } catch (_) {}
    if (typeof row.discount    === 'string') try { row.discount    = JSON.parse(row.discount)    } catch (_) {}
    row._id        = row.id
    row.cost        = row.cost        != null ? parseFloat(row.cost)        : 0
    row.expense     = row.expense     != null ? parseFloat(row.expense)     : 0
    row.costExpense = row.costExpense  != null ? parseFloat(row.costExpense)  : 0
    row.tax         = row.tax         != null ? parseFloat(row.tax)         : 0
    row.sale        = row.sale        != null ? parseFloat(row.sale)        : 0
    row.finalprice  = row.finalprice  != null ? parseFloat(row.finalprice)  : null
    row.qty         = row.qty         != null ? parseFloat(row.qty)         : 0
    row.costamount  = row.costamount  != null ? parseFloat(row.costamount)  : 0
    row.saleamount  = row.saleamount  != null ? parseFloat(row.saleamount)  : 0
    return row
}

async function _populateProduct(row) {
    if (!row || !row.product) return row
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [row.product])
    if (rows[0]) {
        const p = rows[0]
        if (typeof p.markup  === 'string') try { p.markup  = JSON.parse(p.markup)  } catch (_) {}
        if (typeof p.tax     === 'string') try { p.tax     = JSON.parse(p.tax)     } catch (_) {}
        if (typeof p.picture === 'string') try { p.picture = JSON.parse(p.picture) } catch (_) {}
        p._id = p.id
        row.product = p
    }
    return row
}

async function _populateDocument(row) {
    if (!row || !row.document) return row
    const docId = typeof row.document === 'object' ? row.document.id : row.document
    const [rows] = await db.query('SELECT * FROM documents WHERE id = ?', [docId])
    if (rows[0]) {
        const d = rows[0]
        if (typeof d.payment === 'string') try { d.payment = JSON.parse(d.payment) } catch (_) {}
        d._id = d.id
        row.document = d
    }
    return row
}

const DocItem = {
    find(filter = {}, conn) {
        // Synchronously return _Chainable so .populate() can be chained before the query runs
        return _Chainable(filter, conn)
    },

    async findById(id, conn) {
        const [rows] = await q(conn, 'SELECT * FROM docitems WHERE id = ?', [id])
        return rows[0] ? _parse(rows[0]) : null
    },

    async findOne(filter = {}, conn) {
        const keys = Object.keys(filter)
        let sql = 'SELECT * FROM docitems'
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
        const discount   = data.discount    !== undefined ? JSON.stringify(data.discount)   : null
        const productData = data.productData !== undefined ? JSON.stringify(data.productData) : null
        const productId  = typeof data.product  === 'object' ? (data.product.id  || data.product._id)  : data.product
        const docId      = typeof data.document === 'object' ? (data.document.id || data.document._id) : data.document
        await q(conn,
            `INSERT INTO docitems
              (id, document, productData, product, cost, expense, costExpense, tax,
               discount, sale, finalprice, qty, costamount, saleamount, user)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id, docId, productData, productId,
                data.cost, data.expense, data.costExpense, data.tax,
                discount, data.sale, data.finalprice || null,
                data.qty, data.costamount, data.saleamount,
                typeof data.user === 'object' ? (data.user.id || data.user._id) : data.user,
            ]
        )
        return this.findById(id, conn)
    },

    async findByIdAndUpdate(id, update, conn) {
        const { $set, ...rest } = update
        const allUpdates = { ...rest, ...($set || {}) }
        if (allUpdates.productData && typeof allUpdates.productData !== 'string') allUpdates.productData = JSON.stringify(allUpdates.productData)
        if (allUpdates.discount    && typeof allUpdates.discount    !== 'string') allUpdates.discount    = JSON.stringify(allUpdates.discount)
        if (allUpdates.document    && typeof allUpdates.document    === 'object') allUpdates.document    = allUpdates.document.id || allUpdates.document._id
        const keys = Object.keys(allUpdates)
        if (keys.length === 0) return this.findById(id, conn)
        const set = keys.map(k => `\`${k}\` = ?`).join(', ')
        await q(conn, `UPDATE docitems SET ${set} WHERE id = ?`, [...Object.values(allUpdates), id])
        return this.findById(id, conn)
    },

    async deleteOne(filter, conn) {
        const keys = Object.keys(filter)
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [result] = await q(conn, `DELETE FROM docitems WHERE ${where}`, Object.values(filter))
        return { deletedCount: result.affectedRows }
    },

    async deleteMany(filter, conn) {
        const keys = Object.keys(filter)
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const vals = Object.values(filter).map(v => typeof v === 'object' ? (v.id || v._id || v) : v)
        const [result] = await q(conn, `DELETE FROM docitems WHERE ${where}`, vals)
        return { deletedCount: result.affectedRows }
    },

    async updateMany(filter, update, conn) {
        const filterKeys = Object.keys(filter)
        const where = filterKeys.length ? 'WHERE ' + filterKeys.map(k => `\`${k}\` = ?`).join(' AND ') : ''
        const { $set } = update
        if (!$set) return
        const setStr = Object.keys($set).map(k => `\`${k}\` = ?`).join(', ')
        await q(conn, `UPDATE docitems SET ${setStr} ${where}`, [...Object.values($set), ...Object.values(filter)])
    },

    async bulkWrite(ops, conn) {
        for (const op of ops) {
            if (op.updateOne) {
                const { filter, update } = op.updateOne
                const id = filter._id || filter.id
                await this.findByIdAndUpdate(id, update, conn)
            }
        }
    },
}

function _Chainable(filter, conn) {
    const obj = {
        _filter: filter,
        _conn: conn,
        _popProduct: false,
        _popDocument: false,

        populate(field) {
            if (field === 'product')  this._popProduct  = true
            if (field === 'document') this._popDocument = true
            return this
        },

        sort() { return this },

        then(resolve, reject) {
            // Build and execute query now that all .populate() calls are registered
            let sql = 'SELECT * FROM docitems'
            let vals = []
            const keys = Object.keys(this._filter)
            if (keys.length > 0) {
                const conditions = []
                for (const [k, v] of Object.entries(this._filter)) {
                    if (v && typeof v === 'object' && !Array.isArray(v)) {
                        if (v.$in) { conditions.push(`\`${k}\` IN (?)`); vals.push(v.$in) }
                        else       { conditions.push(`\`${k}\` = ?`);    vals.push(v) }
                    } else {
                        conditions.push(`\`${k}\` = ?`)
                        vals.push(typeof v === 'object' ? (v.id || v._id || v) : v)
                    }
                }
                sql += ' WHERE ' + conditions.join(' AND ')
            }
            let p = q(this._conn, sql, vals)
                .then(([rows]) => rows.map(_parse))
            if (this._popProduct)  p = p.then(rows => Promise.all(rows.map(_populateProduct)))
            if (this._popDocument) p = p.then(rows => Promise.all(rows.map(_populateDocument)))
            return p.then(resolve, reject)
        },
    }
    return obj
}

module.exports = DocItem
