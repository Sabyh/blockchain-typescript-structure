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
      type Network = 'mainnet' | 'testnet';  // Define the type for the network
      // Define the API endpoints for BlockCypher
      const BLOCKCYPHER_API_URLS: { [key in Network]: string } = {
        mainnet: `https://api.blockcypher.com/v1/btc/main/txs/${hash}`,
        testnet: `https://api.blockcypher.com/v1/btc/test3/txs/${hash}`
      };
      console.log('network:', network);
      const url = BLOCKCYPHER_API_URLS[network as Network];

      // Make the API request
      console.log('Fetching transaction details from:', url);
      const response = await axios.get(url);


      const data = response.data;

      // Convert amount from satoshis to BTC
      const formatAmount = (satoshis: number) => (satoshis / 1e8).toFixed(8);

      // Extract details
      const inputs = data.inputs.map((input: any) => ({
        address: input.addresses[0],
        value: formatAmount(input.output_value),
      }));

      const outputs = data.outputs.map((output: any) => ({
        address: output.addresses[0],
        value: formatAmount(output.value),
      }));

      return {
        txid: data.hash,
        version: data.version,
        locktime: data.lock_time,
        inputs,
        outputs,
        confirmations: data.confirmations,
        details: data
      };
    } catch (error: any) {
      console.log('Error getting transaction details:', error);
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
