const express = require('express');
const router = express.Router();
const Category = require('../../../models/Category');

router.delete('/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.products > 0) {
      return res.status(400).json({success:false, message: 'Category contains products and cannot be deleted' });
    }

    const deletedCategory = await Category.findByIdAndDelete(categoryId);
    return res.status(200).json({success:true, message: 'Category deleted successfully', category: deletedCategory });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success:false, message: 'Server error, please try again later' });
  }
});

module.exports = router;
