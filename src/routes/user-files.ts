import { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import {
  uploadToS3,
  deleteFromS3,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  fileExistsInS3,
  getFileMetadata,
  getFileBuffer,
} from '../lib/s3';
import sharp from 'sharp';
import {
  uploadFileSchema,
  getUploadUrlSchema,
  confirmUploadSchema,
  getDownloadUrlSchema,
  listUserFilesSchema,
  deleteFileSchema,
  getFileSchema,
} from '../schemas/user-file.schemas';

/**
 * Helper function to add download URL to a UserFile object
 * Exported for use in other route files
 */
export async function enrichUserFileWithDownloadUrl(
  userFile: { fileUrl: string; [key: string]: any } | null,
  expiresIn: number = 3600
): Promise<{ downloadUrl: string; [key: string]: any } | null> {
  if (!userFile) {
    return null;
  }
  try {
    const downloadUrl = await getSignedDownloadUrl(userFile.fileUrl, expiresIn);
    return {
      ...userFile,
      downloadUrl,
    };
  } catch (error) {
    // If URL generation fails, return the file without downloadUrl
    return {
      ...userFile,
      downloadUrl: null,
    };
  }
}

/**
 * Helper function to add download URLs to an array of UserFile objects
 * Uses Promise.all for parallel URL generation
 * Exported for use in other route files
 */
export async function enrichUserFilesWithDownloadUrls(
  userFiles: Array<{ fileUrl: string; [key: string]: any }>,
  expiresIn: number = 3600
): Promise<Array<{ downloadUrl: string; [key: string]: any }>> {
  return Promise.all(
    userFiles.map((file) => enrichUserFileWithDownloadUrl(file, expiresIn))
  );
}

export const userFileRoutes = async (fastify: FastifyInstance) => {
  /**
   * POST /api/files/upload
   * Upload a file directly to S3 (with file content in request body)
   */
  fastify.post(
    '/upload',
    {
      preHandler: authenticateToken,
      schema: uploadFileSchema,
    },
    async (request, reply) => {
      const { fileName, fileType, fileSize, filePath, fileBuffer } = request.body as {
        fileName: string;
        fileType: string;
        fileSize: number;
        filePath: string;
        fileBuffer?: string;
      };

      const userId = request.user!.userId;

      try {
        let buffer: Buffer | null = null;
        let finalFileType = fileType;

        // If fileBuffer is provided, upload directly
        if (fileBuffer) {
          buffer = Buffer.from(fileBuffer, 'base64');

          // Convert images to WebP using sharp when possible
          if (isOptimisableImageMime(fileType)) {
            try {
              const result = await convertImageToWebP(buffer, fileType, request.log);
              buffer = result.buffer;
              finalFileType = result.mimeType;
            } catch (optimiseError) {
              request.log.warn(
                { err: optimiseError },
                'Image conversion to WebP failed, falling back to original buffer'
              );
            }
          }

          await uploadToS3(buffer, filePath, finalFileType);
        } else {
          // If no file buffer, just verify the path is valid
          // Frontend will handle the actual upload using presigned URL
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'fileBuffer is required for direct upload. Use /upload-url endpoint for presigned uploads.',
          });
        }

        // Create database record
        const finalBufferSize = buffer?.length ?? fileSize;
        const userFile = await prisma.userFile.create({
          data: {
            userId,
            fileUrl: filePath,
            fileName,
            fileType: finalFileType,
            fileSize: finalBufferSize,
          },
        });

        // Add download URL to response
        const enrichedFile = await enrichUserFileWithDownloadUrl(userFile);
        return reply.code(201).send(enrichedFile);
      } catch (error) {
        request.log.error({ error }, 'Failed to upload file');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to upload file',
        });
      }
    }
  );

  /**
   * POST /api/files/upload-url
   * Get a presigned URL for uploading a file directly to S3 from the frontend
   */
  fastify.post(
    '/upload-url',
    {
      preHandler: authenticateToken,
      schema: getUploadUrlSchema,
    },
    async (request, reply) => {
      const { fileName, fileType, fileSize, filePath } = request.body as {
        fileName: string;
        fileType: string;
        fileSize: number;
        filePath: string;
      };

      try {
        // Generate presigned URL (valid for 1 hour)
        const uploadUrl = await getSignedUploadUrl(filePath, fileType, 3600);

        return reply.code(200).send({
          uploadUrl,
          filePath,
          expiresIn: 3600,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to generate upload URL');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to generate upload URL',
        });
      }
    }
  );

  /**
   * POST /api/files/confirm-upload
   * Confirm that a file has been uploaded to S3 and create database record
   */
  fastify.post(
    '/confirm-upload',
    {
      preHandler: authenticateToken,
      schema: confirmUploadSchema,
    },
    async (request, reply) => {
      const { fileName, fileType, fileSize, filePath } = request.body as {
        fileName: string;
        fileType: string;
        fileSize: number;
        filePath: string;
      };

      const userId = request.user!.userId;

      try {
        // Verify file exists in S3
        const exists = await fileExistsInS3(filePath);
        if (!exists) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'File does not exist in S3. Please upload the file first.',
          });
        }

          const metadata = await getFileMetadata(filePath);
          let finalFileType =
            metadata.contentType ?? fileType ?? 'application/octet-stream';
          let finalFileSize = metadata.size || fileSize;

          if (isOptimisableImageMime(finalFileType)) {
            try {
              const { buffer: originalBuffer, contentType } = await getFileBuffer(filePath);
              const originalMimeType = contentType ?? finalFileType;
              const result = await convertImageToWebP(
                originalBuffer,
                originalMimeType,
                request.log
              );

              // Always convert to WebP and overwrite in S3
              await uploadToS3(result.buffer, filePath, result.mimeType);
              finalFileType = result.mimeType;
              finalFileSize = result.buffer.length;
            } catch (optimiseError) {
              request.log.warn(
                { err: optimiseError },
                'Image conversion to WebP for presigned upload failed; keeping original file'
              );
            }
        }

        // Create database record
        const userFile = await prisma.userFile.create({
          data: {
            userId,
            fileUrl: filePath,
            fileName,
              fileType: finalFileType,
              fileSize: finalFileSize,
          },
        });

        // Add download URL to response
        const enrichedFile = await enrichUserFileWithDownloadUrl(userFile);
        return reply.code(201).send(enrichedFile);
      } catch (error) {
        request.log.error({ error }, 'Failed to confirm upload');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to confirm upload',
        });
      }
    }
  );

  /**
   * GET /api/files/:fileId/download-url
   * Get a presigned URL for downloading a file
   */
  fastify.get(
    '/:fileId/download-url',
    {
      preHandler: authenticateToken,
      schema: getDownloadUrlSchema,
    },
    async (request, reply) => {
      const { fileId } = request.params as { fileId: number };
      const userId = request.user!.userId;

      try {
        // Get file from database
        const file = await prisma.userFile.findUnique({
          where: { id: fileId },
        });

        if (!file) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'File not found',
          });
        }

        // Check if user owns the file
        if (file.userId !== userId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to access this file',
          });
        }

        // Generate presigned download URL (valid for 1 hour)
        const downloadUrl = await getSignedDownloadUrl(file.fileUrl, 3600);

        return reply.code(200).send({
          downloadUrl,
          fileName: file.fileName,
          expiresIn: 3600,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to generate download URL');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to generate download URL',
        });
      }
    }
  );

  /**
   * GET /api/files
   * List all files for the authenticated user
   */
  fastify.get(
    '/',
    {
      preHandler: authenticateToken,
      schema: listUserFilesSchema,
    },
    async (request, reply) => {
      const { limit = 50, offset = 0 } = request.query as {
        limit?: number;
        offset?: number;
      };
      const userId = request.user!.userId;

      try {
        const [files, total] = await Promise.all([
          prisma.userFile.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
          }),
          prisma.userFile.count({
            where: { userId },
          }),
        ]);

        // Add download URLs to all files
        const enrichedFiles = await enrichUserFilesWithDownloadUrls(files);

        return reply.code(200).send({
          files: enrichedFiles,
          total,
          limit,
          offset,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to list files');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to list files',
        });
      }
    }
  );

  /**
   * GET /api/files/:fileId
   * Get details about a specific file
   */
  fastify.get(
    '/:fileId',
    {
      preHandler: authenticateToken,
      schema: getFileSchema,
    },
    async (request, reply) => {
      const { fileId } = request.params as { fileId: number };
      const userId = request.user!.userId;

      try {
        const file = await prisma.userFile.findUnique({
          where: { id: fileId },
        });

        if (!file) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'File not found',
          });
        }

        // Check if user owns the file
        if (file.userId !== userId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to access this file',
          });
        }

        // Add download URL to response
        const enrichedFile = await enrichUserFileWithDownloadUrl(file);
        return reply.code(200).send(enrichedFile);
      } catch (error) {
        request.log.error({ error }, 'Failed to get file');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to get file',
        });
      }
    }
  );

  /**
   * DELETE /api/files/:fileId
   * Delete a file from S3 and database
   */
  fastify.delete(
    '/:fileId',
    {
      preHandler: authenticateToken,
      schema: deleteFileSchema,
    },
    async (request, reply) => {
      const { fileId } = request.params as { fileId: number };
      const userId = request.user!.userId;

      try {
        // Get file from database
        const file = await prisma.userFile.findUnique({
          where: { id: fileId },
        });

        if (!file) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'File not found',
          });
        }

        // Check if user owns the file
        if (file.userId !== userId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to delete this file',
          });
        }

        // Delete from S3
        await deleteFromS3(file.fileUrl);

        // Delete from database
        await prisma.userFile.delete({
          where: { id: fileId },
        });

        return reply.code(200).send({
          message: 'File deleted successfully',
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to delete file');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to delete file',
        });
      }
    }
  );
};


