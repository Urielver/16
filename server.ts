import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function resolvePort(): number {
  const portIndex = process.argv.indexOf('--port');
  if (portIndex !== -1 && process.argv[portIndex + 1]) {
    const parsed = Number(process.argv[portIndex + 1]);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // Note: Cloud Run container sets PORT=8080 for NGINX. The internal Node server must ALWAYS listen on 3000.
  if (process.env.APP_PORT) {
    return Number(process.env.APP_PORT);
  }
  return 3000;
}

const PORT = resolvePort();
const IS_PROD = process.env.NODE_ENV === 'production';

// Allow large payloads for high-resolution event photos (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure server data directory exists
const DATA_DIR = path.join(process.cwd(), 'server_data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MEMORIES_FILE = path.join(DATA_DIR, 'event_memories.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'event_settings.json');
const PLAYLIST_FILE = path.join(DATA_DIR, 'event_playlist.json');

// Helper to read JSON file safely
function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.warn(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

// Helper to write JSON file safely
function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// ==========================================
// REST API ROUTES (Almacenamiento en Servidor)
// ==========================================

// 1. Obtener todos los recuerdos / fotos del evento
app.get('/api/memories', (req: Request, res: Response) => {
  const memories = readJsonFile<any[]>(MEMORIES_FILE, []);
  res.json({
    success: true,
    count: memories.length,
    memories,
  });
});

// 2. Guardar un nuevo recuerdo / foto tomada por un invitado
app.post('/api/memories', (req: Request, res: Response) => {
  try {
    const memory = req.body;
    if (!memory || !memory.image) {
      return res.status(400).json({ success: false, error: 'La foto es obligatoria' });
    }

    const currentMemories = readJsonFile<any[]>(MEMORIES_FILE, []);
    
    // Check if memory already exists
    const existingIndex = currentMemories.findIndex((m) => m.id === memory.id);
    if (existingIndex >= 0) {
      currentMemories[existingIndex] = memory;
    } else {
      currentMemories.unshift(memory);
    }

    writeJsonFile(MEMORIES_FILE, currentMemories);

    res.json({
      success: true,
      message: 'Recuerdo guardado con éxito en el servidor de la fiesta',
      memory,
      totalCount: currentMemories.length,
    });
  } catch (err) {
    console.error('Error saving memory:', err);
    res.status(500).json({ success: false, error: 'Error al procesar la foto' });
  }
});

// 3. Eliminar recuerdo (moderación admin)
app.delete('/api/memories/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let currentMemories = readJsonFile<any[]>(MEMORIES_FILE, []);
    const initialLen = currentMemories.length;
    currentMemories = currentMemories.filter((m) => m.id !== id);
    writeJsonFile(MEMORIES_FILE, currentMemories);

    res.json({
      success: true,
      deleted: initialLen !== currentMemories.length,
      totalCount: currentMemories.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al eliminar foto' });
  }
});

// 4. Toggle Like en un recuerdo (registrando invitado)
app.post('/api/memories/:id/like', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { guestId } = req.body || {};
    const currentMemories = readJsonFile<any[]>(MEMORIES_FILE, []);
    const item = currentMemories.find((m) => m.id === id);
    if (item) {
      if (!Array.isArray(item.likedBy)) {
        item.likedBy = [];
      }
      if (guestId) {
        if (item.likedBy.includes(guestId)) {
          item.likedBy = item.likedBy.filter((gid: string) => gid !== guestId);
          item.isLiked = false;
          item.likes = Math.max(0, (item.likes || 1) - 1);
        } else {
          item.likedBy.push(guestId);
          item.isLiked = true;
          item.likes = (item.likes || 0) + 1;
        }
      } else {
        item.isLiked = !item.isLiked;
        item.likes = item.isLiked ? (item.likes || 0) + 1 : Math.max(0, (item.likes || 1) - 1);
      }
      writeJsonFile(MEMORIES_FILE, currentMemories);
      return res.json({ success: true, memory: item, likes: item.likes, isLiked: item.isLiked });
    }
    res.status(404).json({ success: false, error: 'Recuerdo no encontrado' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al actualizar reacción' });
  }
});

// 4.1 Presencia de invitados en tiempo real (In-Memory + File)
const onlineGuestsMap = new Map<string, { id: string; name: string; table?: string; lastActive: number }>();

app.post('/api/presence', (req: Request, res: Response) => {
  try {
    const { id, name, table } = req.body || {};
    if (id) {
      onlineGuestsMap.set(id, {
        id,
        name: name || 'Invitado de Gala',
        table: table || 'Mesa del Evento',
        lastActive: Date.now(),
      });
    }
    res.json({ success: true, count: onlineGuestsMap.size });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.get('/api/presence', (req: Request, res: Response) => {
  const now = Date.now();
  const active: any[] = [];
  onlineGuestsMap.forEach((guest, key) => {
    if (now - guest.lastActive < 60000) {
      active.push(guest);
    } else {
      onlineGuestsMap.delete(key);
    }
  });
  res.json({ success: true, count: active.length, guests: active });
});

// 5. Obtener ajustes del evento
app.get('/api/settings', (req: Request, res: Response) => {
  const settings = readJsonFile<any | null>(SETTINGS_FILE, null);
  res.json({ success: true, settings });
});

// 6. Guardar ajustes del evento
app.post('/api/settings', (req: Request, res: Response) => {
  try {
    const settings = req.body;
    writeJsonFile(SETTINGS_FILE, settings);
    res.json({ success: true, message: 'Ajustes guardados correctamente', settings });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al guardar ajustes' });
  }
});

// 6.1 Playlist Colaborativa de Canciones (YouTube & Spotify)
app.get('/api/playlist', (req: Request, res: Response) => {
  const playlist = readJsonFile<any[]>(PLAYLIST_FILE, []);
  res.json({ success: true, count: playlist.length, playlist });
});

app.post('/api/playlist', (req: Request, res: Response) => {
  try {
    const song = req.body;
    if (!song || !song.title) {
      return res.status(400).json({ success: false, error: 'Título requerido' });
    }
    const playlist = readJsonFile<any[]>(PLAYLIST_FILE, []);
    const existsIdx = playlist.findIndex((s) => s.id === song.id);
    if (existsIdx >= 0) {
      playlist[existsIdx] = song;
    } else {
      playlist.unshift(song);
    }
    writeJsonFile(PLAYLIST_FILE, playlist);
    res.json({ success: true, song, playlist });
  } catch {
    res.status(500).json({ success: false, error: 'Error al guardar canción' });
  }
});

app.post('/api/playlist/:id/vote', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { guestId } = req.body || {};
    const playlist = readJsonFile<any[]>(PLAYLIST_FILE, []);
    const song = playlist.find((s) => s.id === id);
    if (song) {
      if (!Array.isArray(song.likedBy)) song.likedBy = [];
      const hasVoted = guestId && song.likedBy.includes(guestId);
      if (hasVoted) {
        song.likedBy = song.likedBy.filter((g: string) => g !== guestId);
        song.likes = Math.max(0, (song.likes || 1) - 1);
      } else {
        if (guestId) song.likedBy.push(guestId);
        song.likes = (song.likes || 0) + 1;
      }
      writeJsonFile(PLAYLIST_FILE, playlist);
      return res.json({ success: true, song, likes: song.likes, hasVoted: !hasVoted });
    }
    res.status(404).json({ success: false, error: 'Canción no encontrada' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al votar canción' });
  }
});

app.delete('/api/playlist/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let playlist = readJsonFile<any[]>(PLAYLIST_FILE, []);
    playlist = playlist.filter((s) => s.id !== id);
    writeJsonFile(PLAYLIST_FILE, playlist);
    res.json({ success: true, message: 'Canción eliminada de la playlist' });
  } catch {
    res.status(500).json({ success: false, error: 'Error al eliminar canción' });
  }
});

// 7. Estadísticas del almacenamiento del servidor
app.get('/api/storage-info', (req: Request, res: Response) => {
  const memories = readJsonFile<any[]>(MEMORIES_FILE, []);
  let approxBytes = 0;
  try {
    if (fs.existsSync(MEMORIES_FILE)) {
      const stats = fs.statSync(MEMORIES_FILE);
      approxBytes = stats.size;
    }
  } catch {}

  res.json({
    success: true,
    totalPhotos: memories.length,
    approximateSizeBytes: approxBytes,
    approximateSizeMB: (approxBytes / (1024 * 1024)).toFixed(2),
    storageType: 'Servidor Local Integrado (Independiente de Google Drive)',
    status: 'Activo y Listo para la Fiesta',
  });
});

// ==========================================
// VITE INTEGRATION / STATIC SERVING
// ==========================================
async function startServer() {
  if (!IS_PROD) {
    // Mount Vite dev server middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback handler for SPA client routes in development
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else {
          next();
        }
      } catch (e) {
        next(e);
      }
    });
  } else {
    // Serve static build in production
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Servidor de Gala] Corriendo exitosamente en http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error(`[Error Servidor] No se pudo escuchar en el puerto ${PORT}:`, err);
  });
}

startServer();
