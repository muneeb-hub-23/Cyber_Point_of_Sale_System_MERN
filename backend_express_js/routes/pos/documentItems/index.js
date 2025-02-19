const express = require('express')
const router = express.Router()

router.use('/createdocumentitem',require('./CreateDocumentItem'))
router.use('/deletedocumentitem',require('./DeleteDocumentItem'))
router.use('/getdocumentitems',require('./GetDocumentItems'))
router.use('/changeitemqty',require('./ChangeItemQty'))
router.use('/adddiscount',require('./AddDiscount'))

module.exports = router