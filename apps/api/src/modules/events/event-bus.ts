type Handler = (payload: any) => Promise<void>;

class EventBus {
  private listeners: Record<string, Handler[]> = {};

  on(event: string, handler: Handler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  async emit(event: string, payload: any) {
    const handlers = this.listeners[event] || [];

    for (const handler of handlers) {
      await handler(payload);
    }
  }
}

export const eventBus = new EventBus();
