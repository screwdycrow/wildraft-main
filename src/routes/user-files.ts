import { FastifyInstance } from 'fastify';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import {
  uploadToS3,
  deleteFromS3,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  fileExistsInS3,
} from '../lib/s3';
import {
  uploadFileSchema,
  getUploadUrlSchema,
  confirmUploadSchema,
  getDownloadUrlSchema,
  listUserFilesSchema,
  deleteFileSchema,
  getFileSchema,
} from '../schemas/user-file.schemas';

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
        // If fileBuffer is provided, upload directly
        if (fileBuffer) {
          const buffer = Buffer.from(fileBuffer, 'base64');
          await uploadToS3(buffer, filePath, fileType);
        } else {
          // If no file buffer, just verify the path is valid
          // Frontend will handle the actual upload using presigned URL
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'fileBuffer is required for direct upload. Use /upload-url endpoint for presigned uploads.',
          });
        }

        // Create database record
        const userFile = await prisma.userFile.create({
          data: {
            userId,
            fileUrl: filePath,
            fileName,
            fileType,
            fileSize,
          },
        });

        return reply.code(201).send(userFile);
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

        // Create database record
        const userFile = await prisma.userFile.create({
          data: {
            userId,
            fileUrl: filePath,
            fileName,
            fileType,
            fileSize,
          },
        });

        return reply.code(201).send(userFile);
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

        return reply.code(200).send({
          files,
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

        return reply.code(200).send(file);
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

