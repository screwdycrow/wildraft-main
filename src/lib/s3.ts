import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client (configured for Contabo Object Storage)
// Reference: https://dev.to/einlinuus/use-contabo-object-storage-with-nodejs-5b9l
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'default', // Contabo uses 'default' region
  endpoint: process.env.AWS_ENDPOINT,
  disableS3ExpressSessionAuth: true, // Required for Contabo Object Storage
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for S3-compatible services like Contabo
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || '';

// Log S3 configuration on startup (without sensitive data)
console.log('S3 Configuration:', {
  region: process.env.AWS_REGION || 'eu-central-1',
  endpoint: process.env.AWS_ENDPOINT,
  bucket: BUCKET_NAME,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
});

/**
 * Upload a file to S3
 * @param fileBuffer - The file buffer to upload
 * @param filePath - The path/key where the file will be stored in S3
 * @param contentType - The MIME type of the file
 * @returns The S3 path (key) of the uploaded file
 */
export const uploadToS3 = async (
  fileBuffer: Buffer,
  filePath: string,
  contentType: string
): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return filePath;
  } catch (error) {
    console.error('S3 Upload Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      bucket: BUCKET_NAME,
      key: filePath,
      endpoint: process.env.AWS_ENDPOINT,
    });
    throw error;
  }
};

/**
 * Delete a file from S3
 * @param filePath - The path/key of the file to delete
 */
export const deleteFromS3 = async (filePath: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filePath,
  });

  await s3Client.send(command);
};

/**
 * Generate a presigned URL for downloading a file
 * @param filePath - The path/key of the file
 * @param expiresIn - How long the URL should be valid (in seconds), defaults to 1 hour
 * @returns A signed URL that can be used to download the file
 */
export const getSignedDownloadUrl = async (
  filePath: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    console.log('Generated download URL for:', filePath);
    return url;
  } catch (error) {
    console.error('S3 Get Download URL Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      bucket: BUCKET_NAME,
      key: filePath,
    });
    throw error;
  }
};

/**
 * Generate a presigned URL for uploading a file
 * @param filePath - The path/key where the file will be uploaded
 * @param contentType - The MIME type of the file
 * @param expiresIn - How long the URL should be valid (in seconds), defaults to 1 hour
 * @returns A signed URL that can be used to upload the file
 */
export const getSignedUploadUrl = async (
  filePath: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    console.log('Generated upload URL for:', filePath);
    return url;
  } catch (error) {
    console.error('S3 Get Upload URL Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      bucket: BUCKET_NAME,
      key: filePath,
    });
    throw error;
  }
};

/**
 * Check if a file exists in S3
 * @param filePath - The path/key of the file to check
 * @returns True if the file exists, false otherwise
 */
export const fileExistsInS3 = async (filePath: string): Promise<boolean> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get file metadata from S3
 * @param filePath - The path/key of the file
 * @returns File metadata including size and content type
 */
export const getFileMetadata = async (
  filePath: string
): Promise<{ size: number; contentType: string | undefined }> => {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filePath,
  });

  const response = await s3Client.send(command);
  
  return {
    size: response.ContentLength || 0,
    contentType: response.ContentType,
  };
};

export { s3Client, BUCKET_NAME };

