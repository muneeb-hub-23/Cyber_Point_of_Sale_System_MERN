const express = require('express')
const router = express.Router()
const Customer = require('../../models/Customer')
const Shop = require('../../models/Shop')

router.post('/', async (req, res) => {
        const Person = await Customer.save(req.body)
        if (Person) {
            await Shop.findByIdAndUpdate(req.body.linkedShop, { $inc: { customers: 1 } })
            const result = { ...Person, success: true }
            res.send(JSON.stringify(result))
        } else {
            res.send(JSON.stringify({success:false, message:"Not created User"}))
        }
})

module.exports = router
