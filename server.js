
var async = require("async");
var archiver = require("archiver");
var requestLib = require("request");
var express = require("express");
var fmt = require("util").format;
var app = express();
var port = process.env.PORT || 3000;
var baseURL = "http://fonts.googleapis.com";
var userAgents = {
	chrome: "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36",
	firefox: "Mozilla/5.0 (Windows NT 5.1; rv:31.0) Gecko/20100101 Firefox/31.0",
	msie: "Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US))"
};

function fetchCSS(request, name, query, cb) {
	var url = baseURL+query;
	console.log("Fetching %s", url);
	request(url, function(err, res, body) {
		if(err)
			return cb(err);
		if(res.statusCode !== 200)
			return cb(fmt("Could not fetch: %s (%s)", url, res.statusCode));
		cb(err, request, name, body);
	});
}

function createFetcher(request, filename, ext) {
	var url = filename+"."+ext;
	return function(cb) {
		request(url, function(err, res, body) {
			if(err)
				return cb(err);
			if(res.statusCode !== 200)
				return cb(fmt("Could not fetch item: %s (%s)", url, res.statusCode));
			console.log("Fetched %s", url);
			return cb(null, new Buffer(body));
		});
	};
}

function createArchive(request, name, css, cb) {
	console.log('creating: %s', name);
	var index = 0;
	var filenames = [];
	var fetches = [];

	var localCss = css.replace(/url\((https?:\/\/[^\)]+)\.(\w+)\)/g, function(str, filename, ext) {
		fetches.push(createFetcher(request, filename, ext));
		var localFilename = name + "-" + index + "." + ext;
		var cssFilename = "url(./" + localFilename + ")";
		filename = 
		filenames[index] = localFilename;
		//next
		index++;
		return cssFilename;
	});

	async.parallel(fetches, function(err, buffers) {
		if(err)
			return cb(err);

		var archive = archiver('zip');
		archive.name = name;
		archive.append(new Buffer(localCss), { name: name + ".css" });

		for(var i = 0; i < buffers.length; i++) {
			var buff = buffers[i];
			var filename = filenames[i];
			archive.append(buff, { name: filename });
		}

		cb(null, archive);
	});
}

function finalizeArchive(archive, cb) {
	archive.on('error', function(err) {
		cb(err);
	});
	archive.on('finish', function() {
		console.log('created archive (%s bytes)', archive.pointer());
		cb(null, archive);
	});
	archive.finalize();
}

app.use(function(req, res) {
	if(!/(\/[a-z]+)?(\/css\?family=([^\:]+)\:.+)/.test(req.url))
		return res.status(400).send("Invalid request");
	var browser = RegExp.$1.substr(1);
	var query = RegExp.$2;
	var name = RegExp.$3.replace(/\W/g,'');

	var ua = userAgents[browser];
	if(browser && !ua)
		return res.status(400).send("Invalid browser: " + browser);

	//create a request agent
	var request = requestLib.defaults({
		headers: {
			'User-Agent': ua || userAgents.msie
		}
	});

	//kick it off
	async.waterfall([
		fetchCSS.bind(null, request, name, query),
		createArchive,
		finalizeArchive
	], function end(err, archive) {
		if(res.$writingResponse)
			return console.log("Double write prevented (%s)", err || 'output archive');
		res.$writingResponse = true;

		if(err) {
			return res.status(400).send(err.toString());
		}
		//pipe to user
		res.header('Content-Disposition', 'attachment; filename='+archive.name+'.zip;');
		res.status(200);
		archive.pipe(res);
	});
});

app.listen(port, function() {
	console.log("listening on %s...", port);
});
