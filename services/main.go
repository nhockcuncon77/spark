package main

import (
	"spark/internal/cmd"
	"spark/internal/logger"
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"
)

var Version = "dev" // overridden at build/run time

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go cmd.StartGraphql(ctx)
	go cmd.StartGoFiber(ctx)
	go cmd.StartProxyServer(ctx)

	l := logger.NewLogger()
	l.Startup(Version)

	// Wait for SIGINT or SIGTERM
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	cancel()
	time.Sleep(2 * time.Second)
}
