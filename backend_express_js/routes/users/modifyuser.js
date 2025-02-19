const express = require('express');
const multer = require('multer');
const router = express.Router();
const User = require('../../models/User'); // Assuming you have a User model

const upload = multer({ dest: './public/images/userprofilepicture' }); // Set your upload directory

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, shop, permissions, job } = req.body;

    // Update the user in your database
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        username,
        email,
        password,
        shops: JSON.parse(shop),
        permissions: JSON.parse(permissions), // Make sure to parse JSON string
        job,
        profilepicture: req.file ? "/images/userprofilepicture/"+req.file.filename : undefined, // Handle uploaded image
      },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user.' });
  }
});

module.exports = router
