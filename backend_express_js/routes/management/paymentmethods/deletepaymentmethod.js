const express = require('express');
const router = express.Router();
const PaymentMethods = require('../../../models/PaymentMethods'); // Adjust path to your actual model file

// Route: Delete a payment method
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Check if the payment method exists
        const paymentMethod = await PaymentMethods.findById(id);
        if (!paymentMethod) {
            return res.status(404).json({ success: false, message: 'Payment method not found.' });
        }

        // Delete the payment method
        await paymentMethod.deleteOne();

        // Respond with success
        res.status(200).json({ success: true, message: 'Payment method deleted successfully.' });
    } catch (error) {
        console.error('Error deleting payment method:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

module.exports = router;
