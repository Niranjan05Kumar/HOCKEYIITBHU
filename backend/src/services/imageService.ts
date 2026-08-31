import { toFile, type ImageKit } from '@imagekit/nodejs';

import {
  getImageKitConfig,
  imageKitClient,
} from '../config/imageKit.js';
import AppError from '../utils/appError.js';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const SAFE_FILE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export type ImageUploadInput = {
  file: Buffer;
  fileName: string;
  mimeType: string;
  folder?: string;
};

export type UploadedImage = {
  fileId: string;
  fileName: string;
  filePath?: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
};

const detectImageMimeType = (file: Buffer): string | null => {
  // JPEG
  if (
    file.length >= 3 &&
    file[0] === 0xff &&
    file[1] === 0xd8 &&
    file[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  // PNG
  if (
    file.length >= 8 &&
    file[0] === 0x89 &&
    file[1] === 0x50 &&
    file[2] === 0x4e &&
    file[3] === 0x47 &&
    file[4] === 0x0d &&
    file[5] === 0x0a &&
    file[6] === 0x1a &&
    file[7] === 0x0a
  ) {
    return 'image/png';
  }

  // GIF
  if (
    file.length >= 6 &&
    file.subarray(0, 6).toString('ascii') === 'GIF87a'
  ) {
    return 'image/gif';
  }

  if (
    file.length >= 6 &&
    file.subarray(0, 6).toString('ascii') === 'GIF89a'
  ) {
    return 'image/gif';
  }

  // WebP
  if (
    file.length >= 12 &&
    file.subarray(0, 4).toString('ascii') === 'RIFF' &&
    file.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
};

const validateImageUpload = (
  input: ImageUploadInput,
  maxFileSizeBytes: number,
): void => {
  if (!Buffer.isBuffer(input.file) || input.file.length === 0) {
    throw new AppError('An image file is required', 400);
  }

  const declaredMimeType = input.mimeType.trim().toLowerCase();

  if (!ALLOWED_IMAGE_TYPES.has(declaredMimeType)) {
    throw new AppError(
      'Unsupported image type. Allowed types: JPEG, PNG, WebP, GIF',
      400,
    );
  }

  if (input.file.length > maxFileSizeBytes) {
    throw new AppError(
      `Image file exceeds the ${maxFileSizeBytes}-byte size limit`,
      400,
    );
  }

  if (
    !SAFE_FILE_NAME.test(input.fileName) ||
    input.fileName.includes('..')
  ) {
    throw new AppError(
      'Image file name contains unsupported characters',
      400,
    );
  }

  const detectedMimeType = detectImageMimeType(input.file);

  if (!detectedMimeType) {
    throw new AppError(
      'Unable to verify the image file type',
      400,
    );
  }

  if (detectedMimeType !== declaredMimeType) {
    throw new AppError(
      'Image file type does not match its declared MIME type',
      400,
    );
  }
};

const toUploadedImage = (
  response: ImageKit.FileUploadResponse,
  input: ImageUploadInput,
): UploadedImage => {
  if (
    !response.fileId ||
    !response.url ||
    !response.name ||
    response.size === undefined
  ) {
    throw new AppError(
      'ImageKit returned an incomplete upload response',
      502,
    );
  }

  return {
    fileId: response.fileId,
    fileName: response.name,
    ...(response.filePath !== undefined
      ? { filePath: response.filePath }
      : {}),
    url: response.url,
    ...(response.thumbnailUrl !== undefined
      ? { thumbnailUrl: response.thumbnailUrl }
      : {}),
    mimeType: input.mimeType.trim().toLowerCase(),
    size: response.size,
    ...(response.width !== undefined
      ? { width: response.width }
      : {}),
    ...(response.height !== undefined
      ? { height: response.height }
      : {}),
  };
};

export const uploadImage = async (
  input: ImageUploadInput,
): Promise<UploadedImage> => {
  const { maxFileSizeBytes } = getImageKitConfig();

  validateImageUpload(input, maxFileSizeBytes);

  try {
    const response = await imageKitClient.files.upload({
      file: await toFile(input.file, input.fileName),
      fileName: input.fileName,
      ...(input.folder !== undefined
        ? { folder: input.folder }
        : {}),
    });

    return toUploadedImage(response, input);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Image upload failed', 502);
  }
};

export const deleteImage = async (
  fileId: string,
): Promise<void> => {
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    throw new AppError(
      'A valid ImageKit file ID is required',
      400,
    );
  }

  try {
    await imageKitClient.files.delete(fileId);
  } catch {
    throw new AppError('Image deletion failed', 502);
  }
};

export const getImageUploadLimit = (): number => {
  return getImageKitConfig().maxFileSizeBytes;
};