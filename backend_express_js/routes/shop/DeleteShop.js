const express = require('express')
const router = express.Router()
const Shop = require('../../models/Shop')
const Customer = require('../../models/Customer')
const Transaction = require('../../models/Transaction')
router.delete('/',async (req,res)=>{

        let deletedShop = await Shop.deleteOne({_id:req.headers.shopid},{new:true})
        let deletedCustomer = await Customer.deleteMany({linkedShop:req.headers.shopid},{new:true})
        let deletedTransaction = await Transaction.deleteMany({'currentCustomer.linkedShop':req.headers.shopid},{new:true})
        if(deletedShop){
                res.json({success:true,message:"Shop Deleted With All Records"})
        }else{
                res.json({success:false,message:"Some Error Occured"})
        }

})


module.exports = router