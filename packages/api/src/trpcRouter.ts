import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { BlockchainFactory } from './blockchainFactory';  // Adjust the path as needed

// Initialize tRPC
const t = initTRPC.create();

// Create the router using `initTRPC`
export const trpcRouter = t.router({
    getBalance: t.procedure
        .input(z.object({
            type: z.string(),
            address: z.string()
        }).nullish())
        .query(async ({ input }: { input: any }) => {
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin');  // Default to 'bitcoin' if type is not provided
            return await blockchainService.getBalance(input?.address || '');
        }),

    createAccount: t.procedure
        .input(z.object({
            type: z.string(),
            networkType: z.string()
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin');  // Default to 'bitcoin' if type is not provided
            return await blockchainService.createAccount(input?.networkType);
        }),

     importAccount : t.procedure
        .input(z.object({
            type: z.string(),
            address: z.string(),
            networkType: z.string(),  // Make network optional if not required for all blockchains
        }))
        .mutation(async ({ input }: { input: { type: string; address: string; networkType: string } }) => {
            const { type, address, networkType } = input;

            // Get the blockchain service instance based on the type
            const blockchainService = BlockchainFactory.getInstance(type);

            // Import the account using the provided address and network
            // Assume `importAccount` is a method in your BlockchainService interface
            return await blockchainService.importAccount(address, networkType);
        }),

    generateDepositAddress: t.procedure
        .input(z.object({
            type: z.string(),
            xPub: z.string(),
            index: z.number(),
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin');  // Default to 'bitcoin' if type is not provided
            return await blockchainService.generateDepositAddress(input?.xPub || '', input?.index || 0);
        }),

    generatePrivateKey: t.procedure
        .input(z.object({
            type: z.string(),
            mnemonic: z.string(),
            index: z.number(),
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin');  // Default to 'bitcoin' if type is not provided
            return await blockchainService.generatePrivateKey(input?.mnemonic || '', input?.index || 0);
        }),

    getTransactionDetails: t.procedure
        .input(z.object({
            type: z.string(),
            hash: z.string()
        }).nullish())
        .query(async ({ input }: { input: any }) => {
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin');  // Default to 'bitcoin' if type is not provided
            return await blockchainService.getTransactionDetails(input?.hash || '');
        }),

    getTransactions: t.procedure
        .input(z.object({
            type: z.string(),
            address: z.string()
        }).nullish())
        .query(async ({ input }: { input: any }) => {
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin');  // Default to 'bitcoin' if type is not provided
            return await blockchainService.getTransactions(input?.address || '');
        }),

    sendTransaction: t.procedure
        .input(z.object({
            type: z.string(),
            fromAddress: z.string(),
            privateKey: z.string(),
            toAddress: z.string(),
            amount: z.number(),
        }).nullish())
        .mutation(async ({ input }: { input: any }) => {
            const blockchainService = BlockchainFactory.getInstance(input?.type || 'bitcoin');  // Default to 'bitcoin' if type is not provided
            return await blockchainService.sendTransaction(
                input?.fromAddress || '',
                input?.privateKey || '',
                input?.toAddress || '',
                input?.amount || 0
            );
        }),



});
