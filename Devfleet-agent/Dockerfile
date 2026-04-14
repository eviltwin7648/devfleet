FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install dependencies for CGO if needed, though mostly standard go is fine
RUN apk add --no-cache git

# Copy go.mod and go.sum
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the agent
RUN CGO_ENABLED=0 GOOS=linux go build -o /devfleet-agent main.go

# Final minimal image
FROM alpine:latest

WORKDIR /app

# Install bash, ca-certificates (needed for web requests), and common tools that might be run by the agent
RUN apk --no-cache add ca-certificates bash curl jq

COPY --from=builder /devfleet-agent /usr/local/bin/devfleet-agent

ENTRYPOINT ["devfleet-agent"]
