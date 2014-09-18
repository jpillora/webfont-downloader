# webfont-downloader

Easily download Google Webfonts as a zip file

## Usage

1. Given the Google Webfonts CSS file:

	http://fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,300,600,700,800

2. Just change the domain to:

	http://webfonts.jpillora.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,300,600,700,800

3. It should begin to down an `OpenSans.zip` file

4. Use it with:

	``` css
	<link rel="stylesheet" href="./path/to/my/local/css/OpenSans/OpenSans.css">
	```

## API

* `/<type>/css` Creates a zip archive of font family provided, where `type` can be one of `tff`, `woff`,`woff2` or `eotwoff` (default).

## Remote Usage (Pre-hosted)

```
http://webfonts.jpillora.com/css?family=<Insert chosen font here>
```

## Remote Usage (Self-hosted)

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Local Usage

``` sh
$ npm i -g webfont-downloader
$ webfont-downloader
Listening on 3000...
```

## FAQ

#### Google already has this service available

It does, though it provides you with **only** the `.tff` files. This also service downloads
`.woff` and `.eof` files and creates a local version of the one-line include CSS file.

#### Why is `eotwoff` the default?

It is the largest download though it has the most support.

#### MIT License

Copyright © 2014 Jaime Pillora &lt;dev@jpillora.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
