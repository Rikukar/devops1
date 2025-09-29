package main

import (
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

const logPath = "/data/log.txt"

// Make sure the directory and log file exists
func ensureDataPath() {
	dir := filepath.Dir(logPath)
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		os.MkdirAll(dir, 0755)
	}
	f, _ := os.OpenFile(logPath, os.O_CREATE, 0644)
	f.Close()
}

// Append a new log line to the file
func postLogHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "use POST", http.StatusMethodNotAllowed)
		return
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "bad body", http.StatusBadRequest)
		return
	}
	f, err := os.OpenFile(logPath, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		http.Error(w, "server error", http.StatusInternalServerError)
		return
	}
	defer f.Close()
	_, err = f.Write(append(body, '\n'))
	if err != nil {
		http.Error(w, "server error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(204)
}

// Return the entire log file
func getLogHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "use GET", http.StatusMethodNotAllowed)
		return
	}
	data, err := os.ReadFile(logPath)
	if err != nil {
		http.Error(w, "server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/plain")
	w.Write(data)
}

func main() {
	ensureDataPath()
	http.HandleFunc("/log", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			postLogHandler(w, r)
		} else if r.Method == http.MethodGet {
			getLogHandler(w, r)
		} else {
			http.Error(w, "only /log GET/POST supported", http.StatusMethodNotAllowed)
		}
	})
	log.Println("storage listening on :8200, log file:", logPath)
	log.Fatal(http.ListenAndServe(":8200", nil))
}