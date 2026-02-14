package logger

import "go.uber.org/zap"

type Logger struct {
	logger *zap.Logger
}

func NewLogger() *Logger {
	logger, _ := zap.NewProduction()
	return &Logger{logger: logger}
}

func (l *Logger) Info(msg string, fields ...zap.Field) {
	l.logger.Info(msg, fields...)
}

func (l *Logger) Error(msg string, fields ...zap.Field) {
	l.logger.Error(msg, fields...)
}

func (l *Logger) Fatal(msg string, fields ...zap.Field) {
	l.logger.Fatal(msg, fields...)
}
