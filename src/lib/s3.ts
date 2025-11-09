import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

// Lazy initialization - read environment variables when first needed
// This ensures dotenv.config() has been called before we read env vars
let s3Client: S3Client | null = null;
let bucketName: string | null = null;

/**
 * Get or create the S3 client (lazy initialization)
 */
function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'default', // Contabo uses 'default' region
      endpoint: process.env.AWS_ENDPOINT,
      disableS3ExpressSessionAuth: true, // Required for Contabo Object Storage
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: true, // Required for S3-compatible services like Contabo
    });
  }
  return s3Client;
}

/**
 * Get the bucket name from environment variables
 */
function getBucketName(): string {
  if (bucketName === null) {
    bucketName = process.env.AWS_S3_BUCKET || '';
    
    // Log S3 configuration on first access (without sensitive data)
    console.log('S3 Configuration:', {
      region: process.env.AWS_REGION || 'eu-central-1',
      endpoint: process.env.AWS_ENDPOINT,
      bucket: bucketName,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    });
    
    if (!bucketName) {
      console.warn('⚠️  Warning: AWS_S3_BUCKET is not set in environment variables');
    }
  }
  return bucketName;
}

// Note: BUCKET_NAME is no longer exported as a constant to ensure lazy loading
// All functions use getBucketName() directly to read env vars when needed

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
    const bucket = getBucketName();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await getS3Client().send(command);
    return filePath;
  } catch (error) {
    console.error('S3 Upload Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      bucket: getBucketName(),
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
    Bucket: getBucketName(),
    Key: filePath,
  });

  await getS3Client().send(command);
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
    const bucket = getBucketName();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: filePath,
    });

    const url = await getSignedUrl(getS3Client(), command, { expiresIn });
    console.log('Generated download URL for:', filePath);
    return url;
  } catch (error) {
    console.error('S3 Get Download URL Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      bucket: getBucketName(),
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
    const bucket = getBucketName();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
      ContentType: contentType,
    });

    const url = await getSignedUrl(getS3Client(), command, { expiresIn });
    console.log('Generated upload URL for:', filePath);
    return url;
  } catch (error) {
    console.error('S3 Get Upload URL Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      bucket: getBucketName(),
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
      Bucket: getBucketName(),
      Key: filePath,
    });

    await getS3Client().send(command);
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
    Bucket: getBucketName(),
    Key: filePath,
  });

  const response = await getS3Client().send(command);
  
  return {
    size: response.ContentLength || 0,
    contentType: response.ContentType,
  };
};

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

/**
 * Download a file from S3 as a buffer
 * @param filePath - The path/key of the file
 * @returns Buffer with file contents and content type metadata
 */
export const getFileBuffer = async (
  filePath: string
): Promise<{ buffer: Buffer; contentType?: string }> => {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: filePath,
  });

  const response = await getS3Client().send(command);
  const body = response.Body;

  if (!body) {
    throw new Error('S3 object body is empty');
  }

  let buffer: Buffer;

  if (body instanceof Readable) {
    buffer = await streamToBuffer(body);
  } else if (body instanceof Uint8Array) {
    buffer = Buffer.from(body);
  } else {
    throw new Error(`Unsupported S3 body type: ${typeof body}`);
  }

  return {
    buffer,
    contentType: response.ContentType,
  };
};

// Export s3Client getter for backward compatibility
export { getS3Client as s3Client };

