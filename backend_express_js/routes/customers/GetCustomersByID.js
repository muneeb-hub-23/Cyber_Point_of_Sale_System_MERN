const express = require('express')
const router = express.Router()
const Customer = require('../../models/Customer')

router.get('/',async (req,res)=>{

        let customers = await Customer.find({id:req.headers.customerid})
        
        res.send(JSON.stringify(customers))

})


module.exports = router