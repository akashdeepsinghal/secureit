
/**
 * @param {Object} the message to set to the content script
 */
function send_to_webpage(message)
{
	console.log("CALLED message: ", message);

	chrome.tabs.query({active: true, currentWindow: true},
		function(tabs) {
			console.log("send to webpage tabs:", tabs);
			chrome.tabs.sendMessage(tabs[0].id, message, function(response) { console.log("From Web Page Response: ", response); });
	});
}

/**
 * record button press
 */
function start_record() {
	console.log("START RECORD");
	//var rbtn = document.getElementById("rec_text");
	//rbtn.innerText = "RECORDING";
	//alert("record");
	var recelm = document.getElementById("record");
	var stopelm = document.getElementById("stop");
	recelm.className = "hidden";
	stopelm.className = "";

	chrome.extension.sendMessage({'type':'record'}, function(r) { xssstate = r; });
	send_to_webpage("record");
} 

/**
 * stop record button press
 */
function stop_record() {
	console.log("STOP RECORD");
	//var rbtn = document.getElementById("stop_text");
	//rbtn.innerText = "STOPED";

	var recelm = document.getElementById("record");
	var stopelm = document.getElementById("stop");
	recelm.className = "";
	stopelm.className = "hidden";

	chrome.extension.sendMessage({'type':'stop'}, function(r) { xssstate = r; });
	send_to_webpage("stop");
}


function save_record() {
	var elm = document.getElementById("options");
	elm.className = "left opt hidden";
	var elm2 = document.getElementById("loading");
	elm2.className = "left opt";
}

function updatetarget() {
	console.log("UPDATE TARGET");
	chrome.extension.sendMessage({"type":18, "target": document.getElementById("target_dom").value, "delay": document.getElementById("test_delay").value});
	window.close();
	//confirm("test");
	//alert("test");

	//var r = confirm("HackTab sends web requests that many systems will consider malicious.  It can store bogus data and possibly delete stored data depending on the application targeted.  HackTab is indented to be used in sandbox environemnts.  By clicking OK you assume all responsibility for using this tool.");
	//console.log("R", r);
	/*
	if (r == true) {
		chrome.extension.sendMessage({"type":18, "target": document.getElementById("target_dom").value, "delay": document.getElementById("test_delay").value});
	} else {
		var elm = document.getElementById("target_Dom");
		elm.value = "https?://.*domain.com";
	}
	*/
}

chrome.extension.sendMessage({"type":19}, function(r) {
	console.log("GET TARGET (Delay)", r, r.target.host);
	if ("target" in r && r.target.length > 1) {
		console.log("target host");
		document.getElementById("target_dom").setAttribute("value", r.target);
	} else {
		console.log("NO target host http://");
		document.getElementById("target_dom").setAttribute("value", "https?://");
	}
	console.log("GOT TARGET");

	document.getElementById("test_delay").setAttribute("value", r.delay);
	for (var x in r.plugins) {
		var elm = document.getElementById(x);
		if (r.plugins.x) {
			elm.setAttribute("checked", "checked");
		} else {
			elm.setAttribute("checked", "");
		}
	}
});

/**
 * attach event listeners
 */
/*
document.addEventListener('DOMContentLoaded', function() {
	var rbtn = document.getElementById("record");
	rbtn.addEventListener('click', start_record);
});

document.addEventListener('DOMContentLoaded', function() {
	var rbtn = document.getElementById("stop");
	rbtn.addEventListener('click', stop_record);
});
document.addEventListener('DOMContentLoaded', function() {
	var rbtn = document.getElementById("save");
	rbtn.addEventListener('click', save_record);
});
*/

document.addEventListener('DOMContentLoaded', function() {
	var btn = document.getElementById("target_dom_save");
	btn.addEventListener('click', updatetarget);

	// Check for all
	var threats = ['xss', 'mysql', 'mssql', 'lfi', 'csrf'] //CSRF is new
	for (i = 0; i < threats.length; i++) { 
		var elm = document.getElementById(threats[i]);
		elm.addEventListener("change", function() {
			var name = this.getAttribute("data-plugin");
			console.log("this", this.checked);
			chrome.extension.sendMessage({"type":20, "name":name, "enabled":this.checked});
		});
	}

});

chrome.extension.sendMessage({"type":20}, function(result) {
	for (var x in result) {
		var input = document.getElementById(x);
		console.log("have this", result, x, input);
		if (!result[x]) {
			input.removeAttribute("checked");
		}
	}
});