import { ethers, JsonRpcProvider } from 'ethers';
// import { contractABI } from './contractAbi';
// Replace with your contract details
const contractAddress = '0xb5489789D66D83cC0CFae950Cf8Ef8381B9E2f77';
const provider = new JsonRpcProvider('https://go.getblock.io/e91b729a43df4beab0bfa681bc6bd000');
const contractABI = [];
const contract = new ethers.Contract(contractAddress, contractABI);
export class AgreementFactory {
    // Store Agreement
    async storeAgreement(agreementType, agreementNo, clientName, partyName, agreementDate, expiryDate, ipfsHash) {
        const tx = await contract.storeAgreement(agreementType, agreementNo, clientName, partyName, agreementDate, expiryDate, ipfsHash);
        await tx.wait();
        console.log('Agreement stored!');
    }
    // Update Agreement
    async updateAgreement(agreementNo, clientName, partyName, expiryDate, ipfsHash) {
        const tx = await contract.updateAgreement(agreementNo, clientName, partyName, expiryDate, ipfsHash);
        await tx.wait();
        console.log('Agreement updated!');
    }
    // Cancel Agreement
    async cancelAgreement(agreementNo) {
        const tx = await contract.cancelAgreement(agreementNo);
        await tx.wait();
        console.log('Agreement cancelled!');
    }
    // Get Agreement
    async getAgreement(agreementNo) {
        const agreement = await contract.getAgreement(agreementNo);
        console.log('Agreement details:', agreement);
    }
    // Delete Agreement
    async deleteAgreement(agreementNo) {
        const tx = await contract.deleteAgreement(agreementNo);
        await tx.wait();
        console.log('Agreement deleted!');
    }
}
