package cmd

import (
	"net/http"
	"strings"

	"spark/internal/constants"
)

func setCORSHeaders(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")

	if constants.IsOriginAllowed(origin) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
	}

	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Connection, Upgrade, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol, Cache-Control, X-N8n-Url, X-N8n-Action, X-N8n-Session, Chatkit-Frame-Instance-Id")
	w.Header().Set("Vary", "Origin")
}

func getFiberCORSOrigins() string {
	origins := constants.GetAllowedOrigins()
	return strings.Join(origins, ",")
}
