type WsHandler = (data: unknown) => void

class WsClient {
  private ws: WebSocket | null = null
  private handlers: Map<string, WsHandler[]> = new Map()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  connect() {
    const url = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
    this.ws = new WebSocket(url)

    this.ws.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data as string) as { event: string; data: unknown }
        this.handlers.get(event)?.forEach((h) => h(data))
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(), 3000)
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }

  on(event: string, handler: WsHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, [])
    this.handlers.get(event)!.push(handler)
  }

  off(event: string, handler: WsHandler) {
    const list = this.handlers.get(event)
    if (list) this.handlers.set(event, list.filter((h) => h !== handler))
  }
}

export const wsClient = new WsClient()
