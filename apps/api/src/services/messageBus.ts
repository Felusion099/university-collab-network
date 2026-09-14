import { EventEmitter } from "node:events";

/**
 * In-process message event bus for SSE realtime delivery. sendMessage
 * emits; the stream endpoint subscribes per conversation. Single-node
 * deployment consistent with the project's Express stack — no new
 * dependency, no fake polling. Multi-node would swap this for Redis
 * pub/sub behind the same emit/subscribe interface.
 */
class MessageBus extends EventEmitter {
  publish(conversationId: string, message: unknown) {
    this.emit(`conversation:${conversationId}`, message);
  }

  subscribe(conversationId: string, handler: (message: unknown) => void) {
    const channel = `conversation:${conversationId}`;
    this.on(channel, handler);
    return () => this.off(channel, handler);
  }
}

export const messageBus = new MessageBus();
