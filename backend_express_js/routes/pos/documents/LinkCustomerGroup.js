const express = require('express');
const router = express.Router();
const Document = require('../../../models/Documents');

router.get('/',(req,res)=>{ res.send("hello") })

router.post('/', async (req, res) => {
  const { id, customer } = req.body;
  try {
    const data = await Document.findByIdAndUpdate(id, { customerGroup: customer, customer });
    if (data) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Document not found' });
    }
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
