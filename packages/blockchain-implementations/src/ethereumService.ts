import Web3 from 'web3';
import { Transaction as EthereumTx } from 'ethereumjs-tx';
import axios from 'axios';
import { BlockchainService } from 'blockchain-interfaces';
import { ethers } from 'ethers';
import * as bip39 from 'bip39';

export class EthereumService implements BlockchainService {
  private web3: Web3;
  private EthereumTx: typeof EthereumTx;

  constructor() {
    this.web3 = new Web3(new Web3.providers.HttpProvider('https://goerli.infura.io/v3/YOUR_INFURA_PROJECT_ID')); // Replace with your Infura Project ID
    this.EthereumTx = EthereumTx;
  }
  generateDepositAddress(xPub: string, index: number): Promise<string> {
    throw new Error('Method not implemented.');
  }
  generatePrivateKey(mnemonic: string, index: number): Promise<string> {
    throw new Error('Method not implemented.');
  }
  getTransactions(address: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async createAccount(): Promise<any> {
    try {
      const wallet = ethers.Wallet.createRandom();
      // Ensure mnemonic is available
      if (!wallet.mnemonic || !wallet.mnemonic.phrase) {
        throw new Error('Mnemonic could not be generated');
      }
      const mnemonic = wallet.mnemonic.phrase; // Get the mnemonic phrase from the wallet
      
      return {
        mnemonic,
        address: wallet.address,
        privateKey: wallet.privateKey
      };
    } catch (error: any) {
      throw new Error(`Error creating account: ${error.message}`);
    }
  }

  async importAccount(input: string, network: string): Promise<any> {
    try {
      // Check if input is a valid Ethereum address
      if (input.startsWith('0x') && input.length === 42 && /^[0-9a-fA-F]{40}$/.test(input.slice(2))) {
        // Import account from address
        return this.importAccountFromPrivateKey(input);
      }

      // Check if input is a valid mnemonic phrase
      if (bip39.validateMnemonic(input)) {
        // Import account from mnemonic
        return this.importAccountFromMnemonic(input);
      }

      throw new Error('Invalid address or mnemonic');
    } catch (error: any) {
      throw new Error(`Error importing account: ${error.message}`);
    }
  }

  async importAccountFromPrivateKey(privateKey: string): Promise<any> {
    try {
      return this.web3.eth.accounts.privateKeyToAccount(privateKey);
    } catch (error: any) {
      throw new Error(`Error importing account from private key: ${error.message}`);
    }
  }

  async importAccountFromMnemonic(mnemonic: string): Promise<any> {
    try {
      // Validate the mnemonic
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Create a wallet from the mnemonic
      const wallet = ethers.Wallet.fromPhrase(mnemonic);

      // Return wallet information
      return {
        address: wallet.address,
        privateKey: wallet.privateKey
      };
    } catch (error: any) {
      throw new Error(`Error importing account from mnemonic: ${error.message}`);
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
      const balance = await this.web3.eth.getBalance(address);
      return this.web3.utils.fromWei(balance, 'ether') as unknown as Promise<number>;
    } catch (error: any) {
      throw new Error(`Error getting balance: ${error.message}`);
    }
  }

  async getTransactionDetails(hash: string): Promise<any> {
    try {
      const receipt = await this.web3.eth.getTransaction(hash);
      const amount = this.web3.utils.fromWei(receipt.value, 'ether');
      return {
        value: amount,
        from: receipt.from,
        to: receipt.to,
        details: receipt
      };
    } catch (error: any) {
      throw new Error(`Error getting transaction details: ${error.message}`);
    }
  }

  async sendTransaction(fromAddress: string, privateKey: string, toAddress: string, amount: number): Promise<string> {
    try {
      const nonce = await this.web3.eth.getTransactionCount(fromAddress);
      const gasPrices = await this.getCurrentGasPrices();
      const txDetails: any = {
        to: toAddress,
        value: this.web3.utils.toHex(this.web3.utils.toWei(amount.toString(), 'ether')),
        gas: 26000,
        gasPrice: gasPrices.high * 1e9,
        nonce: nonce,
        chainId: 5 // Goerli Testnet
      };

      const tx = new this.EthereumTx(txDetails, { chain: 'goerli' });
      const privKey = Buffer.from(privateKey.replace('0x', ''), 'hex');
      tx.sign(privKey);
      const serializedTx = tx.serialize();

      return new Promise((resolve, reject) => {
        this.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
          .once('transactionHash', (hash: string) => resolve(hash))
          .on('error', (err: Error) => reject(err));
      });
    } catch (error: any) {
      throw new Error(`Error sending transaction: ${error.message}`);
    }
  }

  private async getCurrentGasPrices(): Promise<{ low: number; medium: number; high: number }> {
    const response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
    return {
      low: response.data.safeLow / 10,
      medium: response.data.average / 10,
      high: response.data.fast / 10
    };
  }
}
