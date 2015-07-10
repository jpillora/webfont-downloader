# Webfont Downloader

Easily download Google Webfonts as a zip file. Useful for offline development. Recently ported from [Node to Go](https://github.com/jpillora/webfont-downloader/commit/54c7ab29500acebad9c3523e7738402a7a7ff6c9).

## Usage

1. Given the Google Webfonts CSS file:

	https://fonts.googleapis.com/css?family=Open+Sans

2. Just change `googleapis` in the URL to `jpillora`:

	https://fonts.jpillora.com/css?family=Open+Sans

3. It should begin to download an `OpenSans.zip` file

4. Use it with:

	``` html
	<link rel="stylesheet" href="./path/to/my/local/css/OpenSans/OpenSans.css">
	```

## Examples

* Default styles: https://fonts.jpillora.com/css?family=Noto+Sans

* Include all styles: https://fonts.jpillora.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,300,600,700,800

## API

### `/<type>/css?family=<font:styles>`

Creates a zip archive of `font` family provided, including each of the `styles` listed.

The `type` param is optional and can be one of `ttf`, `woff` (default),`woff2`, `eot` or `detect` (chooses the best type for your browser).

## CLI Usage

``` sh
wget --content-disposition 'https://fonts.jpillora.com/css?family=<your-font-here>'
# or
curl 'https://fonts.jpillora.com/css?family=<your-font-here>' > /tmp/font.zip
```

*https://fonts.jpillora.com was deployed using the button below*

## Deploy your own

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Local Usage

``` sh
$ # install go
$ go get github.com/jpillora/webfont-downloader
$ webfont-downloader
Listening on 3000...
```

## FAQ

#### Google already has this service available

It does, though it provides you with **only** the `.ttf` files. This also service downloads
`.woff` and `.eof` files and creates a local version of the one-line include CSS file.

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
