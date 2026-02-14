package models

type Gender string

const (
	MALE   Gender = "MALE"
	FEMALE Gender = "FEMALE"
)

type ActivityType string

const (
	POKE         ActivityType = "POKE"
	PROFILE_VIEW ActivityType = "PROFILE_VIEW"
	SUPERLIKE    ActivityType = "SUPERLIKE"
	LIKEE        ActivityType = "LIKE"
	POSTLOVE     ActivityType = "POSTLOVE"
	POSTCOMMENT  ActivityType = "POSTCOMMENT"
	POSTVIEW     ActivityType = "POSTVIEW"
	COMMENTLOVE  ActivityType = "COMMENTLOVE"
)

type SwipeType string

const (
	LIKE       SwipeType = "LIKE"
	SUPERRLIKE SwipeType = "SUPERLIKE"
	DISLIKE    SwipeType = "DISLIKE"
)

type MessageType string

const (
	TEXT  MessageType = "TEXT"
	IMAGE MessageType = "IMAGE"
	VIDEO MessageType = "VIDEO"
	AUDIO MessageType = "AUDIO"
	FILE  MessageType = "FILE"
)
