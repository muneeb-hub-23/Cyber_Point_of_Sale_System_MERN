const express = require('express');
const router = express.Router();
const Document = require('../../../models/Documents');
const mongoose = require('mongoose');

router.get('/',(req,res)=>{
    res.send("hello")
})

router.post('/', async (req, res) => {
  const { id, customer } = req.body;
  try {
    // Update the document by ID with the new customer ObjectId
    const data = await Document.findByIdAndUpdate(
      id,
      { customer },
      { new: true } // Return the updated document
    );

    // Check if the document was found and updated
    if (data) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Document not found' });
    }
  } catch (error) {
    // Handle any errors
    console.error("Error updating document:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
