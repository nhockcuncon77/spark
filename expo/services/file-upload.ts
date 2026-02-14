// File upload service for user photos
// Uses the FS API from services/internal/handlers/fs/users.go

import { config } from "@/constants/config";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

interface UploadedFile {
  id: string;
  uid: string;
  key: string;
  s3_path: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

interface UploadResult {
  success: boolean;
  files?: UploadedFile[];
  errors?: string[];
  error?: string;
}

/**
 * Get stored access token for authorization
 */
async function getAccessToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(config.ACCESS_TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(config.ACCESS_TOKEN_KEY);
}

/**
 * Upload user photos to the server
 * @param photos Array of photo URIs to upload
 * @param visibility Visibility setting: "public" or "private"
 */
export async function uploadUserPhotos(
  photos: { uri: string; key: string }[],
  visibility: string = "public",
): Promise<UploadResult> {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const formData = new FormData();

    // Build metadata for each file
    const fileMetadata = photos.map((photo) => ({
      key: photo.key,
      visibility: visibility,
    }));

    formData.append("body", JSON.stringify(fileMetadata));

    // Add each file to the form
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];

      // Handle different URI formats
      const fileUri = photo.uri;
      const fileName = photo.key || `photo_${i}.jpg`;
      const fileType = "image/jpeg";

      // @ts-expect-error - React Native FormData accepts this format
      formData.append(`file_${i}`, {
        uri: fileUri,
        name: fileName,
        type: fileType,
      });
    }

    const response = await fetch(`${config.api_host}/v1/fs/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Upload failed",
        errors: data.errors,
      };
    }

    return {
      success: true,
      files: data.data?.files || [],
      errors: data.data?.errors,
    };
  } catch (error) {
    console.error("Photo upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Get the S3 URLs from uploaded files
 */
export function getPhotoUrls(files: UploadedFile[]): string[] {
  return files.map((file) => file.s3_path);
}

export default { uploadUserPhotos, getPhotoUrls };
