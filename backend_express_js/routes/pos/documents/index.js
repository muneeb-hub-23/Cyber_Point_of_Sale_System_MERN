const express = require('express')
const router = express.Router()

router.use('/createdocument',require('./CreateDocument'))
router.use('/getdocuments',require('./getDocuments'))
router.use('/getdocumentsforsale',require('./getDocumenstForSale'))
router.use('/deletedocument',require('./DeleteDocument'))
router.use('/joincustomer',require('./JoinCustomer'))
router.use('/delinkcustomer',require('./DelinkCustomer'))
router.use('/linkcustomergroup',require('./LinkCustomerGroup'))

module.exports = router