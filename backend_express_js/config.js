// Database configuration
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'cyber_khata',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
    // Return DECIMAL/NUMERIC columns as JS numbers instead of strings
    decimalNumbers: true,
    typeCast(field, next) {
        if (field.type === 'DECIMAL' || field.type === 'NEWDECIMAL') {
            const val = field.string()
            return val === null ? null : parseFloat(val)
        }
        return next()
    },
}

module.exports = dbConfig
