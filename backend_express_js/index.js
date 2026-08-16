const express = require('express')
const app = express()
const cors = require('cors')
const path = require('path');
const verifyer = require('./authVerifyer')
const db = require('./db')

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json({ limit: '500mb' }));

// Test MySQL connection on startup
db.getConnection()
    .then(conn => {
        console.log('MySQL database connected')
        conn.release()
    })
    .catch(err => {
        console.error('MySQL connection failed:', err.message)
    })



app.use('/customers',require('./routes/customers/index'))
app.use('/shop',require('./routes/shop/index'))
app.use('/khata',require('./routes/khata/index'))
app.use('/transaction',require('./routes/transactions/index'))
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
