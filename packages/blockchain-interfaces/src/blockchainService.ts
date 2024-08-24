export interface BlockchainService {
    getBalance(address: string, network: string): Promise<number>;
    importAccount(address: string, network: string): Promise<any>;
    // sendTransaction(from: string, to: string, amount: number): Promise<string>;
    createAccount(networkType: string): Promise<any>;
    generateDepositAddress(xPub: string, index: number): Promise<string>;
    generatePrivateKey(mnemonic: string, index: number): Promise<string>;
    getTransactionDetails(hash: string, network: string): Promise<any>;
    getTransactions(address: string): Promise<any>;
    sendTransaction(fromAddress: string, privateKey: string, toAddress: string, amount: number): Promise<string>;
}
