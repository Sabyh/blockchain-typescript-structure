import { BlockchainService } from 'blockchain-interfaces';
import { EthereumService, BitcoinService } from 'blockchain-implementations';

export class BlockchainFactory {
    private static instances: { [key: string]: BlockchainService } = {};

    static getInstance(type: string): BlockchainService {
        if (!this.instances[type]) {
            switch (type) {
                case 'ethereum':
                    this.instances[type] = new EthereumService();
                    break;
                case 'bitcoin':
                    this.instances[type] = new BitcoinService();
                    break;
                // Add more cases for other blockchains
                default:
                    throw new Error('Unsupported blockchain type');
            }
        }
        return this.instances[type];
    }
}
