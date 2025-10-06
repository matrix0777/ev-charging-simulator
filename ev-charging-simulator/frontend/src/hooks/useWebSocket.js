import { useState, useEffect, useRef } from 'react';
import { WebSocketService } from '../services/api';

export const useWebSocket = (url) => {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState(null);
  const wsService = useRef(null);

  useEffect(() => {
    wsService.current = new WebSocketService(url);
    
    wsService.current.on('connected', () => {
      setIsConnected(true);
    });

    wsService.current.on('disconnected', () => {
      setIsConnected(false);
    });

    wsService.current.on('message', (message) => {
      setData(message);
    });

    wsService.current.connect();

    return () => {
      if (wsService.current) {
        wsService.current.disconnect();
      }
    };
  }, [url]);

  return { isConnected, data };
};