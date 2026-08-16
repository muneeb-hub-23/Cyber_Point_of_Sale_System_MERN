const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const Counter = {
    async find(filter = {}) {
        const [rows] = await db.query('SELECT * FROM counters')
        rows.forEach(r => { r._id = r.id })
        return rows
    },

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM counters WHERE id = ?', [id])
        if (rows[0]) rows[0]._id = rows[0].id
        return rows[0] || null
    },

    async save(data) {
        const id = data.id || uuidv4()
        await db.query(
            'INSERT INTO counters (id, name, count) VALUES (?, ?, ?)',
            [id, data.name || null, data.count || 1]
        )
        return this.findById(id)
    },

    async findByIdAndUpdate(id, update) {
        if (update.$inc) {
            const parts = Object.keys(update.$inc).map(k => `\`${k}\` = \`${k}\` + ?`)
            const vals = Object.values(update.$inc)
            await db.query(`UPDATE counters SET ${parts.join(', ')} WHERE id = ?`, [...vals, id])
        }
        if (update.$set) {
            const parts = Object.keys(update.$set).map(k => `\`${k}\` = ?`)
            const vals = Object.values(update.$set)
            await db.query(`UPDATE counters SET ${parts.join(', ')} WHERE id = ?`, [...vals, id])
        }
        return this.findById(id)
    },

    async deleteMany(filter = {}) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            await db.query('DELETE FROM counters')
        } else {
            const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
            await db.query(`DELETE FROM counters WHERE ${where}`, Object.values(filter))
        }
    },

    async insertMany(records) {
        for (const record of records) {
            const id = record.id || record._id || uuidv4()
            await db.query(
                'INSERT IGNORE INTO counters (id, name, count) VALUES (?, ?, ?)',
                [id, record.name || null, record.count || 1]
            )
        }
    },
}

module.exports = Counter
