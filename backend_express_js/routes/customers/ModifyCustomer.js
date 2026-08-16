const express = require('express')
const router = express.Router()
const Customer = require('../../models/Customer')

router.delete('/',async (req,res)=>{
        console.log(req.body)
        const { _id, id, ...updateData } = req.body
        const customerId = _id || id
        let modifiedcustomer = await Customer.findByIdAndUpdate(customerId, updateData)
        res.send(JSON.stringify(modifiedcustomer))
})

module.exports = router
