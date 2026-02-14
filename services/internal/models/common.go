package models

import (
	"time"

	"github.com/golang-jwt/jwt"
)

type Address struct {
	City        string    `json:"city"`
	State       string    `json:"state"`
	Country     string    `json:"country"`
	Coordinates []float64 `json:"coordinates" db:"coordinates"` // latitude, longitude
}

type PostUnlockRating struct {
	SheRating int `json:"she_rating"`
	HeRating  int `json:"he_rating"`
}

type Media struct {
	Id        string    `json:"id"`
	Type      string    `json:"type"`
	Url       string    `json:"url"`
	CreatedAt time.Time `json:"created_at"`
}

type Reaction struct {
	Id        string    `json:"id"`
	SenderId  string    `json:"sender_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type Message struct {
	Id        string      `json:"id"`
	Type      MessageType `json:"type"`
	Content   string      `json:"content"`
	SenderId  string      `json:"sender_id"`
	Received  bool        `json:"received"`
	Seen      bool        `json:"seen"`
	Media     []Media     `json:"media" db:"media"`
	Reactions []Reaction  `json:"reactions" db:"reactions"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

type Claims struct {
	UserID      string `json:"uid"`
	Email       string `json:"email"`
	Gender      string `json:"gender"`
	Age         int    `json:"age"`
	DateOfBirth string `json:"date_of_birth"`
	Name        string `json:"name"`
	Pfp         string `json:"pfp"`
	jwt.StandardClaims
}

type ResponseHTTP struct {
	Success bool   `json:"success"`
	Data    any    `json:"data"`
	Message string `json:"message"`
	Error   any    `json:"error"`
}

type ExtraMetadata struct {
	School     string   `json:"school"`
	Work       string   `json:"work"`
	LookingFor []string `json:"looking_for" db:"looking_for"`
	Zodiac     string   `json:"zodiac"`
	Languages  []string `json:"languages" db:"languages"`
	Excercise  string   `json:"excercise"`
	Drinking   string   `json:"drinking"`
	Smoking    string   `json:"smoking"`
	Kids       string   `json:"kids"`
	Religion   string   `json:"religion"`
	Ethnicity  string   `json:"ethnicity"`
	Sexuality  string   `json:"sexuality"`
}
