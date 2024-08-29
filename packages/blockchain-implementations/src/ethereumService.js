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
exports.EthereumService = void 0;
const web3_1 = __importDefault(require("web3"));
const ethereumjs_tx_1 = require("ethereumjs-tx");
const axios_1 = __importDefault(require("axios"));
const ethers_1 = require("ethers");
const bip39 = __importStar(require("bip39"));
// Define network configurations
const NETWORKS = {
    mainnet: {
        url: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
        chainId: 1
    },
    ropsten: {
        url: 'https://ropsten.infura.io/v3/YOUR_INFURA_PROJECT_ID',
        chainId: 3
    },
    rinkeby: {
        url: 'https://rinkeby.infura.io/v3/YOUR_INFURA_PROJECT_ID',
        chainId: 4
    },
    goerli: {
        url: 'https://goerli.infura.io/v3/YOUR_INFURA_PROJECT_ID',
        chainId: 5
    },
    kovan: {
        url: 'https://kovan.infura.io/v3/YOUR_INFURA_PROJECT_ID',
        chainId: 42
    },
    sepolia: {
        url: 'https://go.getblock.io/e91b729a43df4beab0bfa681bc6bd000',
        chainId: 11155111
    },
    testnet: {
        url: 'https://go.getblock.io/e91b729a43df4beab0bfa681bc6bd000',
        chainId: 11155111
    },
};
class EthereumService {
    web3;
    EthereumTx;
    network;
    constructor(network) {
        if (!NETWORKS[network]) {
            throw new Error('Unsupported network');
        }
        this.network = network;
        const providerUrl = NETWORKS[network].url;
        this.web3 = new web3_1.default(new web3_1.default.providers.HttpProvider(providerUrl));
        this.EthereumTx = ethereumjs_tx_1.Transaction;
    }
    generateDepositAddress(xPub, index) {
        throw new Error('Method not implemented.');
    }
    generatePrivateKey(mnemonic, index) {
        throw new Error('Method not implemented.');
    }
    getTransactions(address) {
        throw new Error('Method not implemented.');
    }
    async createAccount() {
        try {
            const wallet = ethers_1.ethers.Wallet.createRandom();
            if (!wallet.mnemonic || !wallet.mnemonic.phrase) {
                throw new Error('Mnemonic could not be generated');
            }
            const mnemonic = wallet.mnemonic.phrase;
            return {
                mnemonic,
                address: wallet.address,
                privateKey: wallet.privateKey
            };
        }
        catch (error) {
            throw new Error(`Error creating account: ${error.message}`);
        }
    }
    async importAccount(input) {
        try {
            if (input.startsWith('0x') && input.length === 42 && /^[0-9a-fA-F]{40}$/.test(input.slice(2))) {
                return this.importAccountFromPrivateKey(input);
            }
            if (bip39.validateMnemonic(input)) {
                return this.importAccountFromMnemonic(input);
            }
            throw new Error('Invalid address or mnemonic');
        }
        catch (error) {
            throw new Error(`Error importing account: ${error.message}`);
        }
    }
    async importAccountFromPrivateKey(privateKey) {
        try {
            return this.web3.eth.accounts.privateKeyToAccount(privateKey);
        }
        catch (error) {
            throw new Error(`Error importing account from private key: ${error.message}`);
        }
    }
    async importAccountFromMnemonic(mnemonic) {
        try {
            if (!bip39.validateMnemonic(mnemonic)) {
                throw new Error('Invalid mnemonic phrase');
            }
            const wallet = ethers_1.ethers.Wallet.fromPhrase(mnemonic);
            return {
                address: wallet.address,
                privateKey: wallet.privateKey
            };
        }
        catch (error) {
            throw new Error(`Error importing account from mnemonic: ${error.message}`);
        }
    }
    async getBalance(address) {
        try {
            const balance = await this.web3.eth.getBalance(address);
            return parseFloat(this.web3.utils.fromWei(balance, 'ether'));
        }
        catch (error) {
            throw new Error(`Error getting balance: ${error.message}`);
        }
    }
    async getTransactionDetails(hash) {
        try {
            const receipt = await this.web3.eth.getTransaction(hash);
            console.log('Transaction receipt:', receipt);
            // Convert BigInt to string
            const value = this.web3.utils.fromWei(receipt.value, 'ether');
            const gasPrice = this.web3.utils.fromWei(receipt.gasPrice, 'ether'); // Convert gas price to ether if needed
            const block = await this.web3.eth.getBlock(receipt.blockNumber || 'latest');
            // Convert block timestamp from BigInt to a number
            const timestamp = Number(block.timestamp); // Convert BigInt to number
            // Format the transaction date
            const transactionDate = new Date(timestamp * 1000).toISOString();
            return {
                value,
                from: receipt.from,
                to: receipt.to,
                gasPrice,
                transactionHash: receipt.hash,
                transactionDate
            };
        }
        catch (error) {
            throw new Error(`Error getting transaction details: ${error.message}`);
        }
    }
    async sendTransaction(fromAddress, privateKey, toAddress, amount) {
        try {
            const nonce = await this.web3.eth.getTransactionCount(fromAddress);
            const gasPrices = await this.getCurrentGasPrices();
            const networkConfig = NETWORKS[this.network];
            const txDetails = {
                to: toAddress,
                value: this.web3.utils.toHex(this.web3.utils.toWei(amount.toString(), 'ether')),
                gas: 26000,
                gasPrice: gasPrices.high * 1e9,
                nonce: nonce,
                chainId: networkConfig.chainId
            };
            const tx = new this.EthereumTx(txDetails, { chain: this.network });
            const privKey = Buffer.from(privateKey.replace('0x', ''), 'hex');
            tx.sign(privKey);
            const serializedTx = tx.serialize();
            return new Promise((resolve, reject) => {
                this.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
                    .once('transactionHash', (hash) => resolve(hash))
                    .on('error', (err) => reject(err));
            });
        }
        catch (error) {
            throw new Error(`Error sending transaction: ${error.message}`);
        }
    }
    async getCurrentGasPrices() {
        const response = await axios_1.default.get('https://ethgasstation.info/json/ethgasAPI.json');
        return {
            low: response.data.safeLow / 10,
            medium: response.data.average / 10,
            high: response.data.fast / 10
        };
    }
}
exports.EthereumService = EthereumService;
