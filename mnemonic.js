const constants = require("./constants");
const Bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const Web3 = require('web3')
const bip32 = require("bip32");
const hdKey = require("ethereumjs-wallet/hdkey");
const Axios = require('axios').default
const ABI = require('./ABI')

const web3 = new Web3(new Web3.providers.HttpProvider(constants.ETHER_WEB3));
const contract = new web3.eth.Contract(ABI, constants.ADDRESS);

let seed;

const convertToBitcoin = async (network, path) => {
    const wif = bip32
        .fromSeed(seed, network)
        .derivePath(path)
        .toWIF();
    const keyPair = Bitcoin.ECPair.fromWIF(wif, network);
    const { address } = Bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network,
        privateKey: wif
    });
    const balance = await Axios.get(`${constants.BITCOIN_API}/addr/${address}`);
    return {
        publicKey: address,
        balance: balance.data.balance,
        // privateKey: wif
    };
};

const convertToEthereum = async (path) => {
    const keyPair = hdKey.fromMasterSeed(seed).derivePath(path);
    const address = keyPair.getWallet().getAddressString()
    return {
        publicKey: keyPair.getWallet().getAddressString(),
        balance: await web3.eth.getBalance(address).then(ethBalance => Number(ethBalance / 1000000000000000000).toFixed(5))
        // privateKey: keyPair.getWallet().getPrivateKeyString()
    };
};

exports.getAccountCredentials = async (index = 0) => {
    if (!seed) {
        seed = await bip39.mnemonicToSeed(process.env.SEED);
    }
    return new Promise(async (resolve, reject) => {
        const BTC = await convertToBitcoin(
            // Network
            Bitcoin.networks.bitcoin,
            `${constants.BTC_PATH}/${index}`
        );
        const ETH = await convertToEthereum(`${constants.ETH_PATH}/${index}`);
        resolve({
            BTC,
            ETH
        });
    });
};
