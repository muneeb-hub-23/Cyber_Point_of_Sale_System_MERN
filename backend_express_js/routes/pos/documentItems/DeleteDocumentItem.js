const express = require('express');
const router = express.Router();
const DocumentItem = require('../../../models/DocumentItem');

router.delete('/', async (req, res) => {
    try {
        const { id } = req.headers;

        if (!id) {
            return res.status(400).json({ success: false, message: "Missing document ID in headers" });
        }

        const data = await DocumentItem.deleteOne({ id });

        if (data.deletedCount > 0) {
            res.json({ success: true, message: "Document deleted successfully" });
        } else {
            res.status(404).json({ success: false, message: "Document not found" });
        }
    } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ success: false, message: "Server error occurred while deleting document" });
    }
});

module.exports = router;
