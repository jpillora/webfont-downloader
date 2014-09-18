
var async = require("async");
var archiver = require("archiver");
var request = require("request");
var express = require("express");
var fmt = require("util").format;
// var fs = require("fs");
var app = express();
var port = process.env.PORT || 3000;
var baseURL = "http://fonts.googleapis.com";

function fetchCSS(name, query, cb) {
	var url = baseURL+query;
	console.log("Fetching %s", url);
	request(url, function(err, res, body) {
		if(err)
			return cb(err);
		if(res.statusCode !== 200)
			return cb(fmt("Could not fetch: %s (%s)", url, res.statusCode));
		cb(err, name, body);
	});
}

function createFetcher(filename, ext) {
	var url = filename+"."+ext;
	return function(cb) {
		request(url, function(err, res, body) {
			if(err)
				return cb(err);
			console.log("Fetched %s", url);
			return cb(null, new Buffer(body));
		});
	};
}

function createArchive(name, css, cb) {
	console.log('creating: %s', name);
	var index = 0;
	var filenames = [];
	var fetches = [];

	var localCss = css.replace(/url\((.+)\.(\w+)\)/g, function(str, filename, ext) {
		fetches.push(createFetcher(filename, ext));
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
	if(!/(\/css\?family=([^\:]+)\:.+)/.test(req.url))
		return res.status(400).send("Invalid request");
	var query = RegExp.$1;
	var name = RegExp.$2.replace(/\W/g,'');

	//kick it off
	async.waterfall([
		fetchCSS.bind(null, name, query),
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
