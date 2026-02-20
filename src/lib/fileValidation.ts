export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface FileValidationError {
  type: 'size' | 'type';
  message: string;
}

export const validateImageFile = (file: File): FileValidationError | null => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      type: 'size',
      message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`
    };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      type: 'type',
      message: `File type must be one of: ${ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')}. You provided: ${file.type}`
    };
  }

  return null;
};
