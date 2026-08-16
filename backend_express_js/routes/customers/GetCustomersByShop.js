const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');
const CustomerGroup = require('../../models/CustomerGroup');

router.get('/', async (req, res) => {
    let { shopid } = req.headers;
    
    if (shopid) {
        let customers = await Customer.find({ linkedShop: shopid });
        let customerGroups = await CustomerGroup.find({ 'ids.shopID': shopid });

        let verifiedCustomerIDs = [];
        customerGroups.forEach(group => {
            if (group && group.ids) {
                group.ids.forEach(entry => {
                    const cid = entry.customerID?._id || entry.customerID?.id || entry.customerID
                    if (cid) verifiedCustomerIDs.push(cid.toString());
                });
            }
        });

        let updatedCustomers = customers.map(customer => {
            const c = { ...customer, _id: customer.id }
            c.verified = verifiedCustomerIDs.includes(customer.id.toString());
            return c;
        });

        res.send(JSON.stringify(updatedCustomers));
    } else {
        res.send(JSON.stringify([]));
    }
});

module.exports = router;
