import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "./use-auth";
import { Message, User } from "@shared/schema";

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (receiverId: string, content?: string, imageUrl?: string) => void;
  sendTyping: (receiverId: string, isTyping: boolean) => void;
  onlineUsers: User[];
  typingUsers: Record<string, boolean>;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (!user || socket?.readyState === WebSocket.CONNECTING) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      setIsConnected(true);
      setSocket(newSocket);
      
      // Authenticate the connection
      newSocket.send(JSON.stringify({
        type: 'auth',
        userId: user.id,
      }));
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'newMessage':
            // Handle new message - parent component should listen for this
            window.dispatchEvent(new CustomEvent('newMessage', { detail: data }));
            break;
            
          case 'messageConfirmed':
            // Handle message confirmation
            window.dispatchEvent(new CustomEvent('messageConfirmed', { detail: data }));
            break;
            
          case 'userTyping':
            setTypingUsers(prev => ({
              ...prev,
              [data.userId]: data.isTyping,
            }));
            
            // Clear typing indicator after 3 seconds
            if (data.isTyping) {
              setTimeout(() => {
                setTypingUsers(prev => ({
                  ...prev,
                  [data.userId]: false,
                }));
              }, 3000);
            }
            break;
            
          case 'userOnline':
          case 'userOffline':
            // Update online users list
            window.dispatchEvent(new CustomEvent('onlineStatusChanged'));
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    newSocket.onclose = () => {
      setIsConnected(false);
      setSocket(null);
      
      // Attempt to reconnect after 3 seconds
      if (user) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  useEffect(() => {
    if (user && !socket) {
      connect();
    } else if (!user && socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [user]);

  const sendMessage = (receiverId: string, content?: string, imageUrl?: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'sendMessage',
        receiverId,
        content,
        imageUrl,
      }));
    }
  };

  const sendTyping = (receiverId: string, isTyping: boolean) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'typing',
        receiverId,
        isTyping,
      }));
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      sendMessage,
      sendTyping,
      onlineUsers,
      typingUsers,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
