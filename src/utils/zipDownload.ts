import JSZip from 'jszip';
import { Memory } from '../types';

export const downloadMemoriesAsZip = async (
  memories: Memory[],
  eventName: string = 'Mis 15 Bianca',
  onProgress?: (progress: number, total: number) => void
): Promise<void> => {
  const zip = new JSZip();
  const folder = zip.folder(`Fotos_${eventName.replace(/\s+/g, '_')}`) || zip;

  let dedicatoriasText = `========================================================\n`;
  dedicatoriasText += `   RECUERDOS Y DEDICATORIAS - ${eventName.toUpperCase()}\n`;
  dedicatoriasText += `   Fecha de descarga: ${new Date().toLocaleDateString('es-ES')}\n`;
  dedicatoriasText += `   Total de fotos: ${memories.length}\n`;
  dedicatoriasText += `========================================================\n\n`;

  const total = memories.length;

  for (let i = 0; i < memories.length; i++) {
    const mem = memories[i];
    const indexNum = String(i + 1).padStart(2, '0');
    const safeAuthor = (mem.author || 'Invitado').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_ -]/g, '').trim().replace(/\s+/g, '_');
    const safeTable = (mem.table || 'General').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_ -]/g, '').trim().replace(/\s+/g, '_');
    const fileName = `${indexNum}_${safeTable}_${safeAuthor}.jpg`;

    // Process image data
    try {
      if (mem.image.startsWith('data:image')) {
        const base64Data = mem.image.split(',')[1];
        folder.file(fileName, base64Data, { base64: true });
      } else if (mem.image.startsWith('http')) {
        // Fetch remote image as blob
        const response = await fetch(mem.image);
        const blob = await response.blob();
        folder.file(fileName, blob);
      }
    } catch (e) {
      console.warn(`Error bundling photo ${fileName}:`, e);
    }

    dedicatoriasText += `[Foto #${indexNum}]\n`;
    dedicatoriasText += `Autor: ${mem.author}\n`;
    dedicatoriasText += `Mesa: ${mem.table}\n`;
    dedicatoriasText += `Hora: ${mem.time}\n`;
    if (mem.message) dedicatoriasText += `Mensaje: "${mem.message}"\n`;
    if (mem.reaction) dedicatoriasText += `Reacción: ${mem.reaction}\n`;
    dedicatoriasText += `Me Gusta: ${mem.likes}\n`;
    dedicatoriasText += `--------------------------------------------------------\n\n`;

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  // Add dedicatorias file
  folder.file('Dedicatorias_y_Mensajes.txt', dedicatoriasText);

  // Generate the zip blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // Trigger download
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Fotos_Completas_${eventName.replace(/\s+/g, '_')}_${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
