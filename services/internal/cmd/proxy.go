package cmd

import (
	"context"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

var (
	graphqlTarget *url.URL
	fiberTarget   *url.URL
	graphqlProxy  *httputil.ReverseProxy
	fiberProxy    *httputil.ReverseProxy
)

func init() {
	graphqlTarget, _ = url.Parse("http://127.0.0.1:7777")
	fiberTarget, _ = url.Parse("http://127.0.0.1:8080")

	transport := &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   5 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		MaxIdleConns:          100,
		MaxIdleConnsPerHost:   100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   5 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		DisableCompression:    true,
	}

	graphqlProxy = &httputil.ReverseProxy{
		Director: func(req *http.Request) {
			req.URL.Scheme = graphqlTarget.Scheme
			req.URL.Host = graphqlTarget.Host
			req.Host = graphqlTarget.Host
		},
		Transport:    transport,
		ErrorHandler: silentErrorHandler,
	}

	fiberProxy = &httputil.ReverseProxy{
		Director: func(req *http.Request) {
			req.URL.Scheme = fiberTarget.Scheme
			req.URL.Host = fiberTarget.Host
			req.Host = fiberTarget.Host
		},
		Transport:    transport,
		ErrorHandler: silentErrorHandler,
	}
}

func silentErrorHandler(w http.ResponseWriter, r *http.Request, err error) {
	w.WriteHeader(http.StatusBadGateway)
}

func isWebSocketRequest(r *http.Request) bool {
	return strings.EqualFold(r.Header.Get("Upgrade"), "websocket") &&
		strings.Contains(strings.ToLower(r.Header.Get("Connection")), "upgrade")
}

func handleWebSocketProxy(w http.ResponseWriter, r *http.Request, targetHost string) {
	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	targetURL := "ws://" + targetHost + r.URL.Path
	if r.URL.RawQuery != "" {
		targetURL += "?" + r.URL.RawQuery
	}

	requestHeader := http.Header{}
	for key, values := range r.Header {
		switch key {
		case "Upgrade", "Connection", "Sec-Websocket-Key",
			"Sec-Websocket-Version", "Sec-Websocket-Extensions":
			continue
		default:
			for _, v := range values {
				requestHeader.Add(key, v)
			}
		}
	}

	backendConn, resp, err := dialer.Dial(targetURL, requestHeader)
	if err != nil {
		if resp != nil {
			w.WriteHeader(resp.StatusCode)
		} else {
			w.WriteHeader(http.StatusBadGateway)
		}
		return
	}
	defer backendConn.Close()

	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	clientConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer clientConn.Close()

	done := make(chan struct{})

	go func() {
		defer close(done)
		for {
			messageType, message, err := backendConn.ReadMessage()
			if err != nil {
				return
			}
			if err := clientConn.WriteMessage(messageType, message); err != nil {
				return
			}
		}
	}()

	go func() {
		for {
			messageType, message, err := clientConn.ReadMessage()
			if err != nil {
				backendConn.Close()
				return
			}
			if err := backendConn.WriteMessage(messageType, message); err != nil {
				return
			}
		}
	}()

	<-done
}

func handleWebSocketProxyRaw(w http.ResponseWriter, r *http.Request, targetHost string) {
	log.Printf("[Proxy] WebSocket connection request: %s -> %s", r.URL.Path, targetHost)

	hijacker, ok := w.(http.Hijacker)
	if !ok {
		log.Printf("[Proxy] Failed to hijack connection")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	targetURL := "ws://" + targetHost + r.URL.Path
	if r.URL.RawQuery != "" {
		targetURL += "?" + r.URL.RawQuery
	}

	// Use a dialer with TCP keep-alive enabled
	dialer := &net.Dialer{
		Timeout:   10 * time.Second,
		KeepAlive: 30 * time.Second,
	}

	backendConn, err := dialer.Dial("tcp", targetHost)
	if err != nil {
		log.Printf("[Proxy] Failed to dial backend: %v", err)
		w.WriteHeader(http.StatusBadGateway)
		return
	}

	if tcpConn, ok := backendConn.(*net.TCPConn); ok {
		tcpConn.SetKeepAlive(true)
		tcpConn.SetKeepAlivePeriod(30 * time.Second)
	}

	r.URL, _ = url.Parse(targetURL)
	r.Host = targetHost
	if err := r.Write(backendConn); err != nil {
		backendConn.Close()
		w.WriteHeader(http.StatusBadGateway)
		return
	}

	clientConn, clientBuf, err := hijacker.Hijack()
	if err != nil {
		backendConn.Close()
		return
	}

	if tcpConn, ok := clientConn.(*net.TCPConn); ok {
		tcpConn.SetKeepAlive(true)
		tcpConn.SetKeepAlivePeriod(30 * time.Second)
	}

	log.Printf("[Proxy] WebSocket proxy established: %s", r.URL.Path)

	// Use a done channel to coordinate shutdown
	done := make(chan struct{})

	// Backend -> Client
	go func() {
		defer close(done)
		defer backendConn.Close()
		defer clientConn.Close()
		n, err := io.Copy(clientConn, backendConn)
		log.Printf("[Proxy] Backend->Client closed: bytes=%d, err=%v", n, err)
	}()

	// Client -> Backend
	go func() {
		defer backendConn.Close()
		defer clientConn.Close()
		if clientBuf.Reader.Buffered() > 0 {
			io.CopyN(backendConn, clientBuf, int64(clientBuf.Reader.Buffered()))
		}
		n, err := io.Copy(backendConn, clientConn)
		log.Printf("[Proxy] Client->Backend closed: bytes=%d, err=%v", n, err)
	}()

	// Wait for one direction to close
	<-done
	log.Printf("[Proxy] WebSocket proxy closed: %s", r.URL.Path)
}

func proxyHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	switch {
	case path == "/query" || strings.HasPrefix(path, "/query/"):
		if isWebSocketRequest(r) {
			handleWebSocketProxyRaw(w, r, "127.0.0.1:7777")
			return
		}
		graphqlProxy.ServeHTTP(w, r)

	case path == "/playground" || strings.HasPrefix(path, "/playground/"):
		if isWebSocketRequest(r) {
			handleWebSocketProxyRaw(w, r, "127.0.0.1:7777")
			return
		}
		graphqlProxy.ServeHTTP(w, r)

	default:
		if isWebSocketRequest(r) {
			handleWebSocketProxyRaw(w, r, "127.0.0.1:8080")
			return
		}
		fiberProxy.ServeHTTP(w, r)
	}
}

func StartProxyServer(ctx context.Context) error {
	server := &http.Server{
		Addr:              ":9000",
		Handler:           http.HandlerFunc(proxyHandler),
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		server.Shutdown(shutdownCtx)
	}()

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}
	return nil
}
