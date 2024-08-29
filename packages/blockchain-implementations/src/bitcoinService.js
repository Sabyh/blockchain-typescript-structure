"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitcoinService = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const bip39 = __importStar(require("bip39"));
const bip32_1 = require("bip32");
const ecc = __importStar(require("tiny-secp256k1"));
const axios_1 = __importDefault(require("axios"));
const ECPairFactory = require('ecpair').default;
const ECPair = ECPairFactory(ecc);
const bip32 = (0, bip32_1.BIP32Factory)(ecc);
class BitcoinService {
    apiBaseUrl = 'https://api.getblock.io/v1'; // Replace with your GetBlock API base URL
    apiKey = 'YOUR_API_KEY'; // Replace with your GetBlock API key
    async getBalance(address, network) {
        try {
            console.log('Getting balance for address:', address);
            console.log('Network:', network);
            // BlockCypher base URL for mainnet and testnet
            const baseUrl = network === 'mainnet'
                ? 'https://api.blockcypher.com/v1/btc/main/addrs'
                : 'https://api.blockcypher.com/v1/btc/test3/addrs';
            // Construct the API URL
            const url = `${baseUrl}/${address}/balance`;
            // Make the API request
            const response = await axios_1.default.get(url);
            const data = response.data;
            // The balance is returned in Satoshis, convert it to Bitcoins
            const balanceBitcoin = data.balance / 1e8;
            return balanceBitcoin; // Return as a number
        }
        catch (error) {
            throw new Error(`Error getting Bitcoin balance: ${error.message}`);
        }
    }
    generateDepositAddress(xPub, index) {
        throw new Error('Method not implemented.');
    }
    generatePrivateKey(mnemonic, index) {
        throw new Error('Method not implemented.');
    }
    async getTransactionDetails(hash, network) {
        try {
            // Define the API endpoints for BlockCypher
            const BLOCKCYPHER_API_URLS = {
                mainnet: `https://api.blockcypher.com/v1/btc/main/txs/${hash}`,
                testnet: `https://api.blockcypher.com/v1/btc/test3/txs/${hash}`
            };
            const url = BLOCKCYPHER_API_URLS[network];
            // Make the API request
            const response = await axios_1.default.get(url);
            const data = response.data;
            // Convert amount from satoshis to BTC
            const formatAmount = (satoshis) => (satoshis / 1e8).toFixed(8);
            // Extract details
            const inputs = data.inputs.map((input) => ({
                address: input.addresses[0],
                value: formatAmount(input.output_value),
            }));
            const outputs = data.outputs.map((output) => ({
                address: output.addresses[0],
                value: formatAmount(output.value),
            }));
            // Validate and convert transaction date
            let transactionDate;
            transactionDate = data.received;
            // Hyperlinks for transaction and addresses
            const transactionLink = `https://blockchain.info/tx/${data.hash}`; // Change this URL if using a different block explorer
            const addressLinks = {
                inputs: inputs.map(input => `https://blockchain.info/address/${input.address}`),
                outputs: outputs.map(output => `https://blockchain.info/address/${output.address}`)
            };
            return {
                txid: data.hash,
                version: data.version,
                locktime: data.lock_time,
                inputs: inputs.map((input, index) => ({
                    address: input.address,
                    value: input.value,
                    hyperlink: addressLinks.inputs[index]
                })),
                outputs: outputs.map((output, index) => ({
                    address: output.address,
                    value: output.value,
                    hyperlink: addressLinks.outputs[index]
                })),
                quantity: outputs.reduce((total, output) => total + parseFloat(output.value), 0),
                transactionDate,
                transactionLink
            };
        }
        catch (error) {
            console.log('Error getting transaction details:', error);
            throw new Error(`Error getting transaction details: ${error.message}`);
        }
    }
    getTransactions(address) {
        throw new Error('Method not implemented.');
    }
    sendTransaction(fromAddress, privateKey, toAddress, amount) {
        throw new Error('Method not implemented.');
    }
    async createAccount(networkType) {
        try {
            const network = networkType === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
            const mnemonic = bip39.generateMnemonic();
            const seed = bip39.mnemonicToSeedSync(mnemonic);
            const root = bip32.fromSeed(seed, network);
            const account = root.derivePath("m/44'/0'/0'/0/0");
            const privateKey = account.toWIF();
            const { address } = bitcoin.payments.p2pkh({ pubkey: account.publicKey, network });
            return {
                mnemonic,
                address: address || '',
                privateKey,
            };
        }
        catch (error) {
            throw new Error(`Error creating Bitcoin account: ${error.message}`);
        }
    }
    async isBitcoinAddress(address) {
        try {
            bitcoin.address.fromBech32(address);
            return true;
        }
        catch {
            try {
                bitcoin.address.fromBase58Check(address);
                return true;
            }
            catch {
                return false;
            }
        }
    }
    async importAccount(address, networkType) {
        try {
            const network = networkType === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
            if (await this.isBitcoinAddress(address)) {
                throw new Error('Cannot import directly from Bitcoin address. Requires private key.');
            }
            if (bip39.validateMnemonic(address)) {
                return await this.importAccountFromMnemonic(address, network);
            }
            return await this.importAccountFromPrivateKey(address, network);
        }
        catch (error) {
            throw new Error(`Error importing account: ${error.message}`);
        }
    }
    async importAccountFromPrivateKey(privateKey, network) {
        try {
            const keyPair = ECPair.fromWIF(privateKey, network);
            const { address } = bitcoin.payments.p2pkh({
                pubkey: keyPair.publicKey,
                network,
            });
            return {
                address: address,
                privateKey: keyPair.toWIF(),
            };
        }
        catch (error) {
            throw new Error(`Error importing account from private key: ${error.message}`);
        }
    }
    async importAccountFromMnemonic(mnemonic, network) {
        try {
            if (!bip39.validateMnemonic(mnemonic)) {
                throw new Error('Invalid mnemonic phrase');
            }
            const seed = bip39.mnemonicToSeedSync(mnemonic);
            const root = bip32.fromSeed(seed, network);
            const account = root.derivePath("m/44'/0'/0'/0/0");
            const privateKey = account.toWIF();
            const { address } = bitcoin.payments.p2pkh({
                pubkey: account.publicKey,
                network,
            });
            return {
                address: address,
                privateKey,
                mnemonic,
            };
        }
        catch (error) {
            throw new Error(`Error importing account from mnemonic: ${error.message}`);
        }
    }
    async getAddressInfo(address) {
        try {
            const response = await axios_1.default.get(`${this.apiBaseUrl}/api/v1/address/${address}?api_key=${this.apiKey}`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching address info: ${error.message}`);
        }
    }
    async getTransaction(hash) {
        try {
            const response = await axios_1.default.get(`${this.apiBaseUrl}/api/v1/transaction/${hash}?api_key=${this.apiKey}`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching transaction: ${error.message}`);
        }
    }
}
exports.BitcoinService = BitcoinService;
