const express = require('express');
const DocumentItems = require('../../models/DocumentItem')
const router = express.Router();

router.use('/',require('./SingleReceipt'))
router.use('/sale',require('./sale/index'))

module.exports = router;
