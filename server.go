package main

import (
	"log"
	"net/http"
	"strconv"

	"github.com/jpillora/opts"
	"github.com/jpillora/webfont-downloader/handler"
)

var VERSION = "0.0.0"

type App struct {
	//handler options
	*webfontdownloader.Handler `type:"embedded"`
	//server options
	Port int `help:"Listening port"`
}

func main() {
	a := App{
		Handler: &webfontdownloader.Handler{},
		Port:    3000,
	}

	opts.
		New(&a).
		Version(VERSION).
		Repo("github.com/jpillora/webfont-downloader").
		Parse()

	log.Printf("Listening on %d...", a.Port)
	log.Fatal(http.ListenAndServe(":"+strconv.Itoa(a.Port), a.Handler))
}
