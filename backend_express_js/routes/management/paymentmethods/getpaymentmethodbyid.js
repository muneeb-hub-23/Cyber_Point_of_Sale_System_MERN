const express = require('express');
const router = express.Router();
const PaymentMethods = require('../../../models/PaymentMethods'); // Adjust path to your actual model file

// Route: Get a specific payment method by its ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Find the payment method by its ID
        const paymentMethod = await PaymentMethods.findById(id);

        // Check if the payment method was found
        if (!paymentMethod) {
            return res.status(404).json({ success: false, message: 'Payment method not found.' });
        }

        // Respond with the payment method details
        res.status(200).json({ success: true, paymentMethod });
    } catch (error) {
        console.error('Error fetching payment method:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

module.exports = router;
