import { supabase } from "../client";

// Send a message
export async function sendMessage({
  sender_id,
  receiver_id,
  content,
  message_type,
}: {
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: "video" | "image" | "text" | "post";
}) {
  const { data, error } = await supabase
    .from("messages")
    .insert([{ sender_id, receiver_id, content, message_type: message_type as "video" | "image" | "text" | "post" }])
    .single();
  return { data, error };
}

// Fetch messages between two users (ordered by time)
export async function fetchMessages({ user1, user2 }: { user1: string; user2: string }) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`
    )
    .order("created_at", { ascending: true });
  return { data, error };
}

// Subscribe to new messages between two users
export function subscribeToMessages({ user1, user2, onMessage }: { user1: string; user2: string; onMessage: (message: Record<string, unknown> & { id?: string; isDeleted?: boolean }) => void }) {
  const channel = supabase
    .channel("messages")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const msg = payload.new;
        if (
          (msg.sender_id === user1 && msg.receiver_id === user2) ||
          (msg.sender_id === user2 && msg.receiver_id === user1)
        ) {
          onMessage(msg);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const msgId = payload.old.id;
        onMessage({ id: msgId, isDeleted: true });
      }
    )
    .subscribe();
  return channel;
}

export async function fetchConversations(userId: string) {
  const { data, error } = await (supabase as any).rpc(
    "fetch_user_conversations_with_last_seen",
    {
      current_user_id: userId,
    }
  );

  return { data, error };
}

// Update a message
export async function updateMessage(messageId: string, content: string) {
  return supabase.from("messages").update({ content }).eq("id", messageId);
}

// Delete a message
export async function deleteMessage(messageId: string) {
  return supabase.from("messages").delete().eq("id", messageId);
}

// Upload file to Supabase Storage (returns public URL)
export async function uploadFile(file: File, userId: string, folder = "message-media"): Promise<string> {
  const fileExt = file.name.split(".").pop();
  if (!fileExt) throw new Error("File extension not found");
  const fileName = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}.${fileExt}`;
  const { data, error } = await supabase.storage
    .from(folder)
    .upload(fileName, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage
    .from(folder)
    .getPublicUrl(fileName);
  const publicUrl = urlData.publicUrl;
  if (!publicUrl) throw new Error("Failed to get public URL");
  return publicUrl;
}

export async function deleteConversationBetweenUsers(user1: string, user2: string) {
  const { error } = await supabase
    .from("messages")
    .delete()
    .or(
      `and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`
    );
  return { error };
}

export async function deleteMediaMessage(messageId: string, folder = "message-media") {
  const { data: message, error: fetchError } = await supabase
    .from("messages")
    .select("id, content, message_type")
    .eq("id", messageId)
    .single();

  if (fetchError) return { error: fetchError };

  if (!["image", "video"].includes(message.message_type || "")) {
    return { error: new Error("Not a media message") };
  }

  const publicUrl = message.content;
  if (!publicUrl) return { error: new Error("Message content is null") };
  const urlParts = publicUrl.split("/");
  const filePathIndex = urlParts.findIndex((part) => part === folder);
  if (filePathIndex === -1) return { error: new Error("Invalid file path") };

  const filePath = urlParts.slice(filePathIndex + 1).join("/");

  const { error: storageError } = await supabase.storage
    .from(folder)
    .remove([filePath]);

  if (storageError) return { error: storageError };

  const { error: deleteError } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);

  return { error: deleteError };
}
