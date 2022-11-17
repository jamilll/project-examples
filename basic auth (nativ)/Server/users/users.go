package users

import (
	"basicAuth/database"
	"crypto/sha256"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
)

type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

//TODO save sessions in Database (maybe redis)
var sessions = make(map[string]Session, 0)

type Session struct {
	SessionId string
	Username  string
	Expiry    time.Time
}

func (s *Session) IsExpired() bool {
	return s.Expiry.Before(time.Now())
}

func (s *Session) Destroy() {
	// TODO remove the session tocken from the DATABASE
	delete(sessions, s.SessionId)
	log.Println("session removed successfully: ", len(sessions))
	for _, e := range sessions {
		log.Println("session: ", e.SessionId, ", ", e.Username)
	}
}

func AddNewUser(u User, udb *database.UsersDB) error {
	_, err := udb.GetUserPass(u.Username)
	if err != nil {
		_, err = udb.AddUser(u.Username, u.Password)
		if err != nil {
			return err
		}

		return err
	}

	log.Println("AddNewUser: username already exists, ")
	return errors.New("username already exists")
}

func RemoveUser(u string, udb *database.UsersDB) error {
	_, err := udb.GetUserPass(u)
	if err != nil {
		return errors.New("username does not exist")
	}

	_, err = udb.RemoveUser(u)
	if err != nil {
		return err
	}

	return nil
}

func ValidateLogin(u *User, udb *database.UsersDB) (Session, error) {
	// Check if username exists in database and get the password
	savedPass, err := udb.GetUserPass(u.Username)
	if err != nil {
		return Session{}, errors.New("username does not exist")
	}

	encrPass := fmt.Sprintf("%x", sha256.Sum256([]byte(u.Password)))

	if savedPass != encrPass {
		return Session{}, errors.New("invalid")
	}

	// Add session
	sessionToken := uuid.NewString()
	expiresAt := time.Now().Add(5 * time.Minute)
	newSession := Session{
		SessionId: sessionToken,
		Username:  u.Username,
		Expiry:    expiresAt,
	}
	sessions[sessionToken] = newSession

	return newSession, nil
}

func UpdateSession(sessionId string, username string) Session {
	delete(sessions, sessionId)
	sessionToken := uuid.NewString()
	expiresAt := time.Now().Add(5 * time.Minute)
	newSession := Session{
		SessionId: sessionToken,
		Username:  username,
		Expiry:    expiresAt,
	}
	sessions[sessionToken] = newSession

	return newSession
}

type Task struct {
	Id         string `json:"id"`
	Owner      string `json:"owner"`
	ParentTask string `json:"parent"`
	Value      string `json:"value"`
	Done       bool   `json:"done"`
}

func ValidateSession(sessionID string) (Session, bool) {
	sess, ok := sessions[sessionID]
	if !ok {
		return Session{}, false
	}

	return sess, true
}

func GetUserTasks(o string, udb *database.UsersDB) ([]Task, error) {
	var ts []Task
	rows, err := udb.GetUserTasks(o)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var t Task
		var b int8 = 1
		err = rows.Scan(&t.Id, &t.Owner, &t.ParentTask, &t.Value, &b)
		if err != nil {
			if err == sql.ErrNoRows {
				return ts, nil
			}
			return nil, err
		}
		if b == 0 {
			t.Done = false
		} else {
			t.Done = true
		}

		ts = append(ts, t)
	}

	return ts, nil
}
