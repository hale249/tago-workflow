import { create } from "zustand"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"

import type { Attachment } from "../types/table"

/**
 * Mock file storage for ATTACHMENT fields: metadata + data URL per file, keyed by id.
 * Kept in IndexedDB (data URLs are too big for localStorage); falls back to memory.
 * Only `api/attachments.api.ts` writes here — components read with `useAttachmentsStore`.
 */
type AttachmentsState = { files: Record<string, Attachment> }

const DB_NAME = "tago-attachments"
const memory = new Map<string, string>()
let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore("kv")
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction("kv", mode).objectStore("kv"))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

const hasIdb = typeof indexedDB !== "undefined"
const storage: StateStorage = {
  getItem: (k) => (hasIdb ? run<string | undefined>("readonly", (s) => s.get(k)).then((v) => v ?? null).catch(() => memory.get(k) ?? null) : memory.get(k) ?? null),
  setItem: (k, v) => {
    memory.set(k, v)
    if (hasIdb) return run("readwrite", (s) => s.put(v, k)).then(() => undefined).catch(() => undefined)
  },
  removeItem: (k) => {
    memory.delete(k)
    if (hasIdb) return run("readwrite", (s) => s.delete(k)).then(() => undefined).catch(() => undefined)
  },
}

export const useAttachmentsStore = create<AttachmentsState>()(
  persist(() => ({ files: {} }), { name: "tago-attachments", version: 1, storage: createJSONStorage(() => storage) }),
)
