const express = require('express');
const router = express.Router();
const PaymentMethods = require('../../../models/PaymentMethods'); // Adjust path to your actual model file

// Route: Get all payment methods for a specific shop
router.get('/:shopId', async (req, res) => {
    const { shopId } = req.params;

    try {
        // Find all payment methods that belong to the shop with the provided shopId
        const paymentMethods = await PaymentMethods.find({ shop: shopId });

        // Check if any payment methods were found
        if (paymentMethods.length === 0) {
            return res.status(404).json({ success: false, message: 'No payment methods found for this shop.' });
        }

        // Respond with the list of payment methods
        res.status(200).json({ success: true, paymentMethods });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

module.exports = router;
