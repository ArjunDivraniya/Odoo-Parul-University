// frontend/src/lib/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api').replace('/api', '');

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      transports: ['websocket', 'polling']
    });
    console.log('🔌 Socket initialized with URL:', SOCKET_URL);
  }
  return socket;
};
export default getSocket;
