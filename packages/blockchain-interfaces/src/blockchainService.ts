export interface BlockchainService {
    getBalance(address: string): Promise<number>;
    // sendTransaction(from: string, to: string, amount: number): Promise<string>;
    createAccount(): Promise<any>;
    generateDepositAddress(xPub: string, index: number): Promise<string>;
    generatePrivateKey(mnemonic: string, index: number): Promise<string>;
    getTransactionDetails(hash: string): Promise<any>;
    getTransactions(address: string): Promise<any>;
    sendTransaction(fromAddress: string, privateKey: string, toAddress: string, amount: number): Promise<string>;
}
