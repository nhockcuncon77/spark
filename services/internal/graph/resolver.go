package graph

import (
	blockedusers "spark/internal/graph/blocked_users"
	"spark/internal/graph/chats"
	"spark/internal/graph/community"
	profileactivities "spark/internal/graph/profile_activities"
	"spark/internal/graph/reports"
	"spark/internal/graph/swipes"
	"spark/internal/graph/users"
	"spark/internal/graph/verifications"
)

type Resolver struct {
	UserResolver            *users.Resolver
	ProfileActivityResolver *profileactivities.Resolver
	ChatsResolver           *chats.Resolver
	SwipesResolver          *swipes.Resolver
	CommunityResolver       *community.Resolver
	ReportResolver          *reports.Resolver
	VerificationResolver    *verifications.Resolver
	BlockedUsersResolver    *blockedusers.Resolver
}

func NewResolver() *Resolver {
	return &Resolver{
		UserResolver:            users.NewResolver(),
		ProfileActivityResolver: profileactivities.NewResolver(),
		ChatsResolver:           chats.NewResolver(),
		SwipesResolver:          swipes.NewResolver(),
		CommunityResolver:       community.NewResolver(),
		ReportResolver:          reports.NewResolver(),
		VerificationResolver:    verifications.NewResolver(),
		BlockedUsersResolver:    blockedusers.NewResolver(),
	}
}
