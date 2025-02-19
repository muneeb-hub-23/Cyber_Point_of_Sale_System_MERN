const express = require('express');
const router = express.Router();
const PaymentMethods = require('../../../models/PaymentMethods'); // Adjust path to your actual model file

// Route: Modify an existing payment method
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, shop, enabled, bills, iscustomerrequired } = req.body; // Added iscustomerrequired
    try {
        // Check if the payment method exists
        const paymentMethod = await PaymentMethods.findById(id);
        if (!paymentMethod) {
            return res.status(404).json({ success: false, message: 'Payment method not found.' });
        }

        // Update the payment method's fields with new data, only if provided
        if (name) paymentMethod.name = name;
        if (description) paymentMethod.description = description;
        if (shop) paymentMethod.shop = shop;
        if (typeof enabled === 'boolean') paymentMethod.enabled = enabled; // Ensure enabled is a boolean
        if (typeof bills === 'number') paymentMethod.bills = bills; // Ensure bills is a number
        if (typeof iscustomerrequired === 'boolean') paymentMethod.iscustomerrequired = iscustomerrequired; // Ensure iscustomerrequired is a boolean

        // Save the updated payment method to the database
        await paymentMethod.save();

        // Respond with success
        res.status(200).json({ success: true, message: 'Payment method updated successfully.', paymentMethod });
    } catch (error) {
        console.error('Error updating payment method:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

module.exports = router;
