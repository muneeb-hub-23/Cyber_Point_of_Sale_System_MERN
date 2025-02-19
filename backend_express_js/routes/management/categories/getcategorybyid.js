const express = require('express');
const router = express.Router();
const Category = require('../../../models/Category'); // Adjust the path to your Category model

// GET route to fetch a category by its ID
router.get('/:id', async (req, res) => {
  try {
    const categoryId = req.params.id; // Extract the category ID from the URL

    // Find the category by its ID
    const category = await Category.findById(categoryId);

    // If no category is found, return a 404 response
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Respond with the category data
    return res.status(200).json({ category });
  } catch (error) {
    console.error(error);

    // Handle invalid ObjectId error (when ID is not valid for MongoDB)
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    return res.status(500).json({ message: 'Server error, please try again later' });
  }
});

module.exports = router;
