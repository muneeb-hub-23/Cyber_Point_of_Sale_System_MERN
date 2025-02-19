const express = require('express')
const router = express.Router()


router.use('/createcategory',require('./createcategory'))
router.use('/getcategories',require('./getcategories'))
router.use('/getcategorybyid',require('./getcategorybyid'))
router.use('/deletecategory',require('./deletecategory'))
router.use('/modifycategory',require('./modifycategory'))



module.exports = router