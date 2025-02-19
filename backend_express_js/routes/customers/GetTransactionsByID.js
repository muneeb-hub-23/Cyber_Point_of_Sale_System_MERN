const express = require('express')
const router = express.Router()
const Transaction = require('../../models/Transaction')

router.get('/',async (req,res)=>{

    let transactions = await Transaction.find({"currentCustomer._id":req.headers.customerid})
        
        res.send(JSON.stringify(transactions))

})


module.exports = router