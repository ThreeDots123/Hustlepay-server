import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from "../config/env";

export interface UploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
}

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>(CLOUDINARY_CLOUD_NAME),
      api_key: this.configService.getOrThrow<string>(CLOUDINARY_API_KEY),
      api_secret: this.configService.getOrThrow<string>(CLOUDINARY_API_SECRET),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        resource_type: "auto", // Automatically detect image, video, raw
      };

      if (folder) {
        uploadOptions.folder = folder;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              url: result.url,
              format: result.format || "raw",
              resource_type: result.resource_type,
              bytes: result.bytes,
              width: result.width,
              height: result.height,
            });
          } else {
            reject(new Error("Upload failed: No result returned"));
          }
        },
      );

      // Multer stores files in memory by default, so buffer should be available
      if (file.buffer) {
        uploadStream.end(file.buffer);
      } else {
        reject(new Error("File buffer is not available"));
      }
    });
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteFile(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    const deletePromises = publicIds.map((publicId) =>
      this.deleteFile(publicId),
    );
    await Promise.all(deletePromises);
  }
}
