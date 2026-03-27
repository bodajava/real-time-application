import { WebSocket, WebSocketServer } from "ws";

export async function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
}

export async function broadcast(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    }
}

function heartbeat() {
    this.isAlive = true;
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024 // 1MB max payload for safety and speed
    });

    wss.on('connection', (socket) => {
        // Initialize keep-alive
        socket.isAlive = true;
        socket.on('pong', heartbeat);
        
        sendJson(socket, { type: "welcome" });
        socket.on('error', console.error);
    });

    // Ping every 30 seconds to keep connections alive and ultra-fast
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(interval);
    });
    
    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'match-created', data: match });
    }

    return { broadcastMatchCreated };
}