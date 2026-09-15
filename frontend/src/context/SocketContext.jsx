import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { API_BASE } from '../api/client';
import { getPrefs } from '../lib/prefs';

const SocketContext = createContext(null);

// Human-readable framing per notification type - "New event: X" reads better than
// dumping the raw backend message string into a toast.
const toastLabel = (type) => {
  if (type.startsWith('event_')) return 'Event';
  if (type.startsWith('opportunity_')) return 'Opportunity';
  if (type.startsWith('certification_')) return 'Certification';
  return 'Update';
};

export const SocketProvider = ({ children }) => {
  const { token, role, isAuthenticated } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    // notification-service only accepts student connections - matches the backend's
    // own role check, so there's no point attempting a connection for Faculty/Admin.
    if (!isAuthenticated || role !== 'student') {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(API_BASE, {
      path: '/api/notifications/socket',
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('notification', (payload) => {
      if (getPrefs().liveToasts) {
        push(`${toastLabel(payload.type)}: ${payload.message}`, { variant: 'live' });
      }
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, role, token, push, queryClient]);

  return <SocketContext.Provider value={{}}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
