const log = require('./log.js').log;
const fs = require('fs-extra');
const settings = require("./settings.json");
const io = require('./index.js').io;
const sanitize = require('sanitize-html');

let bans;
let hardwarebans;

exports.init = function() {
    fs.writeFile("./bans.json", "{}", { flag: 'wx' }, function(err) {
        if (!err) console.log("Created empty bans list.");
        try {
            bans = require("./bans.json");
        } catch(e) {
            throw "Could not load bans.json. Check syntax and permissions.";
        }
    });

    fs.writeFile("./hardware_bans.json", "{}", { flag: 'wx' }, function(err) {
        if (!err) console.log("Created empty hardware bans list.");
        try {
            hardwarebans = require("./hardware_bans.json");
        } catch(e) {
            throw "Could not load bans.json. Check syntax and permissions.";
        }
    });
	// wait until we actually put some use to these
	/*
    fs.writeFile("./mutes.json", "{}", { flag: 'wx' }, function(err) {
        if (!err) console.log("Created empty mutes list.");
        try {
            mutes = require("./mutes.json");
        } catch(e) {
            throw "Could not load mutes.json. Check syntax and permissions.";
        }
    });
    fs.writeFile("./logins.json", "{}", { flag: 'wx' }, function(err) {
        if (!err) console.log("Created empty logins list.");
        logins = require("./logins.json");
    });
    fs.writeFile("./reports.json", "{}", { flag: 'wx' }, function(err) {
        if (!err) console.log("Created empty reports list.");
        reports = require("./reports.json");
    });*/
};
exports.saveBans = function() {
	fs.writeFile(
		"./bans.json",
		JSON.stringify(bans),
		{ flag: 'w' },
		function(error) {
			log.info.log('info', 'banSave', {
				error: error
			});
		}
	);
};
exports.saveAccounts = function() {
	fs.writeFile(
		"./accounts.json",
		JSON.stringify(accounts),
		{ flag: 'w' },
		function(error) {
			log.info.log('info', 'accountSave', {
				error: console.error(error)
			});
		}
	);
};
exports.saveHardwareBans = function() {
	fs.writeFile(
		"./hardware_bans.json",
		JSON.stringify(hardwarebans),
		{ flag: 'w' },
		function(error) {
			log.info.log('info', 'banSave', {
				error: error
			});
		}
	);
};

exports.saveLogins = function() {
	fs.writeFile(
		"./logins.json",
		JSON.stringify(logins)
	);
};

exports.saveReport = function() {
	fs.writeFile(
		"./reports.json",
		JSON.stringify(reports)
	);
};

exports.saveMutes = function() {
	fs.writeFile(
		"./mutes.json",
		JSON.stringify(mutes),
		{ flag: 'w' },
		function(error) {
			log.info.log('info', 'banSave', {
				error: error
			});
		}
	);
}; 

// Ban length is in minutes
exports.addBan = function(ip, length, reason) {
	length = parseFloat(length) || settings.banLength;
	reason = reason || "N/A";
	bans[ip] = {
		reason: reason,
		end: new Date().getTime() + (length * 60000)
	};

	var sockets = io.sockets.sockets;
	var socketList = Object.keys(sockets);

	for (var i = 0; i < socketList.length; i++) {
		var socket = sockets[socketList[i]];
		if (socket.handshake && (socket.handshake.headers['cf-connecting-ip'] == ip || socket.request.connection.remoteAddress == ip))
			exports.handleBan(socket);
	}
	exports.saveBans();
};
exports.addAccount = function(ip, bwnzjName, guid) {
	accounts[ip] = {
		name: sanitize(bwnzjName),
		bonziId: sanitize(guid)
	};

	exports.saveAccounts();
};
exports.addHardwareBan = function(ip, agent, length, reason) {
	length = parseFloat(length) || settings.banLength;
	reason = reason || "N/A";
	hardwarebans[agent] = {
		reason: reason
	};

	var sockets = io.sockets.sockets;
	var socketList = Object.keys(sockets);

	for (var i = 0; i < socketList.length; i++) {
		var socket = sockets[socketList[i]];
		if (socket.handshake && socket.handshake.headers['user-agent'] == agent)
			exports.handleBan(socket);
	}
	exports.saveHardwareBans();
};

