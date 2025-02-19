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
  function convertTo12HourFormat(timestamp) {
    const date = new Date(timestamp);
  
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
  
    // Convert hours from 24-hour to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be 12
    minutes = minutes < 10 ? '0' + minutes : minutes; // Pad minutes to 2 digits
  
    // Format time as HH:MM:AM/PM
    return `${hours}:${minutes}:${ampm}`;
  }
router.post('/',async(req,res)=>{
    try{
        let {date,time,user,customer,type,method,shop,category,amount,givento} = req.body
        if(customer.length===0){
            customer = undefined
        }
        date = convertTimestamp(date)
        let options = {date,time,user,type,method,shop,category,amount,givento}
        if(customer){
            options.customer = customer
        }
        let data = new CashRegister(options)
        await data.save()
        res.json({success:true})
    }catch(err){
        console.log(err)
        res.json({success:false})
    }
})

module.exports = router