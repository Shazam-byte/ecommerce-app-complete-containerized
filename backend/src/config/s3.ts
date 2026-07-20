import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const isS3Configured = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET_NAME
);

let s3Client: S3Client | null = null;

if (isS3Configured) {
  console.log("AWS_S3: Initializing AWS S3 client (AWS Cloud Ready).");
  s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
} else {
  console.log("AWS_S3: AWS S3 credentials missing. Using local disk fallback for static uploads.");
}

// Ensure the local uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Handle uploading a single file.
 * Returns the URL of the uploaded image.
 */
export async function uploadImageToS3(
  file: Express.Multer.File,
  appUrl: string = ""
): Promise<string> {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const fileExt = path.extname(file.originalname) || ".jpg";
  const fileName = `products/${uniqueId}${fileExt}`;

  // 1. Genuine AWS S3 Upload
  if (isS3Configured && s3Client) {
    const bucketName = process.env.AWS_S3_BUCKET_NAME!;
    const region = process.env.AWS_REGION || "us-east-1";
    
    // PutObject command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);
    
    // AWS S3 standard public URL
    return `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
  }

  // 2. Local Fallback (for local/preview environment execution)
  const localFilePath = path.join(UPLOADS_DIR, `${uniqueId}${fileExt}`);
  
  // Write the buffer to the uploads directory
  await fs.promises.writeFile(localFilePath, file.buffer);
  
  // Return a relative static server path
  const hostUrl = appUrl.replace(/\/$/, "") || "http://localhost:3000";
  return `${hostUrl}/uploads/${uniqueId}${fileExt}`;
}
