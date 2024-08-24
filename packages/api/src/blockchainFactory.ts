import { BlockchainService } from 'blockchain-interfaces';
import { EthereumService, BitcoinService, MaticService } from 'blockchain-implementations';

// Define possible network types for Ethereum and Bitcoin
type EthereumNetwork = 'mainnet' | 'ropsten' | 'rinkeby' | 'goerli' | 'kovan' | 'sepolia' | 'testnet';
type MaticNetwork = 'mainnet' | 'sepolia' | 'testnet';
type BitcoinNetwork = string; // Define Bitcoin network types as needed

export class BlockchainFactory {
    private static instances: { [key: string]: BlockchainService } = {};

    static getInstance(type: 'ethereum' | 'bitcoin' | 'matic', network: EthereumNetwork | BitcoinNetwork | MaticNetwork): BlockchainService {
        if (!this.instances[type]) {
            switch (type) {
                case 'ethereum':
                    if (typeof network !== 'string' || !['mainnet', 'ropsten', 'rinkeby', 'goerli', 'kovan', 'sepolia', 'testnet'].includes(network)) {
                        throw new Error('Invalid Ethereum network');
                    }
                    this.instances[type] = new EthereumService(network as EthereumNetwork);
                    break;

                case 'bitcoin':
                    // Assuming BitcoinService does not need a network parameter, adjust if needed
                    this.instances[type] = new BitcoinService();
                    break;

                case 'matic':
                    // Assuming BitcoinService does not need a network parameter, adjust if needed
                    this.instances[type] = new MaticService(network as MaticNetwork);
                    break;
                // Add more cases for other blockchains if needed

                default:
                    throw new Error('Unsupported blockchain type');
            }
        }
        return this.instances[type];
    }
}
