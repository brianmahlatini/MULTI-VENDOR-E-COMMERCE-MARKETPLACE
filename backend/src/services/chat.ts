import type { User } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { Types } from "mongoose";
import { prisma } from "../db/postgres.js";
import type { AuthRole } from "../middleware/auth.js";
import { ChatConversation, ChatMessage } from "../models/Chat.js";

type ChatUser = Pick<User, "id" | "name" | "username" | "email" | "role">;
type ChatActor = {
  userId: string;
  name?: string;
  username?: string;
  email?: string;
  role: AuthRole;
};

function displayName(user: ChatUser | ChatActor) {
  return user.name || user.username || user.email || "User";
}

export async function listChatContacts(currentUser: ChatActor) {
  const roleFilter: Prisma.UserWhereInput =
    currentUser.role === "ADMIN"
      ? {}
      : currentUser.role === "SELLER"
        ? { role: { in: ["ADMIN", "BUYER"] } }
        : { role: { in: ["ADMIN", "SELLER"] } };

  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUser.userId },
      ...roleFilter
    },
    orderBy: [{ role: "asc" }, { username: "asc" }],
    select: { id: true, name: true, username: true, email: true, role: true }
  });

  return users.map((user) => ({
    id: user.id,
    name: displayName(user),
    email: user.email,
    role: user.role
  }));
}

export async function listConversations(userId: string) {
  return ChatConversation.find({ participantIds: userId }).sort({ lastMessageAt: -1, updatedAt: -1 }).lean();
}

export async function findConversationForUser(conversationId: string, userId: string) {
  if (!Types.ObjectId.isValid(conversationId)) return undefined;
  return ChatConversation.findOne({ _id: conversationId, participantIds: userId });
}

export async function getOrCreateConversation(currentUser: ChatActor, recipientId: string) {
  if (recipientId === currentUser.userId) {
    throw new Error("Choose another account to chat with.");
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, name: true, username: true, email: true, role: true }
  });

  if (!recipient) {
    throw new Error("Chat recipient was not found.");
  }

  const participantIds = [currentUser.userId, recipient.id].sort();
  const existing = await ChatConversation.findOne({ participantIds: { $all: participantIds, $size: participantIds.length } });
  if (existing) return existing;

  return ChatConversation.create({
    participantIds,
    participants: [
      { userId: currentUser.userId, name: displayName(currentUser), role: currentUser.role },
      { userId: recipient.id, name: displayName(recipient), role: recipient.role }
    ],
    lastMessageAt: new Date()
  });
}

export async function listMessages(conversationId: string, userId: string) {
  const conversation = await findConversationForUser(conversationId, userId);
  if (!conversation) return undefined;
  return ChatMessage.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(100).lean();
}

export async function createChatMessage({
  body,
  conversationId,
  user
}: {
  body: string;
  conversationId: string;
  user: ChatUser | ChatActor;
}) {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }

  const senderId = "userId" in user ? user.userId : user.id;
  const conversation = await findConversationForUser(conversationId, senderId);
  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  const message = await ChatMessage.create({
    conversationId: conversation._id,
    senderId,
    senderName: displayName(user),
    senderRole: user.role,
    body: trimmed.slice(0, 2000)
  });

  conversation.lastMessage = message.body;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  return message;
}
