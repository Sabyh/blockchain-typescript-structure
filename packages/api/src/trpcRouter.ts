import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { BlockchainFactory } from './blockchainFactory';  // Adjust the path as needed
import { AgreementFactory } from './agreementHandler';  // Adjust the path as needed
// import { uploadPDFWithHelia } from './ipfsHandler.js';

// Initialize tRPC
const t = initTRPC.create();

// Create the router using `initTRPC`
export const trpcRouter = t.router({
    // Blockchain-related procedures
    getBalance: t.procedure
        .input(z.object({
            type: z.string(),
            address: z.string(),
            networkType: z.string().optional()  // Make networkType optional
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin', input?.networkType);  // Default to 'bitcoin' if type is not provided
            return await blockchainService.getBalance(input?.address || '', input?.networkType);
        }),

    createAccount: t.procedure
        .input(z.object({
            type: z.string(),
            networkType: z.string().optional()  // Make networkType optional
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin', input?.networkType);  // Default to 'bitcoin' if type is not provided
            return await blockchainService.createAccount(input?.networkType || '');
        }),

    importAccount: t.procedure
        .input(z.object({
            type: z.string(),
            address: z.string(),
            networkType: z.string().optional()  // Make networkType optional
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            const { type, address, networkType } = input;
            const blockchainService = BlockchainFactory.getInstance(type, networkType);
            return await blockchainService.importAccount(address, input?.networkType || '');
        }),

    generateDepositAddress: t.procedure
        .input(z.object({
            type: z.string(),
            xPub: z.string(),
            index: z.number()
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin', input?.networkType);
            return await blockchainService.generateDepositAddress(input?.xPub || '', input?.index || 0);
        }),

    generatePrivateKey: t.procedure
        .input(z.object({
            type: z.string(),
            mnemonic: z.string(),
            index: z.number()
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin', input?.networkType);
            return await blockchainService.generatePrivateKey(input?.mnemonic || '', input?.index || 0);
        }),

    getTransactionDetails: t.procedure
        .input(z.object({
            type: z.string(),
            hash: z.string(),
            networkType: z.string()
        }).refine(data => data.type && data.hash && data.networkType, {
            message: "Type and address are required"
        }))
        .mutation(async ({ input }: { input: any }) => {
            console.log('Getting transaction details for hash:', input);
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin', input?.networkType);  // Default to 'bitcoin' if type is not provided
            return await blockchainService.getTransactionDetails(input?.hash, input?.networkType);
        }),

    getTransactions: t.procedure
        .input(z.object({
            type: z.string(),
            address: z.string()
        }).nullish())
        .query(async ({ input }: { input: any }) => {
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin', input?.networkType);  // Default to 'bitcoin' if type is not provided
            return await blockchainService.getTransactions(input?.address || '');
        }),

    sendTransaction: t.procedure
        .input(z.object({
            type: z.string(),
            fromAddress: z.string(),
            privateKey: z.string(),
            toAddress: z.string(),
            amount: z.number()
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin', input?.networkType);  // Default to 'bitcoin' if type is not provided
            return await blockchainService.sendTransaction(
                input?.fromAddress || '',
                input?.privateKey || '',
                input?.toAddress || '',
                input?.amount || 0
            );
        }),

    // Agreement-related procedures
    createAgreement: t.procedure
        .input(z.object({
            agreementType: z.string(),  // e.g., 'ClientTenant', 'ClientLandlord'
            agreementNo: z.string(),
            clientName: z.string(),
            partyName: z.string(),
            agreementDate: z.number(),
            expiryDate: z.number(),
            ipfsHash: z.string()
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            const agreementInstance = new AgreementFactory();
            // Add your logic to create an agreement via your contract interaction
            await agreementInstance.storeAgreement(
                input?.agreementType,
                input?.agreementNo,
                input?.clientName,
                input?.partyName,
                input?.agreementDate,
                input?.expiryDate,
                input?.ipfsHash
            );
            return { success: true };
        }),

    updateAgreement: t.procedure
        .input(z.object({
            agreementNo: z.string(),
            clientName: z.string(),
            partyName: z.string(),
            expiryDate: z.number(),
            ipfsHash: z.string()
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            const agreementInstance = new AgreementFactory();
            await agreementInstance.updateAgreement(
                input?.agreementNo,
                input?.clientName,
                input?.partyName,
                input?.expiryDate,
                input?.ipfsHash
            );
            return { success: true };
        }),

    deleteAgreement: t.procedure
        .input(z.object({
            agreementNo: z.string()
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            // Add your logic to delete an agreement via your contract interaction
            const agreementInstance = new AgreementFactory();
            await agreementInstance.deleteAgreement(input?.agreementNo);
            return { success: true };
        }),

    getAgreement: t.procedure
        .input(z.object({
            agreementNo: z.string()
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            const agreementInstance = new AgreementFactory();
            // Add your logic to get an agreement via your contract interaction
            const agreement = await agreementInstance.getAgreement(input?.agreementNo);
            return agreement;
        }),
});