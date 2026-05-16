"use client";

import { MessageCircle, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CLIENT_API_URL } from "@/lib/clientApi";

type Me = { userId: string; role: "BUYER" | "SELLER" | "ADMIN"; email?: string; name?: string };
type Contact = { id: string; name: string; email: string; role: string };
type Conversation = {
  _id: string;
  participants: Array<{ userId: string; name: string; role: string }>;
  lastMessage?: string;
  lastMessageAt?: string;
};
type ChatMessage = {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  body: string;
  createdAt: string;
};

function socketUrl(conversationId: string) {
  const url = new URL(CLIENT_API_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/chat";
  url.search = `?conversationId=${encodeURIComponent(conversationId)}`;
  return url.toString();
}

export function ChatClient({ contacts, conversations, me }: { contacts: Contact[]; conversations: Conversation[]; me: Me }) {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(conversations[0] ?? null);
  const [conversationList, setConversationList] = useState(conversations);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  const otherParticipant = useMemo(() => {
    if (!activeConversation) return undefined;
    return activeConversation.participants.find((participant) => participant.userId !== me.userId) ?? activeConversation.participants[0];
  }, [activeConversation, me.userId]);

  useEffect(() => {
    if (!activeConversation) return;

    let alive = true;
    setStatus("Connecting");
    fetch(`${CLIENT_API_URL}/chat/conversations/${activeConversation._id}/messages`, { credentials: "include" })
      .then((response) => response.json())
      .then((data: ChatMessage[]) => {
        if (alive) setMessages(data);
      })
      .catch(() => setStatus("Could not load messages."));

    const socket = new WebSocket(socketUrl(activeConversation._id));
    socketRef.current = socket;
    socket.onopen = () => setStatus("Online");
    socket.onclose = () => setStatus("Offline");
    socket.onerror = () => setStatus("Connection problem");
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { type: string; message?: ChatMessage };
      if (payload.type === "message" && payload.message) {
        setMessages((current) => (current.some((message) => message._id === payload.message!._id) ? current : [...current, payload.message!]));
        setConversationList((current) =>
          current.map((conversation) =>
            conversation._id === activeConversation._id
              ? { ...conversation, lastMessage: payload.message!.body, lastMessageAt: payload.message!.createdAt }
              : conversation
          )
        );
      }
    };

    return () => {
      alive = false;
      socket.close();
    };
  }, [activeConversation]);

  async function openConversation(contactId: string) {
    setStatus("");
    const response = await fetch(`${CLIENT_API_URL}/chat/conversations`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: contactId })
    });
    if (!response.ok) {
      setStatus("Could not open chat.");
      return;
    }
    const conversation = (await response.json()) as Conversation;
    setConversationList((current) => [conversation, ...current.filter((item) => item._id !== conversation._id)]);
    setActiveConversation(conversation);
  }

  async function sendMessage(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body || !activeConversation) return;

    setDraft("");
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "message", body }));
      return;
    }

    const response = await fetch(`${CLIENT_API_URL}/chat/conversations/${activeConversation._id}/messages`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body })
    });
    if (response.ok) {
      const message = (await response.json()) as ChatMessage;
      setMessages((current) => [...current, message]);
    } else {
      setStatus("Could not send message.");
    }
  }

  return (
    <div className="grid min-h-[70vh] overflow-hidden rounded-lg border border-line bg-white lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="border-b border-line lg:border-b-0 lg:border-r">
        <div className="border-b border-line p-4">
          <div className="flex items-center gap-2 font-bold">
            <MessageCircle className="h-5 w-5 text-brand" />
            Conversations
          </div>
          <p className="mt-1 text-sm text-slate-600">{me.role}</p>
        </div>
        <div className="max-h-72 overflow-auto border-b border-line lg:max-h-[calc(70vh-73px)]">
          {conversationList.map((conversation) => {
            const participant = conversation.participants.find((item) => item.userId !== me.userId) ?? conversation.participants[0];
            return (
              <button
                key={conversation._id}
                onClick={() => setActiveConversation(conversation)}
                className={`block w-full px-4 py-3 text-left text-sm hover:bg-slate-50 ${activeConversation?._id === conversation._id ? "bg-slate-100" : ""}`}
              >
                <span className="block font-semibold">{participant?.name ?? "Conversation"}</span>
                <span className="block truncate text-slate-600">{conversation.lastMessage || participant?.role}</span>
              </button>
            );
          })}
        </div>
        <div className="p-4">
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Start Chat</p>
          <div className="space-y-2">
            {contacts.map((contact) => (
              <button key={contact.id} onClick={() => openConversation(contact.id)} className="block w-full rounded-md border border-line px-3 py-2 text-left text-sm hover:border-brand">
                <span className="block font-semibold">{contact.name}</span>
                <span className="block text-xs text-slate-600">{contact.role}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
      <section className="flex min-h-[70vh] flex-col">
        <div className="border-b border-line p-4">
          <p className="font-bold">{otherParticipant?.name ?? "Choose a conversation"}</p>
          <p className="text-sm text-slate-600">{status || otherParticipant?.role}</p>
        </div>
        <div className="flex-1 space-y-3 overflow-auto bg-slate-50 p-4">
          {activeConversation ? (
            messages.map((message) => {
              const own = message.senderId === me.userId;
              return (
                <div key={message._id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${own ? "bg-brand text-white" : "border border-line bg-white text-ink"}`}>
                    <p>{message.body}</p>
                    <p className={`mt-1 text-xs ${own ? "text-white/75" : "text-slate-500"}`}>{message.senderName}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-600">Choose an account to start chatting.</p>
          )}
        </div>
        <form action={sendMessage} className="flex gap-2 border-t border-line p-3">
          <input
            name="body"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={!activeConversation}
            placeholder="Write a message"
            className="min-w-0 flex-1 rounded-md border border-line px-3 py-2 outline-none focus:border-brand disabled:bg-slate-100"
          />
          <button disabled={!activeConversation || !draft.trim()} className="focus-ring inline-flex items-center rounded-md bg-brand px-4 py-2 font-semibold text-white disabled:opacity-50">
            <Send className="mr-2 h-4 w-4" />
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
