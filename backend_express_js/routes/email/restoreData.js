const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');
const CashRegister = require('../../models/CashRegister')
const Category = require('../../models/Category')
const Counter = require('../../models/Counter')
const Customer = require('../../models/Customer')
const CustomerGroup = require('../../models/CustomerGroup')
const DocumentItem = require('../../models/DocumentItem')
const DocumentNumber = require('../../models/DocumentNumber')
const Documents = require('../../models/Documents')
const History = require('../../models/History')
const PaymentMethods = require('../../models/PaymentMethods')
const Products = require('../../models/Product')
const ProductHistory = require('../../models/ProductHistory')
const SaleTypes = require('../../models/SaleTypes')
const Shop = require('../../models/Shop')
const Transaction = require('../../models/Transaction')
const Users = require('../../models/User')

// Configure multer for file upload
const upload = multer({ dest: 'public/uploads/' }); // Directory for temporary file storage

// Secret key for decoding JWT (make sure this matches the key used to sign the JWT)
const JWT_SECRET = 'Hello@123';

// POST route for file upload and database restoration
router.post('/', upload.single('backupFile'), async (req, res) => {
    try {
        // Step 1: Handle the uploaded file (the file contains the JWT token)
        const filePath = req.file.path;

        // Step 2: Read the uploaded JWT token file
        const token = await fs.readFile(filePath, 'utf-8');

        // Step 3: Decode the JWT token to get the backup data
        let backupData;
        try {
            backupData = jwt.verify(token, "Hello@123");  // Verify and decode the JWT token
        } catch (error) {
            throw new Error('Invalid JWT token');
        }

        // Step 4: Remove old data from the database

        await CashRegister.deleteMany({})
        await Category.deleteMany({})
        await Counter.deleteMany({})
        await CustomerGroup.deleteMany({})
        await Customer.deleteMany({})
        await DocumentItem.deleteMany({})
        await DocumentNumber.deleteMany({})
        await Documents.deleteMany({})
        await History.deleteMany({})
        await PaymentMethods.deleteMany({})
        await Products.deleteMany({})
        await ProductHistory.deleteMany({})
        await SaleTypes.deleteMany({})
        await Shop.deleteMany({})
        await Transaction.deleteMany({})
        await Users.deleteMany({})


        // Step 5: Write the new data from the decoded JWT token to the database

        await CashRegister.insertMany(backupData.cashregister)
        await Category.insertMany(backupData.category)
        await Counter.insertMany(backupData.counter)
        await Customer.insertMany(backupData.customers)
        await CustomerGroup.insertMany(backupData.customersgroups)
        await DocumentItem.insertMany(backupData.documentitem)
        await DocumentNumber.insertMany(backupData.documentnumber)
        await Documents.insertMany(backupData.documents)
        await History.insertMany(backupData.history)
        await PaymentMethods.insertMany(backupData.paymentmethods)
        await Products.insertMany(backupData.products)
        await ProductHistory.insertMany(backupData.producthistory)
        await SaleTypes.insertMany(backupData.saletypes)
        await Shop.insertMany(backupData.shops)
        await Transaction.insertMany(backupData.transactions)
        await Users.insertMany(backupData.users)



        // Step 6: Cleanup - remove the uploaded file from the server
        await fs.unlink(filePath);

        res.json({ success: true, message: 'Database restored from backup successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message || 'Failed to restore data from backup' });
    }
});

module.exports = router;
