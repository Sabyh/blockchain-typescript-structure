import { BlockchainService } from 'blockchain-interfaces';
import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import axios from 'axios';

const ECPairFactory = require('ecpair').default;
const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

export class BitcoinService implements BlockchainService {
  private apiBaseUrl = 'https://api.getblock.io/v1'; // Replace with your GetBlock API base URL
  private apiKey = 'YOUR_API_KEY'; // Replace with your GetBlock API key

  getBalance(address: string): Promise<number> {
    return this.getAddressInfo(address).then(info => {
      return info.balance;
    }).catch(error => {
      throw new Error(`Error getting balance: ${error.message}`);
    });
  }

  generateDepositAddress(xPub: string, index: number): Promise<string> {
    throw new Error('Method not implemented.');
  }

  generatePrivateKey(mnemonic: string, index: number): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async getTransactionDetails(hash: string, network: string): Promise<any> {
    try {
      console.log('Getting transaction details for hash:', hash);
      console.log('Network:', network);
      // Define API keys and URLs
      const API_KEYS: { [key: string]: string } = {
        mainnet: 'YOUR_MAINNET_API_KEY',
        testnet: 'e74aa49b94568252a4d7444976647de58c8540112a476e81312e6da3d3e2fd18'
      };

      const BITCOIN_NETWORKS: { [key: string]: string } = {
        mainnet: 'https://go.getblock.io/btc/mainnet/',
        testnet: 'https://go.getblock.io/btc/testnet/'
      };

      // Validate network type
      if (!BITCOIN_NETWORKS[network]) {
        throw new Error('Unsupported network');
      }

      const baseUrl = BITCOIN_NETWORKS[network];
      const apiKey = API_KEYS[network];
      if (!apiKey) {
        throw new Error('API key not configured for this network');
      }

      // Fetch transaction details
      const response = await axios.get(`${baseUrl}rawtx/${hash}`, {
        headers: {
          'x-api-key': apiKey
        }
      });

      const data = response.data;

      // Convert amount from satoshis to BTC
      const formatAmount = (satoshis: number) => (satoshis / 1e8).toFixed(8);

      // Extract details
      const inputs = data.inputs.map((input: any) => ({
        address: input.address,
        value: formatAmount(input.value),
      }));

      const outputs = data.outputs.map((output: any) => ({
        address: output.address,
        value: formatAmount(output.value),
      }));

      return {
        txid: data.txid,
        version: data.version,
        locktime: data.locktime,
        inputs,
        outputs,
        confirmations: data.confirmations,
        details: data
      };
    } catch (error: any) {
      throw new Error(`Error getting transaction details: ${error.message}`);
    }
  }



  getTransactions(address: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  sendTransaction(fromAddress: string, privateKey: string, toAddress: string, amount: number): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async createAccount(networkType: string): Promise<{ mnemonic: string, address: string, privateKey: string }> {
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
    } catch (error: any) {
      throw new Error(`Error creating Bitcoin account: ${error.message}`);
    }
  }

  async isBitcoinAddress(address: string): Promise<boolean> {
    try {
      bitcoin.address.fromBech32(address);
      return true;
    } catch {
      try {
        bitcoin.address.fromBase58Check(address);
        return true;
      } catch {
        return false;
      }
    }
  }

  async importAccount(address: string, networkType: string): Promise<any> {
    try {
      const network = networkType === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
      if (await this.isBitcoinAddress(address)) {
        throw new Error('Cannot import directly from Bitcoin address. Requires private key.');
      }
      if (bip39.validateMnemonic(address)) {
        return await this.importAccountFromMnemonic(address, network);
      }

      return await this.importAccountFromPrivateKey(address, network);
    } catch (error: any) {
      throw new Error(`Error importing account: ${error.message}`);
    }
  }

  async importAccountFromPrivateKey(
    privateKey: string,
    network: bitcoin.Network
  ): Promise<{ address: string; privateKey: string }> {
    try {
      const keyPair = ECPair.fromWIF(privateKey, network);
      const { address } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network,
      });

      return {
        address: address!,
        privateKey: keyPair.toWIF(),
      };
    } catch (error: any) {
      throw new Error(`Error importing account from private key: ${error.message}`);
    }
  }

  async importAccountFromMnemonic(mnemonic: string, network: bitcoin.Network): Promise<{ address: string; privateKey: string; mnemonic: string }> {
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
        address: address!,
        privateKey,
        mnemonic,
      };
    } catch (error: any) {
      throw new Error(`Error importing account from mnemonic: ${error.message}`);
    }
  }

  private async getAddressInfo(address: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/v1/address/${address}?api_key=${this.apiKey}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Error fetching address info: ${error.message}`);
    }
  }

  private async getTransaction(hash: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/v1/transaction/${hash}?api_key=${this.apiKey}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Error fetching transaction: ${error.message}`);
    }
  }
}
