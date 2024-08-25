import { ethers, JsonRpcProvider } from 'ethers';
import { contractABI } from './contractAbi';

// Replace with your contract details
const contractAddress = '0xb5489789D66D83cC0CFae950Cf8Ef8381B9E2f77';
const provider = new JsonRpcProvider('https://go.getblock.io/e91b729a43df4beab0bfa681bc6bd000');

const contract = new ethers.Contract(contractAddress, contractABI, signer);


export class AgreementFactory {
    // Store Agreement
    async storeAgreement(
        agreementType: number,
        agreementNo: string,
        clientName: string,
        partyName: string,
        agreementDate: number,
        expiryDate: number,
        ipfsHash: string
    ) {
        const tx = await contract.storeAgreement(
            agreementType,
            agreementNo,
            clientName,
            partyName,
            agreementDate,
            expiryDate,
            ipfsHash
        );
        await tx.wait();
        console.log('Agreement stored!');
    }

    // Update Agreement
    async updateAgreement(
        agreementNo: string,
        clientName: string,
        partyName: string,
        expiryDate: number,
        ipfsHash: string
    ) {
        const tx = await contract.updateAgreement(
            agreementNo,
            clientName,
            partyName,
            expiryDate,
            ipfsHash
        );
        await tx.wait();
        console.log('Agreement updated!');
    }

    // Cancel Agreement
    async cancelAgreement(agreementNo: string) {
        const tx = await contract.cancelAgreement(agreementNo);
        await tx.wait();
        console.log('Agreement cancelled!');
    }

    // Get Agreement
    async getAgreement(agreementNo: string) {
        const agreement = await contract.getAgreement(agreementNo);
        console.log('Agreement details:', agreement);
    }

    // Delete Agreement
    async deleteAgreement(agreementNo: string) {
        const tx = await contract.deleteAgreement(agreementNo);
        await tx.wait();
        console.log('Agreement deleted!');
    }

}