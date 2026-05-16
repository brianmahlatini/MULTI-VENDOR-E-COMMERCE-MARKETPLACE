import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { createChatMessage, getOrCreateConversation, listChatContacts, listConversations, listMessages } from "../services/chat.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.get("/contacts", async (req, res) => {
  res.json(await listChatContacts(req.marketplaceAuth!));
});

chatRouter.get("/conversations", async (req, res) => {
  res.json(await listConversations(req.marketplaceAuth!.userId));
});

chatRouter.post("/conversations", async (req, res, next) => {
  try {
    const body = z.object({ recipientId: z.string().min(1) }).parse(req.body);
    res.status(201).json(await getOrCreateConversation(req.marketplaceAuth!, body.recipientId));
  } catch (error) {
    next(error);
  }
});

chatRouter.get("/conversations/:id/messages", async (req, res) => {
  const messages = await listMessages(req.params.id, req.marketplaceAuth!.userId);
  if (!messages) return res.status(404).json({ message: "Conversation not found" });
  res.json(messages);
});

chatRouter.post("/conversations/:id/messages", async (req, res, next) => {
  try {
    const body = z.object({ body: z.string().trim().min(1).max(2000) }).parse(req.body);
    res.status(201).json(await createChatMessage({ conversationId: req.params.id, body: body.body, user: req.marketplaceAuth! }));
  } catch (error) {
    next(error);
  }
});
