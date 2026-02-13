
import { UploadedFile } from '../types';

/**
 * Placeholder service for Cloud Storage / Firebase integration.
 */
export const cloudService = {
  uploadImage: async (file: File): Promise<UploadedFile> => {
    // Symulacja wysyłania do chmury (Google Cloud Storage / Firebase)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          name: file.name,
          url: reader.result as string,
          timestamp: Date.now()
        });
      };
      reader.readAsDataURL(file);
    });
  },

  checkLockStatus: (): boolean => {
    const hasUploaded = localStorage.getItem('MJ_APARAT_UPLOADED');
    return hasUploaded === 'true';
  },

  lockSystem: () => {
    localStorage.setItem('MJ_APARAT_UPLOADED', 'true');
  }
};
