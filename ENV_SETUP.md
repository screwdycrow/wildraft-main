# Environment Setup

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/wildraft?schema=public"

# JWT Secrets (change these!)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# Google OAuth (optional - for Google login)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# CORS (frontend URL)
CORS_ORIGIN=http://localhost:3000

# AWS S3 Configuration (for file uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=your-bucket-name
```

## Google OAuth Setup (Optional)

Only needed if you want Google login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Credentials → Create OAuth client ID → Web application
4. Add redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Secret to `.env`

## AWS S3 Setup (For File Uploads)

Required for file upload functionality:V

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Create an S3 bucket:
   - Choose a unique bucket name
   - Select your preferred region
   - Configure bucket settings (enable versioning if needed)
   - Set appropriate permissions (public or private based on your needs)
3. Create an IAM user with S3 access:
   - Go to IAM → Users → Create User
   - Attach policy: `AmazonS3FullAccess` (or create custom policy with limited permissions)
   - Generate access keys (Access Key ID and Secret Access Key)
4. Configure CORS on your S3 bucket (if uploading from frontend):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:3000"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
5. Copy credentials to `.env`:
   - `AWS_REGION`: Your bucket's region (e.g., `us-east-1`)
   - `AWS_ACCESS_KEY_ID`: Your IAM user's access key ID
   - `AWS_SECRET_ACCESS_KEY`: Your IAM user's secret access key
   - `AWS_S3_BUCKET`: Your bucket name


dev
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza192dWtBRXpuMXlqMk95M0xlcGtVQk4iLCJhcGlfa2V5IjoiMDFLOEJSMks1WlRRRFc1VFlTVjM4V0FFRkEiLCJ0ZW5hbnRfaWQiOiIzMjBmZTA2NjgxODhhNTA3ZjIwNDIyZGE1NzAzNGIwNDk5ZmFkNGYwODY0Mzk0MWMyZDQ2NDFmNmFhOGY0MmU1IiwiaW50ZXJuYWxfc2VjcmV0IjoiYzQ5N2ZmMGItZmEyNS00NGE4LTg1N2EtMmYxNzY1ODMyYzgyIn0.kVFbPeNt685t3ojXOiJjpwoh_ygwJTbCAfXx1QWDG10"
# Server
PORT=3000
HOST=0.0.0.0

AWS_REGION=default
AWS_ACCESS_KEY_ID = f66a41ec4ad9302424ba250803dfe75d
AWS_SECRET_ACCESS_KEY = 3f70e2947bc0ae20a12a155f3b9cfa76
AWS_S3_BUCKET = wildraft
AWS_ENDPOINT="https://eu2.contabostorage.com"

# Environment
NODE_ENV=development    
### File Upload Flow

The backend supports two upload methods:

1. **Presigned URL Upload (Recommended)**:
   - Frontend generates file path
   - Frontend requests presigned URL from backend (`POST /api/files/upload-url`)
   - Frontend uploads directly to S3 using presigned URL
   - Frontend confirms upload with backend (`POST /api/files/confirm-upload`)
   - Backend creates database record

2. **Direct Upload**:
   - Frontend encodes file as base64
   - Frontend sends file content to backend (`POST /api/files/upload`)
   - Backend uploads to S3 and creates database record

**Note**: The file path (`filePath`) is generated on the frontend and stored in the database. This allows the frontend to reconstruct the full S3 URL using its own configuration.

## Security

- ⚠️ Never commit `.env` to git
- Change JWT secrets before production
- Use HTTPS in production
- Restrict S3 bucket permissions appropriately
- Use IAM policies with least privilege principle
- Consider using S3 bucket policies to restrict access

See [QUICKSTART.md](./QUICKSTART.md) for complete setup instructions.
