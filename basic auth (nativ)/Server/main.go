package main

import (
	"basicAuth/database"
	"basicAuth/users"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
)

var udb database.UsersDB

type response struct {
	Message string       `json:"message"`
	Val     string       `json:"value"`
	Tasks   []users.Task `json:"tasks"`
	Id      string       `json:"id"`
}

func handleRegister(w http.ResponseWriter, r *http.Request) {

	if !strings.EqualFold("post", r.Method) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response{Message: "Invalid request!"})
		return
	}

	// Extrarct user data from request body
	u := users.User{}
	getUserFromUrl(&u, r)

	if err := users.AddNewUser(u, &udb); err != nil {
		json.NewEncoder(w).Encode(response{Message: err.Error(), Val: "0"})
		return
	}

	json.NewEncoder(w).Encode(response{Message: "user added to Database", Val: "1"})
}

func handleDelete(w http.ResponseWriter, r *http.Request) {

	if !strings.EqualFold("post", r.Method) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response{Message: "Invalid request!"})
		return
	}

	// Extract user data from request body
	u := users.User{}
	getUserFromUrl(&u, r)

	err := users.RemoveUser(u.Username, &udb)
	if err != nil {
		json.NewEncoder(w).Encode(response{Message: err.Error(), Val: "0"})
		return
	}

	json.NewEncoder(w).Encode(response{Message: "user removed from Database", Val: "1"})
}

func handleLogin(w http.ResponseWriter, r *http.Request) {

	// handle preflight test
	if strings.EqualFold("options", r.Method) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response{Message: "preflight test"})
		return
	}

	if !strings.EqualFold("post", r.Method) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response{Message: "Invalid request!"})
		return
	}
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "*")

	// Extract user data from request body
	u := users.User{}
	getUserFromUrl(&u, r)

	sess, err := users.ValidateLogin(&u, &udb)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(response{Message: "invalid username or password", Val: "0"})
		return
	}

	// TODO: redirect user (maybe on the client side)
	http.SetCookie(w, &http.Cookie{
		Name:    "session_token",
		Value:   sess.SessionId,
		Expires: sess.Expiry,
	})

	tasks, err := users.GetUserTasks(u.Username, &udb)
	if err != nil && err != sql.ErrNoRows {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response{Message: err.Error()})
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Access-Control-Expose-Headers", "Set-Cookie")

	json.NewEncoder(w).Encode(response{Message: "welcome back user", Val: sess.SessionId, Tasks: tasks})

}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	var us users.Session
	// User credentials are not valid
	if ok := checkUserCreds(w, r, &us); !ok {
		return
	}

	// Only delete session if user is not a public user
	if us.Username != "none" {
		log.Println("deleting user session")
		us.Destroy()
	}

	// Remove the cookie from the http so that user can still add shared tasks
	http.SetCookie(w, &http.Cookie{
		Name:   "session_token",
		MaxAge: -1,
	})

	json.NewEncoder(w).Encode(response{Message: "success"})
}

// Returns a list of all the tasks of a specific user or list of shared tasks if no token exists
func handleTasks(w http.ResponseWriter, r *http.Request) {
	// handle preflight test
	if strings.EqualFold("options", r.Method) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response{Message: "preflight test"})
		return
	}

	if !strings.EqualFold("GET", r.Method) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response{Message: "Invalid request!"})
		log.Println("bad request: ", r.Method, " received")
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "http://192.168.0.101:3000")
	w.Header().Set("Access-Control-Allow-Headers", "session_token")

	u := users.User{}
	getUserFromUrl(&u, r)

	var sessionToken string
	// check session tocken
	c, err := r.Cookie("session_token")
	if err != nil {
		if err == http.ErrNoCookie {
			// check if request contains session_token in header
			headerTocken := r.Header.Get("session_token")
			if headerTocken == "" {
				// The cookie does not exist -> return shares tasks
				tasks, err := users.GetUserTasks("none", &udb)
				if err != nil {
					json.NewEncoder(w).Encode(response{Message: err.Error()})
				}
				json.NewEncoder(w).Encode(&tasks)
				return
			}

			sessionToken = headerTocken

		} else {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
	} else {
		// just get the session_token from the cookie
		sessionToken = c.Value
	}

	// validate session token
	un, ok := users.ValidateSession(sessionToken)
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	if un.IsExpired() {
		un.Destroy()
		w.WriteHeader(http.StatusUnauthorized)
		return

	}

	// Validate session token for another 5mins since user is still active
	sess := users.UpdateSession(un.SessionId, un.Username)
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sess.SessionId,
		Expires:  sess.Expiry,
		SameSite: http.SameSiteNoneMode,
	})

	tasks, err := users.GetUserTasks(un.Username, &udb)
	if err != nil && err != sql.ErrNoRows {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response{Message: err.Error()})
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(&tasks)

}

