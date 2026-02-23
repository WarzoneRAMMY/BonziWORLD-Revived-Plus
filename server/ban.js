const log = require('./log.js').log;
const fs = require('fs-extra');
const settings = require("../settings.json");
const io = require('./index.js').io;
const path = require('path');

const bansPath = path.join(__dirname, 'bans.json');
let bans = {};

exports.init = function() {
	try {
		if (!fs.existsSync(bansPath)) {
			fs.writeFileSync(bansPath, "{}");
			console.log("Created empty bans list.");
		}
		let raw = fs.readFileSync(bansPath, 'utf8');
		bans = JSON.parse(raw || '{}');
	} catch (e) {
		console.error("Could not load bans.json. Check syntax and permissions.", e);
		bans = {};
	}
};

exports.saveBans = function() {
	fs.writeFile(bansPath, JSON.stringify(bans), { flag: 'w' }, function(error) {
		try {
			log.info.log('info', 'banSave', { error: error });
		} catch(e) {}
	});
};

// Ban length is in minutes, or null for permanent
exports.addBan = function(ip, length, reason) {
	reason = reason || "N/A";
	
	// Support permanent bans
	let endTime;
	if (length === null || length === "perm" || length === "null") {
		endTime = null;  // null represents permanent ban
	} else {
		length = parseFloat(length) || settings.banLength;
		endTime = new Date().getTime() + (length * 60000);
	}
	
	bans[ip] = {
		reason: reason,
		end: endTime
	};

	var sockets = io.sockets.sockets;
	var socketList = Object.keys(sockets);

	for (var i = 0; i < socketList.length; i++) {
		var socket = sockets[socketList[i]];
		if (socket.request.connection.remoteAddress == ip)
			exports.handleBan(socket);
	}
	exports.saveBans();
};

exports.removeBan = function(ip) {
	delete bans[ip];
	exports.saveBans();
};

exports.handleBan = function(socket) {
	var ip = socket.request.connection.remoteAddress;
    
	// Ensure we actually have a ban record for this IP
	if (!bans[ip]) {
		return false;
	}

	// Check if ban has expired (permanent bans have null end date)
	if (bans[ip].end !== null && bans[ip].end <= new Date().getTime()) {
		exports.removeBan(ip);
		return false;
	}

	log.access.log('info', 'ban', {
		ip: ip
	});
	try {
		socket.emit('ban', {
			reason: bans[ip].reason,
			end: bans[ip].end
		});
		// Give the client a short moment to receive and process the ban event
		setTimeout(function() {
			try { socket.disconnect(); } catch(e) {}
		}, 200);
	} catch(e) {
		try { socket.disconnect(); } catch(err) {}
	}
	return true;
};

exports.kick = function(ip, reason) {
	var sockets = io.sockets.sockets;
	var socketList = Object.keys(sockets);

	for (var i = 0; i < socketList.length; i++) {
		var socket = sockets[socketList[i]];
		if (socket.request.connection.remoteAddress == ip) {
			socket.emit('kick', {
				reason: reason || "N/A"
			});
			// Allow client to receive the kick message before closing
			setTimeout(function(s) { try { s.disconnect(); } catch(e) {} }, 200, socket);
		}
	}
};

exports.isBanned = function(ip) {
    return Object.keys(bans).indexOf(ip) != -1;
};
