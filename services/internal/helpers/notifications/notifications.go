package notifications

import (
	"spark/internal/helpers/users"
	"spark/internal/mailer"
	"log"
)

// SendNewMessageNotification sends an email when a user receives a new message
func SendNewMessageNotification(recipientUserID, senderUserID, messagePreview string) {
	go func() {
		recipient, err := users.GetUserById(recipientUserID)
		if err != nil {
			log.Printf("[Notifications] Failed to get recipient user %s: %v", recipientUserID, err)
			return
		}

		sender, err := users.GetUserById(senderUserID)
		if err != nil {
			log.Printf("[Notifications] Failed to get sender user %s: %v", senderUserID, err)
			return
		}

		senderName := sender.FirstName
		if senderName == "" {
			senderName = "Someone"
		}

		template := mailer.NewMessage(recipient.Email, senderName, messagePreview)
		if err := template.Send(); err != nil {
			log.Printf("[Notifications] Failed to send new message email to %s: %v", recipient.Email, err)
			return
		}

		log.Printf("[Notifications] Sent new message notification to %s from %s", recipient.Email, senderName)
	}()
}

// SendProfileViewedNotification sends an email when someone views a user's profile
func SendProfileViewedNotification(targetUserID, viewerUserID string) {
	go func() {
		target, err := users.GetUserById(targetUserID)
		if err != nil {
			log.Printf("[Notifications] Failed to get target user %s: %v", targetUserID, err)
			return
		}

		viewer, err := users.GetUserById(viewerUserID)
		if err != nil {
			log.Printf("[Notifications] Failed to get viewer user %s: %v", viewerUserID, err)
			return
		}

		viewerName := viewer.FirstName
		if viewerName == "" {
			viewerName = "Someone"
		}

		template := mailer.ProfileViewed(target.Email, viewerName)
		if err := template.Send(); err != nil {
			log.Printf("[Notifications] Failed to send profile viewed email to %s: %v", target.Email, err)
			return
		}

		log.Printf("[Notifications] Sent profile viewed notification to %s from %s", target.Email, viewerName)
	}()
}

// SendSuperlikeNotification sends an email when someone superlikes a user
func SendSuperlikeNotification(targetUserID, senderUserID string) {
	go func() {
		target, err := users.GetUserById(targetUserID)
		if err != nil {
			log.Printf("[Notifications] Failed to get target user %s: %v", targetUserID, err)
			return
		}

		sender, err := users.GetUserById(senderUserID)
		if err != nil {
			log.Printf("[Notifications] Failed to get sender user %s: %v", senderUserID, err)
			return
		}

		senderName := sender.FirstName
		if senderName == "" {
			senderName = "Someone"
		}

		template := mailer.SuperlikeReceived(target.Email, senderName)
		if err := template.Send(); err != nil {
			log.Printf("[Notifications] Failed to send superlike email to %s: %v", target.Email, err)
			return
		}

		log.Printf("[Notifications] Sent superlike notification to %s from %s", target.Email, senderName)
	}()
}

// SendMatchNotification sends an email when a match is created (to both users)
func SendMatchNotification(userID1, userID2 string) {
	go func() {
		user1, err := users.GetUserById(userID1)
		if err != nil {
			log.Printf("[Notifications] Failed to get user1 %s: %v", userID1, err)
			return
		}

		user2, err := users.GetUserById(userID2)
		if err != nil {
			log.Printf("[Notifications] Failed to get user2 %s: %v", userID2, err)
			return
		}

		user1Name := user1.FirstName
		if user1Name == "" {
			user1Name = "Someone"
		}

		user2Name := user2.FirstName
		if user2Name == "" {
			user2Name = "Someone"
		}

		// Send to user1
		template1 := mailer.NewMatch(user1.Email, user2Name)
		if err := template1.Send(); err != nil {
			log.Printf("[Notifications] Failed to send match email to %s: %v", user1.Email, err)
		} else {
			log.Printf("[Notifications] Sent match notification to %s about %s", user1.Email, user2Name)
		}

		// Send to user2
		template2 := mailer.NewMatch(user2.Email, user1Name)
		if err := template2.Send(); err != nil {
			log.Printf("[Notifications] Failed to send match email to %s: %v", user2.Email, err)
		} else {
			log.Printf("[Notifications] Sent match notification to %s about %s", user2.Email, user1Name)
		}
	}()
}

// SendPokeNotification sends an email when someone pokes a user
func SendPokeNotification(targetUserID, senderUserID string) {
	go func() {
		target, err := users.GetUserById(targetUserID)
		if err != nil {
			log.Printf("[Notifications] Failed to get target user %s: %v", targetUserID, err)
			return
		}

		sender, err := users.GetUserById(senderUserID)
		if err != nil {
			log.Printf("[Notifications] Failed to get sender user %s: %v", senderUserID, err)
			return
		}

		senderName := sender.FirstName
		if senderName == "" {
			senderName = "Someone"
		}

		template := mailer.PokeReceived(target.Email, senderName)
		if err := template.Send(); err != nil {
			log.Printf("[Notifications] Failed to send poke email to %s: %v", target.Email, err)
			return
		}

		log.Printf("[Notifications] Sent poke notification to %s from %s", target.Email, senderName)
	}()
}
