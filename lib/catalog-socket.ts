import { API_URL } from "@/lib/api";

export type CatalogEntity = "brand" | "car" | "category";
export type CatalogAction = "created" | "updated" | "deleted";
export type SocketConnection = "connecting" | "connected" | "disconnected";

export type CatalogEvent = {
  type: "catalog.event";
  entity: CatalogEntity;
  action: CatalogAction;
  data: unknown;
};

function isCatalogEvent(value: unknown): value is CatalogEvent {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CatalogEvent>;
  if (candidate.type !== "catalog.event") return false;
  if (
    candidate.entity !== "brand" &&
    candidate.entity !== "car" &&
    candidate.entity !== "category"
  ) {
    return false;
  }
  if (
    candidate.action !== "created" &&
    candidate.action !== "updated" &&
    candidate.action !== "deleted"
  ) {
    return false;
  }
  if (!candidate.data || typeof candidate.data !== "object") return false;
  const id = (candidate.data as { id?: unknown }).id;
  return typeof id === "string";
}

export function connectCatalogSocket(
  onEvent: (event: CatalogEvent) => void,
  onConnection: (connection: SocketConnection) => void,
): () => void {
  if (typeof window === "undefined" || typeof window.WebSocket === "undefined") {
    return () => {};
  }
  const wsUrl = `${API_URL.replace(/^http/, "ws")}/ws/catalog/`;
  let socket: WebSocket | null = null;
  let disposed = false;
  let attempts = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const open = () => {
    if (disposed) return;
    onConnection("connecting");
    socket = new WebSocket(wsUrl);
    socket.onopen = () => {
      attempts = 0;
      onConnection("connected");
    };
    socket.onmessage = (message) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(message.data));
      } catch {
        parsed = null;
      }
      if (isCatalogEvent(parsed)) onEvent(parsed);
    };
    socket.onclose = () => {
      onConnection("disconnected");
      if (disposed) return;
      attempts += 1;
      const delay = Math.min(1000 * 2 ** attempts, 15000);
      timer = setTimeout(open, delay);
    };
    socket.onerror = () => {
      socket?.close();
    };
  };

  open();

  return () => {
    disposed = true;
    if (timer !== undefined) clearTimeout(timer);
    socket?.close();
  };
}
