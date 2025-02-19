const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');
const CustomerGroup = require('../../models/CustomerGroup');

router.get('/', async (req, res) => {
    let { shopid } = req.headers;
    
    if (shopid) {
        // Find customers linked to the shop
        let customers = await Customer.find({ linkedShop: shopid });

        // Find all customer groups linked to the shop
        let customerGroups = await CustomerGroup.find({ 'ids.shopID': shopid });

        // Extract customer IDs from the customer groups
        let verifiedCustomerIDs = [];
        customerGroups.forEach(group => {
            group.ids.forEach(id => {
                verifiedCustomerIDs.push(id.customerID.toString()); // Push the customerID as string for comparison
            });
        });

        // Update each customer with the 'verified' field
        let updatedCustomers = customers.map(customer => {
            // Create a new object to ensure Mongoose documents are not mutated directly
            let customerWithVerifiedField = customer.toObject();
            customerWithVerifiedField.verified = verifiedCustomerIDs.includes(customer._id.toString());
            return customerWithVerifiedField;
        });

        res.send(JSON.stringify(updatedCustomers)); // Return the updated customers with 'verified' field
    } else {
        res.send(JSON.stringify([])); // Return empty array if no shopid provided
    }
});

module.exports = router;
