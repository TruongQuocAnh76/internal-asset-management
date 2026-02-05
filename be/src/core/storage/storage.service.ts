import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  constructor(private s3client: S3Client) {
    this.s3client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
  }
  async getTemporaryUploadUrl(filename: string) {
    return await getSignedUrl(
      this.s3client,
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: filename,
      }),
      { expiresIn: 3600 },
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.s3client.send(
        new HeadObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
        }),
      );
      return true;
    } catch (err) {
      if (err.$metadata.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    await this.s3client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
      }),
    );
  }
}
