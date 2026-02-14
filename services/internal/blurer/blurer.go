package blurer

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/MelloB1989/karma/files"
)

// BlurPhoto takes a photo URL and returns the blurred version URL
// It downloads the image, applies gaussian blur using ffmpeg, and uploads the result
func BlurPhoto(photoURL string, userId string) (string, error) {
	// Create temp directory for processing
	tempDir, err := os.MkdirTemp("", "blur-")
	if err != nil {
		return "", fmt.Errorf("failed to create temp dir: %w", err)
	}
	defer os.RemoveAll(tempDir)

	// Parse the URL to get the file extension
	ext := filepath.Ext(photoURL)
	if ext == "" {
		ext = ".jpg"
	}

	inputPath := filepath.Join(tempDir, "input"+ext)
	outputPath := filepath.Join(tempDir, "output"+ext)

	// Download the image
	if err := downloadFile(photoURL, inputPath); err != nil {
		return "", fmt.Errorf("failed to download image: %w", err)
	}

	// Apply blur using ffmpeg
	// sigma=30 provides a strong blur that obscures details
	cmd := exec.Command("ffmpeg",
		"-i", inputPath,
		"-vf", "gblur=sigma=30",
		"-y", // Overwrite output file
		outputPath,
	)
	if output, err := cmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("ffmpeg failed: %w, output: %s", err, string(output))
	}

	// Upload blurred image to S3 using karma/files
	blurredURL, err := uploadBlurredImage(outputPath, photoURL, userId)
	if err != nil {
		return "", fmt.Errorf("failed to upload blurred image: %w", err)
	}

	return blurredURL, nil
}

// BlurPhotos processes multiple photos and returns their blurred versions
func BlurPhotos(photoURLs []string, userId string) ([]string, error) {
	blurredURLs := make([]string, len(photoURLs))

	for i, url := range photoURLs {
		blurred, err := BlurPhoto(url, userId)
		if err != nil {
			// Log error but continue with other photos
			fmt.Printf("[WARN] Failed to blur photo %s: %v\n", url, err)
			blurredURLs[i] = url // Fall back to original
		} else {
			blurredURLs[i] = blurred
		}
	}

	return blurredURLs, nil
}

func downloadFile(url string, dest string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status: %s", resp.Status)
	}

	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}

func uploadBlurredImage(localPath string, originalURL string, userId string) (string, error) {
	// Create karma file handler for user's blurred photos directory
	kf := files.NewKarmaFile(fmt.Sprintf("spark/user_files/%s/blurred", userId), files.S3)

	// Generate blurred filename from original
	originalName := extractFilenameFromURL(originalURL)
	ext := filepath.Ext(originalName)
	blurredName := strings.TrimSuffix(originalName, ext) + "_blurred" + ext

	// Read the blurred file into bytes
	fileBytes, err := os.ReadFile(localPath)
	if err != nil {
		return "", fmt.Errorf("failed to read blurred file: %w", err)
	}

	// Convert bytes to multipart.FileHeader using karma helper
	fileHeader, err := files.BytesToMultipartFileHeader(fileBytes, blurredName)
	if err != nil {
		return "", fmt.Errorf("failed to create file header: %w", err)
	}

	// Upload using karma/files HandleSingleFileUpload
	blurredURL, err := kf.HandleSingleFileUpload(fileHeader)
	if err != nil {
		return "", fmt.Errorf("failed to upload blurred image: %w", err)
	}

	return blurredURL, nil
}

func extractFilenameFromURL(url string) string {
	// Get the last path component
	lastSlash := strings.LastIndex(url, "/")
	if lastSlash != -1 && lastSlash < len(url)-1 {
		return url[lastSlash+1:]
	}
	return "photo.jpg"
}
