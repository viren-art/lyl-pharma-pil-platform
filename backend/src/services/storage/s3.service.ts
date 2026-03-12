import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import { logger } from '../../utils/logger';

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-southeast-1',
    });
    this.bucketName = process.env.S3_BUCKET_NAME || 'pil-artwork-storage';
  }

  /**
   * Upload artwork file to S3
   */
  async uploadArtwork(
    file: Express.Multer.File,
    pilId: number,
    roundNumber: number,
    versionNumber: number
  ): Promise<string> {
    try {
      const fileName = `v${versionNumber}-${Date.now()}.pdf`;
      const key = `artwork-revisions/pil-${pilId}/round-${roundNumber}/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          pilId: pilId.toString(),
          roundNumber: roundNumber.toString(),
          versionNumber: versionNumber.toString(),
          originalName: file.originalname,
        },
      });

      await this.s3Client.send(command);

      logger.info('Artwork uploaded to S3', { key, pilId, roundNumber, versionNumber });

      return key;
    } catch (error) {
      logger.error('Failed to upload artwork to S3', { error, pilId, roundNumber });
      throw error;
    }
  }

  /**
   * Generate presigned URL for file download
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

  /**
   * Download file from S3
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const stream = response.Body as any;

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      logger.error('Failed to download file from S3', { error, key });
      throw error;
    }
  }

  /**
   * Calculate SHA-256 hash of file
   */
  async calculateFileHash(buffer: Buffer): Promise<string> {
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if ((error as any).name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}