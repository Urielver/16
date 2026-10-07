export function compressImage(
  dataUrlOrFile: File | string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    const processImageSrc = (src: string) => {
      // If not a data URL or small enough URL, return as is
      if (!src.startsWith('data:image')) {
        resolve(src);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let result = canvas.toDataURL('image/jpeg', quality);
        // If image is still larger than 400KB in base64, reduce quality slightly to ensure it saves cleanly to Cloud Firestore
        if (result.length > 400000) {
          result = canvas.toDataURL('image/jpeg', 0.65);
        }
        if (result.length > 500000) {
          result = canvas.toDataURL('image/jpeg', 0.55);
        }
        resolve(result);
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };

    if (typeof dataUrlOrFile === 'string') {
      processImageSrc(dataUrlOrFile);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          processImageSrc(e.target.result);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(dataUrlOrFile);
    }
  });
}
