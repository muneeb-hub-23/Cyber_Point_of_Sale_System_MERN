const express = require('express')
const router = express.Router()



router.use('/createuser',require('./createuser'))
router.use('/getusers',require('./getusers'))
router.use('/deleteuser',require('./deleteuser'))
router.use('/getuserbyid',require('./getuserbyid'))
router.use('/modifyuser',require('./modifyuser'))


module.exports = router