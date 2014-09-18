
var async = require("async");
var archiver = require("archiver");
var requestLib = require("request");
var express = require("express");
var fmt = require("util").format;
var app = express();
var port = process.env.PORT || 3000;
var baseURL = "http://fonts.googleapis.com";
var types = {
	tff: "Node.js",
	woff: "Mozilla/5.0 (Windows NT 5.1; rv:31.0) Gecko/20100101 Firefox/31.0",
	eotwoff: "Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US))"
};

function fetchCSS(request, name, query, cb) {
	var url = baseURL+query;
	console.log("Fetching font '%s' at %s", name, url);
	request(url, function(err, res, body) {
		if(err)
			return cb(err);
		if(res.statusCode !== 200)
			return cb(fmt("Could not fetch: %s (%s)", url, res.statusCode));
		cb(err, request, name, body);
	});
}

function createFetcher(request, index, filename, ext) {
	var url = filename+"."+ext;
	return function(cb) {
		console.log("Fetching item #%s %s", index, url);
		request(url, function(err, res, body) {
			if(err)
				return cb(err);
			if(res.statusCode !== 200)
				return cb(fmt("Could not fetch item #%s %s (%s)", index, url, res.statusCode));
			console.log("Fetched item #%s %s", index, url);
			return cb(null, new Buffer(body));
		});
	};
}

function createArchive(request, name, css, cb) {
	console.log('Creating: %s', name);
	var index = 0;
	var filenames = [];
	var fetches = [];

	var localCss = css.replace(/url\((https?:\/\/[^\)]+)\.(\w+)\)/g, function(str, filename, ext) {

		fetches.push(createFetcher(request, index, filename, ext));
		var localFilename = name + "-" + index + "." + ext;
		var cssFilename = "url(./" + localFilename + ")";
		filenames[index] = localFilename;
		//next
		index++;
		return cssFilename;
	});

	async.parallelLimit(fetches, 10, function(err, buffers) {
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
	var type = RegExp.$1.substr(1);
	var query = RegExp.$2;
	var name = RegExp.$3.replace(/\W/g,'');

	var ua = types[type];
	if(type && !ua)
		return res.status(400).send("Invalid type: " + type);

	//create a request agent
	var request = requestLib.defaults({
		headers: {
			'User-Agent': ua || types.eotwoff
		}
	});

	//kick it off
	async.waterfall([
		fetchCSS.bind(null, request, name, query),
		createArchive,
		finalizeArchive
	], function end(err, archive) {
		//log errors
		if(err)
			console.error(err);

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
