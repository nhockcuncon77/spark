package anal

import (
	"log"

	"github.com/MelloB1989/karma/config"
	"github.com/posthog/posthog-go"
)

type AnalyticsEngine struct {
	client           posthog.Client
	UserProperties   map[string]any
	UniqueIdentifier string
}

func CreateAnalytics(uid string) *AnalyticsEngine {
	client, err := CreatePostHogClient()
	if err != nil {
		log.Println(err)
	}
	return &AnalyticsEngine{
		client:           client,
		UserProperties:   make(map[string]any, 20),
		UniqueIdentifier: uid,
	}
}

func (e *AnalyticsEngine) SetProperty(property Properties, val any) {
	e.UserProperties[string(property)] = val
}

func (e *AnalyticsEngine) SendEvent(event Events) {
	if config.GetEnvRaw("ENVIRONMENT") == "DEV" {
		return
	}
	e.client.Enqueue(posthog.Capture{
		DistinctId: e.UniqueIdentifier,
		Event:      string(event),
		Properties: e.UserProperties,
	})
}

func (e *AnalyticsEngine) SendRequestError(error Events, err any) {
	if config.GetEnvRaw("ENVIRONMENT") == "DEV" {
		return
	}
	e.SetProperty(ERROR_LIST, err)
	e.SetProperty(ERROR_TYPE, error)
	e.client.Enqueue(posthog.Capture{
		DistinctId: e.UniqueIdentifier,
		Event:      string(SERVER_ERROR),
		Properties: e.UserProperties,
	})
}
