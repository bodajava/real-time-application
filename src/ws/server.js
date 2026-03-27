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
  // Use noServer: true because we handle the upgrade manually for security
  const wss = new WebSocketServer({
    noServer: true,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  // Handle the HTTP upgrade manually
  server.on("upgrade", async (req, socket, head) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    if (pathname === "/ws") {
      try {
        const decision = await wsArcjet.protect(req);

        if (decision.isDenied()) {
          const isRateLimit = decision.reason?.isRateLimit();
          const statusCode = isRateLimit ? 429 : 403;
          const statusText = isRateLimit ? "Too Many Requests" : "Forbidden";

          // Write raw HTTP error before handshake
          socket.write(`HTTP/1.1 ${statusCode} ${statusText}\r\nConnection: close\r\n\r\n`);
          socket.destroy();
          return;
        }

        // If authorized, proceed with the upgrade
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit("connection", ws, req);
        });
      } catch (error) {
        console.error("WS Upgrade Security Error:", error);
        socket.write("HTTP/1.1 500 Internal Server Error\r\nConnection: close\r\n\r\n");
        socket.destroy();
      }
    } else {
      // If it's not the /ws path, destroy it or let something else handle it
      socket.destroy();
    }
  });

  wss.on("connection", (socket) => {
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