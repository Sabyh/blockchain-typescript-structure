import { BlockchainService } from 'blockchain-interfaces';
import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
const ECPairFactory = require('ecpair').default;


// const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);
const network = bitcoin.networks.testnet; // Otherwise, bitcoin = mainnet and regnet = local

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

  async createAccount(): Promise<{ mnemonic: string, address: string, privateKey: string }> {
    try {
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

  private static isBitcoinAddress(address: string): boolean {
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

  public static async importAccount(input: string): Promise<any> {
    try {
      // Check if input is a valid Bitcoin address
      if (this.isBitcoinAddress(input)) {
        throw new Error('Cannot import directly from Bitcoin address. Requires private key.');
      }

      // Check if input is a valid mnemonic phrase
      if (bip39.validateMnemonic(input)) {
        return this.importAccountFromMnemonic(input);
      }

      // If input is neither address nor mnemonic, assume it's a private key
      return this.importAccountFromPrivateKey(input);

    } catch (error: any) {
      throw new Error(`Error importing account: ${error.message}`);
    }
  }

  private static async importAccountFromPrivateKey(
    privateKey: string
  ): Promise<{ address: string; privateKey: string }> {
    try {
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

  private static async importAccountFromMnemonic(mnemonic: string): Promise<{ address: string; privateKey: string; mnemonic: string }> {
    try {
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      const seed = bip39.mnemonicToSeedSync(mnemonic);
      const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
      const path = `m/44'/0'/0'/0/0`;
      const account = root.derivePath(path);
      const { address } = bitcoin.payments.p2pkh({
        pubkey: account.publicKey,
        network: bitcoin.networks.bitcoin,
      });

      return {
        address: address!,
        privateKey: account.toWIF(),
        mnemonic: mnemonic
      };
    } catch (error: any) {
      throw new Error(`Error importing account from mnemonic: ${error.message}`);
    }
  }
}
