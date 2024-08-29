import { EthereumService, BitcoinService, MaticService } from 'blockchain-implementations';
export class BlockchainFactory {
    static instances = {};
    static getInstance(type, network) {
        if (!this.instances[type]) {
            switch (type) {
                case 'ethereum':
                    if (typeof network !== 'string' || !['mainnet', 'ropsten', 'rinkeby', 'goerli', 'kovan', 'sepolia', 'testnet'].includes(network)) {
                        throw new Error('Invalid Ethereum network');
                    }
                    this.instances[type] = new EthereumService(network);
                    break;
                case 'bitcoin':
                    // Assuming BitcoinService does not need a network parameter, adjust if needed
                    this.instances[type] = new BitcoinService();
                    break;
                case 'matic':
                    // Assuming BitcoinService does not need a network parameter, adjust if needed
                    this.instances[type] = new MaticService(network);
                    break;
                // Add more cases for other blockchains if needed
                default:
                    throw new Error('Unsupported blockchain type');
            }
        }
        return this.instances[type];
    }
}
