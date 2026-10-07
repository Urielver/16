import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Memory, EventSettings, OnlineGuest, PlaylistItem } from '../types';

export const MEMORIES_COLLECTION = 'memories';
export const SETTINGS_COLLECTION = 'settings';
export const PRESENCE_COLLECTION = 'presence';
export const PLAYLIST_COLLECTION = 'playlist';
export const MAIN_SETTINGS_DOC = 'main_event_settings';

// Subscribe in real-time to all memories in Google Cloud Firestore
export function subscribeToCloudMemories(
  onUpdate: (memories: Memory[]) => void,
  onError?: (error: unknown) => void
): () => void {
  try {
    const q = query(
      collection(db, MEMORIES_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(500)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Memory[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Memory);
        });
        onUpdate(items);
      },
      (error) => {
        console.warn('Google Cloud Firestore subscription warning:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish Google Cloud Firestore subscription:', err);
    return () => {};
  }
}

// Fetch all photo memories directly from Google Cloud Firestore
export async function fetchAllCloudMemories(): Promise<Memory[]> {
  try {
    const q = query(
      collection(db, MEMORIES_COLLECTION),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    const items: Memory[] = [];
    snap.forEach((docSnap) => {
      items.push(docSnap.data() as Memory);
    });
    return items;
  } catch (err) {
    console.warn('Error fetching all Cloud memories:', err);
    return [];
  }
}

// Seed initial party memories to Google Cloud Firestore if empty
export async function seedMemoriesToCloud(memories: Memory[]): Promise<void> {
  try {
    const existing = await fetchAllCloudMemories();
    if (existing.length === 0 && memories.length > 0) {
      console.log('Seeding initial memories to Google Cloud Firestore...');
      for (const mem of memories) {
        await saveMemoryToCloud(mem);
      }
    }
  } catch (err) {
    console.warn('Could not seed initial memories to Google Cloud:', err);
  }
}

// Save a photo memory directly to Google Cloud Firestore
export async function saveMemoryToCloud(memory: Memory): Promise<boolean> {
  try {
    const memoryRef = doc(db, MEMORIES_COLLECTION, memory.id);
    await setDoc(
      memoryRef,
      {
        ...memory,
        cloudSynced: true,
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Error saving memory to Google Cloud Firestore:', error);
    return false;
  }
}

// Delete a photo memory from Google Cloud Firestore
export async function deleteMemoryFromCloud(id: string): Promise<boolean> {
  try {
    const memoryRef = doc(db, MEMORIES_COLLECTION, id);
    await deleteDoc(memoryRef);
    return true;
  } catch (error) {
    console.error('Error deleting memory from Google Cloud Firestore:', error);
    return false;
  }
}

// Update like count in Google Cloud Firestore
export async function updateLikeInCloud(id: string, newLikesCount: number): Promise<void> {
  try {
    const memoryRef = doc(db, MEMORIES_COLLECTION, id);
    await updateDoc(memoryRef, { likes: newLikesCount });
  } catch (error) {
    console.warn('Could not update likes in Google Cloud Firestore:', error);
  }
}

// Save global event settings to Google Cloud Firestore
export async function saveSettingsToCloud(settings: EventSettings): Promise<boolean> {
  try {
    // Strip undefined properties because Firestore rejects undefined values
    const cleanSettings: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        cleanSettings[key] = value;
      }
    }
    const settingsRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC);
    await setDoc(settingsRef, cleanSettings, { merge: true });
    return true;
  } catch (error) {
    console.warn('Could not save settings to Google Cloud Firestore:', error);
    return false;
  }
}

// Subscribe to global event settings in Google Cloud Firestore
export function subscribeToCloudSettings(
  onUpdate: (settings: Partial<EventSettings>) => void
): () => void {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC);
    return onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as Partial<EventSettings>);
      }
    });
  } catch {
    return () => {};
  }
}

// ==========================================
// REAL-TIME PRESENCE (Invitados en línea)
// ==========================================

