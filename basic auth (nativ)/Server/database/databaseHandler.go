package database

import (
	"crypto/sha256"
	"database/sql"
	"fmt"
	"log"

	"github.com/mattn/go-sqlite3"
)

type user struct {
	username string
	password string
}

type UsersDB struct {
	db *sql.DB
}

const CREATE_USERS string = `
	CREATE TABLE IF NOT EXISTS users(
		username VARCHAR(60) NOT NULL PRIMARY KEY UNIQUE,
		password TEXT NOT NULL
	);
`
const CREATE_SESSIONS string = `
	CREATE TABLE IF NOT EXISTS sessions(
		username VARCHAR(60),
		sessionId TEXT NOT NULL PRIMARY KEY,
		expiry Date
	);
`
const CREATE_TASKS string = `
	CREATE TABLE IF NOT EXISTS tasks(
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username VARCHAR(60),
		parent INTEGER,
		value TEXT,
		done INTEGER
	);
`

func InitDatabase(udb *UsersDB) error {
	var err error
	udb.db, err = sql.Open("sqlite3", "./database/users.db")
	if err != nil {
		log.Println(sqlite3.SQLITE_SELECT)
		return err
	}
	if _, err := udb.db.Exec(CREATE_USERS); err != nil {
		return err
	}
	if _, err := udb.db.Exec(CREATE_SESSIONS); err != nil {
		return err
	}
	if _, err := udb.db.Exec(CREATE_TASKS); err != nil {
		log.Println("couldnt create tasks table")

		return err
	}

	return nil
}

func (c *UsersDB) AddUser(username string, password string) (int, error) {
	encpass := sha256.Sum256([]byte(password))
	ep := fmt.Sprintf("%x", encpass)
	res, err := c.db.Exec("INSERT INTO users VALUES(?,?)", username, ep)
	if err != nil {
		return 0, err
	}

	var id int64
	if id, err = res.LastInsertId(); err != nil {
		return 0, err
	}

	return int(id), nil
}

func (c *UsersDB) RemoveUser(username string) (int, error) {
	res, err := c.db.Exec("DELETE FROM users WHERE username=?", username)
	if err != nil {
		return 0, err
	}

	var r int64
	if r, err = res.RowsAffected(); err != nil {
		return 0, nil
	}
	return int(r), nil
}

// Returns password of the user if the user exists in Database
func (c *UsersDB) GetUserPass(username string) (string, error) {
	row := c.db.QueryRow("SELECT username, password FROM users WHERE username=?", username)
	u := user{}
	var err error
	if err = row.Scan(&u.username, &u.password); err != nil {
		if err == sql.ErrNoRows {
			return "", err
		}
		return "", err
	}

	return u.password, nil
}

func (c *UsersDB) AddTask(owner string, parent string, value string, done bool) (int64, error) {
	d := 0
	if done {
		d = 1
	}
	res, err := c.db.Exec("INSERT INTO tasks VALUES(NULL,?,?,?,?)", owner, parent, value, d)
	if err != nil {
		log.Println(err.Error())
		return 0, err
	}
	id, _ := res.LastInsertId()

	return id, nil
}

func (c *UsersDB) GetUserTasks(username string) (*sql.Rows, error) {
	return c.db.Query("SELECT * FROM tasks WHERE username=?", username)
}

func (c *UsersDB) UpdateTask(id string, value string, done bool) error {
	d := 0
	if done {
		d = 1
	}
	_, err := c.db.Exec("UPDATE tasks SET value=?, done=? WHERE id=?", value, d, id)
	if err != nil {
		log.Println(err.Error())
		return err
	}

	return nil
}

func (c *UsersDB) RemoveTask(id string) error {
	_, err := c.db.Exec("DELETE from tasks WHERE id=?", id)
	if err != nil {
		log.Println(err.Error())
		return err
	}

	// Remove all children tasks
	_, err = c.db.Exec("DELETE from tasks WHERE parent=?", id)
	if err != nil {
		log.Println(err.Error())
		return err
	}

	return nil
}
