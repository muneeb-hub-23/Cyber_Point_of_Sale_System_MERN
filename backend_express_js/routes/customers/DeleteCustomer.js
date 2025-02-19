const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');
const Shop = require('../../models/Shop');
const Transaction = require('../../models/Transaction')

router.delete('/', async (req, res) => {
  try {
    // Find the customer by ID
    const currentCustomer = await Customer.findById(req.headers.customerid);
    const currentShop = await Shop.findById(currentCustomer.linkedShop);

    if (!currentCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    // Check if `leneHain` needs to be decremented
    if (currentCustomer.leneHain > 0) {
      const updatedShop = await Shop.findByIdAndUpdate(
        currentCustomer.linkedShop,
        {lenehain: currentShop.lenehain-currentCustomer.leneHain }, // Decrement `leneHain` by the customer's value
        { new: true }
      );
    }

    // Check if `deneHain` needs to be decremented
    if (currentCustomer.deneHain > 0) {
      const updatedShop = await Shop.findByIdAndUpdate(
        currentCustomer.linkedShop,
        {denehain: currentShop.denehain-currentCustomer.deneHain}, // Decrement `deneHain` by the customer's value
        { new: true }
      );
    }

    // Now delete the customer
    const deletedItem = await Customer.deleteOne({ _id: req.headers.customerid });

    if (deletedItem.deletedCount > 0) {
      // Decrement the total customers count from the shop
      const updatedShop = await Shop.findByIdAndUpdate(
        currentCustomer.linkedShop,
        { $inc: { customers: -1 } }, // Decrement customer count by 1
        { new: true }
      );
      const updatedTransactions = await Transaction.deleteMany(
        {'currentCustomer._id':req.headers.customerid}, // Decrement customer count by 1
        { new: true }
      );

      if (updatedTransactions) {
        return res.json({ success: true, message: 'Customer deleted and shop updated', deletedItem });
      }
    } else {
      return res.status(400).json({ error: 'Failed to delete customer' });
    }
  } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });
    
    module.exports = router;