func getUserFromUrl(u *users.User, r *http.Request) {
	u.Username = r.PostFormValue("username")
	u.Password = r.PostFormValue("password")
	log.Println(u)
}

// Middleware to check user credentials
func checkUserCreds(w http.ResponseWriter, r *http.Request, us *users.Session) bool {
	log.Println("checking creds")

	// handle preflight test
	if strings.EqualFold("options", r.Method) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response{Message: "preflight test"})
		return false
	}

	if !strings.EqualFold("post", r.Method) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response{Message: "Invalid request!"})
		return false
	}

	u := users.User{}
	getUserFromUrl(&u, r)

	// check session token
	c, err := r.Cookie("session_token")
	var sessionToken string
	if err != nil {
		if err == http.ErrNoCookie {
			headerToken := r.Header.Get("session_token")
			// no cookie and no session_token header
			if headerToken == "" || headerToken == "empty" {
				// Public users do not need a cookie to add a shared task
				log.Println("user with no cookie: ", c)
				us.Username = "none"
				return true
			}
			sessionToken = headerToken
			log.Println("header token: ", headerToken)

		} else {
			log.Println("cookie error")
			w.WriteHeader(http.StatusBadRequest)
			return false
		}
	} else {
		sessionToken = c.Value

	}

	// validate session token
	var ok bool
	*us, ok = users.ValidateSession(sessionToken)
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		log.Println("invalid token")
		return false
	}

	if us.IsExpired() {
		us.Destroy()
		w.WriteHeader(http.StatusUnauthorized)
		return false

	}

	// Validate session token for another 5mins since user is still active
	sess := users.UpdateSession(us.SessionId, us.Username)
	us.SessionId = sess.SessionId
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sess.SessionId,
		Expires:  sess.Expiry,
		SameSite: http.SameSiteNoneMode,
		Secure:   false,
		HttpOnly: false,
	})

	return true
}

func addTask(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "http://192.168.0.101:3000")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Headers", "session_token")

	// if r.Method == http.MethodOptions && r.Header.Get("Access-Control-Request-Method") != "" {
	// 	w.WriteHeader(http.StatusNoContent)
	// 	return
	// }

	var us users.Session
	// User credentials are not valid
	if ok := checkUserCreds(w, r, &us); !ok {
		return
	}

	// Extract task data from req body
	var task users.Task
	json.NewDecoder(r.Body).Decode(&task)

	// Validate Task data
	if task.Value == "" {
		json.NewEncoder(w).Encode(response{Message: "empty Task", Id: "-1"})
	}

	if task.ParentTask == "" {
		task.ParentTask = "-1"
	}

	var id int64
	id, err := udb.AddTask(us.Username, task.ParentTask, task.Value, task.Done)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response{Message: "something went wrong while adding task to database!", Id: "-1"})
		return
	}

	// Returns the ID of the added Task
	// ID is required to remove/update tasks
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-type", "application/json")

	json.NewEncoder(w).Encode(response{Message: "success", Val: us.SessionId, Id: fmt.Sprintf("%v", id), Tasks: []users.Task{task}})

}
func updateTask(w http.ResponseWriter, r *http.Request) {
	var us users.Session
	// User credentials are not valid
	if ok := checkUserCreds(w, r, &us); !ok {
		return
	}
	var task users.Task
	json.NewDecoder(r.Body).Decode(&task)

	// TODO: check if task id actually belongs to the uesr

	err := udb.UpdateTask(task.Id, task.Value, task.Done)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response{Message: "something went wrong while updating task data!"})
		return
	}

	json.NewEncoder(w).Encode(response{Message: "success"})
}

func removeTask(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "http://192.168.0.101:3000")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Headers", "session_token")

	var us users.Session
	// User credentials are not valid
	if ok := checkUserCreds(w, r, &us); !ok {
		return
	}
	var task users.Task
	json.NewDecoder(r.Body).Decode(&task)

	// TODO: check if task id actually belongs to the uesr

	err := udb.RemoveTask(task.Id)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response{Message: "something went wrong while updating task data!", Id: "0", Val: us.SessionId})
		return
	}

	json.NewEncoder(w).Encode(response{Message: "success", Val: us.SessionId, Id: "1"})

}

func main() {
	err := database.InitDatabase(&udb)
	if err != nil {
		log.Panic("unable to open Database: ", err.Error())
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/register", handleRegister)
	mux.HandleFunc("/remove", handleDelete)
	mux.HandleFunc("/login", handleLogin)
	mux.HandleFunc("/logout", handleLogout)
	mux.HandleFunc("/", handleTasks)
	mux.HandleFunc("/addtask", addTask)
	mux.HandleFunc("/updatetask", updateTask)
	mux.HandleFunc("/removetask", removeTask)

	log.Fatal(http.ListenAndServe(":8080", mux))
}
