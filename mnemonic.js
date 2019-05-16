const constants = require("./constants");
const Bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const bip32 = require("bip32");
const hdKey = require("ethereumjs-wallet/hdkey");

let seed;

const convertToBitcoin = (network, path) => {
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
    return {
        publicKey: address,
        privateKey: wif
    };
};

const convertToEthereum = (path) => {
    const keyPair = hdKey.fromMasterSeed(seed).derivePath(path);
    return {
        publicKey: keyPair.getWallet().getAddressString(),
        privateKey: keyPair.getWallet().getPrivateKeyString()
    };
};

exports.getAccountCredentials = async (index = 0) => {
    if (!seed) {
        seed = await bip39.mnemonicToSeed(process.env.SEED);
    }
    return new Promise((resolve, reject) => {
        const BTC = convertToBitcoin(
            // Network
            Bitcoin.networks.bitcoin,
            `${constants.BTC_PATH}/${index}`
        );
        const ETH = convertToEthereum(`${constants.ETH_PATH}/${index}`);
        resolve({
            BTC,
            ETH
        });
    });
};
