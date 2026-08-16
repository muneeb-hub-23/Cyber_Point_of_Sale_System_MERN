const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const q = (conn, sql, vals) => conn ? conn.query(sql, vals) : db.query(sql, vals)

function _parse(row) {
    if (!row) return null
    if (typeof row.markup  === 'string') try { row.markup  = JSON.parse(row.markup)  } catch (_) {}
    if (typeof row.tax     === 'string') try { row.tax     = JSON.parse(row.tax)     } catch (_) {}
    if (typeof row.picture === 'string') try { row.picture = JSON.parse(row.picture) } catch (_) {}
    row._id    = row.id
    row.onHand = row.onHand != null ? parseFloat(row.onHand) : 0
    row.cost   = row.cost   != null ? parseFloat(row.cost)   : 0
    row.kharcha = row.kharcha != null ? parseFloat(row.kharcha) : 0
    row.sale   = row.sale   != null ? parseFloat(row.sale)   : 0
    row.unit   = row.unit   != null ? parseFloat(row.unit)   : 1
    row.reorder = row.reorder != null ? parseFloat(row.reorder) : 1
    return row
}

function _serialize(data) {
    const out = { ...data }
    if (out.markup  !== undefined && typeof out.markup  !== 'string') out.markup  = JSON.stringify(out.markup)
    if (out.tax     !== undefined && typeof out.tax     !== 'string') out.tax     = JSON.stringify(out.tax)
    if (out.picture !== undefined && typeof out.picture !== 'string') out.picture = JSON.stringify(out.picture)
    return out
}

function _buildWhere(filter) {
    const conditions = []
    const vals = []
    for (const [k, v] of Object.entries(filter)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            if (v.$in) { conditions.push(`p.\`${k}\` IN (?)`); vals.push(v.$in) }
        } else {
            conditions.push(`p.\`${k}\` = ?`); vals.push(v)
        }
    }
    return { conditions, vals }
}

const Product = {
    async find(filter = {}, conn) {
        let sql = 'SELECT p.* FROM products p'
        let vals = []
        if (Object.keys(filter).length > 0) {
            const { conditions, vals: v } = _buildWhere(filter)
            if (conditions.length) { sql += ' WHERE ' + conditions.join(' AND '); vals = v }
        }
        const [rows] = await q(conn, sql, vals)
        return rows.map(_parse)
    },

    async findById(id, conn) {
        const [rows] = await q(conn, 'SELECT * FROM products WHERE id = ?', [id])
        return rows[0] ? _parse(rows[0]) : null
    },

    async findOne(filter = {}, conn) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            const [rows] = await q(conn, 'SELECT * FROM products LIMIT 1', [])
            return rows[0] ? _parse(rows[0]) : null
        }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [rows] = await q(conn, `SELECT * FROM products WHERE ${where} LIMIT 1`, Object.values(filter))
        return rows[0] ? _parse(rows[0]) : null
    },

    async distinct(field, conn) {
        const [rows] = await q(conn, `SELECT DISTINCT \`${field}\` FROM products`, [])
        return rows.map(r => r[field])
    },

    async save(data, conn) {
        const id = data.id || uuidv4()
        const s = _serialize(data)
        await q(conn,
            `INSERT INTO products
              (id, name, itemCode, barCode, suplier, supliersGroup, shop, onHand, cost, kharcha,
               iskharchaincludedinsale, markup, tax, istaxincludedinsale,
               ispricechangeallowed, isservice, sale, isenabled, unit, reorder,
               description, createdby, category, picture, pictureby, status, modifiedby)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id, s.name, s.itemCode, s.barCode, s.suplier, s.supliersGroup || null, s.shop,
                s.onHand || 0, s.cost || 0, s.kharcha || 0,
                s.iskharchaincludedinsale !== false ? 1 : 0,
                s.markup || null, s.tax || null,
                s.istaxincludedinsale !== false ? 1 : 0,
                s.ispricechangeallowed !== false ? 1 : 0,
                s.isservice ? 1 : 0,
                s.sale || 0,
                s.isenabled !== false ? 1 : 0,
                s.unit || 1, s.reorder || 1,
                s.description || null,
                s.createdby, s.category || null,
                s.picture || JSON.stringify(['/images/products/default.png']),
                s.pictureby || null,
                s.status || 'pending',
                s.modifiedby || null,
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
        const s = _serialize(plainUpdate)
        for (const [k, v] of Object.entries(s))      { parts.push(`\`${k}\` = ?`);             vals.push(v) }
        for (const [k, v] of Object.entries(incUpdate)) { parts.push(`\`${k}\` = \`${k}\` + ?`); vals.push(v) }
        if (parts.length === 0) return this.findById(id, conn)
        await q(conn, `UPDATE products SET ${parts.join(', ')} WHERE id = ?`, [...vals, id])
        return this.findById(id, conn)
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

    async deleteOne(filter, conn) {
        const keys = Object.keys(filter)
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [result] = await q(conn, `DELETE FROM products WHERE ${where}`, Object.values(filter))
        return { deletedCount: result.affectedRows }
    },
}

module.exports = Product
