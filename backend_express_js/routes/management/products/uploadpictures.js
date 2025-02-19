const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../../../models/Product');
const router = express.Router();

// Create the directory if it doesn't exist
const uploadDirectory = path.join(__dirname, '../../../public/images/productspictures');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// POST /api/products/upload/:productId
router.post('/:productId', upload.array('images', 10), async (req, res) => {
  const { productId } = req.params;
  const { userId } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded.' });
  }

  try {
    // Map the uploaded files to an array of file paths
    const uploadedFilePaths = req.files.map(file => `/images/productspictures/${file.filename}`);

    // Update the product's pictures and pictureBy fields in the database
    const product = await Product.findByIdAndUpdate(
      productId,
      {
        picture:uploadedFilePaths,
        pictureBy: userId,
        status:"picturesuploaded"
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.status(200).json({
      message: 'Images uploaded and product updated successfully!',
      product,
      files: uploadedFilePaths
    });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while uploading files and updating the product.', error });
  }
});

module.exports = router;
