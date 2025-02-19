const express = require('express')
const router = express.Router()
const CashRegister = require('../../models/CashRegister')

router.post('/',async (req,res)=>{
    const {shopid,date} = req.body
    let data = await CashRegister.find({shop:shopid,date}).populate('customer').populate('user')
    if(data.length>0){
        res.json(data)
    }else{
        res.json([])
    }
})

module.exports = router