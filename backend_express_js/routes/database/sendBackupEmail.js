const express = require('express')
const router = express.Router()
const CashRegister = require('../../models/CashRegister')
const Category = require('../../models/Category')
const Counter = require('../../models/Counter')
const Customer = require('../../models/Customer')
const DocumentItem = require('../../models/DocumentItem')
const DocumentNumber = require('../../models/DocumentNumber')
const Documents = require('../../models/Documents')
const History = require('../../models/History')
const PaymentMethods = require('../../models/PaymentMethods')
const Products = require('../../models/Product')
const ProductHistory = require('../../models/ProductHistory')
const SaleTypes = require('../../models/SaleTypes')
const Shop = require('../../models/Shop')
const Transaction = require('../../models/Transaction')
const Users = require('../../models/User')


router.get('/',async (req,res)=>{
try{
let cashregister = await CashRegister.find()
let category = await Category.find()
let counter = await Counter.find()
let customers = await Customer.find()
let documentitem = await DocumentItem.find()
let documentnumber = await DocumentNumber.find()
let documents = await Documents.find()
let history = await History.find()
let paymentmethods = await PaymentMethods.find()
let products = await Products.find()
let producthistory = await ProductHistory.find()
let saletypes = await SaleTypes.find()
let shops = await Shop.find()
let transactions = await Transaction.find()
let users = await Users.find()

let collectedData = {
    cashregister,
    category,
    counter,
    customers,
    documentitem,
    documentnumber,
    documents,
    history,
    paymentmethods,
    products,
    producthistory,
    saletypes,
    shops,
    transactions,
    users
}


res.json({success:true,message:"Check Your E-mail"})
}catch(err){
    console.log(err)
    res.json({success:false,message:"Internet Connection Lost"})
}

})


module.exports = router