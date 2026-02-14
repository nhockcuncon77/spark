package mailer

import "fmt"

// AccountDeletion returns a template for account deletion confirmation
func AccountDeletion(toEmail, code string) *Template {
	return &Template{
		ToEmail: toEmail,
		Subject: "Spark - Account Deletion Confirmation",
		Text: fmt.Sprintf(`Account Deletion Request

You have requested to delete your Spark account.

Your confirmation code is: %s

This code will expire in 15 minutes.

If you did not request this, please ignore this email and your account will remain safe.

- The Spark Team`, code),
		HTML: fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0D14; margin: 0; padding: 40px 20px;">
    <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(180deg, #1A0B2E 0%%, #0D0517 100%%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(138, 60, 255, 0.3);">
        <div style="background: linear-gradient(135deg, #6A1BFF 0%%, #8A3CFF 100%%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Spark</h1>
        </div>

        <div style="padding: 32px;">
            <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 16px 0;">Account Deletion Request</h2>

            <p style="color: rgba(255, 255, 255, 0.7); font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                You have requested to delete your Spark account. Use the code below to confirm this action.
            </p>

            <div style="background: rgba(138, 60, 255, 0.15); border: 2px solid rgba(138, 60, 255, 0.5); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Your Confirmation Code</p>
                <p style="color: #ffffff; font-size: 36px; font-weight: 700; margin: 0; letter-spacing: 8px;">%s</p>
            </div>

            <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">
                ⏱️ This code expires in <strong style="color: rgba(255, 255, 255, 0.8);">15 minutes</strong>
            </p>

            <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; line-height: 1.5; margin: 0;">
                ⚠️ If you did not request this, please ignore this email and your account will remain safe.
            </p>
        </div>

        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding: 20px; text-align: center;">
            <p style="color: rgba(255, 255, 255, 0.4); font-size: 12px; margin: 0;">© 2024 Spark. Built with love in India.</p>
        </div>
    </div>
</body>
</html>`, code),
	}
}
