const express = require('express');
const multer = require('multer');
const router = express.Router();
const User = require('../../models/User');

const upload = multer({ dest: './public/images/userprofilepicture' });

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, shop, permissions, job } = req.body;

    const updateData = {
      username,
      email,
      shops: JSON.parse(shop),
      permissions: JSON.parse(permissions),
      job,
    }
    if (password) updateData.password = password
    if (req.file) updateData.profilepicture = "/images/userprofilepicture/" + req.file.filename

    const updatedUser = await User.findByIdAndUpdate(id, updateData);

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
