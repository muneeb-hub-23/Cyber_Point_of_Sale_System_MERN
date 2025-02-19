const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const path = require('path');
const verifyer = require('./authVerifyer')

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json({ limit: '500mb' }));
try{
mongoose.connect('mongodb://localhost:27017/cyber_khata')
console.log('database connected')
}catch(err){
    console.log(err)
}



app.use('/customers',require('./routes/customers/index'))
app.use('/shop',require('./routes/shop/index'))
app.use('/khata',require('./routes/khata/index'))
app.use('/transaction',require('./routes/transactions/index'))
app.use('/database',require('./routes/database/index'))
app.use('/email',require('./routes/email/index'))
app.use('/dashboard',require('./routes/dashboard/index'))
app.use('/users',require('./routes/users/index'))
app.use('/authentication',require('./routes/authentication/index'))
app.use('/management',require('./routes/management/index'))
app.use('/pos',require('./routes/pos/index'))
app.use('/cashregister',require('./routes/cashregister/index'))
app.use('/recentdocs',require('./routes/recentDocs/index'))
app.use('/update',require('./routes/update/index'))
app.use('/print',require('./routes/prints/print'))
app.use('/test',require('./routes/testroute/test'))
app.use('/reporting',require('./routes/reporting/index'))

app.get('/',(req,res)=>{
    res.send("This is a Secured Directory")
})


const port = process.env.PORT || 4000
app.listen(port,()=>{
    console.log("server is running")
})