const express = require('express');
const router = express.Router();
const User = require('../../models/User'); // Make sure the path is correct based on your project structure

// GET route to fetch all users
router.get('/', async (req, res) => {
  try {
    // Find all users in the database
    const users = await User.find({});

    // Send the users as a response
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
