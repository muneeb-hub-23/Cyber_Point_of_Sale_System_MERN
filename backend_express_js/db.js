const mysql = require('mysql2/promise')
const dbConfig = require('./config')

const pool = mysql.createPool(dbConfig)

/**
 * Run a callback inside a MySQL transaction.
 * Automatically commits on success, rolls back on error.
 *
 * Usage:
 *   const result = await withTransaction(async (conn) => {
 *     await conn.query('...')
 *     return something
 *   })
 */
async function withTransaction(fn) {
    const conn = await pool.getConnection()
    await conn.beginTransaction()
    try {
        const result = await fn(conn)
        await conn.commit()
        return result
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

pool.withTransaction = withTransaction

module.exports = pool
