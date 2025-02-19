const express = require('express');
const router = express.Router();
const Category = require('../../../models/Category'); // Adjust the path to your Category model

// DELETE route to delete a category by its ID, but only if it has no products
router.delete('/:id', async (req, res) => {
  try {
    const categoryId = req.params.id; // Extract the category ID from the URL

    // Find the category by its ID
    const category = await Category.findById(categoryId);

    // If the category is not found, return a 404 response
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if the category contains products
    if (category.products > 0) {
      return res.status(400).json({success:false, message: 'Category contains products and cannot be deleted' });
    }

    // Proceed to delete the category if no products are found
    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    // Respond with a success message
    return res.status(200).json({success:true, message: 'Category deleted successfully', category: deletedCategory });
  } catch (error) {
    console.error(error);

    // Handle invalid ObjectId error (when the ID is not valid for MongoDB)
    if (error.kind === 'ObjectId') {
      return res.status(400).json({success:false, message: 'Invalid category ID' });
    }

    return res.status(500).json({ success:false,message: 'Server error, please try again later' });
  }
});

module.exports = router;
