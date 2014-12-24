
var async = require("async");
var archiver = require("archiver");
var requestLib = require("request");
var express = require("express");
var fmt = require("util").format;
var app = express();
var port = process.env.PORT || 3000;
var baseURL = "http://fonts.googleapis.com";
var types = {
	ttf: "Node.js",
	woff: "Mozilla/5.0 (Windows NT 5.1; rv:31.0) Gecko/20100101 Firefox/31.0",
	woff2: "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36",
	eot: "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0; GTB7.4; InfoPath.2; SV1; .NET CLR 3.3.69573; WOW64; en-US)"
};
var reqid = 0;

// var through = require('through');
// function pass(data) {
// 	console.log('queue data %s', data.length);
// 	this.queue(data);
// }

function fetchCSS(request, name, query, cb) {
	var url = baseURL+query;
	request.log("Fetching font '%s' at %s", name, url);
	request(url, function(err, res, body) {
		if(err)
			return cb(err);
		if(res.statusCode !== 200)
			return cb(fmt("Could not fetch: %s (%s)", url, res.statusCode));
		cb(err, request, name, body);
	});
}

function createFetcher(request, archive, index, url, filename) {
	return function(cb) {
		// request.log("Fetching item #%s %s", index, url);
		request(url, function(err, res, body) {
			if(err)
				return cb(err);
			if(res.statusCode !== 200)
				return cb(fmt("Could not fetch item #%s %s (%s)", index, url, res.statusCode));

			var buff = new Buffer(body);
			//workaround: passing buffer breaks arhiver
			// var stream = through(pass);
			// archive.append(stream, { name: filename });
			// stream.end(buff);
			archive.append(buff, { name: filename });
			// request.log("Adding #%s %s (#%s)", index, filename, buff.length);
			return cb(null);
		});
	};
}

function createArchive(request, name, css, cb) {
	var index = 0;
	var fetches = [];

	request.log('Creating archive...');
	var archive = archiver('zip');
	archive.$name = name;

	var localCss = css.replace(/url\((https?:\/\/[^\)]+)\.(\w+)\)/g, function(str, filename, ext) {
		var remoteUrl = filename+"."+ext;
		var localFilename = name + "-" + index + "." + ext;
		var cssFilename = "url(./" + localFilename + ")";
		fetches.push(createFetcher(request, archive, index++, remoteUrl, localFilename));
		return cssFilename;
	});

	async.parallelLimit(fetches, 3, function(err) {
		if(err)
			return cb(err);
		//finally, add the new css file
		archive.append(new Buffer(localCss), { name: name + ".css" });
		cb(null, request, archive);
	});
}

function finalizeArchive(request, archive, cb) {
	archive.on('error', function(err) {
		request.log('Error with archive (%s)', err);
		cb(err);
	});
	archive.on('finish', function() {
		request.log('Created archive (%s bytes)', archive.pointer());
		cb(null, archive);
	});
	archive.finalize();
}

app.use(function(req, res) {
	if(req.url === "/")
		return res.status(302).header('location','https://github.com/jpillora/webfont-downloader').send("redirecting...");
	if(/^\/ping/.test(req.url))
		return res.send("Pong");
	if(!/^(\/[a-z2]+)?(\/css\?family=([^\:]+).*)$/.test(req.url))
		return res.status(400).send("Invalid request");
	var type = RegExp.$1.substr(1);
	var query = RegExp.$2;
	var name = RegExp.$3.replace(/\W/g,'');

	var ua = types[type];
	if(type && !ua)
		return res.status(400).send("Invalid type: " + type);

	//identify request
	var id = reqid;
	reqid++;

	//create a request agent
	var request = requestLib.defaults({
		timeout: 3000,
		headers: {
			'User-Agent': ua || types.woff
		}
	});
	request.log = function() {
		arguments[0] = "#" + id + " " + arguments[0];
		console.log.apply(console, arguments);
	};

	//kick it off
	async.waterfall([
		fetchCSS.bind(null, request, name, query),
		createArchive,
		finalizeArchive
	], function end(err, archive) {
		//log errors
		if(err)
			request.log(err);

		if(res.$writingResponse)
			return request.log("Double write prevented (%s)", err || 'output archive');
		res.$writingResponse = true;

		if(err)
			return res.status(400).send(err.toString());

		var zipname = archive.$name+'.zip';
		request.log("Writing out: " + zipname);
		//pipe to user
		res.header('Content-Disposition', 'attachment; filename='+zipname+';');
		res.status(200);
		archive.pipe(res);
	});
});

app.listen(port, function() {
	console.log("Listening on %s...", port);
});
