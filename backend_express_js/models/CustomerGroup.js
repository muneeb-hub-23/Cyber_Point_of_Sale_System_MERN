const db = require('../db')
const { v4: uuidv4 } = require('uuid')

async function _populateIds(group) {
    if (!group) return null
    group._id = group.id
    const [idRows] = await db.query(
        `SELECT cgi.*, c.*, s.shopName, s.id AS shopId
         FROM customergroup_ids cgi
         LEFT JOIN customers c ON c.id = cgi.customerID
         LEFT JOIN shops s ON s.id = cgi.shopID
         WHERE cgi.groupId = ?`,
        [group.id]
    )
    group.ids = idRows.map(r => ({
        customerID: {
            _id: r.customerID, id: r.customerID,
            customerName: r.customerName, customerMobileNumber: r.customerMobileNumber,
            balance: r.balance, leneHain: r.leneHain, deneHain: r.deneHain,
            linkedShop: r.linkedShop, customerType: r.customerType,
        },
        shopID: { _id: r.shopID, id: r.shopID, shopName: r.shopName },
    }))
    return group
}

const CustomerGroup = {
    async find(filter = {}) {
        let sql = 'SELECT * FROM customergroups'
        let vals = []
        const keys = Object.keys(filter)
        if (keys.length > 0) {
            const conditions = []
            for (const [k, v] of Object.entries(filter)) {
                if (k === 'ids.shopID') {
                    // join through customergroup_ids
                    sql = `SELECT DISTINCT cg.* FROM customergroups cg
                           JOIN customergroup_ids cgi ON cgi.groupId = cg.id
                           WHERE cgi.shopID = ?`
                    vals = [v]
                    break
                } else {
                    conditions.push(`\`${k}\` = ?`); vals.push(v)
                }
            }
            if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ')
        }
        const [rows] = await db.query(sql, vals)
        return Promise.all(rows.map(_populateIds))
    },

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM customergroups WHERE id = ?', [id])
        return rows[0] ? _populateIds(rows[0]) : null
    },

    async save(data) {
        const id = data.id || uuidv4()
        await db.query(
            `INSERT INTO customergroups (id, customerName, customerMobileNumber, customerType, customerCnic, customerEmail, customerAddress)
             VALUES (?,?,?,?,?,?,?)`,
            [id, data.customerName || null, data.customerMobileNumber || null, data.customerType || null,
             data.customerCnic || null, data.customerEmail || null, data.customerAddress || null]
        )
        if (Array.isArray(data.ids) && data.ids.length > 0) {
            for (const entry of data.ids) {
                const cid = entry.customerID?._id || entry.customerID?.id || entry.customerID
                const sid = entry.shopID?._id || entry.shopID?.id || entry.shopID
                await db.query(
                    'INSERT INTO customergroup_ids (groupId, customerID, shopID) VALUES (?,?,?)',
                    [id, cid, sid]
                )
            }
        }
        return this.findById(id)
    },

    async findByIdAndUpdate(id, update) {
        const { ids, ...rest } = update
        const keys = Object.keys(rest)
        if (keys.length > 0) {
            const set = keys.map(k => `\`${k}\` = ?`).join(', ')
            await db.query(`UPDATE customergroups SET ${set} WHERE id = ?`, [...Object.values(rest), id])
        }
        if (Array.isArray(ids)) {
            await db.query('DELETE FROM customergroup_ids WHERE groupId = ?', [id])
            for (const entry of ids) {
                const cid = entry.customerID?._id || entry.customerID?.id || entry.customerID
                const sid = entry.shopID?._id || entry.shopID?.id || entry.shopID
                await db.query(
                    'INSERT INTO customergroup_ids (groupId, customerID, shopID) VALUES (?,?,?)',
                    [id, cid, sid]
                )
            }
        }
        return this.findById(id)
    },

    async deleteOne(filter) {
        const keys = Object.keys(filter)
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [result] = await db.query(`DELETE FROM customergroups WHERE ${where}`, Object.values(filter))
        return { deletedCount: result.affectedRows }
    },
}

module.exports = CustomerGroup
