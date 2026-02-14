package mailer

import "fmt"

// NewMessage returns a template for new message notification
func NewMessage(toEmail, senderName, messagePreview string) *Template {
	if len(messagePreview) > 100 {
		messagePreview = messagePreview[:97] + "..."
	}

	return &Template{
		ToEmail: toEmail,
		Subject: "New message on Spark",
		Text: fmt.Sprintf(`You have a new message on Spark.

%s sent you a message:

"%s"

Open Spark to reply and continue the conversation.`, senderName, messagePreview),
		HTML: baseTemplate(
			"New message",
			fmt.Sprintf(`<strong>%s</strong> sent you a message`, senderName),
			messagePreview,
			"Open chat",
		),
	}
}

// ProfileViewed returns a template for profile view notification
func ProfileViewed(toEmail, viewerName string) *Template {
	return &Template{
		ToEmail: toEmail,
		Subject: "Someone viewed your profile on Spark",
		Text: fmt.Sprintf(`Someone viewed your profile on Spark.

%s checked out your profile.

Open Spark to see who’s interested.`, viewerName),
		HTML: baseTemplate(
			"Profile view",
			fmt.Sprintf(`<strong>%s</strong> viewed your profile`, viewerName),
			"",
			"View profile",
		),
	}
}

// SuperlikeReceived returns a template for superlike notification
func SuperlikeReceived(toEmail, senderName string) *Template {
	return &Template{
		ToEmail: toEmail,
		Subject: "You received a superlike on Spark",
		Text: fmt.Sprintf(`You received a superlike on Spark.

%s showed strong interest in your profile.

Open Spark to see more.`, senderName),
		HTML: baseTemplate(
			"Superlike received",
			fmt.Sprintf(`<strong>%s</strong> superliked you`, senderName),
			"A superlike signals strong interest.",
			"See details",
		),
	}
}

// NewMatch returns a template for match notification
func NewMatch(toEmail, matchName string) *Template {
	return &Template{
		ToEmail: toEmail,
		Subject: "It’s a match on Spark",
		Text: fmt.Sprintf(`It’s a match.

You and %s liked each other.

Start a conversation on Spark.`, matchName),
		HTML: baseTemplate(
			"It’s a match",
			fmt.Sprintf(`You and <strong>%s</strong> liked each other`, matchName),
			"Start a conversation and explore the connection.",
			"Start chatting",
		),
	}
}

// PokeReceived returns a template for poke notification
func PokeReceived(toEmail, senderName string) *Template {
	return &Template{
		ToEmail: toEmail,
		Subject: "You received a poke on Spark",
		Text: fmt.Sprintf(`You received a poke on Spark.

%s wants to get your attention.

Open Spark to respond.`, senderName),
		HTML: baseTemplate(
			"You got a poke",
			fmt.Sprintf(`<strong>%s</strong> poked you`, senderName),
			"Curious? You can choose to engage or ignore.",
			"View poke",
		),
	}
}

/* ---------- Shared base template ---------- */

func baseTemplate(title, subtitle, message, cta string) string {
	messageBlock := ""
	if message != "" {
		messageBlock = fmt.Sprintf(`
		<div style="background: rgba(124,58,237,0.12); border-radius: 12px; padding: 18px; margin: 24px 0;">
			<p style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.6; margin: 0;">
				"%s"
			</p>
		</div>`, message)
	}

	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:32px;background:#0B0B10;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
	<div style="max-width:480px;margin:0 auto;background:#121218;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

		<div style="padding:28px 24px;text-align:center;background:linear-gradient(135deg,#6B21A8,#8B5CF6);">
			<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Spark</h1>
		</div>

		<div style="padding:28px 24px;text-align:center;">
			<h2 style="margin:0 0 12px;color:#ffffff;font-size:20px;font-weight:600;">%s</h2>

			<p style="margin:0 0 20px;color:rgba(255,255,255,0.7);font-size:15px;line-height:1.6;">
				%s
			</p>

			%s

			<a href="https://spark-frontend-tlcj.onrender.com"
			   style="display:inline-block;margin-top:16px;padding:14px 32px;
			   background:linear-gradient(135deg,#7C3AED,#8B5CF6);
			   color:#ffffff;text-decoration:none;border-radius:999px;
			   font-size:15px;font-weight:600;">
			   %s
			</a>
		</div>

		<div style="border-top:1px solid rgba(255,255,255,0.06);padding:16px;text-align:center;">
			<p style="margin:0;color:rgba(255,255,255,0.35);font-size:12px;">
				© 2025 Spark · Personality first, always
			</p>
		</div>
	</div>
</body>
</html>
`, title, subtitle, messageBlock, cta)
}
