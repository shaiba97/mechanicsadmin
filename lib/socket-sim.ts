export type SocketStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export type SocketOrder = {
  id: string;
  status: string;
  totalSar: number;
};

export type SocketFeed = {
  status: SocketStatus;
  orders: SocketOrder[];
};

const MAX_STREAM_ORDERS = 15;

type SocketListener = () => void;

const listeners = new Set<SocketListener>();

let feed: SocketFeed = { status: "connecting", orders: [] };

let socketUrl: string | undefined = process.env.NEXT_PUBLIC_SOCKET_URL;

let started = false;

function record(partial: Partial<SocketFeed>): void {
  feed = { ...feed, ...partial };
  listeners.forEach((notify) => notify());
}

export function getSocketSnapshot(): SocketFeed {
  return feed;
}

const SERVER_SNAPSHOT: SocketFeed = { status: "connecting", orders: [] };

export function getServerSocketSnapshot(): SocketFeed {
  return SERVER_SNAPSHOT;
}

export function subscribeSocket(listener: SocketListener): () => void {
  listeners.add(listener);
  ensureSocketSim();
  return () => listeners.delete(listener);
}

export function configureSocketUrl(url: string | undefined): void {
  socketUrl = url;
}

async function connectRealSocket(url: string): Promise<void> {
  const { io } = await import("socket.io-client");
  const socket = io(url, { transports: ["websocket"] });
  socket.on("connect", () => record({ status: "connected" }));
  socket.on("disconnect", () => record({ status: "disconnected" }));
  socket.on("reconnect_attempt", () => record({ status: "reconnecting" }));
  socket.on("order:new", (order: SocketOrder) =>
    record({ orders: [order, ...feed.orders].slice(0, MAX_STREAM_ORDERS) }),
  );
}

export function ensureSocketSim(): void {
  if (started) return;
  started = true;
  if (socketUrl) {
    void connectRealSocket(socketUrl);
    return;
  }
  record({ status: "connected" });
}