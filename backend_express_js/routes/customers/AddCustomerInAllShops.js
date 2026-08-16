const express = require('express')
const router = express.Router()
const Customer = require('../../models/Customer')
const Shop = require('../../models/Shop')
const CustomerGroup = require('../../models/CustomerGroup');

router.post('/', async (req, res) => {
        let customerData = req.body
        let shops = await Shop.find({})
        let groupingIds = []

        for(let shop of shops){
            let dataSet = {...customerData, linkedShop: shop.id}
            let data = await Customer.save(dataSet)
            if(data){
                await Shop.findByIdAndUpdate(shop.id, { $inc: { customers: 1 } })
            }
            groupingIds.push({customerID: data.id, shopID: shop.id})
        }

        await CustomerGroup.save({
            customerName: customerData.customerName,
            customerMobileNumber: customerData.customerMobileNumber,
            customerType: customerData.customerType ? customerData.customerType : "customer",
            customerCnic: customerData.customerCnic,
            customerEmail: customerData.customerEmail,
            customerAddress: customerData.customerAddress,
            ids: groupingIds,
        });

        res.json({success:true})
})

module.exports = router
