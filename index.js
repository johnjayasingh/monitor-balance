const mongoose = require('mongoose');
// const app = require('express')()
const json2csv = require('json2csv')
require('dotenv').config()

const mnemonic = require('./mnemonic')
const constants = require('./constants')

mongoose.connect(`mongodb://${process.env.MONGODB_URI || 'localhost:27017'}/globalpay`, { useNewUrlParser: true });

// app.listen(8888, console.info)

const UserSchema = new mongoose.Schema(
    {
        phone: { type: String, require: true, unique: true },
    },
);


const User = mongoose.model("GlobalPayUsers", UserSchema);

User.find().lean().limit(10).select('-_id userId email phone').then(async dbResult => {
    const promise = []
    dbResult.forEach(data => {
        promise.push(mnemonic.getAccountCredentials(data.userId).then(result => ({ Ethereum: result.ETH.publicKey, 'Ethereum Balance': result.ETH.balance, Bitcoin: result.BTC.publicKey, 'Bitcoin Balance': result.BTC.balance, ...data })))
    })
    const resolvedAddress = await Promise.all(promise).catch(console.error)
    const result = json2csv.parse(resolvedAddress)
    console.log(result)
    process.exit()
})
