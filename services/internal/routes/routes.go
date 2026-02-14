package routes

import (
	"spark/internal/handlers/ai"
	"spark/internal/handlers/chat"
	"spark/internal/handlers/fs"
	"spark/internal/handlers/webhooks"
	"spark/internal/middlewares"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
)

func Routes() *fiber.App {
	app := fiber.New(fiber.Config{
		BodyLimit:             8000 * 1024 * 1024,
		DisableStartupMessage: true,
	})
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, X-Karma-Admin-Auth",
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
	}))
	v1 := app.Group("/v1")

	fsRoutes := v1.Group("/fs")
	fsRoutes.Post("/upload", middlewares.IsUserVerified, fs.StoreUserFile)

	chatserviceRoutes := v1.Group("/chat")
	chatserviceRoutes.Post("/flush", chat.FlushHandler)
	chatserviceRoutes.Get("/ws/:chatId", middlewares.IsWebsocketVerified, websocket.New(chat.WSHandler))

	aiRoutes := v1.Group("/ai")
	aiRoutes.Get("/summarize_profile/:userId", middlewares.IsUserVerified, ai.GetProfileSummary)
	aiRoutes.Get("/chat", middlewares.IsWebsocketVerified, websocket.New(ai.AIChatHandler))

	// Register webhook routes for payment providers
	webhooks.RegisterWebhookRoutes(app)

	return app
}
