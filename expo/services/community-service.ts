// Community Service - File upload with progress tracking
// Used for uploading media when creating posts

import { config } from "@/constants/config";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// ============= Types =============

export type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "FILE";

export interface UploadedMedia {
    id: string;
    url: string;
    type: MediaType;
    created_at: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface UploadResult {
    success: boolean;
    media?: UploadedMedia[];
    error?: string;
}

// ============= Helpers =============

async function getAccessToken(): Promise<string | null> {
    if (Platform.OS === "web") {
        return localStorage.getItem(config.ACCESS_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(config.ACCESS_TOKEN_KEY);
}

function getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith("image/")) return "IMAGE";
    if (mimeType.startsWith("video/")) return "VIDEO";
    if (mimeType.startsWith("audio/")) return "AUDIO";
    return "FILE";
}

function getMimeType(uri: string): string {
    const extension = uri.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        mp4: "video/mp4",
        mov: "video/quicktime",
        avi: "video/x-msvideo",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        m4a: "audio/mp4",
        pdf: "application/pdf",
    };
    return mimeTypes[extension] || "application/octet-stream";
}

// ============= Upload Functions =============

/**
 * Upload media files with progress tracking
 * @param files Array of file URIs with optional keys and types
 * @param onProgress Progress callback
 * @returns Upload result with media metadata
 */
export async function uploadMedia(
    files: { uri: string; key?: string; type?: "image" | "video" | "audio" | "file" }[],
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
    try {
        const token = await getAccessToken();
        if (!token) {
            return { success: false, error: "Not authenticated" };
        }

        const formData = new FormData();

        // Build metadata for each file
        const fileMetadata = files.map((file, index) => ({
            key: file.key || `community_media_${Date.now()}_${index}`,
            visibility: "public",
        }));

        formData.append("body", JSON.stringify(fileMetadata));

        // Add each file to the form
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const mimeType = getMimeType(file.uri);
            const fileName =
                file.key || `media_${i}.${file.uri.split(".").pop() || "bin"}`;

            // @ts-expect-error - React Native FormData accepts this format
            formData.append(`file_${i}`, {
                uri: file.uri,
                name: fileName,
                type: mimeType,
            });
        }

        // Use XMLHttpRequest for progress tracking
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    onProgress({
                        loaded: event.loaded,
                        total: event.total,
                        percentage: Math.round((event.loaded / event.total) * 100),
                    });
                }
            };

            xhr.onload = () => {
                try {
                    const response = JSON.parse(xhr.responseText);

                    if (xhr.status >= 200 && xhr.status < 300) {
                        const uploadedFiles = response.data?.files || [];
                        // Map media types from original file URIs since server key may not preserve extension
                        const media: UploadedMedia[] = uploadedFiles.map(
                            (f: { id: string; s3_path: string; created_at: string; key: string }, index: number) => {
                                // Use the original file's URI to determine media type
                                const originalFile = files[index];
                                const mediaType = originalFile?.type
                                    ? (originalFile.type.toUpperCase() as MediaType)
                                    : getMediaType(getMimeType(originalFile?.uri || f.key));
                                return {
                                    id: f.id,
                                    url: f.s3_path,
                                    type: mediaType,
                                    created_at: f.created_at,
                                };
                            }
                        );

                        resolve({ success: true, media });
                    } else {
                        resolve({
                            success: false,
                            error: response.message || "Upload failed",
                        });
                    }
                } catch {
                    resolve({ success: false, error: "Failed to parse response" });
                }
            };

            xhr.onerror = () => {
                resolve({ success: false, error: "Network error" });
            };

            xhr.open("POST", `${config.api_host}/v1/fs/upload`);
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.send(formData);
        });
    } catch (error) {
        console.error("Media upload error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Upload failed",
        };
    }
}

export default { uploadMedia };
