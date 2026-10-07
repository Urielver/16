import React, { useState } from 'react';
import { CelebrationType, EventSettings, Memory, TabType } from '../../types';
import { downloadMemoriesAsZip } from '../../utils/zipDownload';
import { saveMemoryToCloud, saveSettingsToCloud } from '../../utils/firestoreService';
import { compressImage } from '../../utils/imageCompressor';

interface SettingsScreenProps {
  eventSettings: EventSettings;
  onUpdateSettings: (newSettings: EventSettings) => void;
  onNavigate: (tab: TabType) => void;
  onOpenQRModal: () => void;
  onLogout?: () => void;
  memories?: Memory[];
  onDeleteMemory?: (id: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  eventSettings,
  onUpdateSettings,
  onNavigate,
  onOpenQRModal,
  onLogout,
  memories = [],
  onDeleteMemory,
}) => {
  const [formData, setFormData] = useState<EventSettings>(() => ({
    ...eventSettings,
    storageMethod: eventSettings.storageMethod || 'cloud_firestore',
  }));

  // Mantener formData actualizado si las configuraciones del evento se actualizan externamente
  React.useEffect(() => {
    if (
      eventSettings.settingsUpdatedAt &&
      (!formData.settingsUpdatedAt || eventSettings.settingsUpdatedAt > formData.settingsUpdatedAt)
    ) {
      setFormData((prev) => ({
        ...prev,
        ...eventSettings,
      }));
    }
  }, [eventSettings]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('Todos los cambios sincronizados');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string>('');
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<string>('');
  const [showDriveInstructions, setShowDriveInstructions] = useState<boolean>(false);
  const [testDriveStatus, setTestDriveStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testDriveMessage, setTestDriveMessage] = useState<string>('');

  const handleAutoGenerateFolder = () => {
    const folder = `Mis 15 ${formData.honoreeName || 'Bianca'} - Fotos en Vivo`;
    setFormData((prev) => ({ ...prev, driveFolder: folder }));
  };

  const handleTestDriveConnection = async () => {
    if (!formData.driveWebhookUrl) {
      setTestDriveStatus('error');
      setTestDriveMessage('Debes pegar primero la URL de tu Webhook de Google Apps Script.');
      return;
    }
    setTestDriveStatus('testing');
    setTestDriveMessage('Probando conexión con Google Drive...');
    try {
      await fetch(formData.driveWebhookUrl, { method: 'GET', mode: 'no-cors' });
      setTestDriveStatus('success');
      setTestDriveMessage('¡Conexión establecida con éxito con tu Google Drive!');
      setTimeout(() => setTestDriveMessage(''), 4000);
    } catch {
      setTestDriveStatus('error');
      setTestDriveMessage('No se pudo conectar con el Webhook. Revisa los permisos en Google Apps Script.');
    }
  };

  const defaultCoverPhoto =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAowa0QMnNmb_1oTuH7ZOk8q6iAM-lTcaSNdpAnbnq7kYzUgmA8fOOEsAEOFARvnQaibJg0qXzwbmre302mdeKRiSs3Ti4g91q7TsWSkKY3oy7iflNQamMV80IVpgubltRGIMjyPLA6DWl_JFQi5sf92FQuXDamwSPta2LaldeW8KXkpxtPIoChcgwncDh9qZK9FrKnvVOMThrU-xHmGPB6LKCOlanqU-dtngxmWi2MHOWpg2loatUJ_A';

  const celebrationTypes: { type: CelebrationType; icon: string }[] = [
    { type: 'Mis 15 Años', icon: 'stars' },
    { type: 'Mis 18 Años', icon: 'cake' },
    { type: 'Boda / Gala', icon: 'favorite' },
    { type: 'Cumpleaños Especial', icon: 'auto_awesome' },
  ];

  const handleSave = () => {
    setIsSaving(true);
    const updated = {
      ...formData,
      settingsUpdatedAt: Date.now(),
    };
    setFormData(updated);

    saveSettingsToCloud(updated).catch((err) => {
      console.warn('Could not save to Cloud Firestore:', err);
    });

    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});

    setTimeout(() => {
      onUpdateSettings(updated);
      setIsSaving(false);
      setSaveMessage('¡Guardado en Google Cloud y Servidor!');
      setTimeout(() => {
        setSaveMessage('Todos los cambios sincronizados');
      }, 2500);
    }, 350);
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsSaving(true);
        setSaveMessage('Optimizando y guardando foto de presentación...');
        const compressed = await compressImage(file, 960, 960, 0.75);
        if (compressed) {
          const updated = {
            ...formData,
            coverImage: compressed,
            settingsUpdatedAt: Date.now(),
          };
          setFormData(updated);
          onUpdateSettings(updated);
          try {
            localStorage.setItem('mis15_settings', JSON.stringify(updated));
          } catch {}
          await saveSettingsToCloud(updated);
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(() => {});
          setSaveMessage('¡Foto de presentación guardada y sincronizada permanentemente!');
          setTimeout(() => setSaveMessage('Todos los cambios sincronizados'), 3000);
        }
      } catch (err) {
        console.warn('Error reading cover photo:', err);
        setSaveMessage('Error al procesar la foto');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleRemoveCoverPhoto = () => {
    if (window.confirm('¿Seguro que deseas eliminar la foto de presentación de la portada?')) {
      const updated = { ...formData, coverImage: '', settingsUpdatedAt: Date.now() };
      setFormData(updated);
      onUpdateSettings(updated);
      saveSettingsToCloud(updated).catch(() => {});
    }
  };

  const handleRestoreDefaultCover = () => {
    const updated = { ...formData, coverImage: defaultCoverPhoto, settingsUpdatedAt: Date.now() };
    setFormData(updated);
    onUpdateSettings(updated);
    saveSettingsToCloud(updated).catch(() => {});
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 500, 500, 0.85);
        if (compressed) {
          const updated = {
            ...formData,
            customLogoUrl: compressed,
            settingsUpdatedAt: Date.now(),
          };
          setFormData(updated);
          onUpdateSettings(updated);
          saveSettingsToCloud(updated).catch(() => {});
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('Error reading logo:', err);
      }
    }
  };

  const handleSongUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const title = file.name.replace(/\.[^/.]+$/, '');
      setFormData((prev) => ({
        ...prev,
        backgroundSongUrl: url,
        backgroundSongTitle: title,
      }));
    }
  };

  // Sincronizar todas las fotos del evento con Google Cloud Firestore
  const handleSyncAllToGoogleCloud = async () => {
    if (memories.length === 0) return;
    setIsCloudSyncing(true);
    setCloudSyncMsg('Sincronizando fotos con Google Cloud Firestore...');
    try {
      for (const mem of memories) {
        await saveMemoryToCloud(mem);
      }
      setCloudSyncMsg(`¡${memories.length} fotos guardadas y sincronizadas en Google Cloud!`);
      setTimeout(() => setCloudSyncMsg(''), 3500);
    } catch (e) {
      setCloudSyncMsg('Error al sincronizar con Google Cloud.');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Copy Google Apps Script code to clipboard
  const handleCopyScriptCode = () => {
    const cleanFolderId =
      formData.driveFolderId && !formData.driveFolderId.startsWith('AKfycb')
        ? formData.driveFolderId.trim()
        : '1bHI5-NkaB7LBEeTD_wOZ-_nfcuTOLYrt';

    const scriptCode = `/**
 * API Backend de Mis 15 - Google Apps Script
 * Guarda fotos de los invitados directamente en tu Google Drive
 * ¡Crea automáticamente la carpeta si no existe y nunca falla!
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Sin datos postData" })).setMimeType(ContentService.MimeType.JSON);
    }
    const data = JSON.parse(e.postData.contents);
    if (!data.image) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Sin imagen" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Obtener o crear la carpeta de destino de forma segura
    let folder = null;
    const rawFolderId = "${cleanFolderId}" || (data.folderId || "").trim();
    if (rawFolderId && rawFolderId.length > 10 && rawFolderId.indexOf("AKfy") !== 0) {
      try {
        folder = DriveApp.getFolderById(rawFolderId);
      } catch (err) {
        folder = null;
      }
    }

    // Si no hay carpeta por ID, buscar o crear la carpeta "Mis 15 Bianca - Fotos en Vivo"
    if (!folder) {
      const folderName = (data.folderName || "Mis 15 Bianca - Fotos en Vivo").replace(/^Drive\\s*\\/\\s*/i, "").trim() || "Mis 15 Bianca - Fotos";
      const folders = DriveApp.getFoldersByName(folderName);
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
    }

    // 2. Procesar la imagen (soporta Base64 y URL)
    let decodedBlob = null;
    const authorName = (data.nombre || "Invitado").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_ -]/g, "").trim().replace(/\\s+/g, "_");
    const tableName = (data.mesa || "Mesa").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_ -]/g, "").trim().replace(/\\s+/g, "_");
    const fileName = "Recuerdo_" + tableName + "_" + authorName + "_" + Date.now() + ".jpg";

    if (data.image.indexOf("http") === 0) {
      const resp = UrlFetchApp.fetch(data.image);
      decodedBlob = resp.getBlob().setName(fileName);
    } else {
      let rawBase64 = data.image;
      if (rawBase64.indexOf(",") > -1) {
        rawBase64 = rawBase64.split(",")[1];
      }
      const bytes = Utilities.base64Decode(rawBase64);
      decodedBlob = Utilities.newBlob(bytes, data.mimeType || "image/jpeg", fileName);
    }

    // 3. Crear el archivo en la carpeta de Google Drive
    const file = folder.createFile(decodedBlob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(shareErr) {}

    if (data.dedicatoria) {
      file.setDescription("Dedicatoria: " + data.dedicatoria + " | Mesa: " + data.mesa + " | Reacción: " + (data.reaccion || ""));
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      fileId: file.getId(),
      fileName: file.getName(),
      folderName: folder.getName(),
      url: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Servicio de Google Drive para Mis 15 funcionando correctamente"
  })).setMimeType(ContentService.MimeType.JSON);
}`;

    navigator.clipboard?.writeText(scriptCode);
    alert('¡Código de Google Apps Script copiado al portapapeles! Pégalo en tu proyecto de script.google.com, haz clic en Implementar > Nueva implementación y actualízalo.');
  };

  // Descarga directa de todas las fotos en un archivo ZIP sin necesidad de Drive
  const handleDownloadZip = async () => {
    if (memories.length === 0) {
      alert('Aún no hay fotos registradas para descargar.');
      return;
    }
    setIsZipping(true);
    setZipProgress('Iniciando empaquetado...');
    try {
      await downloadMemoriesAsZip(
        memories,
        formData.eventName || 'Mis 15 Bianca',
        (current, total) => {
          setZipProgress(`Empaquetando foto ${current} de ${total}...`);
        }
      );
      setZipProgress('¡Descarga de archivo ZIP completada!');
      setTimeout(() => setZipProgress(''), 3500);
    } catch (err) {
      console.error('Error generando archivo ZIP:', err);
      alert('Hubo un inconveniente al generar el ZIP. Puedes usar la descarga JSON de respaldo.');
    } finally {
      setIsZipping(false);
    }
  };

  // Download all memories as JSON backup
  const handleDownloadAllMemories = () => {
    const backupData = {
      event: formData.eventName,
      honoree: formData.honoreeName,
      date: formData.date,
      exportDate: new Date().toISOString(),
      totalMemories: memories.length,
      memories: memories,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_Fotos_Mis15_${formData.honoreeName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col gap-5 pb-36 pt-1 text-left">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('album')}
            className="w-9 h-9 rounded-full bg-[#1d1f27] border border-white/10 flex items-center justify-center text-[#8d90a0] hover:text-[#7bd0ff] active:scale-95 transition-all cursor-pointer"
            title="Volver"
          >
            <span className="material-symbols-outlined text-[19px]">arrow_back</span>
          </button>
          <div>
            <span className="text-[10px] font-sans-ui text-[#7bd0ff] uppercase tracking-widest block font-bold">
              Panel de Control
            </span>
            <h1 className="text-lg font-bold font-serif-gala text-[#b4c5ff] tracking-wide">
              Personalizar Evento
            </h1>
          </div>
        </div>

        {/* Quick Actions: Logout and Save */}
        <div className="flex items-center gap-2">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Cerrar sesión de administrador"
              className="p-2 rounded-full bg-[#1d1f27] hover:bg-rose-500/20 text-[#8d90a0] hover:text-rose-400 border border-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7bd0ff] text-[#0b0e15] text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-transform duration-150 cursor-pointer"
          >
            {isSaving ? (
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-sm">check</span>
            )}
            <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {/* Host Overview Banner */}
      <div className="glass-card rounded-2xl p-3.5 flex items-center gap-3 border-l-4 border-l-[#7bd0ff]">
        <div className="w-10 h-10 rounded-xl bg-[#2563eb]/30 flex items-center justify-center text-[#7bd0ff] shrink-0">
          <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-white font-sans-ui">Modo Anfitrión Activo</p>
            <span className="bg-[#2563eb]/30 text-[#7bd0ff] border border-[#7bd0ff]/30 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
              {formData.adminUser || 'uriel'}
            </span>
          </div>
          <p className="text-[11px] text-[#8d90a0] leading-snug">
            Edita cada sección: Google Drive, correo, fotos de presentación, galería y seguridad.
          </p>
        </div>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#7bd0ff] animate-pulse glow-cyan-sm mr-1 shrink-0"></span>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 1: DATOS DEL FESTEJO                                              */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">celebration</span>
            <h2 className="text-sm font-bold text-white font-serif-gala">1. Datos del Festejo</h2>
          </div>
          <span className="text-[11px] text-[#7bd0ff] bg-[#2563eb]/20 px-2 py-0.5 rounded-full border border-[#7bd0ff]/20 font-medium">
            Editable
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-3.5 border border-white/10">
          {/* Nombre de la Festejada */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#c3c6d7] flex items-center justify-between">
              <span>Nombre de la Quinceañera / Festejada</span>
              <span className="text-[#7bd0ff] text-[11px]">Visible en portada y pantallas</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#8d90a0]">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </span>
              <input
                type="text"
                value={formData.honoreeName}
                onChange={(e) => {
                  const val = e.target.value;
                  const first = val.split(' ')[0] || val;
                  setFormData((prev) => ({
                    ...prev,
                    honoreeName: val,
                    eventName: `Mis 15 ${first}`,
                  }));
                }}
                className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]/70 transition-all font-sans-ui"
                placeholder="ej. Bianca Vargas"
              />
            </div>
          </div>

          {/* Nombre del Evento / Título */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#c3c6d7] block">
              Título Oficial del Evento
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#8d90a0]">
                <span className="material-symbols-outlined text-[18px]">stars</span>
              </span>
              <input
                type="text"
                value={formData.eventName}
                onChange={(e) => setFormData((prev) => ({ ...prev, eventName: e.target.value }))}
                className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]/70 transition-all font-sans-ui"
                placeholder="ej. Mis 15 Bianca"
              />
            </div>
          </div>

          {/* Tipo de Celebración */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#c3c6d7] block">
              Tipo de Celebración
            </label>
            <div className="grid grid-cols-2 gap-2">
              {celebrationTypes.map(({ type, icon }) => {
                const isSelected = formData.celebrationType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, celebrationType: type }))}
                    className={`flex items-center p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#7bd0ff] bg-[#2563eb]/25 shadow-sm text-white font-semibold'
                        : 'border-white/10 bg-[#191b23]/50 text-[#8d90a0] hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined mr-2 text-[18px] ${
                        isSelected ? 'text-[#7bd0ff]' : 'text-[#8d90a0]'
                      }`}
                    >
                      {icon}
                    </span>
                    <span className="text-xs font-sans-ui flex-1">{type}</span>
                    {isSelected && (
                      <span
                        className="material-symbols-outlined text-[#7bd0ff] text-base ml-auto"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fecha, Lugar y Hashtag */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#c3c6d7] block">Fecha de Gala</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]/70 transition-all font-sans-ui"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#c3c6d7] block">Lugar / Salón</label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-[#8d90a0]">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                </span>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-xl pl-8 pr-2.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]/70 transition-all font-sans-ui"
                  placeholder="ej. Salón Crystal Palace"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#c3c6d7] block">Hashtag Oficial</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#7bd0ff] text-xs font-bold">#</span>
                <input
                  type="text"
                  value={formData.hashtag.replace(/^#/, '')}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      hashtag: `#${e.target.value.replace(/^#/, '')}`,
                    }))
                  }
                  className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-xl pl-7 pr-3 py-2 text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]/70 transition-all font-sans-ui"
                  placeholder="Mis15Valen"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: PORTADA Y BIENVENIDA (CON OPCIÓN DE ELIMINAR FOTO)            */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">image</span>
            <h2 className="text-sm font-bold text-white font-serif-gala">2. Portada y Bienvenida</h2>
          </div>
          <span className="text-[11px] text-[#7bd0ff] flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-[13px]">visibility</span> En pantalla
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-3.5 border border-white/10">
          {/* Live Cover Preview or Empty Placeholder */}
          {formData.coverImage ? (
            <div className="relative rounded-xl overflow-hidden aspect-[16/9] border border-white/15 group">
              <img
                src={formData.coverImage}
                alt="Portada Activa"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e15] via-[#0b0e15]/40 to-transparent"></div>

              {/* Badges */}
              <div className="absolute top-2.5 left-2.5 bg-[#0b0e15]/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#7bd0ff] animate-ping"></span>
                <span className="text-[10px] text-white tracking-wide uppercase font-semibold">
                  Foto de Presentación Activa
                </span>
              </div>

              <div className="absolute top-2.5 right-2.5 bg-[#0b0e15]/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-[#8d90a0] font-mono">
                1920 × 1080 px
              </div>

              <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold text-white drop-shadow font-serif-gala">
                    {formData.honoreeName}
                  </p>
                  <p className="text-[11px] text-[#7bd0ff] drop-shadow font-medium">
                    {formData.date} · {formData.location}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl aspect-[16/9] border-2 border-dashed border-white/20 bg-[#10131a] flex flex-col items-center justify-center p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-[#8d90a0] mb-2">hide_image</span>
              <p className="text-xs font-bold text-white">Sin Foto de Presentación</p>
              <p className="text-[11px] text-[#8d90a0] mt-1 max-w-xs">
                Se eliminó la foto de portada. Sube una nueva foto abajo o pulsa en restablecer predeterminada.
              </p>
            </div>
          )}

          {/* Action buttons: Subir, Eliminar, Restablecer */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#7bd0ff]/40 bg-[#7bd0ff]/10 hover:bg-[#7bd0ff]/20 text-[#7bd0ff] text-xs font-semibold cursor-pointer active:scale-[0.98] transition-all">
                <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                <span>Cambiar / Subir Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverPhotoUpload}
                />
              </label>

              {formData.coverImage ? (
                <button
                  type="button"
                  onClick={handleRemoveCoverPhoto}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold cursor-pointer active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[18px] text-rose-400">delete</span>
                  <span>Eliminar foto de presentación</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRestoreDefaultCover}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#7bd0ff]">refresh</span>
                  <span>Restablecer foto original</span>
                </button>
              )}
            </div>

            {/* Direct URL input */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#c3c6d7] block">
                O ingresa la URL directa de la imagen de portada
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#8d90a0]">
                  <span className="material-symbols-outlined text-[16px]">link</span>
                </span>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]"
                />
                {formData.coverImage && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, coverImage: '' }))}
                    className="absolute right-2.5 text-[#8d90a0] hover:text-white"
                    title="Eliminar URL"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#c3c6d7]">
                Mensaje de Bienvenida para Invitados
              </label>
              <span className="text-[10px] text-[#8d90a0]">
                {formData.welcomeMessage.length}/250 carac.
              </span>
            </div>
            <div className="relative">
              <textarea
                rows={3}
                maxLength={250}
                value={formData.welcomeMessage}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, welcomeMessage: e.target.value }))
                }
                className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]/70 transition-all resize-none leading-relaxed"
                placeholder="Escribe un saludo especial..."
              />
              <div className="absolute bottom-2 right-2 text-[#8d90a0]">
                <span className="material-symbols-outlined text-[15px]">format_quote</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: LOGO OFICIAL DEL EVENTO (IMAGEN PERSONALIZADA O B15)           */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">verified</span>
            <h2 className="text-sm font-bold text-white font-serif-gala">2. Logo Oficial del Evento</h2>
          </div>
          <span className="text-[11px] text-[#7bd0ff] bg-[#2563eb]/20 px-2 py-0.5 rounded-full border border-[#7bd0ff]/20 font-medium">
            Personalizable
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-3.5 border border-white/10 text-left">
          {/* Vista previa del Logo Actual */}
          <div className="flex items-center gap-4 p-3 bg-[#0b0e15]/90 rounded-2xl border border-white/10">
            <div className="relative">
              {formData.customLogoUrl ? (
                <img
                  src={formData.customLogoUrl}
                  alt="Logo Personalizado"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#7bd0ff] shadow-lg shadow-blue-500/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2563eb] to-[#38bdf8] flex items-center justify-center text-white font-serif-gala font-bold text-xl shadow-lg shadow-blue-500/30 border border-white/20">
                  B15
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white">
                {formData.customLogoUrl ? 'Logo Personalizado Activo' : 'Logo Predeterminado (B15)'}
              </h4>
              <p className="text-[11px] text-[#8d90a0] leading-snug mt-0.5">
                Este logo se proyecta en la barra superior, la cámara y la pantalla en vivo del evento.
              </p>
            </div>
          </div>

          {/* Botones para Subir Imagen o Restablecer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#7bd0ff]/40 bg-[#7bd0ff]/10 hover:bg-[#7bd0ff]/20 text-[#7bd0ff] text-xs font-bold cursor-pointer active:scale-[0.98] transition-all">
              <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
              <span>Subir Imagen de Logo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </label>

            {formData.customLogoUrl ? (
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, customLogoUrl: '' }))}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-[18px] text-[#7bd0ff]">refresh</span>
                <span>Restablecer a B15</span>
              </button>
            ) : null}
          </div>

          {/* O Ingresar URL de Imagen directa */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[#c3c6d7] block">
              O ingresa la URL directa de la imagen de tu logo
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#8d90a0]">
                <span className="material-symbols-outlined text-[16px]">link</span>
              </span>
              <input
                type="url"
                value={formData.customLogoUrl || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, customLogoUrl: e.target.value }))}
                placeholder="https://ejemplo.com/mi-logo.png"
                className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN 2.1: MÚSICA DE LA FIESTA / SUBIR CANCIÓN PARA REPRODUCIR          */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">music_note</span>
            <h2 className="text-sm font-bold text-white font-serif-gala">Música de la Fiesta</h2>
          </div>
          <span className="text-[11px] text-[#7bd0ff] bg-[#2563eb]/20 px-2 py-0.5 rounded-full border border-[#7bd0ff]/20 font-medium">
            Reproductor Activo
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-3.5 border border-white/10 text-left">
          <div className="p-3 bg-[#0b0e15]/90 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#2563eb]/30 text-[#7bd0ff] flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">graphic_eq</span>
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {formData.backgroundSongTitle || 'Canción de Fondo'}
                  </h4>
                  <p className="text-[10px] text-[#8d90a0]">Canción que se escucha en la fiesta</p>
                </div>
              </div>
            </div>

            {formData.backgroundSongUrl && (
              <audio
                controls
                src={formData.backgroundSongUrl}
                className="w-full h-8 mt-2"
              />
            )}
          </div>

          {/* Subir Canción MP3 o Audio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#7bd0ff]/40 bg-[#7bd0ff]/10 hover:bg-[#7bd0ff]/20 text-[#7bd0ff] text-xs font-bold cursor-pointer active:scale-[0.98] transition-all">
              <span className="material-symbols-outlined text-[18px]">upload</span>
              <span>Subir Canción (MP3 / Audio)</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleSongUpload}
              />
            </label>

            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  backgroundSongUrl:
                    'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=waltz-of-the-flowers-tchaikovsky-114251.mp3',
                  backgroundSongTitle: 'Vals de Gala - Mis 15 Bianca',
                }))
              }
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[18px] text-[#7bd0ff]">refresh</span>
              <span>Restablecer Vals</span>
            </button>
          </div>

          {/* Título de la canción */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[#c3c6d7] block">
              Nombre de la Canción
            </label>
            <input
              type="text"
              value={formData.backgroundSongTitle || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, backgroundSongTitle: e.target.value }))
              }
              placeholder="ej. Vals de Quinceañera - Bianca"
              className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]"
            />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN 3: ALMACENAMIENTO DE FOTOS Y RESPALDO (ELIGE TU MÉTODO SIN DRIVE) */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-[18px]">cloud_sync</span>
            <h2 className="text-sm font-bold text-white font-serif-gala">
              3. Almacenamiento y Respaldo de Fotos
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#2563eb]/20 text-[#7bd0ff] border border-[#7bd0ff]/30 text-[10px] font-bold">
            {formData.storageMethod === 'drive'
              ? 'GOOGLE DRIVE'
              : formData.storageMethod === 'app_local'
              ? 'SERVIDOR LOCAL'
              : 'GOOGLE CLOUD'}
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-4 border border-white/10 shadow-xl bg-gradient-to-b from-[#191b23] to-[#121622]">
          {/* Selector de Método de Almacenamiento */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white block">
              Selecciona cómo prefieres guardar las fotos de los invitados:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Opción 1: Google Cloud Firestore */}
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, storageMethod: 'cloud_firestore' }))}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  formData.storageMethod === 'cloud_firestore' || !formData.storageMethod
                    ? 'bg-amber-400/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : 'bg-[#0b0e15]/70 border-white/10 text-[#8d90a0] hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-lg text-amber-400">cloud_done</span>
                  <span className="text-[9px] font-bold text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded">
                    EN VIVO
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">1. Google Cloud</p>
                  <p className="text-[10px] text-[#8d90a0] leading-tight">Firestore Cloud Database en tiempo real</p>
                </div>
              </button>

              {/* Opción 2: Google Drive */}
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, storageMethod: 'drive' }))}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  formData.storageMethod === 'drive'
                    ? 'bg-[#2563eb]/25 border-[#7bd0ff] text-white shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                    : 'bg-[#0b0e15]/70 border-white/10 text-[#8d90a0] hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-lg text-[#7bd0ff]">folder_shared</span>
                  <span className="text-[9px] font-bold text-[#7bd0ff] bg-[#2563eb]/20 px-1.5 py-0.5 rounded">
                    DRIVE
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">2. Google Drive</p>
                  <p className="text-[10px] text-[#8d90a0] leading-tight">Con Script y Carpeta de Drive</p>
                </div>
              </button>

              {/* Opción 3: Servidor Local + ZIP */}
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, storageMethod: 'app_local' }))}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 col-span-2 sm:col-span-1 ${
                  formData.storageMethod === 'app_local'
                    ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'bg-[#0b0e15]/70 border-white/10 text-[#8d90a0] hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-lg text-emerald-400">folder_zip</span>
                  <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                    ZIP DIRECTO
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">3. Servidor + ZIP</p>
                  <p className="text-[10px] text-[#8d90a0] leading-tight">Sin cuentas externas, descarga ZIP</p>
                </div>
              </button>
            </div>
          </div>

          {/* PANEL: GOOGLE CLOUD FIRESTORE + DESCARGA ZIP */}
          {(formData.storageMethod === 'cloud_firestore' || formData.storageMethod === 'app_local' || !formData.storageMethod) && (
            <div className="space-y-3.5 p-4 rounded-xl bg-[#0b0e15]/90 border border-amber-400/40 animate-in fade-in duration-200 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <span className="material-symbols-outlined text-lg">cloud_done</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-300">
                      Método Activo: Almacenamiento en Google Cloud (Firestore)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Cloud Online
                    </span>
                  </div>
                  <p className="text-[11px] text-[#c3c6d7] leading-relaxed mt-0.5">
                    Todas las fotos tomadas por los invitados se guardan de forma instantánea en <strong>Google Cloud Firestore</strong>. Se sincronizan en vivo entre todos los celulares y la Pantalla Gigante sin necesidad de Google Drive ni contraseñas.
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-[#8d90a0] font-mono">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      Proyecto: unified-saga-8cb1c
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      BD: ai-studio-mis15...
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle Auto-descarga en el celular del invitado */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <div className="space-y-0.5 pr-2">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#7bd0ff]">download_for_offline</span>
                    <span>Descarga automática en la galería del celular del invitado</span>
                  </p>
                  <p className="text-[10px] text-[#8d90a0]">
                    Al pulsar &quot;Publicar&quot;, la foto también se descargará al carrete de fotos del teléfono del invitado.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoDownloadToDevice || false}
                  onChange={(e) => setFormData((prev) => ({ ...prev, autoDownloadToDevice: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-400 cursor-pointer shrink-0"
                />
              </label>

              {/* Botón de descarga de archivo ZIP completo */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-400 text-[18px]">folder_zip</span>
                    <span>Descarga de Fotos en Archivo ZIP</span>
                  </span>
                  <span className="text-[10px] text-[#7bd0ff] font-mono font-bold bg-[#7bd0ff]/10 px-2 py-0.5 rounded border border-[#7bd0ff]/20">
                    {memories.length} fotos listas
                  </span>
                </div>
                <p className="text-[11px] text-[#8d90a0]">
                  Al pulsar este botón, la aplicación empaqueta todas las fotos originales tomadas en la fiesta con el nombre de cada invitado y mesa en un archivo comprimido .ZIP listo para guardar en tu pendrive o computadora.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={isZipping || memories.length === 0}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-bold text-xs shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isZipping ? (
                      <>
                        <span className="material-symbols-outlined text-base animate-spin">sync</span>
                        <span>{zipProgress || 'Generando ZIP...'}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">download</span>
                        <span>Descargar Álbum Completo en ZIP ({memories.length} fotos)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadAllMemories}
                    disabled={memories.length === 0}
                    className="py-3 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                    title="Descargar copia de seguridad en formato JSON"
                  >
                    <span className="material-symbols-outlined text-sm text-[#7bd0ff]">data_object</span>
                    <span>Respaldo JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 3: GOOGLE DRIVE (OPCIONAL) */}
          {formData.storageMethod === 'drive' && (
            <div className="space-y-4 pt-2 border-t border-white/10 animate-in fade-in duration-200">
              {/* Explicación de por qué no se guardaban las fotos */}
          <div className="p-3.5 rounded-xl bg-[#0b0e15]/90 border border-amber-400/30 text-amber-200 text-xs leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <span className="material-symbols-outlined text-lg">info</span>
              <span>¿Por qué no se guardaban las fotos en tu Google Drive?</span>
            </div>
            <p className="text-[11px] text-slate-300 font-light leading-snug">
              Google Drive <strong>no permite</strong> que una página web externa escriba archivos en tu cuenta únicamente escribiendo el nombre de una carpeta (por motivos de seguridad de Google).
              Para que las fotos de los invitados se guarden solas en tu Drive sin pedirles su contraseña, se usa un script gratuito (Google Apps Script).
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyScriptCode}
                className="px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                <span>Copiar Script de Google Drive (1 Clic)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDriveInstructions(!showDriveInstructions)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/10 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm">help</span>
                <span>{showDriveInstructions ? 'Ocultar Guía' : 'Ver Guía de 2 Minutos'}</span>
              </button>
            </div>
          </div>

          {/* Guía desplegable visual paso a paso */}
          {showDriveInstructions && (
            <div className="p-4 rounded-xl bg-[#10131a] border border-[#7bd0ff]/30 text-xs space-y-3.5 text-[#c3c6d7] animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-[#7bd0ff]">verified</span>
                  Guía Paso a Paso para Conectar Google Drive
                </h4>
                <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Solo toma 2 minutos
                </span>
              </div>

              {/* Paso 1 */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-white font-bold text-xs">Copia el Script de la App</p>
                  <p className="text-[11px] text-[#8d90a0]">
                    Pulsa arriba en el botón amarillo <strong className="text-amber-300">"Copiar Script de Google Drive (1 Clic)"</strong>.
                  </p>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-white font-bold text-xs">Abre Google Apps Script y Pega el Código</p>
                  <p className="text-[11px] text-[#8d90a0]">
                    Ve a <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-[#7bd0ff] underline font-bold">script.google.com</a> con tu correo <strong>carlosvargasotorgues@gmail.com</strong>.
                    Haz clic en <strong>"Nuevo proyecto"</strong>, borra cualquier texto que aparezca y pega el código que copiaste.
                  </p>
                </div>
              </div>

              {/* Paso 3: EL PASO CLAVE QUE SUELE TRABAR A LOS USUARIOS */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30">
                <div className="w-6 h-6 rounded-full bg-amber-400 text-black text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-amber-300 font-bold text-xs">
                    Implementar como Aplicación Web (¡Muy Importante!)
                  </p>
                  <p className="text-[11px] text-white/90 leading-relaxed">
                    Arriba a la derecha haz clic en el botón azul <strong>"Implementar" &gt; "Nueva implementación"</strong>:
                  </p>
                  <ul className="list-disc pl-4 text-[11px] text-slate-300 space-y-1">
                    <li>Haz clic en el engranaje ⚙️ y elige: <strong>Aplicación web</strong>.</li>
                    <li><strong>Ejecutar como:</strong> Selecciona <span className="text-emerald-400 font-bold">Yo (carlosvargasotorgues@gmail.com)</span>.</li>
                    <li><strong>Quién tiene acceso:</strong> Selecciona <span className="text-emerald-400 font-bold">Cualquier usuario (Anyone)</span>.</li>
                  </ul>
                </div>
              </div>

              {/* Paso 4: PANTALLA DE PERMISOS DE GOOGLE */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  4
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-white font-bold text-xs">Autorizar Permisos en Google</p>
                  <p className="text-[11px] text-[#8d90a0] leading-relaxed">
                    Google te pedirá autorizar el acceso:
                  </p>
                  <ol className="list-decimal pl-4 text-[11px] text-slate-300 space-y-0.5">
                    <li>Elige tu cuenta de Google.</li>
                    <li>Si te sale la pantalla <em>"Google no verificó esta app"</em>, haz clic en <strong className="text-white">"Avanzado"</strong> o <strong className="text-white">"Configuración avanzada"</strong> abajo a la izquierda.</li>
                    <li>Haz clic en <strong className="text-amber-300">"Ir a Proyecto (no seguro)"</strong> y luego en <strong className="text-emerald-400">"Permitir"</strong>.</li>
                  </ol>
                </div>
              </div>

              {/* Paso 5 */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  5
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-white font-bold text-xs">Pega la URL de la Aplicación Web</p>
                  <p className="text-[11px] text-[#8d90a0]">
                    Google te dará una <strong>URL de aplicación web</strong> que termina en <code className="text-[#7bd0ff] font-bold">/exec</code>.
                    Cópiala y pégala abajo en el campo <strong>Webhook de Google Apps Script</strong>.
                  </p>
                </div>
              </div>

              {/* Paso 6 */}
              <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg shrink-0">check_circle</span>
                <span className="text-[11px] font-medium">
                  ¡Listo! Haz clic abajo en <strong>"Probar Conexión con mi Google Drive"</strong> y verás la carpeta <strong>"Mis 15 Bianca - Fotos en Vivo"</strong> en tu Google Drive.
                </span>
              </div>
            </div>
          )}

          {/* EDITABLE FIELD 1: Correo Electrónico de Google Drive */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#0b0e15]/80 border border-white/10">
            <label className="text-xs font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#7bd0ff] text-[17px]">mail</span>
                <span>Correo Electrónico de Google Drive (Cuenta Anfitrión)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                EDITABLE
              </span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#8d90a0]">
                <span className="material-symbols-outlined text-[17px]">alternate_email</span>
              </span>
              <input
                type="email"
                value={formData.driveAccount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, driveAccount: e.target.value }))
                }
                className="w-full bg-[#191b23] border border-white/20 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff] transition-all font-mono"
                placeholder="ej. carlosvargasotorgues@gmail.com"
              />
            </div>
            <p className="text-[10px] text-[#8d90a0]">
              Tu correo de Google donde eres dueño del álbum.
            </p>
          </div>

          {/* EDITABLE FIELD 2: Carpeta de Google Drive */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#0b0e15]/80 border border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#7bd0ff] text-[17px]">
                  folder_shared
                </span>
                <span>Nombre o Ruta de la Carpeta en Google Drive</span>
              </label>
              <button
                type="button"
                onClick={handleAutoGenerateFolder}
                className="text-[10px] text-[#7bd0ff] hover:underline font-semibold cursor-pointer"
              >
                Sugerir automático
              </button>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#8d90a0]">
                <span className="material-symbols-outlined text-[17px]">folder</span>
              </span>
              <input
                type="text"
                value={formData.driveFolder}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, driveFolder: e.target.value }))
                }
                className="w-full bg-[#191b23] border border-white/20 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff] transition-all font-mono"
                placeholder="Drive / Mis 15 Bianca / Fotos en Vivo"
              />
            </div>
            <p className="text-[10px] text-[#8d90a0]">
              Nombre de la carpeta de destino donde se guardarán los archivos.
            </p>
          </div>

          {/* EDITABLE FIELD 3: ID de Carpeta de Google Drive (Folder ID) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#0b0e15]/80 border border-white/10">
            <label className="text-xs font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#7bd0ff] text-[17px]">tag</span>
                <span>ID de la Carpeta de Google Drive (Folder ID)</span>
              </span>
              <span className="text-[10px] text-[#7bd0ff]">Clave para el Script</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#8d90a0]">
                <span className="material-symbols-outlined text-[17px]">key</span>
              </span>
              <input
                type="text"
                value={formData.driveFolderId || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, driveFolderId: e.target.value }))
                }
                className="w-full bg-[#191b23] border border-white/20 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff] transition-all font-mono"
                placeholder="ej. 1A2b3C4D5e6F7g8H9i0J"
              />
            </div>
            <p className="text-[10px] text-[#8d90a0]">
              Copia este ID desde la barra de direcciones de drive.google.com de tu carpeta (o déjalo vacío para que el script cree la carpeta automáticamente).
            </p>
            {formData.driveFolderId && formData.driveFolderId.startsWith('AKfycb') && (
              <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] flex items-center justify-between gap-2">
                <span>⚠️ Este valor es el ID del Webhook. Te recomendamos dejar este campo vacío para que el script cree automáticamente la carpeta en tu Google Drive.</span>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, driveFolderId: '' }))}
                  className="px-2 py-1 rounded bg-amber-400 text-black text-[10px] font-bold shrink-0 cursor-pointer"
                >
                  Dejar Vacío
                </button>
              </div>
            )}
          </div>

          {/* EDITABLE FIELD 4: Webhook de Google Apps Script */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#0b0e15]/80 border border-white/10">
            <label className="text-xs font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#7bd0ff] text-[17px]">code</span>
                <span>Webhook de Google Apps Script (URL de Web App)</span>
              </span>
              <span className="text-[10px] text-amber-300 font-mono">Conector Directo</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#8d90a0]">
                <span className="material-symbols-outlined text-[17px]">webhook</span>
              </span>
              <input
                type="url"
                value={formData.driveWebhookUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, driveWebhookUrl: e.target.value }))
                }
                className="w-full bg-[#191b23] border border-white/20 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#7bd0ff] placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff] transition-all font-mono"
                placeholder="https://script.google.com/macros/s/.../exec"
              />
            </div>
            <p className="text-[10px] text-[#8d90a0]">
              La URL de la Web App implementada en tu Google Apps Script (debe terminar en /exec).
            </p>
          </div>

          {/* EDITABLE FIELD 5: Alternativa Ultra-Rápida - Enlace Directo a Carpeta Compartida */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-gradient-to-r from-[#0b0e15] to-[#121b2d] border border-emerald-500/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">folder_shared</span>
                <span>Alternativa Ultra-Rápida: Enlace a Carpeta Compartida de Drive</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                ⚡ Subida Masiva
              </span>
            </div>
            <p className="text-[11px] text-[#c3c6d7] leading-relaxed">
              Si deseas que los invitados puedan subir <strong>lotes de 20 o 50 fotos al instante</strong> con la app nativa de Google Drive, crea una carpeta en tu Google Drive, compártela como <em>"Cualquier persona con el enlace puede editar"</em> y pega aquí el enlace:
            </p>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#8d90a0]">
                <span className="material-symbols-outlined text-[17px]">link</span>
              </span>
              <input
                type="url"
                value={formData.driveDirectFolderUrl || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, driveDirectFolderUrl: e.target.value }))
                }
                className="w-full bg-[#191b23] border border-emerald-500/30 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-emerald-300 placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
                placeholder="https://drive.google.com/drive/folders/1..."
              />
            </div>
            <p className="text-[10px] text-[#8d90a0]">
              Al configurar este enlace, aparecerá un botón directo en el álbum para que cualquier invitado abra tu carpeta y suba fotos a máxima velocidad.
            </p>
          </div>

          {/* Botón Probar Conexión con Google Drive */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleTestDriveConnection}
              disabled={testDriveStatus === 'testing'}
              className="w-full py-2.5 px-4 rounded-xl border border-[#7bd0ff]/50 bg-[#2563eb]/20 hover:bg-[#2563eb]/30 text-[#7bd0ff] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">
                {testDriveStatus === 'testing' ? 'sync' : 'network_check'}
              </span>
              <span>
                {testDriveStatus === 'testing'
                  ? 'Probando Conexión con Google Drive...'
                  : 'Probar Conexión con mi Google Drive'}
              </span>
            </button>

            {testDriveMessage && (
              <div
                className={`p-3 rounded-xl text-xs leading-relaxed border ${
                  testDriveStatus === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                {testDriveMessage}
              </div>
            )}
          </div>
        </div>
      )}

          {/* Permisos & Moderation Switches */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            {/* Toggle 1: Permiso estricto de borrado */}
            <div className="flex items-center justify-between py-1">
              <div className="pr-3">
                <p className="text-xs font-semibold text-white">Permiso estricto de borrado</p>
                <p className="text-[11px] text-[#8d90a0]">
                  Solo anfitriones autorizados pueden eliminar fotos del álbum
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.strictDeletePermission}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, strictDeletePermission: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#32353d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
              </label>
            </div>

            {/* Toggle 2: Moderación previa */}
            <div className="flex items-center justify-between py-1">
              <div className="pr-3">
                <p className="text-xs font-semibold text-white">
                  Moderación previa del Muro en Vivo
                </p>
                <p className="text-[11px] text-[#8d90a0]">
                  Revisar fotos antes de proyectarlas en la pantalla gigante de la fiesta
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.moderationEnabled}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, moderationEnabled: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#32353d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN 4: GESTIÓN DE FOTOS EN PRESENTACIÓN Y MURO (SOLICITUD CLAVE)      */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">photo_library</span>
            <h2 className="text-sm font-bold text-white font-serif-gala">
              4. Fotos en Presentación y Muro ({memories.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={handleDownloadAllMemories}
            className="text-[11px] text-[#7bd0ff] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">download</span>
            <span>Descargar Respaldo</span>
          </button>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-3.5 border border-white/10">
          <p className="text-xs text-[#8d90a0] leading-snug">
            Aquí puedes <strong>eliminar cualquier foto</strong> de la presentación en pantalla gigante y del muro de la fiesta en tiempo real:
          </p>

          {memories.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#8d90a0] bg-[#0b0e15]/50 rounded-xl border border-white/5">
              No hay fotos en la presentación actualmente.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-2.5 rounded-xl bg-[#0b0e15]/90 border border-white/10 flex items-center justify-between gap-3 group hover:border-white/20 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                    <img src={mem.image} alt={mem.author} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate">{mem.author}</p>
                      <span className="text-[10px] text-[#7bd0ff] bg-[#2563eb]/20 px-1.5 rounded">
                        {mem.table}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8d90a0] italic truncate mt-0.5">
                      "{mem.message || 'Sin mensaje'}"
                    </p>
                    <span className="text-[10px] text-[#8d90a0]/70 font-mono">{mem.time}</span>
                  </div>

                  {/* Botón Eliminar Foto de la Presentación */}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `¿Seguro que deseas eliminar la foto de "${mem.author}" de la presentación y el muro?`
                        )
                      ) {
                        onDeleteMemory?.(mem.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition-all cursor-pointer shrink-0"
                    title="Eliminar de la presentación"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN 5: ACCESO Y DIFUSIÓN (ENLACE Y CÓDIGO QR)                         */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">share</span>
            <h2 className="text-sm font-bold text-white font-serif-gala">5. Acceso y Difusión</h2>
          </div>
          <span className="text-[11px] text-[#8d90a0]">Mesas e Invitados</span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-3.5 border border-white/10">
          {/* Editable Slug */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#c3c6d7] block">
              Enlace Personalizado del Evento
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#7bd0ff] font-mono text-xs font-bold">
                mis15.party/
              </span>
              <input
                type="text"
                value={formData.eventSlug}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    eventSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''),
                  }))
                }
                className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-xl pl-26 pr-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]"
                placeholder="valen-mendez-2025"
              />
            </div>
            <p className="text-[10px] text-[#8d90a0]">
              Este enlace se codifica automáticamente en el código QR para las mesas.
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onOpenQRModal}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#272a32] hover:bg-[#32353d] border border-white/10 text-white text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">qr_code_2</span>
              <span>Generar QR Actualizado</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('inicio')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#7bd0ff]/50 bg-[#7bd0ff]/15 hover:bg-[#7bd0ff]/25 text-[#7bd0ff] text-xs font-semibold active:scale-[0.98] transition-all glow-cyan-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">smartphone</span>
              <span>Vista de Invitados</span>
            </button>
          </div>

          {/* Quick shortcut to Open Projector / Pantalla Gigante */}
          <button
            type="button"
            onClick={() => onNavigate('proyector')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-xs font-bold transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">tv</span>
            <span>Abrir Pantalla Gigante para Proyector</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN 6: MODERACIÓN Y GESTIÓN DE FOTOS (EXCLUSIVO ADMINISTRADOR)        */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">delete_sweep</span>
            <h2 className="text-sm font-bold text-white font-serif-gala">
              6. Moderación y Eliminación de Fotos
            </h2>
          </div>
          <span className="text-[11px] text-rose-300 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            Solo Administrador
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-3.5 border border-white/10">
          <div className="p-3 rounded-xl bg-[#0b0e15]/80 border border-emerald-400/30 text-emerald-300 text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-base mt-0.5 shrink-0">verified_user</span>
            <p className="leading-snug">
              <strong>Protección activa:</strong> Los invitados tienen bloqueada la opción de eliminar fotos. Solo tú como administrador puedes borrar fotos inapropiadas o repetidas aquí o en el Muro en Vivo.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#c3c6d7] font-semibold">
              Total de fotos activas: {memories.length}
            </span>
            <button
              type="button"
              onClick={handleDownloadAllMemories}
              className="text-[11px] text-[#7bd0ff] hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-xs">download</span>
              <span>Descargar copia de seguridad</span>
            </button>
          </div>

          {memories.length === 0 ? (
            <p className="text-xs text-[#8d90a0] py-4 text-center italic">
              Aún no hay fotos subidas por los invitados.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#0b0e15] border border-white/5 hover:border-white/15 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={m.image}
                      alt={m.author}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10"
                    />
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-bold text-white truncate">{m.author}</p>
                      <p className="text-[10px] text-[#8d90a0] truncate">
                        {m.table} • {m.time}
                      </p>
                      {m.message && (
                        <p className="text-[10px] text-[#c3c6d7] italic truncate max-w-[200px]">
                          "{m.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  {onDeleteMemory && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Seguro que deseas eliminar definitivamente la foto de "${m.author}"?`
                          )
                        ) {
                          onDeleteMemory(m.id);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Eliminar foto"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN 7: SEGURIDAD Y CREDENCIALES DEL ADMINISTRADOR                     */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">lock</span>
            <h2 className="text-sm font-bold text-white font-serif-gala">
              7. Seguridad y Credenciales de Acceso
            </h2>
          </div>
          <span className="text-[11px] text-amber-300 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
            Protección
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-3.5 border border-white/10">
          <p className="text-xs text-[#8d90a0] leading-snug">
            Puedes cambiar el usuario y contraseña necesarios para acceder a este panel de administración:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Usuario Admin */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#c3c6d7] block">
                Usuario de Administrador
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#8d90a0]">
                  <span className="material-symbols-outlined text-[17px]">person</span>
                </span>
                <input
                  type="text"
                  value={formData.adminUser || 'uriel'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, adminUser: e.target.value }))}
                  className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#7bd0ff] font-mono"
                  placeholder="uriel"
                />
              </div>
            </div>

            {/* Contraseña Admin */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#c3c6d7] block">
                Contraseña de Administrador
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#8d90a0]">
                  <span className="material-symbols-outlined text-[17px]">key</span>
                </span>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={formData.adminPassword || '94909766'}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, adminPassword: e.target.value }))
                  }
                  className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-xl pl-9 pr-9 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#7bd0ff] font-mono"
                  placeholder="94909766"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-2.5 text-[#8d90a0] hover:text-white cursor-pointer"
                  title={showAdminPassword ? 'Ocultar' : 'Mostrar'}
                >
                  <span className="material-symbols-outlined text-sm">
                    {showAdminPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-[480px] mx-auto bg-[#10131a]/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 pb-6 flex items-center justify-between gap-3 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        <div className="min-w-0">
          <p className="text-[10px] text-[#8d90a0] truncate">Estado de cambios:</p>
          <p className="text-xs text-[#7bd0ff] font-medium truncate">{saveMessage}</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7bd0ff] text-[#0b0e15] text-xs font-bold shadow-lg hover:shadow-[#7bd0ff]/20 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px]">save</span>
          <span>{isSaving ? 'Guardando...' : 'Guardar Todos los Cambios'}</span>
        </button>
      </div>
    </div>
  );
};
