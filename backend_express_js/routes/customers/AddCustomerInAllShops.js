const express = require('express')
const router = express.Router()
const Customer = require('../../models/Customer')
const Shop = require('../../models/Shop')
const CustomerGroup = require('../../models/CustomerGroup');

router.post('/', async (req, res) => {


        let customerData = req.body
        let shops = await Shop.find({},{_id:1})
        let groupingIds = []

        for(let shop of shops){
        let dataSet = {...customerData,linkedShop:shop._id}
        const Person = new Customer(dataSet)
        let data = await Person.save()
        if(data){
            await Shop.findOneAndUpdate({ _id: shop._id }, { $inc: { customers: 1 } }, { new: true })
        }
        groupingIds.push({customerID:data._id,shopID:shop._id})
        }

        let newGroup = new CustomerGroup({
            customerName: customerData.customerName,
            customerMobileNumber: customerData.customerMobileNumber,
            customerType: customerData.customerType ? customerData.customerType : "customer",
            customerCnic: customerData.customerCnic,
            customerEmail: customerData.customerEmail,
            customerAddress: customerData.customerAddress,
            ids: groupingIds,
          });
      
          // Save the new group to the database
          await newGroup.save();

        res.json({success:true})

})


module.exports = router