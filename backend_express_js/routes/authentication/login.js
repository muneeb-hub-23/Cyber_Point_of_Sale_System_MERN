const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../..//models/User'); // Assuming you have a User model set up with Mongoose

const router = express.Router();

// Secret key for JWT
const JWT_SECRET = 'Hello@123'; // Replace with your own secret key
const TOKEN_EXPIRY = '12h'; // 12-hour expiry

// Sign-in route
router.post('/', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Create a token with a 12-hour expiry
    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );

    // Send the token and user object as response
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        shops: user.shops,
        permissions: user.permissions,
        job: user.job,
        profilepicture: user.profilepicture,
      },
    });
  } catch (error) {
    console.error('Error during sign-in:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
