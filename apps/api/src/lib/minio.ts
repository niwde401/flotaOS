import { Client } from 'minio'

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'flotaos_minio',
  secretKey: process.env.MINIO_SECRET_KEY || 'flotaos_minio_secret',
})

export const BUCKET = process.env.MINIO_BUCKET || 'fleet-docs'

export async function ensureBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET)
  if (!exists) {
    await minioClient.makeBucket(BUCKET)
    await minioClient.setBucketPolicy(BUCKET, JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Deny',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${BUCKET}/*`],
      }],
    }))
    console.log(`MinIO bucket '${BUCKET}' created`)
  }
}

export async function getSignedUrl(objectName: string, expiry = 3600): Promise<string> {
  return minioClient.presignedGetObject(BUCKET, objectName, expiry)
}
