const express = require('express')
const router = express.Router()
const Shop = require('../../models/Shop')
const Customer = require('../../models/Customer')
const Transaction = require('../../models/Transaction')

router.get('/',async (req,res)=>{
    let custom = await Customer.findOne({customerMobileNumber:3135064012})
    let trns = await Transaction.findOne({'currentCustomer._id':custom._id}).sort({ createdAt: -1 });
    res.json({custom,trns})
})

router.use("/analytics",require('./analytics'))


module.exports = router