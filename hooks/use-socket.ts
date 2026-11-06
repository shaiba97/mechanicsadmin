"use client";

import * as React from "react";
import type { SocketOrder, SocketStatus } from "@/lib/socket-sim";
import {
  getServerSocketSnapshot,
  getSocketSnapshot,
  subscribeSocket,
} from "@/lib/socket-sim";

// Mirrors the socket.io client surface (on / connect / disconnect).
// Source: https://socket.io/docs/v4/client-api/

export function useSocketFeed(): { status: SocketStatus; orders: SocketOrder[] } {
  return React.useSyncExternalStore(
    subscribeSocket,
    getSocketSnapshot,
    getServerSocketSnapshot,
  );
}

export function useSocketStatus(): SocketStatus {
  return React.useSyncExternalStore(subscribeSocket, getSocketSnapshot, getServerSocketSnapshot)
    .status;
}