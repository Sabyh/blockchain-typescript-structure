"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.uploadPDFWithHelia = exports.handleFileUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const helia_1 = __importDefault(require("helia"));
const unixfs_1 = require("@helia/unixfs");
const blockstore_core_1 = require("blockstore-core");
// Set up multer for file uploads
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
exports.upload = upload;
// Define the function to handle file uploads
async function handleFileUpload(req, res) {
    if (!req.file) {
        res.status(400).send('No file uploaded');
        return;
    }
    const pdfBuffer = req.file.buffer;
    const path = req.body.path || 'example.pdf';
    try {
        const cid = await uploadPDFWithHelia(pdfBuffer, path);
        res.json({ cid });
    }
    catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Error uploading file');
    }
}
exports.handleFileUpload = handleFileUpload;
// Function to upload PDF with Helia
async function uploadPDFWithHelia(pdfBuffer, path = 'example.pdf') {
    const blockstore = new blockstore_core_1.MemoryBlockstore();
    const _helia = await helia_1.default.createHelia({ blockstore });
    const fsHelia = (0, unixfs_1.unixfs)(_helia);
    const cid = await fsHelia.addFile({
        path: path,
        content: pdfBuffer,
    });
    console.log('PDF uploaded to IPFS with CID:', cid.toString());
    return cid.toString();
}
exports.uploadPDFWithHelia = uploadPDFWithHelia;
