package webfontdownloader

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"regexp"
	"sync"

	"github.com/jpillora/archive"
)

const baseURL = "https://fonts.googleapis.com"

var pathParser = regexp.MustCompile(`^(\/([a-z2]+))?(\/css\?family=([^\:]+).*)$`)
var nonwords = regexp.MustCompile(`\W`)
var cssURL = regexp.MustCompile(`url\((https?:\/\/[^\)]+)\.(\w+)\)`)

var userAgents = map[string]string{
	"ttf":   "Go Client",
	"woff":  "Mozilla/5.0 (Windows NT 5.1; rv:31.0) Gecko/20100101 Firefox/31.0",
	"woff2": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36",
	"eot":   "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0; GTB7.4; InfoPath.2; SV1; .NET CLR 3.3.69573; WOW64; en-US)",
}

type Handler struct {
	count int
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := r.URL.RequestURI()
	//forward users to README
	if path == "/" {
		w.Header().Set("Location", "https://github.com/jpillora/webfont-downloader")
		w.WriteHeader(http.StatusFound)
		w.Write([]byte("Redirecting..."))
		return
	}
	//heroku anti-idle endpoint
	if path == "/ping" {
		w.Write([]byte("Pong"))
		return
	}

	m := pathParser.FindStringSubmatch(path)
	if len(m) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Invalid request: " + path))
		return
	}

	h.count++
	requestID := h.count

	fontType := "woff" //default
	if m[1] != "" {
		fontType = m[2]
	}
	query := m[3]
	name := nonwords.ReplaceAllString(m[4], "")

	ua := ""
	if fontType == "detect" {
		ua = r.Header.Get("User-Agent")
	} else if u, ok := userAgents[fontType]; ok {
		ua = u
	}
	if ua == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Could not resolve font type"))
		return
	}

	//begin!
	cssBytes, err := h.fetch(ua, baseURL+query)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
		w.Write([]byte(err.Error()))
		return
	}

	//stream contents
	w.Header().Set("Content-Disposition", "attachment; filename="+name+".zip;")
	w.WriteHeader(http.StatusOK)
	zip := archive.NewZipWriter(w)

	log.Printf("[#%04d] Creating '%s' archive (%s)...", requestID, name, query)

	fileID := 1
	fileFetches := sync.WaitGroup{}

	//1 transform css file
	//2 fetch each URL import
	cssStr := cssURL.ReplaceAllStringFunc(string(cssBytes), func(url string) string {
		m = cssURL.FindStringSubmatch(url)
		//parse url
		ext := m[2]
		remoteUrl := m[1] + "." + ext
		localPath := fmt.Sprintf("%s-%d.%s", name, fileID, ext)
		fileID++
		fileFetches.Add(1)
		//async fetch
		go func() {
			defer fileFetches.Done()
			out, err := h.fetch(ua, remoteUrl)
			if err != nil {
				return
			}
			log.Printf("[#%04d] Fetched %s, %d bytes", requestID, remoteUrl, len(out))
			zip.AddBytes(localPath, out)
		}()
		//swap remote url with local url
		return "url(./" + localPath + ")"
	})

	//insert modified css
	zip.AddBytes(name+".css", []byte(cssStr))
	//wait for all fetches to complete
	fileFetches.Wait()
	//finalize archive
	zip.Close()
	log.Printf("[#%04d] Finalize '%s.zip'", requestID, name)
}

func (h *Handler) fetch(ua, url string) ([]byte, error) {
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", ua)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Could not connect to %s", baseURL)
	}
	defer resp.Body.Close()
	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("Download cancelled from %s", baseURL)
	}
	return b, nil
}
