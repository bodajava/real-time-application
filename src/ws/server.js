import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcject.js";

export function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

export function broadcast(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  }
}

const heartbeat = function () {
  this.isAlive = true;
};

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", async (socket, req) => {
    // 🔐 Arcjet Protection
    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);

        if (decision.isDenied()) {
          const isRateLimit = decision.reason?.type === "RATE_LIMIT";

          const code = isRateLimit ? 1013 : 1008;
          const reason = isRateLimit
            ? "Rate limit exceeded"
            : "Access denied";

          socket.close(code, reason);
          return;
        }
      } catch (error) {
        console.error("WS Arcjet error:", error);
        socket.close(1011, "Server security error");
        return;
      }
    }

    // ❤️ heartbeat
    socket.isAlive = true;
    socket.on("pong", heartbeat);

    // 👋 welcome
    sendJson(socket, { type: "welcome" });

    socket.on("error", console.error);
  });

  // 🔄 keep alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  // 📡 broadcast function
  function broadcastMatchCreated(match) {
    broadcast(wss, {
      type: "match-created",
      data: match,
    });
  }

  return { broadcastMatchCreated };
}