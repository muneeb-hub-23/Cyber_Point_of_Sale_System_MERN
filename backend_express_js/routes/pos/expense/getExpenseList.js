const express = require('express')
const router = express.Router()
const CashRegister = require('../../../models/CashRegister')
function convertTimestamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based, so add 1
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

router.get('/',async(req,res)=>{
    let {datex,shop} = req.headers
    datex = convertTimestamp(datex)
    let x = await CashRegister.find({date:datex,shop,category:"expense"}).populate('customer').populate('user')
    res.json(x)
})

module.exports = router