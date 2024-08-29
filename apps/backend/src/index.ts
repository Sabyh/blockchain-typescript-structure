import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { trpcRouter } from 'api';  // Ensure 'api' exports 'trpcRouter'
import { handleFileUpload, upload } from './ipfs';

const app = express();
const port = 4000;

// Middleware for handling file uploads
// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.post('/upload', upload.single('file'), handleFileUpload);

// TRPC router setup
app.use(
  '/api',
  trpcExpress.createExpressMiddleware({
    router: trpcRouter,
    createContext: () => ({}),
  }),
);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