exports.removeBan = function(ip) {
	delete bans[ip];
	exports.saveBans();
};
exports.removeHardwareBan = function(ip) {
	delete hardwarebans[ip];
	exports.saveHardwareBans();
};
exports.removeMute = function(ip) {
	delete mutes[ip];
	exports.saveMutes();
};

exports.removeLogin = function(ip) {
	delete logins[ip];
	exports.saveLogins();
};

exports.handleReport = function(name) {
	var ip = name;
	return true;
};
exports.handleMute = function(socket) {
	var ip = socket.request.connection.remoteAddress;
	if (mutes[ip].end <= new Date().getTime()) {
		exports.removeMute(ip);
		return false;
	}

	log.access.log('info', 'ban', {
		ip: ip
	});
		socket.emit('mute', {
			reason: mutes[ip].reason  + " <button onclick='hidemute()'>Close</button>",
			end: mutes[ip].end
		});
	return true;
};
exports.handleBan = function(socket) {
	var ip = socket.handshake.headers['cf-connecting-ip'] || socket.request.connection.remoteAddress;
	var agent = socket.handshake.headers['user-agent'];
	if (!bans[ip]) return false;
	if (bans[ip].end <= new Date().getTime()) {
		exports.removeBan(ip);
		return false;
	}

	log.access.log('info', 'ban', {
		ip: ip
	});
	socket.emit('ban', {
		reason: bans[ip].reason,
		end: bans[ip].end
	});
	socket.disconnect();
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
			socket.disconnect();
		}
	}
};

exports.warning = function(ip, reason) {
	var sockets = io.sockets.sockets;
	var socketList = Object.keys(sockets);
	reason = reason || "N/A";
	for (var i = 0; i < socketList.length; i++) {
		var socket = sockets[socketList[i]];
		if (socket.request.connection.remoteAddress == ip) {
			socket.emit('warning', {
				reason: reason + " <button onclick='hidewarning()'>Close</button>"
			});
		}
	}
};

exports.handleLogin = function(socket) {
	var ip = socket.request.connection.remoteAddress;

	log.access.log('info', 'loginadded', {
		ip: ip
	});
	return true;
};

exports.mute = function(ip, length, reason) {
	var sockets = io.sockets.sockets;
	var socketList = Object.keys(sockets);
	length = parseFloat(length) || settings.banLength;
	mutes[ip] = {
		reason: reason,
		end: new Date().getTime() + (length * 600)
	};
	reason = reason || "N/A";
	for (var i = 0; i < socketList.length; i++) {
		var socket = sockets[socketList[i]];
		if (socket.request.connection.remoteAddress == ip) {
			exports.handleMute(socket);
		}
	}
	
	exports.saveMutes();
};

exports.addReport = function(name, username, reason, reporter) {
	var sockets = io.sockets.sockets;
	var socketList = Object.keys(sockets);
	reports[name] = {
		username: username,
		reporter: reporter,
		reason: reason
	};
	reason = reason || "N/A";
	username = username || "missingno";
	reporter = reporter || "FAK SAN WAT ARE YOU DOING, NO!"
	exports.handleReport(name);
	exports.saveReport();
};

exports.login = function(ip, reason) {
	var sockets = io.sockets.sockets;
	var socketList = Object.keys(sockets);
	logins[ip] = {
		reason: reason 
	};
	reason = reason || "N/A";
	for (var i = 0; i < socketList.length; i++) {
		var socket = sockets[socketList[i]];
		if (socket.request.connection.remoteAddress == ip) {
			socket.emit('achieve', {
				reason: reason
			});
			exports.handleLogin(socket);
		}
	}
	exports.saveLogins();
};

exports.isBanned = function(ip) {
    return Object.keys(bans).indexOf(ip) != -1;
};
exports.isHardwareBanned = function(ip,agent) {
    return Object.keys(hardwarebans).indexOf(agent) != -1;
};

exports.isIn = function(ip) {
    return Object.keys(logins).indexOf(ip) != -1;
};

exports.isMuted = function(ip) {
    return Object.keys(mutes).indexOf(ip) != -1;
};
