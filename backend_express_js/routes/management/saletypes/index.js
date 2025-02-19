const express = require('express')
const router = express.Router()

router.use('/addsaletype',require('./addsaletype'))
router.use('/modifySaleType',require('./modifysaletype'))
router.use('/deleteSaleType',require('./deletesaletype'))
router.use('/getSaleTypes',require('./getsaletypes'))
router.use('/getsaletypesbyid',require('./getsaletypebyid'))


module.exports = router