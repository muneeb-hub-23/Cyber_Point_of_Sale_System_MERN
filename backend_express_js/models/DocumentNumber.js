const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const q = (conn, sql, vals) => conn ? conn.query(sql, vals) : db.query(sql, vals)

const DocumentNumber = {
    async find(filter = {}, conn) {
        const [rows] = await q(conn, 'SELECT * FROM documentnumbers', [])
        rows.forEach(r => { r._id = r.id })
        return rows
    },

    async save(data, conn) {
        const id = data.id || uuidv4()
        await q(conn, 'INSERT INTO documentnumbers (id, name, count) VALUES (?,?,?)',
            [id, data.name || null, data.count || 1])
        const [rows] = await q(conn, 'SELECT * FROM documentnumbers WHERE id = ?', [id])
        if (rows[0]) rows[0]._id = rows[0].id
        return rows[0] || null
    },

    async updateMany(filter, update, conn) {
        if (update.$inc) {
            const parts = Object.keys(update.$inc).map(k => `\`${k}\` = \`${k}\` + ?`)
            const vals  = Object.values(update.$inc)
            await q(conn, `UPDATE documentnumbers SET ${parts.join(', ')}`, vals)
        }
    },
}

module.exports = DocumentNumber
