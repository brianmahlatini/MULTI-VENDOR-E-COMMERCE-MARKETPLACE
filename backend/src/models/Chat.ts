import mongoose, { Schema } from "mongoose";

const ParticipantSchema = new Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["BUYER", "SELLER", "ADMIN"], required: true }
  },
  { _id: false }
);

const ChatConversationSchema = new Schema(
  {
    participantIds: [{ type: String, index: true, required: true }],
    participants: [ParticipantSchema],
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date }
  },
  { timestamps: true }
);

const ChatMessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, index: true, required: true },
    senderId: { type: String, index: true, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ["BUYER", "SELLER", "ADMIN"], required: true },
    body: { type: String, maxlength: 2000, required: true }
  },
  { timestamps: true }
);

ChatConversationSchema.index({ participantIds: 1, lastMessageAt: -1 });
ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const ChatConversation = mongoose.model("ChatConversation", ChatConversationSchema);
export const ChatMessage = mongoose.model("ChatMessage", ChatMessageSchema);
