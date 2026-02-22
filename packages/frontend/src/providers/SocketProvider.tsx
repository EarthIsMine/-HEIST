import React, { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../net/socket';
import { wireSocketHandlers } from '../net/handlers';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    wireSocketHandlers();
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  return <>{children}</>;
}
