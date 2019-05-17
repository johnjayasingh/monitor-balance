const mongoose = require('mongoose');
const json2csv = require('json2csv')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const mnemonic = require('./mnemonic')

mongoose.connect(`mongodb://${process.env.MONGODB_URI || 'localhost:27017'}/globalpay`, { useNewUrlParser: true });

const UserSchema = new mongoose.Schema(
    {
        phone: { type: String, require: true, unique: true },
    },
);


const User = mongoose.model("GlobalPayUsers", UserSchema);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

User.find().lean().skip(Number(process.env.SKIP)).limit(Number(process.env.LIMIT) || 1).select('-_id userId email phone').then(async dbResult => {
    let result;
    const resolvedAddress = []
    dbResult.forEach(async data => {
        const resultData = await mnemonic
            .getAccountCredentials(data.userId)
            .then(result => ({
                Ethereum: result.ETH.publicKey,
                'Ethereum Balance': result.ETH.balance,
                Bitcoin: result.BTC.publicKey,
                'Bitcoin Balance': result.BTC.balance,
                ...data
            }))
            .catch(console.error)
        await delay(3000)
        resolvedAddress.push(resultData)
        result = json2csv.parse(resolvedAddress)
        try {
            fs.writeFileSync(path.resolve(__dirname, `output_${new Date().toUTCString()}.csv`), result)
        } catch (error) {
            console.error(error)
            process.exit()
        }
    })
})
