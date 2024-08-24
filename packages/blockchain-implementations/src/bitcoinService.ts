import { BlockchainService } from 'blockchain-interfaces';
import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
const ECPairFactory = require('ecpair').default;


// const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

export class BitcoinService implements BlockchainService {
  getBalance(address: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  generateDepositAddress(xPub: string, index: number): Promise<string> {
    throw new Error('Method not implemented.');
  }
  generatePrivateKey(mnemonic: string, index: number): Promise<string> {
    throw new Error('Method not implemented.');
  }
  getTransactionDetails(hash: string): Promise<any> {
    throw new Error('Method not implemented.');
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
      // Generate a random mnemonic (12-word phrase)
      const mnemonic = bip39.generateMnemonic();

      // Convert mnemonic to seed (as a Buffer)
      const seed = bip39.mnemonicToSeedSync(mnemonic);

      // Create a root keypair from the seed using bitcoinjs-lib
      const root = bip32.fromSeed(seed, network);

      // Derive the first account's private key and address using BIP44 standard
      const account = root.derivePath("m/44'/0'/0'/0/0");

      // Get the private key in WIF (Wallet Import Format)
      const privateKey = account.toWIF();

      // Get the public key and derive the address
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
      // Check if input is a valid Bitcoin address
      if (await this.isBitcoinAddress(address)) {
        throw new Error('Cannot import directly from Bitcoin address. Requires private key.');
      }
      // Check if input is a valid mnemonic phrase
      if (bip39.validateMnemonic(address)) {
        return await this.importAccountFromMnemonic(address, network);
      }

      // If input is neither address nor mnemonic, assume it's a private key
      return await this.importAccountFromPrivateKey(address, network);

    } catch (error: any) {
      throw new Error(`Error importing account: ${error.message}`);
    }
  }

  async importAccountFromPrivateKey(
    privateKey: string,
    networkType: any
  ): Promise<{ address: string; privateKey: string }> {
    try {
      const network = networkType === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
      // Import the key pair from the given private key
      const keyPair = ECPair.fromWIF(privateKey, network);

      // Generate the address from the public key
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

  async importAccountFromMnemonic(mnemonic: string, networkType: any): Promise<{ address: string; privateKey: string; mnemonic: string }> {
    try {
      const network = networkType === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
      // Validate the mnemonic
      console.log('mnemonic', mnemonic);
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Convert mnemonic to seed
      const seed = bip39.mnemonicToSeedSync(mnemonic);

      // Create root from seed using BIP32
      const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);

      // Derive the account path using BIP44 for Bitcoin
      const path = `m/44'/0'/0'/0/0`;
      const account = root.derivePath(path);

      // Extract the private key in WIF format
      const privateKey = account.toWIF();

      // Generate the public address
      const { address } = bitcoin.payments.p2pkh({
        pubkey: account.publicKey,
        network: bitcoin.networks.bitcoin,
      });

      return {
        address: address!,
        privateKey: privateKey,
        mnemonic: mnemonic
      };
    } catch (error: any) {
      throw new Error(`Error importing account from mnemonic: ${error.message}`);
    }
  }

}
