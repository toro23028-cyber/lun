import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ── Cliente R2 (compatível com S3) ──────────────────────────────────────────
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

// ── Upload de arquivo (buffer do multer) ────────────────────────────────────
export async function uploadToR2(buffer, key, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    // Torna o objeto público (requer bucket com Public Access ativado)
    // Se preferir acesso privado, remova esta linha e use presigned URLs
    // ACL: "public-read",  // R2 não usa ACL — acesso é controlado pelo bucket
  }));
  return `${PUBLIC_URL}/${key}`;
}

// ── Deletar objeto ───────────────────────────────────────────────────────────
export async function deleteFromR2(key) {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// ── Gerar URL assinada (acesso temporário a objetos privados) ────────────────
export async function getPresignedUrl(key, expiresInSeconds = 3600) {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2, command, { expiresIn: expiresInSeconds });
}

// ── Listar objetos no bucket ─────────────────────────────────────────────────
export async function listObjects(prefix = "") {
  const result = await r2.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
  return result.Contents || [];
}
