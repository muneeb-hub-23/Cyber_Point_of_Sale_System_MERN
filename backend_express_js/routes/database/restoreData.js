const express = require('express')
const router = express.Router()
const Shop = require('../../models/Shop')
const Customer = require('../../models/Customer')
const Transaction = require('../../models/Transaction')

router.get('/',async (req,res)=>{
try{
let shops = await Shop.find()
let customers = await Customer.find()
let transactions = await Transaction.find()
let collectedData = {shops,customers,transactions}

console.log(collectedData)

res.json({success:true,message:"Check Your E-mail"})
}catch(err){
    console.log(err)
    res.json({success:false,message:"Internet Connection Lost"})
}

})


module.exports = router