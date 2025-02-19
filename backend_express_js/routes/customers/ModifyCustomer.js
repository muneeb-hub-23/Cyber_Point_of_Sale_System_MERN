const express = require('express')
const router = express.Router()
const Customer = require('../../models/Customer')

router.delete('/',async (req,res)=>{
        console.log(req.body)
        let modifiedcustomer = await Customer.findByIdAndUpdate({_id:req.body._id},req.body)
        res.send(JSON.stringify(modifiedcustomer))

})


module.exports = router