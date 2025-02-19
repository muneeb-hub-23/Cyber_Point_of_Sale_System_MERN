// Import necessary packages
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../../models/User'); // Adjust the path as needed
const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Get the token from the Authorization header

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const JWT_SECRET = "Hello@123"
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token' });
        }
        req.userId = decoded.userId; // Make sure the payload has _id
        next();
    });
    
};

// Verify route
router.post('/', verifyToken, async (req, res) => {

    try {
        // Find user by ID
        const user = await User.findById(req.userId).select('-password'); // Exclude password from response

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user }); // Respond with the user data
    } catch (error) {
        console.error('Error during verification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
