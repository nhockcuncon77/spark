package anal

import (
	"github.com/MelloB1989/karma/config"
	"github.com/posthog/posthog-go"
)

func CreatePostHogClient() (posthog.Client, error) {
	client, err := posthog.NewWithConfig(config.GetEnvRaw("POSTHOG_KEY"), posthog.Config{Endpoint: config.GetEnvRaw("POSTHOG_ENDPOINT")})
	if err != nil {
		return nil, err
	}

	return client, nil
}
