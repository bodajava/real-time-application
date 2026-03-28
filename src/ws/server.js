import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcject.js";

// Map to track which sockets are subscribed to which matchId
const matchSubscribers = new Map();

/**
 * Adds a socket to a match subscription list.
 */
function subscribe(matchId, socket) {
  const id = String(matchId);
  if (!matchSubscribers.has(id)) {
    matchSubscribers.set(id, new Set());
  }

  matchSubscribers.get(id).add(socket);
  socket.subscriptions.add(id);
}

/**
 * Removes a socket from a match subscription list.
 */
function unsubscribe(matchId, socket) {
  const id = String(matchId);
  const subscribers = matchSubscribers.get(id);
  
  if (subscribers) {
    subscribers.delete(socket);
    if (subscribers.size === 0) {
      matchSubscribers.delete(id);
    }
  }
  socket.subscriptions.delete(id);
}

/**
 * Cleans up all subscriptions for a socket on disconnect.
 */
function cleanupSubscriptions(socket) {
  for (const matchId of socket.subscriptions) {
    unsubscribe(matchId, socket);
  }
}

/**
 * Sends a JSON payload to a single socket.
 */
export function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

/**
 * Broadcasts a JSON payload to every connected client.
 */
export function broadcastToAll(wss, payload) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

/**
 * Broadcasts a payload to all sockets subscribed to a specific match.
 */
function broadcastToMatch(matchId, payload) {
  const id = String(matchId);
  const subscribers = matchSubscribers.get(id);

  if (!subscribers || subscribers.size === 0) return;

  const message = JSON.stringify(payload);
  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

const heartbeat = function () {
  this.isAlive = true;
};

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    noServer: true,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  server.on("upgrade", async (req, socket, head) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    if (pathname === "/ws") {
      try {
        const decision = await wsArcjet.protect(req);

        if (decision.isDenied()) {
          const isRateLimit = decision.reason?.isRateLimit();
          const statusCode = isRateLimit ? 429 : 403;
          const statusText = isRateLimit ? "Too Many Requests" : "Forbidden";

          socket.write(`HTTP/1.1 ${statusCode} ${statusText}\r\nConnection: close\r\n\r\n`);
          socket.destroy();
          return;
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit("connection", ws, req);
        });
      } catch (error) {
        console.error("WS Upgrade Security Error:", error);
        socket.write("HTTP/1.1 500 Internal Server Error\r\nConnection: close\r\n\r\n");
        socket.destroy();
      }
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (socket) => {
    socket.isAlive = true;
    socket.subscriptions = new Set();
    
    socket.on("pong", heartbeat);
    
    socket.on("message", (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage);
        
        if (message.type === "subscribe" && message.matchId) {
          subscribe(message.matchId, socket);
          sendJson(socket, { type: "subscribed", matchId: message.matchId });
        } else if (message.type === "unsubscribe" && message.matchId) {
          unsubscribe(message.matchId, socket);
          sendJson(socket, { type: "unsubscribed", matchId: message.matchId });
        }
      } catch (e) {
        console.error("Failed to parse WS message:", e);
        sendJson(socket, { type: "error", message: "Invalid JSON format" });
      }
    });

    socket.on("error", (err) => {
      console.error("WebSocket socket error:", err);
      socket.terminate();
    });

    socket.on("close", () => {
      cleanupSubscriptions(socket);
    });

    sendJson(socket, { type: "welcome" });
  });

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

  // Global events
  function broadcastMatchCreated(match) {
    broadcastToAll(wss, { type: "match-created", data: match });
  }

  // Topic-specific events
  function broadcastCommentary(matchId, commentary) {
    broadcastToMatch(matchId, { type: "commentary-added", data: commentary });
  }

  return { broadcastMatchCreated, broadcastCommentary };
}
