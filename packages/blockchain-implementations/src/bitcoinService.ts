import { BlockchainService } from 'blockchain-interfaces';
import https from 'https';

export class BitcoinService implements BlockchainService {
    async getBalance(address: string): Promise<number> {
        return this.makeRequest(`/v3/bitcoin/address/balance/${address}`);
    }

    async createAccount(): Promise<any> {
        return this.makeRequest('/v3/bitcoin/wallet');
    }

    async generateDepositAddress(xPub: string, index: number): Promise<string> {
        return this.makeRequest(`/v3/bitcoin/address/${xPub}/${index}`);
    }

    async generatePrivateKey(mnemonic: string, index: number): Promise<string> {
        const options = { index, mnemonic };
        return this.makeRequest('/v3/bitcoin/wallet/priv', options, 'POST');
    }

    async getTransactionDetails(hash: string): Promise<any> {
        return this.makeRequest(`/v3/bitcoin/transaction/${hash}`);
    }

    async getTransactions(address: string): Promise<any> {
        return this.makeRequest(`/v3/bitcoin/transaction/address/${address}?pageSize=50&offset=0`);
    }

    async sendTransaction(fromAddress: string, privateKey: string, toAddress: string, amount: number): Promise<string> {
        const options = {
            fromAddress: [{ address: fromAddress, privateKey }],
            to: [{ address: toAddress, value: amount }]
        };
        return this.makeRequest('/v3/bitcoin/transaction', options, 'POST');
    }

    private makeRequest(path: string, data?: any, method: string = 'GET'): Promise<any> {
        return new Promise((resolve, reject) => {
            const options = {
                method,
                hostname: 'api-eu1.tatum.io',
                path,
                headers: {
                    'content-type': 'application/json',
                    'x-api-key': process.env.TATUM_API_KEY || ''
                }
            };

            const req = https.request(options, (res) => {
                let chunks: any[] = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks).toString()));
            });

            req.on('error', (err) => reject(err));

            if (method === 'POST' && data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }
}
