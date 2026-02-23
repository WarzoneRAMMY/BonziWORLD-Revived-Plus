// ========================================================================
// Server init
// ========================================================================

// Filesystem reading functions
const fs = require('fs-extra');

// Load settings
try {
	stats = fs.lstatSync('settings.json');
} catch (e) {
	// If settings do not yet exist
	if (e.code == "ENOENT") {
		try {
			fs.copySync(
				'settings.example.json',
				'settings.json'
			);
			console.log("Created new settings file.");
		} catch(e) {
			console.log(e);
			throw "Could not create new settings file.";
		}
	// Else, there was a misc error (permissions?)
	} else {
		console.log(e);
		throw "Could not read 'settings.json'.";
	}
}

// Load settings into memory
const settings = require("./settings.json");

// Setup basic express server
const path = require('path');

// Maintenance Configs
// Options: true and false
updating = false;

if (updating == true) {
	var express = require('express');
	var app = express();
	exports.app = app;
	if (settings.express.serveStatic) {
		const servePath = path.join(__dirname, '..', 'build', 'maintenance', 'themes', 'win_7');
		console.log('Serving maintenance static from', servePath);
		app.use(express.static(servePath));
	}
	var server = require('http').createServer(app);
} else {
	var express = require('express');
	var app = express();
	if (settings.express.serveStatic) {
		const servePath = path.join(__dirname, '..', 'build', 'www');
		console.log('Serving web static from', servePath);
		app.use(express.static(servePath));
	}
	var server = require('http').createServer(app);
};
// Shutdown Configs
// Options: true and false
/* offline = false;

if (offline == true) {
var express = require('express');
var app = express();
if (settings.express.serveStatic)
	app.use(express.static('../build/shutdown/themes/win_7'));
var server = require('http').createServer(app);
} else {
var express = require('express');
var app = express();
if (settings.express.serveStatic)
	app.use(express.static('../build/www'));
var server = require('http').createServer(app);
}; */

// Init socket.io
var io = require('socket.io')(server);
var port = process.env.PORT || settings.port || 3505;
// Some hosts (or misconfigured envs) may set PORT to 10000 — prefer configured port 3505
if (Number(port) === 10000) {
	port = 3505;
}
exports.io = io;

// Init sanitize-html
var sanitize = require('sanitize-html');

// Init winston loggers (hi there)
const Log = require('./log.js');
Log.init();
const log = Log.log;

// Load ban list
const Ban = require('./ban.js');
Ban.init();
// Start actually listening
server.listen(port, function () {
	console.log(
		" Welcome to BonziWORLD!\n",
		"Time to meme!\n",
		"----------------------\n",
		"Server listening at port " + port
	);
});
app.use(express.static(__dirname + '/public'));

// Health check endpoint for hosting platforms
app.get('/health', function (req, res) {
	res.status(200).send('OK');
});

// ========================================================================
// Banning functions
// ========================================================================

// ========================================================================
// Helper functions
// ========================================================================

const Utils = require("./utils.js")

// ========================================================================
// The Beef(TM)
// ========================================================================

const Meat = require("./meat.js");
Meat.beat();

// Console commands
const Console = require('./console.js');
Console.listen();

// ========================================================================
// BOTS -- DO NOT USE
// ========================================================================

// require('./cosmicbot.js');
// twats will use this for posting black people twerking
// require('./boombot.js');
