const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const User = require('../../models/User');

const storage = multer.diskStorage({
  destination: './public/images/userprofilepicture',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const defaultImage = '/images/userprofilepicture/default.jpg';

router.post('/', upload.single('image'), async (req, res) => {
  const { username, email, password, shop, permissions } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.save({
      username,
      email,
      password: hashedPassword,
      profilepicture: req.file ? `/images/userprofilepicture/${req.file.filename}` : defaultImage,
      rfid: '',
      fingerprint: '',
      shops: shop && shop.length > 0 ? JSON.parse(shop) : [],
      permissions: permissions && permissions.length > 0 ? JSON.parse(permissions) : [],
    });

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