// Update presence for an active guest
export async function updateCloudPresence(guest: OnlineGuest): Promise<void> {
  try {
    const guestRef = doc(db, PRESENCE_COLLECTION, guest.id);
    await setDoc(guestRef, {
      ...guest,
      lastActive: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not update cloud presence:', err);
  }
}

// Remove presence when guest leaves
export async function removeCloudPresence(guestId: string): Promise<void> {
  try {
    const guestRef = doc(db, PRESENCE_COLLECTION, guestId);
    await deleteDoc(guestRef);
  } catch {}
}

// Real-time subscription to online guests
export function subscribeToCloudPresence(
  onUpdate: (activeGuests: OnlineGuest[]) => void
): () => void {
  try {
    const presenceCol = collection(db, PRESENCE_COLLECTION);
    return onSnapshot(presenceCol, (snapshot) => {
      const now = Date.now();
      const guests: OnlineGuest[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as OnlineGuest;
        // Consider active if updated within the last 60 seconds
        if (data && data.lastActive && now - data.lastActive < 60000) {
          guests.push(data);
        }
      });
      // Sort by recency
      guests.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
      onUpdate(guests);
    });
  } catch (err) {
    console.warn('Could not subscribe to presence:', err);
    return () => {};
  }
}

// Register guest like with personal tracking
export async function toggleCloudLikeWithGuest(
  memoryId: string,
  guestId: string,
  _guestName?: string
): Promise<{ likes: number; isLiked: boolean }> {
  try {
    const memRef = doc(db, MEMORIES_COLLECTION, memoryId);
    const snap = await getDoc(memRef);
    if (!snap.exists()) {
      return { likes: 0, isLiked: false };
    }
    const mem = snap.data() as Memory;
    const currentLikedBy = Array.isArray(mem.likedBy) ? [...mem.likedBy] : [];
    const hasLiked = currentLikedBy.includes(guestId);

    let updatedLikedBy: string[];
    let newLikesCount: number;

    if (hasLiked) {
      updatedLikedBy = currentLikedBy.filter((id) => id !== guestId);
      newLikesCount = Math.max(0, (mem.likes || 1) - 1);
    } else {
      updatedLikedBy = [...currentLikedBy, guestId];
      newLikesCount = (mem.likes || 0) + 1;
    }

    await updateDoc(memRef, {
      likes: newLikesCount,
      likedBy: updatedLikedBy,
    });

    return { likes: newLikesCount, isLiked: !hasLiked };
  } catch (err) {
    console.warn('Error toggling like in cloud:', err);
    return { likes: 1, isLiked: true };
  }
}

// ==========================================
// COLLABORATIVE PLAYLIST (YouTube & Spotify)
// ==========================================

export function subscribeToCloudPlaylist(
  onUpdate: (playlist: PlaylistItem[]) => void,
  onError?: (error: unknown) => void
): () => void {
  try {
    const q = query(collection(db, PLAYLIST_COLLECTION), orderBy('timestamp', 'desc'), limit(150));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: PlaylistItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as PlaylistItem);
        });
        onUpdate(items);
      },
      (error) => {
        console.warn('Playlist cloud subscription warning:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Could not subscribe to cloud playlist:', err);
    return () => {};
  }
}

export async function addSongToCloudPlaylist(song: PlaylistItem): Promise<boolean> {
  try {
    const songRef = doc(db, PLAYLIST_COLLECTION, song.id);
    await setDoc(songRef, song, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving song to cloud playlist:', err);
    return false;
  }
}

export async function voteSongInCloudPlaylist(
  songId: string,
  guestId: string
): Promise<{ likes: number; hasVoted: boolean }> {
  try {
    const songRef = doc(db, PLAYLIST_COLLECTION, songId);
    const snap = await getDoc(songRef);
    if (!snap.exists()) return { likes: 0, hasVoted: false };

    const song = snap.data() as PlaylistItem;
    const currentLikedBy = Array.isArray(song.likedBy) ? [...song.likedBy] : [];
    const hasVoted = currentLikedBy.includes(guestId);

    let updatedLikedBy: string[];
    let newLikes: number;

    if (hasVoted) {
      updatedLikedBy = currentLikedBy.filter((g) => g !== guestId);
      newLikes = Math.max(0, (song.likes || 1) - 1);
    } else {
      updatedLikedBy = [...currentLikedBy, guestId];
      newLikes = (song.likes || 0) + 1;
    }

    await updateDoc(songRef, {
      likes: newLikes,
      likedBy: updatedLikedBy,
    });

    return { likes: newLikes, hasVoted: !hasVoted };
  } catch (err) {
    console.warn('Error voting song in cloud playlist:', err);
    return { likes: 1, hasVoted: true };
  }
}

export async function updateSongStatusInCloud(
  songId: string,
  status: 'pending' | 'playing' | 'played'
): Promise<void> {
  try {
    const songRef = doc(db, PLAYLIST_COLLECTION, songId);
    await updateDoc(songRef, { status });
  } catch (err) {
    console.warn('Could not update song status in cloud:', err);
  }
}

export async function deleteSongFromCloud(songId: string): Promise<boolean> {
  try {
    const songRef = doc(db, PLAYLIST_COLLECTION, songId);
    await deleteDoc(songRef);
    return true;
  } catch (err) {
    console.error('Error deleting song from cloud playlist:', err);
    return false;
  }
}

export async function seedPlaylistToCloud(initialSongs: PlaylistItem[]): Promise<void> {
  try {
    const q = query(collection(db, PLAYLIST_COLLECTION), limit(1));
    const snap = await getDocs(q);
    if (snap.empty && initialSongs.length > 0) {
      for (const song of initialSongs) {
        await addSongToCloudPlaylist(song);
      }
    }
  } catch (err) {
    console.warn('Could not seed initial playlist to cloud:', err);
  }
}
