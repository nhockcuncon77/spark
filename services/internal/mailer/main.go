package mailer

import (
	"github.com/MelloB1989/karma/config"
	"github.com/MelloB1989/karma/mails"
	m "github.com/MelloB1989/karma/models"
)

type Template struct {
	ToEmail string
	Subject string
	Text    string
	HTML    string
}

func (t *Template) Send() error {
	km := mails.NewKarmaMail(config.GetEnvRaw("MAILER_ADDRESS"), mails.AWS_SES)

	// Send email
	if err := km.SendSingleMail(m.SingleEmailRequest{
		To: t.ToEmail,
		Email: m.Email{
			Subject: t.Subject,
			Body: m.EmailBody{
				Text: t.Text,
				HTML: t.HTML,
			},
		},
	}); err != nil {
		return err
	}

	return nil
}
