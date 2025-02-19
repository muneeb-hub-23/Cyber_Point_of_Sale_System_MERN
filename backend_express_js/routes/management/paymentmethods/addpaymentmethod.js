const express = require('express');
const router = express.Router();
const PaymentMethods = require('../../../models/PaymentMethods'); // Adjust path to your actual model file

// Route: Add a new payment method
router.post('/', async (req, res) => {
    const { name, description, shop, enabled, iscustomerrequired } = req.body;

    // Input validation (basic)
    if (!name || !shop) {
        return res.status(400).json({ success: false, message: 'Name and Shop are required.' });
    }

    try {
        // Check if a payment method with the same name already exists for the shop
        const existingMethod = await PaymentMethods.findOne({ name, shop });
        if (existingMethod) {
            return res.status(400).json({ success: false, message: 'Payment method already exists for this shop.' });
        }

        // Create a new payment method
        const newPaymentMethod = new PaymentMethods({
            name,
            description: description || '',
            shop,
            enabled: enabled !== undefined ? enabled : true, // Default to true if not provided
            iscustomerrequired: iscustomerrequired !== undefined ? iscustomerrequired : false, // Default to false if not provided
            bills: 0,
        });

        // Save to the database
        await newPaymentMethod.save();

        // Respond with success
        res.status(201).json({ success: true, message: 'Payment method added successfully.', paymentMethod: newPaymentMethod });
    } catch (error) {
        console.error('Error adding payment method:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

module.exports = router;
