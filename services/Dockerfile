# Build stage
FROM golang:1.24-alpine AS builder

ARG VERSION=dev

RUN apk --no-cache add \
    ca-certificates \
    tzdata \
    git

WORKDIR /build

# Copy go mod files and vendored deps (no network needed)
COPY services/go.mod services/go.sum ./
COPY services/vendor ./vendor

# Copy source code
COPY services/ .

# Build the binary with version (use vendor, no proxy access)
RUN CGO_ENABLED=0 GOOS=linux go build -mod=vendor -ldflags="-w -s -X main.Version=${VERSION}" -o spark .

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add \
    ca-certificates \
    tzdata \
    ffmpeg \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy built binary from builder stage
COPY --from=builder /build/spark .

# Copy .env file from root context and set ENVIRONMENT to empty for production
COPY .env* ./
RUN if [ -f .env ]; then sed -i 's/^ENVIRONMENT="DEV"/ENVIRONMENT=""/' .env; fi

RUN chmod +x spark

RUN addgroup -g 1001 appgroup && \
    adduser -D -u 1001 -G appgroup appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 9000

CMD ["./spark"]
