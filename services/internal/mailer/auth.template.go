package mailer

import "fmt"

func BuildMagicLogin(email string, code string) *Template {
	return &Template{
		ToEmail: email,
		Subject: "Magic Login",
		Text:    fmt.Sprintf("Your magic login code is: %s", code),
		HTML:    fmt.Sprintf("<p>Your magic login code is: <strong>%s</strong></p>", code),
	}
}
