import { redirect } from "next/navigation";
import { ChatClient } from "@/components/ChatClient";
import { apiRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

type Me = { userId: string; role: "BUYER" | "SELLER" | "ADMIN"; email?: string; name?: string };
type Contact = { id: string; name: string; email: string; role: string };
type Conversation = {
  _id: string;
  participants: Array<{ userId: string; name: string; role: string }>;
  lastMessage?: string;
  lastMessageAt?: string;
};

export default async function ChatPage() {
  const me = await apiRequest<Me>("/auth/me");
  if (!me.data) redirect("/access");

  const [contacts, conversations] = await Promise.all([
    apiRequest<Contact[]>("/chat/contacts"),
    apiRequest<Conversation[]>("/chat/conversations")
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Messages</h1>
      <div className="mt-5">
        <ChatClient contacts={contacts.data ?? []} conversations={conversations.data ?? []} me={me.data} />
      </div>
    </main>
  );
}
