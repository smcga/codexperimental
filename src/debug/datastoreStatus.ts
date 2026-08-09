export type DatastoreDebugTone = "info" | "warn" | "error";

type DatastoreDebugEntry = {
  message: string;
  tone: DatastoreDebugTone;
  timestamp: number;
};

type DatastoreDebugListener = (entries: DatastoreDebugEntry[]) => void;

const MAX_ENTRIES = 5;
const DEDUPE_WINDOW_MS = 1200;

let enabled = false;
let entries: DatastoreDebugEntry[] = [];
let listeners: DatastoreDebugListener[] = [];

function emit(): void {
  listeners.forEach((listener) => listener(entries));
}

export function setDatastoreDebugEnabled(next: boolean): void {
  enabled = next;
  if (enabled) {
    emit();
  }
}

export function resetDatastoreDebugMessages(): void {
  entries = [];
  emit();
}

export function pushDatastoreDebugMessage(message: string, tone: DatastoreDebugTone = "info"): void {
  if (!enabled) {
    return;
  }
  const trimmed = message.trim();
  if (!trimmed) {
    return;
  }
  const now = Date.now();
  const last = entries[entries.length - 1];
  if (last && last.message === trimmed && now - last.timestamp < DEDUPE_WINDOW_MS) {
    return;
  }
  entries = [...entries, { message: trimmed.slice(0, 88), tone, timestamp: now }].slice(-MAX_ENTRIES);
  emit();
}

export function subscribeDatastoreDebugMessages(listener: DatastoreDebugListener): () => void {
  listeners = [...listeners, listener];
  listener(entries);
  return () => {
    listeners = listeners.filter((candidate) => candidate !== listener);
  };
}
