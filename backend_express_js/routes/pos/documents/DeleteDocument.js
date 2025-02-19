const express = require('express');
const router = express.Router();
const Document = require('../../../models/Documents');
const DocumentItem = require('../../../models/DocumentItem')
const mongoose = require('mongoose')
const {ObjectId} = mongoose.Types

router.delete('/', async (req, res) => {

    let { docid,doctype, user, status, date, linkedShop } = req.body;
    try {
       
        await Document.findByIdAndDelete(docid)
        await DocumentItem.deleteMany({document:docid})
        let query = {
            doctype,
            user,
            status,
            linkedShop,
            date
        };
        let data = await Document.find(query).populate('customer')

        res.json(data)


    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ success: false, error: "An error occurred while fetching documents." });
    }
});

module.exports = router;
