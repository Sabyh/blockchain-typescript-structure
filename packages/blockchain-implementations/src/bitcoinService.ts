import { BlockchainService } from 'blockchain-interfaces';
import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
const ECPairFactory = require('ecpair').default;

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
}
