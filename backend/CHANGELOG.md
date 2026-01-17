# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2024-10-29

### Added - File Upload Feature

#### New Files
- `src/lib/s3.ts` - AWS S3 integration library
  - Upload files to S3
  - Delete files from S3
  - Generate presigned URLs (upload & download)
  - Check file existence
  - Get file metadata

- `src/routes/user-files.ts` - File management routes
  - POST `/api/files/upload-url` - Get presigned upload URL
  - POST `/api/files/confirm-upload` - Confirm file uploaded
  - POST `/api/files/upload` - Direct upload with base64
  - GET `/api/files` - List user files (paginated)
  - GET `/api/files/:fileId` - Get file details
  - GET `/api/files/:fileId/download-url` - Get download URL
  - DELETE `/api/files/:fileId` - Delete file

- `src/schemas/user-file.schemas.ts` - Validation schemas for file operations

#### Documentation
- `docs/FILES_API.md` - Complete API reference
- `docs/FILES_API_EXAMPLES.md` - Frontend integration examples
- `FILE_UPLOAD.md` - Comprehensive file upload guide

#### Updated Files
- `src/routes/index.ts` - Registered file routes
- `src/index.ts` - Added 'files' tag to Swagger
- `docs/API_SUMMARY.md` - Updated with file endpoints
- `ENV_SETUP.md` - Added AWS S3 configuration
- `package.json` - Added AWS SDK dependencies

#### Dependencies
- `@aws-sdk/client-s3@^3.x` - AWS S3 client
- `@aws-sdk/s3-request-presigner@^3.x` - Presigned URL generation
- `@sinclair/typebox@^0.x` - Schema validation

#### Environment Variables
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET=your-bucket-name
```

#### Features
- ✅ Two upload methods: presigned URLs (recommended) and direct upload
- ✅ File metadata tracking in PostgreSQL
- ✅ User-owned file access control
- ✅ Presigned download URLs with expiration
- ✅ File deletion with S3 cleanup
- ✅ Paginated file listing
- ✅ Frontend-controlled file path generation
- ✅ Complete Swagger/OpenAPI documentation

#### Database Schema
- `UserFile` model already existed in schema with proper relations
- No migration needed (model was already in place)

---

## [1.0.0] - Initial Release

### Features
- User authentication (email/password + Google OAuth)
- Library management with access control
- Library items (4 types with validation)
- Tags system
- Complete Swagger documentation
- Comprehensive API examples

### Models
- User
- Library
- LibraryAccess
- LibraryItem
- Tag
- UserFile (prepared for file uploads)

### API Endpoints
- Authentication (`/api/auth`)
- Users (`/api/users`)
- Libraries (`/api/libraries`)
- Library Access (`/api/libraries/:libraryId/access`)
- Library Items (`/api/libraries/:libraryId/items`)
- Tags (`/api/libraries/:libraryId/tags`)

---

## Future Enhancements

### Planned Features
- [ ] Link files to library items
- [ ] Image thumbnail generation
- [ ] File type restrictions
- [ ] Virus scanning
- [ ] Bulk upload
- [ ] File preview
- [ ] File versioning
- [ ] File sharing between users
- [ ] Multipart upload for large files
- [ ] Progress tracking for uploads
- [ ] File compression

### Under Consideration
- [ ] Image processing (resize, crop)
- [ ] Video transcoding
- [ ] PDF generation
- [ ] File templates
- [ ] Automatic cleanup of orphaned files
- [ ] File analytics and reporting

