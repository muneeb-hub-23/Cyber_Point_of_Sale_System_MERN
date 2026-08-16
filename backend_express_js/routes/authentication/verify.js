const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const router = express.Router();

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const JWT_SECRET = "Hello@123"
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token' });
        }
        req.userId = decoded.userId;
        next();
    });
};

router.post('/', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Remove password from response
        const { password, ...safeUser } = user
        res.status(200).json({ user: safeUser });
    } catch (error) {
        console.error('Error during verification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