const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/tiff',
]);

const normaliseMimeType = (mime?: string | null): string =>
  (mime ?? '').toLowerCase();

const isOptimisableImageMime = (mime?: string | null): boolean =>
  SUPPORTED_IMAGE_TYPES.has(normaliseMimeType(mime));

async function convertImageToWebP(
  buffer: Buffer,
  mimeType: string,
  log: FastifyBaseLogger
): Promise<{ buffer: Buffer; mimeType: string }> {
  const normalisedMime = normaliseMimeType(mimeType);

  if (!SUPPORTED_IMAGE_TYPES.has(normalisedMime)) {
    log.debug({ mimeType }, 'Skipping conversion for unsupported image mime type');
    return { buffer, mimeType };
  }

  // If already WebP, just optimize it
  if (normalisedMime === 'image/webp') {
    const optimizedBuffer = await sharp(buffer)
      .rotate()
      .webp({ quality: 80, smartSubsample: true })
      .toBuffer();
    return { buffer: optimizedBuffer, mimeType: 'image/webp' };
  }

  // Convert all other image types to WebP
  const webpBuffer = await sharp(buffer)
    .rotate()
    .webp({ quality: 80, smartSubsample: true })
    .toBuffer();

  return { buffer: webpBuffer, mimeType: 'image/webp' };
}
