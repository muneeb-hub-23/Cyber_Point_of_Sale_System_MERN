const express = require('express')
const router = express.Router()
const Customer = require('../../models/Customer')
const Shop = require('../../models/Shop')

router.post('/', async (req, res) => {



        const Person = new Customer(req.body)
        await Person.save()
            .then(async data => {
                await Shop.findOneAndUpdate({ _id: req.body.linkedShop }, { $inc: { customers: 1 } }, { new: true })
                    .then(data => console.log(data))
                    .catch(
                        (err) => {
                            console.log(err)
                        })
            })
            .catch(
                (err) => {
                    console.log(err)
                })


        let person = await JSON.parse(JSON.stringify(Person))
        person.success = true
        if(person){
            res.send(JSON.stringify(person))
        }else{
            res.send(JSON.stringify({success:false,message:"Not created User"}))
        }

})


module.exports = router