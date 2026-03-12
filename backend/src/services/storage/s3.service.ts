import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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

  async uploadDocument(buffer: Buffer, key: string): Promise<string> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: 'application/pdf',
        })
      );

      const path = `s3://${this.bucketName}/${key}`;
      logger.info('Document uploaded to S3', { path });
      return path;
    } catch (error) {
      logger.error('S3 upload failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async uploadJSON(data: any, key: string): Promise<string> {
    try {
      const buffer = Buffer.from(JSON.stringify(data, null, 2));
      
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: 'application/json',
        })
      );

      const path = `s3://${this.bucketName}/${key}`;
      logger.info('JSON uploaded to S3', { path });
      return path;
    } catch (error) {
      logger.error('S3 JSON upload failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async downloadDocument(path: string): Promise<Buffer> {
    try {
      const key = path.replace(`s3://${this.bucketName}/`, '');
      
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );

      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      logger.error('S3 download failed', {
        path,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}