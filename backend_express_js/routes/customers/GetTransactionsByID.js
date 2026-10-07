const express = require('express')
const router = express.Router()
const Transaction = require('../../models/Transaction')
const db = require('../../db')

router.get('/',async (req,res)=>{

    const [rows] = await db.query(
        `SELECT * FROM transactions WHERE JSON_UNQUOTE(JSON_EXTRACT(currentCustomer, '$._id')) = ? ORDER BY date DESC`,
        [req.headers.customerid]
    )
    const Transaction_parse = (row) => {
        if (!row) return null
        if (typeof row.currentCustomer === 'string') try { row.currentCustomer = JSON.parse(row.currentCustomer) } catch (_) {}
        row._id       = row.id
        row.amount     = row.amount     != null ? parseFloat(row.amount)     : null
        row.oldBalance = row.oldBalance != null ? parseFloat(row.oldBalance) : null
        row.newBalance = row.newBalance != null ? parseFloat(row.newBalance) : null
        if (row.currentCustomer && typeof row.currentCustomer === 'object') {
            if (row.currentCustomer.balance  != null) row.currentCustomer.balance  = parseFloat(row.currentCustomer.balance)
            if (row.currentCustomer.leneHain != null) row.currentCustomer.leneHain = parseFloat(row.currentCustomer.leneHain)
            if (row.currentCustomer.deneHain != null) row.currentCustomer.deneHain = parseFloat(row.currentCustomer.deneHain)
        }
        return row
    }
    res.send(JSON.stringify(rows.map(Transaction_parse)))

})


module.exports = router