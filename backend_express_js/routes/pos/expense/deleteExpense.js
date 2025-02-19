const express = require('express')
const router = express.Router()
const CashRegister = require('../../../models/CashRegister')

router.delete('/', async (req, res) => {
    try {
        let { eid } = req.headers
        if (eid) {
            await CashRegister.findByIdAndDelete(eid)
            res.json({ success: true })
        } else {
            res.json({ success: false })
        }
    } catch (err) {
        console.log(err)
        res.json({ success: false })
    }
})

module.exports = router