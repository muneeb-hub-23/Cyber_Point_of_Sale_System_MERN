const express = require('express');
const router = express.Router();
const Category = require('../../../models/Category'); // Adjust the path to your Category model

// PUT route to modify a category's title and description by its ID
router.put('/:id', async (req, res) => {
  try {
    const categoryId = req.params.id; // Extract the category ID from the URL
    const { name, description } = req.body; // Extract name and description from the request body

    // Check if both name and description are provided
    if (!name || !description) {
      return res.status(400).json({ success:false,message: 'Both name and description are required' });
    }

    // Update the category with new name and description
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { name, description }, // Update these fields
      { new: true, runValidators: true } // Return the updated document and run validation
    );

    // If no category is found with the provided ID, return a 404 response
    if (!updatedCategory) {
      return res.status(404).json({ success:false,message: 'Category not found' });
    }

    // Respond with the updated category
    return res.status(200).json({ success:true,message: 'Category updated successfully', category: updatedCategory });
  } catch (error) {
    console.error(error);

    // Handle invalid ObjectId error (when the ID is not valid for MongoDB)
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success:false,message: 'Invalid category ID' });
    }

    return res.status(500).json({ success:false,message: 'Server error, please try again later' });
  }
});

module.exports = router;
