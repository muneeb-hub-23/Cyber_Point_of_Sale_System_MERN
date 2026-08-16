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
    return row
}

function _serialize(data) {
    const out = { ...data }
    if (out.markup  !== undefined && typeof out.markup  !== 'string') out.markup  = JSON.stringify(out.markup)
    if (out.tax     !== undefined && typeof out.tax     !== 'string') out.tax     = JSON.stringify(out.tax)
    if (out.picture !== undefined && typeof out.picture !== 'string') out.picture = JSON.stringify(out.picture)
    return out
}

const ProductHistory = {
    async find(filter = {}, conn) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            const [rows] = await q(conn, 'SELECT * FROM producthistory', [])
            return rows.map(_parse)
        }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [rows] = await q(conn, `SELECT * FROM producthistory WHERE ${where}`, Object.values(filter))
        return rows.map(_parse)
    },

    async findById(id, conn) {
        const [rows] = await q(conn, 'SELECT * FROM producthistory WHERE id = ?', [id])
        return rows[0] ? _parse(rows[0]) : null
    },

    async save(data, conn) {
        const s = _serialize(data)
        const productId = s.id || s.productId || s._id || null
        const newId = uuidv4()
        await q(conn,
            `INSERT INTO producthistory
              (id, productId, name, itemCode, barCode, suplier, supliersGroup, shop,
               onHand, cost, kharcha, iskharchaincludedinsale, markup, tax,
               istaxincludedinsale, ispricechangeallowed, isservice, sale, isenabled,
               unit, description, createdby, category, picture, pictureby, status, docType, modifiedby)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                newId, productId,
                s.name, s.itemCode || null, s.barCode || null, s.suplier,
                s.supliersGroup || null, s.shop,
                s.onHand || 0, s.cost || 0, s.kharcha || 0,
                s.iskharchaincludedinsale !== false ? 1 : 0,
                s.markup || null, s.tax || null,
                s.istaxincludedinsale !== false ? 1 : 0,
                s.ispricechangeallowed !== false ? 1 : 0,
                s.isservice ? 1 : 0,
                s.sale || 0,
                s.isenabled !== false ? 1 : 0,
                s.unit || 1, s.description || null,
                s.createdby, s.category || null,
                s.picture || JSON.stringify(['/images/products/default.png']),
                s.pictureby || null,
                s.status || 'pending',
                s.docType || null,
                s.modifiedby || null,
            ]
        )
        return data
    },

    async insertMany(items, conn) {
        for (const item of items) {
            await this.save(item, conn)
        }
    },
}

module.exports = ProductHistory
