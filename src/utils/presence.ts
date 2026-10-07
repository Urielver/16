import { useEffect, useState } from 'react';
import { OnlineGuest } from '../types';
import { updateCloudPresence, subscribeToCloudPresence } from './firestoreService';

export function getOrCreateGuestId(): string {
  try {
    let id = localStorage.getItem('mis15_guest_id');
    if (!id) {
      id = 'guest_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('mis15_guest_id', id);
    }
    return id;
  } catch {
    return 'guest_' + Date.now();
  }
}

export function useOnlinePresence(guestName: string, guestTable: string) {
  const [onlineGuests, setOnlineGuests] = useState<OnlineGuest[]>([]);
  const guestId = getOrCreateGuestId();

  // 1. Heartbeat to Cloud Firestore and local server
  useEffect(() => {
    const currentName = guestName.trim() || guestTable.trim() || 'Familia y Amigos';
    const currentTable = guestTable.trim() || 'Familia';

    const sendHeartbeat = () => {
      const guestObj: OnlineGuest = {
        id: guestId,
        name: currentName,
        table: currentTable,
        lastActive: Date.now(),
      };

      // Send to Firestore
      updateCloudPresence(guestObj).catch(() => {});

      // Send to local server
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestObj),
      }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 20000); // Every 20 seconds

    return () => clearInterval(interval);
  }, [guestId, guestName, guestTable]);

  // 2. Real-time subscription to online guests
  useEffect(() => {
    const unsubscribe = subscribeToCloudPresence((active) => {
      if (active && active.length > 0) {
        setOnlineGuests(active);
      }
    });

    // Also poll server presence as fallback
    const pollServer = () => {
      fetch('/api/presence')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.guests) && data.guests.length > 0) {
            setOnlineGuests((prev) => {
              const ids = new Set(prev.map((g) => g.id));
              const merged = [...prev];
              data.guests.forEach((g: OnlineGuest) => {
                if (!ids.has(g.id)) {
                  merged.push(g);
                }
              });
              return merged;
            });
          }
        })
        .catch(() => {});
    };

    pollServer();
    const pollInterval = setInterval(pollServer, 15000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  return { onlineGuests, guestId };
}
