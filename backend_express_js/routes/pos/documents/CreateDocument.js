const express = require('express');
const router = express.Router();
const Document = require('../../../models/Documents');
const DocCounter = require('../../../models/DocumentNumber')
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

router.post('/', async (req, res) => {
    function formatDate(dateString) {
        const date = new Date(dateString);
      
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        const day = String(date.getDate()).padStart(2, '0');
      
        return `${year}${month}${day}`;
      }
      let { user, linkedShop, doctype,status,date } = req.body;
      date = formatDate(date)
    try {
        // Destructure and cast relevant fields to ObjectId

        let count = 1
        let xip = await DocCounter.find()
        if(xip.length > 0){
          await DocCounter.updateMany({$inc:{count: 1}})
          count = xip[0].count
        }else{
          count = 1
          dba = new DocCounter({count:1})
          await dba.save()
        }


        let data = new Document({
            doctype,
            status,
            date,
            user,
            linkedShop,
            count
        });

        // Save the new document
        await data.save();

        // Find the saved document with populated 'customer' field
        const values = await Document.find({
            doctype,
            status,
            date,
            user,
            linkedShop
        }).populate('customer');

        // Check if any documents are found and respond accordingly
        if (values.length > 0) {
            res.status(200).json(values);
        } else {
            res.status(404).json({ success: false, message: "No documents found" });
        }
    } catch (error) {
        console.error("Error creating document:", error);
        res.status(500).json({ success: false, error: "An error occurred" });
    }
});

module.exports = router;
