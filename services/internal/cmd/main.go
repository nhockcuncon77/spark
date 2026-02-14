package cmd

import (
	"log"

	"github.com/joho/godotenv"
)

func Start() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: unable to load .env file: %v", err)
	}
}
