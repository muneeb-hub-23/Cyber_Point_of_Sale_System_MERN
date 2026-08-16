const db = require('../db')
const { v4: uuidv4 } = require('uuid')

const User = {
    async find(filter = {}) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            const [rows] = await db.query('SELECT * FROM users')
            return rows.map(_parse)
        }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [rows] = await db.query(`SELECT * FROM users WHERE ${where}`, Object.values(filter))
        return rows.map(_parse)
    },

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id])
        return rows[0] ? _parse(rows[0]) : null
    },

    async findOne(filter = {}) {
        const keys = Object.keys(filter)
        if (keys.length === 0) {
            const [rows] = await db.query('SELECT * FROM users LIMIT 1')
            return rows[0] ? _parse(rows[0]) : null
        }
        const where = keys.map(k => `\`${k}\` = ?`).join(' AND ')
        const [rows] = await db.query(`SELECT * FROM users WHERE ${where} LIMIT 1`, Object.values(filter))
        return rows[0] ? _parse(rows[0]) : null
    },

    async save(data) {
        const id = data.id || uuidv4()
        await db.query(
            'INSERT INTO users (id, username, email, password, shops, job, permissions, profilepicture, rfid, fingerprint) VALUES (?,?,?,?,?,?,?,?,?,?)',
            [
                id,
                data.username,
                data.email,
                data.password,
                JSON.stringify(data.shops || []),
                data.job || 'Normal User',
                JSON.stringify(data.permissions || []),
                data.profilepicture || '/images/userprofilepicture/default.jpg',
                data.rfid || '',
                data.fingerprint || '',
            ]
        )
        return this.findById(id)
    },

    async findByIdAndUpdate(id, update) {
        const parsed = _serialize(update)
        const keys = Object.keys(parsed)
        if (keys.length === 0) return this.findById(id)
        const set = keys.map(k => `\`${k}\` = ?`).join(', ')
        await db.query(`UPDATE users SET ${set} WHERE id = ?`, [...Object.values(parsed), id])
        return this.findById(id)
    },

    // select('-password') pattern — just return user without password
    select(fields) {
        // Returns a proxy that omits specified fields; used after findById
        // We implement this by post-processing: callers chain .select('-password')
        // Not easily chainable here; handled in route code directly
        return this
    },

    async findByIdAndDelete(id) {
        const row = await this.findById(id)
        await db.query('DELETE FROM users WHERE id = ?', [id])
        return row
    },
}

function _parse(row) {
    if (!row) return null
    if (typeof row.shops === 'string') try { row.shops = JSON.parse(row.shops) } catch (_) { row.shops = [] }
    if (typeof row.permissions === 'string') try { row.permissions = JSON.parse(row.permissions) } catch (_) { row.permissions = [] }
    row._id = row.id
    return row
}

function _serialize(data) {
    const out = { ...data }
    if (out.shops !== undefined && typeof out.shops !== 'string') out.shops = JSON.stringify(out.shops)
    if (out.permissions !== undefined && typeof out.permissions !== 'string') out.permissions = JSON.stringify(out.permissions)
    return out
}

module.exports = User
