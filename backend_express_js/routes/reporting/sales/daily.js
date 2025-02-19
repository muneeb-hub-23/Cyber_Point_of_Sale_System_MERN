const express = require('express')
const router = express.Router()

router.get('/',(req,res)=>{
    // let {doctype,criteria} = req.headers

    const users = [
        { id: 1, name: "John Doe", email: "john@example.com", joinDate: "2020-05-15" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2021-02-10" },
        { id: 3, name: "Alice Johnson", email: "alice@example.com", joinDate: "2023-01-25" }
    ];


    res.render('reports/sales/daily', { users: users });

    // res.json({success:true})

})


module.exports = router