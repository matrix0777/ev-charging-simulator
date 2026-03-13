// Vite exposes env vars prefixed with VITE_; fallback to Render for production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ev-charging-simulator-1.onrender.com/api';

/** Get WebSocket URL from API base (e.g. http://localhost:8000/api -> ws://localhost:8000/ws) */
export function getWebSocketUrl() {
  const url = new URL(API_BASE_URL);
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${url.host}/ws`;
}

export { API_BASE_URL };

export const apiService = {
  // Get network data
  async getNetwork() {
    const response = await fetch(`${API_BASE_URL}/network`);
    return await response.json();
  },

  // Get recommendations
  async getRecommendations() {
    const response = await fetch(`${API_BASE_URL}/recommendations`);
    return await response.json();
  },

  // Chat with AI
  async chat(query) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    return await response.json();
  },
};

// WebSocket service
export class WebSocketService {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    this.socket = new WebSocket(this.url);
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.emit('connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}