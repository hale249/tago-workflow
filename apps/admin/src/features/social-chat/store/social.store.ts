import { create } from "zustand"
import { persist } from "zustand/middleware"

import { defaultSettings, SEED_CONNECTIONS, SEED_CONVERSATIONS, SEED_MESSAGES, SEED_PAGES } from "../data/seed"
import type { Channel, ChannelPage, ChannelSettings, Connection, Conversation, Message } from "../types/social"

type State = {
  connections: Connection[]
  pages: ChannelPage[]
  conversations: Conversation[]
  messages: Message[]
  /** One shared settings object for the unified inbox (labels, templates, assignees, linked table). */
  settings: ChannelSettings
  send: (conversationId: string, text: string, authorId: string) => void
  markRead: (conversationId: string) => void
  updateConversation: (id: string, patch: Partial<Conversation>) => void
  saveSettings: (s: ChannelSettings) => void
}

/** Channel of a conversation's page (page → connection → channel). */
export const channelOfPage = (s: Pick<State, "pages" | "connections">, pageId: string): Channel | undefined =>
  s.connections.find((c) => c.id === s.pages.find((p) => p.id === pageId)?.connectionId)?.channel

/** Local stand-in for the Social Chat backend (conversations, messages, per-channel settings). */
export const useSocialStore = create<State>()(
  persist(
    (set) => ({
      connections: SEED_CONNECTIONS,
      pages: SEED_PAGES,
      conversations: SEED_CONVERSATIONS,
      messages: SEED_MESSAGES,
      settings: defaultSettings(),
      send: (conversationId, text, authorId) =>
        set((s) => {
          const at = new Date().toISOString()
          return {
            messages: [...s.messages, { id: `m_${Date.now().toString(36)}`, conversationId, from: "agent", authorId, text, at }],
            conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, lastMessageAt: at } : c)),
          }
        }),
      markRead: (id) => set((s) => ({ conversations: s.conversations.map((c) => (c.id === id && c.unread ? { ...c, unread: 0 } : c)) })),
      updateConversation: (id, patch) => set((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      saveSettings: (settings) => set({ settings }),
    }),
    { name: "tago-social-chat", version: 3, migrate: () => ({ connections: SEED_CONNECTIONS, pages: SEED_PAGES, conversations: SEED_CONVERSATIONS, messages: SEED_MESSAGES, settings: defaultSettings() }) as never, partialize: ({ connections, pages, conversations, messages, settings }) => ({ connections, pages, conversations, messages, settings }) },
  ),
)

/** Conversations with unread messages (sidebar badge). */
export const useUnreadChats = () => useSocialStore((s) => s.conversations.filter((c) => c.unread > 0).length)
