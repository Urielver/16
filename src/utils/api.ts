import { Memory } from '../types';
import {
  saveMemoryToIndexedDB,
  getAllMemoriesFromIndexedDB,
  deleteMemoryFromIndexedDB,
} from './indexedDBStorage';
import {
  saveMemoryToCloud,
  deleteMemoryFromCloud,
  updateLikeInCloud,
} from './firestoreService';

// Fetch all memories from server, syncing with local IndexedDB
export async function fetchEventMemories(): Promise<Memory[] | null> {
  try {
    const res = await fetch('/api/memories');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.memories)) {
        // Also cache all memories into IndexedDB for offline access
        for (const mem of data.memories) {
          saveMemoryToIndexedDB(mem).catch(() => {});
        }
        return data.memories;
      }
    }
  } catch (err) {
    console.warn('Backend server not reachable, attempting IndexedDB fallback:', err);
  }

  // Fallback to IndexedDB
  try {
    const localMemories = await getAllMemoriesFromIndexedDB();
    if (localMemories && localMemories.length > 0) {
      return localMemories as Memory[];
    }
  } catch (err) {
    console.warn('IndexedDB read failed:', err);
  }

  return null;
}

// Save a memory to Cloud Firestore, local IndexedDB, and server API
export async function saveEventMemory(memory: Memory): Promise<boolean> {
  // 1. Save directly to Google Cloud Firestore (Primary Cloud Storage!)
  saveMemoryToCloud(memory).catch((err) =>
    console.warn('Cloud Firestore save warning:', err)
  );

  // 2. Immediately store in IndexedDB (client persistence with gigabyte capacity)
  saveMemoryToIndexedDB(memory).catch((err) =>
    console.warn('IndexedDB save error:', err)
  );

  // 3. Transmit to server API so all other devices (projector, guests) receive it
  try {
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memory),
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn('Could not sync memory to server endpoint:', err);
  }

  return true;
}

// Delete a memory from Cloud Firestore, server, and IndexedDB
export async function deleteEventMemory(id: string): Promise<boolean> {
  deleteMemoryToCloudSafely(id);
  deleteMemoryFromIndexedDB(id).catch(() => {});

  try {
    const res = await fetch(`/api/memories/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

function deleteMemoryToCloudSafely(id: string) {
  deleteMemoryFromCloud(id).catch((err) => console.warn('Cloud delete warning:', err));
}

// Toggle like on a memory
export async function toggleEventMemoryLike(id: string, newLikesCount?: number): Promise<void> {
  if (typeof newLikesCount === 'number') {
    updateLikeInCloud(id, newLikesCount).catch(() => {});
  }
  try {
    await fetch(`/api/memories/${id}/like`, { method: 'POST' });
  } catch {}
}

// Optional ImgBB Cloud Uploader (Alternative free cloud storage without Google Drive)
export async function uploadToImgBB(base64Image: string, apiKey: string): Promise<string | null> {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const formData = new FormData();
    formData.append('image', cleanBase64);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.success && data.data && data.data.url) {
      return data.data.url;
    }
  } catch (e) {
    console.warn('ImgBB upload error:', e);
  }
  return null;
}
