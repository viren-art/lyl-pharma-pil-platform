import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../../utils/logger';

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-southeast-1',
    });
    this.bucketName = process.env.S3_BUCKET_NAME || 'pil-documents';
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    key: string,
    body: Buffer,
    contentType: string
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      logger.info('File uploaded to S3', { key, contentType });

      return key;
    } catch (error) {
      logger.error('Failed to upload file to S3', { error, key });
      throw error;
    }
  }

  /**
   * Get presigned URL for file download
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      return url;
    } catch (error) {
      logger.error('Failed to generate presigned URL', { error, key });
      throw error;
    }
  }
}