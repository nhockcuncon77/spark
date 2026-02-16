package constants

import "strings"

func GetAllowedOrigins() []string {
	return []string{
		"http://localhost:3000",
		"http://localhost:3001",
		"http://localhost:4173",
		"http://localhost:4174",
		"http://localhost:5170",
		"http://localhost:5173",
		"http://localhost:8080",
		"http://localhost:9000",
		"https://spark-frontend-tlcj.onrender.com",
		"http://spark-frontend-tlcj.onrender.com",
	}
}

// IsOriginAllowed returns true if the origin is in the list or is any localhost/127.0.0.1 origin (for local dev).
func IsOriginAllowed(origin string) bool {
	if origin == "" {
		return false
	}
	if strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "http://127.0.0.1:") {
		return true
	}
	for _, o := range GetAllowedOrigins() {
		if o == origin {
			return true
		}
	}
	return false
}
