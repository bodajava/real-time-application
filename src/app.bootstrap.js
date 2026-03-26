import express from 'express'
import { MatchesRouter } from './Module/index.js';
import { connectDB } from './db/connection.js';
import { globalErrorHandler } from './common/utils/index.js';
import http from 'http';
import { attachWebSocketServer } from './ws/server.js';

export const bootstrap = async () => {
    const app = express();
    const port = process.env.PORT || 8000;
    const host = process.env.HOST || '0.0.0.0';
    
    app.use(express.json());
    await connectDB();

    app.use('/matches', MatchesRouter);

    app.use(globalErrorHandler);

    const server = http.createServer(app);

    const { broadcastMatchCreated } = attachWebSocketServer(server);
    app.locals.broadcastMatchCreated = broadcastMatchCreated;

    app.use((req, res) => {
        return res.status(404).json({ message: "page not found" });
    });

    server.listen(port, host, () => {
        const baseUrl = host === '0.0.0.0' ? `http://localhost:${port}` : `http://${host}:${port}`;
        console.log(`server is running on ${baseUrl}`);
        console.log(`websocket server running on ${baseUrl.replace('http', 'ws')}/ws`);
    });
}
