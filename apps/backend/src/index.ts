import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { trpcRouter } from 'api';

const app = express();
const port = 4000;

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
