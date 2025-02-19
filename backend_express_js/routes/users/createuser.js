const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const User = require('../../models/User');

// Configure Multer to store files in the "public/images/userprofilepicture" directory with unique filenames
const storage = multer.diskStorage({
  destination: './public/images/userprofilepicture',  // Ensure this folder exists
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension to filename
  },
});

const upload = multer({ storage: storage });

// Default values
const defaultImage = '/images/userprofilepicture/default.jpg'; // Default image path
const defaultShops = ['Shop1']; // Default shop if none provided
const defaultPermissions = []; // Default permissions (empty array)

// POST route to create a new user with an uploaded profile picture
router.post('/', upload.single('image'), async (req, res) => {
  let result = JSON.parse(req.body.shop)
  console.log(result)
  const { username, email, password, shop, permissions } = req.body;

  try {
    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the data, including the path to the profile picture
    const newUser = new User({
      username,
      email,
      password: hashedPassword,  // Store the hashed password
      profilepicture: req.file ? `/images/userprofilepicture/${req.file.filename}` : defaultImage,  // Use uploaded image or default
      rfid: '',   // Leave rfid and fingerprint empty
      fingerprint: '',
      shops: shop && shop.length > 0 ? JSON.parse(shop) : defaultShops,  // Set to provided shop or default shop
      permissions: permissions && permissions.length > 0 ? JSON.parse(permissions) : defaultPermissions, // Parse permissions or use default
    });

    // Save the user to the database
    await newUser.save();

    // Return a success response with the user's profile picture
    res.status(200).json({
      message: 'User created successfully!',
      user: newUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while creating user' });
  }
});

module.exports = router;
