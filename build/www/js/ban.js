function ban() {
	var x = document.getElementById("banmenu_reason").value;
	var x2 = document.getElementById("banmenu_ip").value;
	var endValue = document.getElementById("banmenu_end").value;
	
	// Convert duration input to minutes or "perm" for permanent
	var x3;
	var lowerEnd = endValue.toLowerCase().trim();
	
	if (lowerEnd === "perm" || lowerEnd === "permanent") {
		x3 = "perm";
	} else if (lowerEnd === "1h" || lowerEnd === "1 hour" || lowerEnd === "1hour") {
		x3 = 60; // 1 hour in minutes
	} else if (lowerEnd === "7d" || lowerEnd === "7 days" || lowerEnd === "7days") {
		x3 = 10080; // 7 days in minutes (7 * 24 * 60)
	} else if (!isNaN(endValue)) {
		x3 = endValue; // Use as-is if it's already a number (minutes)
	} else {
		x3 = 1440; // Default to 24 hours if unrecognized
	}
	
	socket.emit("command", {list:["ban",x2,x3,x]});
	var x4 = document.getElementById("page_banmenu");
	if (x4.style.display === "none") {
		x4.style.display = "block";
	} else {
		x4.style.display = "none";
	}
}

function report() {
	var x = document.getElementById("reportmenu_reason").value;
	var x2 = document.getElementById("reportmenu_name").value;
	socket.emit("command", {list:["report",x2,x]});
	var x4 = document.getElementById("page_reportmenu");
	if (x4.style.display === "none") {
		x4.style.display = "block";
	} else {
		x4.style.display = "none";
	}
}

function banmenu() {
	var x4 = document.getElementById("page_banmenu");
	if (x4.style.display === "none") {
		x4.style.display = "block";
	} else {
		x4.style.display = "none";
	}
}
function reportmenu() {
	var x4 = document.getElementById("page_reportmenu");
	if (x4.style.display === "none") {
		x4.style.display = "block";
	} else {
		x4.style.display = "none";
	}
}
