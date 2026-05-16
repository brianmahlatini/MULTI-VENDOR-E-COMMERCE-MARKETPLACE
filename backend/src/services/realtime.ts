import type { Server } from "node:http";
import type { IncomingMessage } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { getSessionUser } from "../middleware/auth.js";
import { createChatMessage, findConversationForUser } from "./chat.js";

const rooms = new Map<string, Set<WebSocket>>();

function sendJson(socket: WebSocket, payload: unknown) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function joinRoom(conversationId: string, socket: WebSocket) {
  const sockets = rooms.get(conversationId) ?? new Set<WebSocket>();
  sockets.add(socket);
  rooms.set(conversationId, sockets);
}

function leaveRoom(conversationId: string, socket: WebSocket) {
  const sockets = rooms.get(conversationId);
  if (!sockets) return;
  sockets.delete(socket);
  if (sockets.size === 0) rooms.delete(conversationId);
}

function broadcast(conversationId: string, payload: unknown) {
  const sockets = rooms.get(conversationId);
  if (!sockets) return;
  for (const socket of sockets) sendJson(socket, payload);
}

export function attachRealtimeChat(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (request, socket, head) => {
    const url = new URL(request.url ?? "", "http://localhost");
    if (url.pathname !== "/ws/chat") return;

    const user = await getSessionUser(request.headers.cookie);
    const conversationId = url.searchParams.get("conversationId");
    const conversation = user && conversationId ? await findConversationForUser(conversationId, user.id) : undefined;

    if (!user || !conversationId || !conversation) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, { conversationId, user });
    });
  });

  wss.on("connection", (socket: WebSocket, _request: IncomingMessage, context: { conversationId: string; user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>> }) => {
    const { conversationId, user } = context;
    joinRoom(conversationId, socket);
    sendJson(socket, { type: "ready", conversationId });

    socket.on("message", async (data) => {
      try {
        const payload = JSON.parse(data.toString()) as { type?: string; body?: string };
        if (payload.type !== "message" || !payload.body) return;

        const message = await createChatMessage({ conversationId, body: payload.body, user });
        broadcast(conversationId, { type: "message", message });
      } catch (error) {
        sendJson(socket, { type: "error", message: error instanceof Error ? error.message : "Could not send message." });
      }
    });

    socket.on("close", () => leaveRoom(conversationId, socket));
  });
}
