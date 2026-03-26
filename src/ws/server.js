import { WebSocket, WebSocketServer } from "ws";

export async function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
}

export async function broadcast(wss, payload) {
    // Fixed: wss.clients (with 's') and checking client.readyState correctly
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    }
}

export function attachWebSocketServer(server) {
    // Fixed: added 'new' keyword to WebSocketServer
    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024,
    });

    wss.on('connection', (socket) => {
        // Fixed spelling: welecom -> welcome
        sendJson(socket, { type: "welcome" });
        socket.on('error', console.error);
    });
    
    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'match-created', data: match });
    }

    return { broadcastMatchCreated };
}