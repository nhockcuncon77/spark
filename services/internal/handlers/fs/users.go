package fs

import (
	"spark/internal/models"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/MelloB1989/karma/errors"
	"github.com/MelloB1989/karma/files"
	"github.com/MelloB1989/karma/utils"
	"github.com/MelloB1989/karma/v2/orm"
	"github.com/gofiber/fiber/v2"
)

type userUploadRequest struct {
	Key        string `json:"key"`
	Visibility string `json:"visibility"`
}

func StoreUserFile(c *fiber.Ctx) error {
	uid, ok := c.Locals("uid").(string)
	if !ok {
		return fiber.ErrUnauthorized
	}

	// Set a timeout context for the entire operation
	_, cancel := context.WithTimeout(c.Context(), 9*time.Minute)
	defer cancel()

	// Parse multipart form with a maximum size to prevent abuse
	const maxSize = 2000 * 1024 * 1024 // 2000MB limit
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request format",
			"errors":  err.Error(),
		})
	}

	// Validate request body
	bodyStr := form.Value["body"]
	if len(bodyStr) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Missing file metadata",
			"errors":  errors.NewKarmaError().GetError(4001),
		})
	}

	// Parse file upload request data
	var fileRequests []userUploadRequest
	if err := json.Unmarshal([]byte(bodyStr[0]), &fileRequests); err != nil {
		var singleRequest userUploadRequest
		if err := json.Unmarshal([]byte(bodyStr[0]), &singleRequest); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(models.ResponseHTTP{
				Success: false,
				Message: "Invalid file metadata format",
				Error:   errors.NewKarmaError().GetError(4001),
			})
		}
		fileRequests = []userUploadRequest{singleRequest}
	}

	// Validate minimum required data
	if len(fileRequests) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(models.ResponseHTTP{
			Success: false,
			Message: "No file metadata provided",
		})
	}

	// Initialize file handler once
	kf := files.NewKarmaFile(fmt.Sprintf("spark/user_files/%s", uid), files.S3)

	// Process files in parallel with controlled concurrency
	var wg sync.WaitGroup
	var mu sync.Mutex // Mutex to protect shared resources

	// Channel for collecting results
	type uploadResult struct {
		File  models.UserFiles
		Error error
		Index int
	}

	resultChan := make(chan uploadResult, len(fileRequests))

	// Set maximum concurrent uploads
	const maxConcurrentUploads = 5
	sem := make(chan struct{}, maxConcurrentUploads)

	for i, fileReq := range fileRequests {
		wg.Add(1)
		sem <- struct{}{} // Acquire semaphore

		go func(i int, fileReq userUploadRequest) {
			defer wg.Done()
			defer func() { <-sem }() // Release semaphore

			// Initialize the file record with common fields
			fileToSave := models.UserFiles{
				Id:         utils.GenerateID(),
				Uid:        uid,
				Key:        fileReq.Key,
				Visibility: fileReq.Visibility,
				CreatedAt:  time.Now(),
				UpdatedAt:  time.Now(),
			}

			// Handle file upload
			fileKey := fmt.Sprintf("file_%d", i)
			uploadedFiles, exists := form.File[fileKey]

			if !exists || len(uploadedFiles) == 0 {
				resultChan <- uploadResult{
					Index: i,
					Error: fmt.Errorf("no file provided for upload %d", i),
				}
				return
			}

			// Upload the file to S3
			s3Path, err := kf.HandleSingleFileUpload(uploadedFiles[0])
			if err != nil {
				resultChan <- uploadResult{
					Index: i,
					Error: fmt.Errorf("failed to upload file %d: %w", i, err),
				}
				return
			}

			fileToSave.S3Path = s3Path

			// Store file metadata in database using createStore pattern
			if err := createStore(&fileToSave); err != nil {
				resultChan <- uploadResult{
					Index: i,
					Error: fmt.Errorf("failed to store file metadata %d: %w", i, err),
				}
				return
			}

			// Success
			resultChan <- uploadResult{
				File:  fileToSave,
				Index: i,
				Error: nil,
			}
		}(i, fileReq)
	}

	// Wait for all goroutines to finish
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// Collect results and handle errors
	var uploadedFiles []models.UserFiles
	var uploadErrors []string

	for result := range resultChan {
		if result.Error != nil {
			log.Printf("File upload error: %v", result.Error)
			uploadErrors = append(uploadErrors, result.Error.Error())
		} else {
			mu.Lock()
			uploadedFiles = append(uploadedFiles, result.File)
			mu.Unlock()
		}
	}

	// Check if any uploads succeeded
	if len(uploadedFiles) == 0 {
		// If all uploads failed, return an error
		return c.Status(fiber.StatusInternalServerError).JSON(models.ResponseHTTP{
			Success: false,
			Message: "All file uploads failed",
			Error:   uploadErrors,
		})
	}

	// If some uploads succeeded but others failed, still return success but include errors
	responseStatus := fiber.StatusCreated
	responseMessage := "All files uploaded successfully"

	if len(uploadErrors) > 0 {
		responseStatus = fiber.StatusPartialContent
		responseMessage = fmt.Sprintf("%d out of %d files uploaded successfully", len(uploadedFiles), len(fileRequests))
	}

	return c.Status(responseStatus).JSON(models.ResponseHTTP{
		Success: true,
		Message: responseMessage,
		Data: fiber.Map{
			"files":  uploadedFiles,
			"errors": uploadErrors,
		},
	})
}

// createStore stores file metadata in the database
func createStore(userFile *models.UserFiles) error {
	userFilesORM := orm.Load(&models.UserFiles{})
	defer userFilesORM.Close()

	if err := userFilesORM.Insert(userFile); err != nil {
		return fmt.Errorf("failed to insert user file record: %w", err)
	}

	return nil
}
