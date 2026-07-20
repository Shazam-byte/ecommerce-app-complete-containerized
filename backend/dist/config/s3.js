"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageToS3 = uploadImageToS3;
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const isS3Configured = !!(process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME);
let s3Client = null;
if (isS3Configured) {
    console.log("AWS_S3: Initializing AWS S3 client (AWS Cloud Ready).");
    s3Client = new client_s3_1.S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
}
else {
    console.log("AWS_S3: AWS S3 credentials missing. Using local disk fallback for static uploads.");
}
// Ensure the local uploads directory exists
const UPLOADS_DIR = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(UPLOADS_DIR)) {
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
/**
 * Handle uploading a single file.
 * Returns the URL of the uploaded image.
 */
async function uploadImageToS3(file, appUrl = "") {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const fileExt = path_1.default.extname(file.originalname) || ".jpg";
    const fileName = `products/${uniqueId}${fileExt}`;
    // 1. Genuine AWS S3 Upload
    if (isS3Configured && s3Client) {
        const bucketName = process.env.AWS_S3_BUCKET_NAME;
        const region = process.env.AWS_REGION || "us-east-1";
        // PutObject command
        const command = new client_s3_1.PutObjectCommand({
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
    const localFilePath = path_1.default.join(UPLOADS_DIR, `${uniqueId}${fileExt}`);
    // Write the buffer to the uploads directory
    await fs_1.default.promises.writeFile(localFilePath, file.buffer);
    // Return a relative static server path
    const hostUrl = appUrl.replace(/\/$/, "") || "http://localhost:3000";
    return `${hostUrl}/uploads/${uniqueId}${fileExt}`;
}
