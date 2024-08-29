/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Request, Response } from 'express';
import multer from 'multer';
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { MemoryBlockstore } from 'blockstore-core';

// Set up multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Define the function to handle file uploads
export async function handleFileUpload(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).send('No file uploaded');
    return;
  }

  const pdfBuffer = req.file.buffer;
  const path = req.body.path || 'example.pdf';

  try {
    const cid = await uploadPDFWithHelia(pdfBuffer, path);
    res.json({ cid });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file');
  }
}

// Function to upload PDF with Helia
export async function uploadPDFWithHelia(pdfBuffer: Uint8Array, path = 'example.pdf'): Promise<string> {
  const blockstore = new MemoryBlockstore();
  const _helia: any = await createHelia({ blockstore });
  const fsHelia: any = unixfs(_helia);
  const cid = await fsHelia.addFile({
    path: path,
    content: pdfBuffer,
  });

  console.log('PDF uploaded to IPFS with CID:', cid.toString());
  return cid.toString();
}

export { upload };
