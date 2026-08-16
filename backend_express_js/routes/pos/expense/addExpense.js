const express = require('express')
const router = express.Router()
const CashRegister = require('../../../models/CashRegister')

function convertTimestamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

router.post('/',async(req,res)=>{
    try{
        let {date,time,user,customer,type,method,shop,category,amount,givento} = req.body
        if(customer && customer.length===0) customer = undefined
        date = convertTimestamp(date)
        let options = {date,time,user,type,method,shop,category,amount,givento}
        if(customer) options.customer = customer
        await CashRegister.save(options)
        res.json({success:true})
    }catch(err){
        console.log(err)
        res.json({success:false})
    }
})

module.exports = router
