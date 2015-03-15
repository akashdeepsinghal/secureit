var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-57409305-1']);
_gaq.push(['_trackPageview']);


(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


var state = {};
state.record = false;
state.recording = [];
state.human = [];
state.current = {};
state.queue = [];
state.referer = {"comb_id":"0:0", "url":""};
//state.enabled = {"mysql":true,"mssql":true,"lfi":true,"xss":true};
state.enabled = {"mysql":false,"mssql":false,"lfi":false,"xss":true};
state.communication = false;
state.total_req = 0;
state.request_data = {};
state.tabs = {};
//state.target = {"host":"https?://.*domain.com", "regex":new RegExp("^https?://$")};
state.target = {"host":"https?://localhost", "regex":new RegExp("^https?://$")};
state.delay = 100;


// we store all of the web requests for each "page view" in this object
// on each page view, we check the cached saved requests against our last request
// if there are differences, then we send the data to the server
//state.pageCache = new Cache();


/**
 * send a JSON message to the content script
 * @param {Object} the message to set to the content script
 */
function send_to_webpage(message)
{
	if (state.communication) {
		chrome.tabs.sendMessage(state.communication, message, function(response) {
			if (response != "ACK") {
				console.log("Error From Web Page Response: ", response, message);
			}
		});
	} else {
		var log = Logger.getLogger("internal");
		log.error("send_to_webpage but no communication");
	}
	return;
}

// global bitdata object
var bitcache = new BitCache();



/**
 * create the hack tab
 */
function createTabs(sender) {
	var comb_tab = sender.tab.windowId + ":" + sender.tab.id;
	if (!(comb_tab in state.tabs) && !state.hacktab) {
		_gaq.push(['_trackEvent', 'tab', 'created']);
		chrome.tabs.create({"url":"/hacktab.html", "windowId": sender.tab.windowId, "index":sender.tab.index + 1}, function(tab) {
			state.tabs[tab.windowId+":"+tab.id] = comb_tab;
			state.tabs[comb_tab] = tab.windowId+":"+tab.id;
			state.hacktab = tab.id;
			send_to_webpage({"type":xcon.hacktab, "tabid":tab.id});
		});
	}
	if (comb_tab in state.tabs)
		return true;
	return false;
}

/**
 * listen for events from content scripts
 */
chrome.runtime.onMessage.addListener(
		// the message handler 
		function(message, sender, sendResponse) {
			if (!("type" in message)) {
				console.log("unknown message type??", message);
				return;
			}

			// set the current target domain
			if (message.type == xcon.settarget) {
				//_trackPageview('set_target');
				_gaq.push(['_trackEvent', 'target', 'set', message.target]);
				_gaq.push(['_trackEvent', 'target', 'delay', message.delay]);
				//var parts = parse_url(message.target);
				state.target = {"host":message.target, "regex": new RegExp("^"+message.target+"$")};
				console.log("set target to:", parts, state.target, message);
				state.delay = message.delay;
				return;
			}
			// get the current target domain
			else if (message.type == xcon.gettarget) {
				var result = {};
				/*
				if (n state && state.target) {
					result.target = state.target;
				} else if ("current" in state && "request" in state.current && "host" in state.current.request) {
					result.target = state.current.request.host;
				} else {
					result.target = "http://";
				}
				*/
				result.target = state.target.host;
				result.delay = state.delay;

				//for (var elm in state.
				return sendResponse(result);
			}
			// enable and disable plugins from the action icon
			else if (message.type == xcon.enable) {
				if ("name" in message) {
					state.enabled[message.name] = message.enabled;
					//_trackPageview(message.name);
					_gaq.push(['_trackEvent', 'enable', message.enabled, message.name]);
				}
				else {
					sendResponse(state.enabled);
				}
				return;
			}

			// no target defined yet or no sender
			if (!state.target.host || !sender || !sender.url) {
				console.log("NO TARGET, SENDER, OR SENDER URL", state.target, sender);
				return;
			}


			var parts = parse_url(sender.url);
			//console.log("test match! [" + state.target.host + "] ["+parts.host+"]", parts, sender);
			// is the message from the extension and not the currently viewed page?
			//if (parts.host.indetOf != "chrome-extension://daikedomhdhipjcbaahoicacfjchmiap" && !state.target.regex.exec(parts.host)) {
			if (parts.host.indexOf("chrome-extension:/") < 0 && !state.target.regex.exec(parts.host)) {
				sendResponse({"ignore":true});
				return;
			}


			if (state.communication && sender.tab.id != sender.tab.id) {
				//console.log("NEW TAB ?????");
				sendResponse({"ignore":true});
				return;
			}

			// create the hacktab if we don't have it yet
			createTabs(sender);

			if (message.type == xcon.shouldload) {
				//console.log("should load response communication:", state.communication);
				sendResponse(state.communication);
				return;
			}

			var log = Logger.getLogger("message");
			if (!("type" in message)) {
				_gaq.push(['_trackEvent', 'error', 'no_type']);
				return log.error("background message process failed, unknown message", message);
			}

			// TODO: handle messages from multiple tabs!
			if (!("hacktab" in message)) {
				state.communication = sender.tab.id; 
			}
			//log.error("background message: " + message.type, sender, message);

			
			// proxy a message to the hacktab from the content script
			if (message.type == xcon.hacktab) {
				// set the source tab of the message for the hacktab
				message.tabid = sender.tab.id;
				chrome.tabs.sendMessage(state.hacktab, message, function(r) { sendResponse(r); } );
			}
			// find out the host_id and url_id, response to content script
			// TODO: move this to a method
			else if (message.type == xcon.addrequest) {
				// calculate the host, url and comb_ids
				var host_id = bitcache.add_host(message.request.host);
				var url_id = bitcache.add_url(host_id, message.request.path);
				var comb_id = host_id+":"+url_id;
				//console.log("ADDREQUEST!", comb_id, message);
				var is_cached = bitcache.cache_request(comb_id, message.request.gparams, message.request.pparams, message.request.type);

				// add the response to the cached responses
				// currently we only cache a single response (the first)
				// perhaps we should cache the most recent?
				// TODO: add a method for updating the reponse
				if (message.response) {
					bitcache.add_resp(comb_id, "actual", 7, 1, message.response);
					bitcache.add_resp(comb_id, "time", 7, 1, message.response);
				}

				// forward the request to the hacktab as well
				if (state.hacktab) {
					chrome.tabs.sendMessage(state.hacktab, {"tabtype": "addrequest", "comb_id": comb_id, "response": message.response, "request": message.request, "info": bitcache.get_detail(comb_id), "tabid": sender.tab.id, "referer": state.referer}, function (r) { if (!r || r == undefined || !r.indexOf("ACK" >= 0)) { console.log("no ACK from tab", r); } });
				}
				// race condition?  this should not be possible...
				else {
					console.log("can't add request");
					console.log("cant add request <span style='color:red'>tab not open!</span>");
					_gaq.push(['_trackEvent', 'error', 'no_hacktab']);
				}
				// update the referer only when the main frame loads
				if (message.response.status == 0) {
					state.referer = {"comb_id":comb_id, "url": message.request.host+message.request.path+message.request.gparamstr};
				}

				// console.log("added the request");
				// send the host_id, and url_id back to the contect script
				_gaq.push(['_trackEvent', 'request', message.request.type, comb_id, countProperties(message.request.gparams) + countProperties(message.request.pparams)]);
				sendResponse({"host_id":host_id, "url_id":url_id, "cached":is_cached});

			}
			// TODO: remove this???
			else if (message.type == xcon.updatevar) {
				console.log("update var: ", message);
				bitcache.update_var(message.comb_id, message.key, message.keytype, message.index);
			}
			// send the background page state to the content script, called when the content scripts load
			else if (message.type == xcon.getstate) {
				sendResponse(state);
				dump_queue();
			}
			else if (message.type == xcon.vuln) {
				var now = new Date().getTime();
				//BitCache.prototype.update_vuln = function(comb_id, method, param_name, vuln_type, vuln)
				console.log(" ~~ update vuln in background.js", message);
				bitcache.update_vuln(message.comb_id, message.method, message.param_name, message.vuln_type, {"title": message.title, "detail":message.detail, "proof":"not implemented", "tested":now, "status":message.status });
				message.tabtype = "vuln";
				message.complete = true;
				message.tested = now;

				// log the found vulnerability type
				if (message.status == xcon.test.fail) {
					_gaq.push(['_trackEvent', 'vuln', 'fail', message.vuln_type]);
				} else {
					_gaq.push(['_trackEvent', 'vuln', 'pass', message.vuln_type]);
				}

				chrome.tabs.sendMessage(state.hacktab, message, function(r) { sendResponse(r); } );
			}
			// update persistant parameter type data
			else if (message.type == xcon.uptype) {
				console.log("up type", message);
				bitcache.update_type(message.comb_id, message.method.toLowerCase(), message.param_name, message.param_type, message.data);
			}
			// update persistant parameter vuln data
			else if (message.type == xcon.upvuln) {
				var now = new Date().getTime();
				message.complete = true;
				message.tested = now;
				if (message.status == xcon.test.fail) {
					_gaq.push(['_trackEvent', 'vuln2', 'fail', messasge.vuln_type]);
				} else {
					_gaq.push(['_trackEvent', 'vuln2', 'pass', messasge.vuln_type]);
				}

				bitcache.update_vuln(message.comb_id, message.method.toLowerCase(), message.param_name, message.vuln_type, message.vuln);
				message.tabtype = "vuln";
				chrome.tabs.sendMessage(state.hacktab, message, function(r) { sendResponse(r); } );
			}
			// update persistant parameter test data
			else if (message.type == xcon.uptests) {
				bitcache.update_tests(message.comb_id, message.method.toLowerCase(), message.param_name, message.tests, message.data);
			}
			// we have an attack request, gather up all data and send it to the content scripts
			else if (message.type == xcon.attack) {
				//_trackPageview("attack");
				_gaq.push(['_trackEvent', 'attack', 'started', message.param_name]);
				data = bitcache.get_detail(message.comb_id);
				var m = {"type":xcon.attack, "method":message.method, "comb_id":message.comb_id, "param_name":message.param_name, "data":data, "tabtype":"attack!!!", "enabled":state.enabled, "delay": state.delay, "referer":state.referer};
				chrome.tabs.sendMessage(state.communication, m, function(r) { console.log("attack r", r); } );
				//send_to_webpage({"type":xcon.attack, "method":message.method, "comb_id":message.comb_id, "param_name":message.param_name, "data":data});
				sendResponse("BACKGROUND ATTACK ACK");
			}
			// WTF?
			else {
				log.error("unknown param:", message);
			}
}
);



chrome.webRequest.onHeadersReceived.addListener(
		function(details) { 
			var parts = parse_url(details.url);

			if (state.target.regex.exec(parts.host)) {
				//console.log("HEADERS MATCHED: " + parts.host, state.target);
			} else {
				return;
				//console.log("NOT HEADERS MATCHED: ", state.target);
			}

			var host_id = bitcache.add_host(parts.host);
			var path_id = bitcache.add_url(host_id, parts.path);
			var comb_id = host_id + ":" + path_id;
			// console.log(" !@#$ !@#$ !@#$ on headers received", comb_id, details, state.redirect);
			var redirect = null;

			for (var i=0;i<details.responseHeaders.length;i++) {
				var hdr = details.responseHeaders[i];
				bitcache.add_resp(comb_id, hdr.name.toLowerCase(), 7, 1, hdr.value);
				if (hdr.name.toLowerCase() == "location") { redirect = hdr.value; console.log(" #### HAVE LOCATION");}
			}
			
			if (details.type == "main_frame") {

				if (state.hacktab && state.redirect === null) {
					//console.log("have headers SEND CLEAR");
					chrome.tabs.sendMessage(state.hacktab, {"tabtype":"clear"});
				}
				// just got a 200/etc after a 30x
				// don't clear the past 302 redirects from the list!
				/*
				if (state.redirect && !redirect)
				{
				// do nothing
				}
				else {
					
				}
				state.redirect = redirect;
				*/
				state.redirect = redirect;
			}


			if (redirect !== null) {
			/*
				var parts2 = parse_url(redirect);
				if (parts2['host'].substr(0, 6) == "chrome") {
					parts2['host'] = state.current.request.host;
				}
				*/
				var h_id = bitcache.add_host(state.current.request.host);
				var u_id = bitcache.add_url(h_id, state.current.request.path);
				var c_id = h_id+":"+u_id;
				var is_cached = bitcache.cache_request(c_id, state.current.request.gparams, state.current.request.pparams, state.current.request.type);
				console.log("add the redirect url ", state.hacktab);
				if (state.hacktab) {
					chrome.tabs.sendMessage(state.hacktab, {"tabtype":"addrequest", "comb_id":c_id, "response": {"text":"", "status":301}, "request": state.current.request, "info": bitcache.get_detail(comb_id), "tabid": state.communication, "referer":state.referer}, function (r) { if (r != "ACK") { console.log("no ACK from tab", r); } });
				}
				console.log("ADD REDIRECT URL!", comb_id, state.current);
				/*
				// add the response to the cached responses
				if (message.response) {
					bitcache.add_resp(comb_id, "actual", 7, 1, message.response);
				}
				*/
			}
		},
		{
			urls: [ "http://*/*", "https://*/*"],
	types: ["main_frame", "xmlhttprequest"]
		},
		["blocking", "responseHeaders"]);

/**
 * intercept all page requests
 * TODO: is this still needed?
 */
chrome.webRequest.onBeforeRequest.addListener(
		function(info) {
			//console.log("BEFORE REQUEST!", info);

			// background extension initiated request, we can ignore this
			if (info.tabId < 0) {
				return {"cancel": false};
			}

			var data = parse_url(info.url);
			//console.log("DATA", data);

			if (state.target.regex.exec(data.host)) {
				//console.log("REQUEST MATCHED", state.target, data.host);
			} else {
				//console.log("NOT REQUEST MATCHED: ", state.target, data.host);
				return;
			}

			var pparams = {};
			if ("requestBody" in info) {
				for (var fd in info.requestBody.formData) {
					pparams[fd] = info.requestBody.formData[fd][0];
				}
			}
			var request = {"method": info.method, "host":data.host, "path":data.path, "gparamstr": data.gparamstr, "gparams":data.gparams, "type":info.type, "pparams": pparams};
			//console.log("MAIN PAGE: ", request);
			//send_to_webpage();
			state.current = {"type":xcon.setcurrent, "request": request};
			//send_to_webpage({"type":xcon.setcurrent, "request": request});

			return {"cancel": false};
		},

		// filtering
{
	urls: [ "http://*/*", "https://*/*" ],
	//types: ["main_frame", "xmlhttprequest"]
	types: ["main_frame"]
},
	// extraInfoSpec
	["blocking", "requestBody"]);



/**
 * dump a list 
 */
function dump_queue() {
	//state.queue.push({"info":info, "url_id":result.url_id, "request":request});
	//console.log(" XX no need to dump queue...", state);
	_gaq.push(['_trackEvent', 'error', 'dump_queue']);

	var item = null;
	while ((item = state.queue.pop())) {
		console.log("DEPRICATED ??? dump this thing", item);
		send_to_webpage({"type": xcon.getinfo, 
			"info": item.info,
			"url_id": item.url_id,
			"host_id": item.host_id,
			"request": item.request});
	}

	var d = new Date();
	state.cutofftime = d.getTime();
}


chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
	console.log("tab deleted!", tabId, removeInfo);
	if (tabId == state.hacktab) {
		console.log(" HACK TAB DELETED!, RESET");
		_gaq.push(['_trackEvent', 'tab', 'ht_deleted']);
		state.hacktab = false;
		state.communication = false;
	}
	if (tabId == state.communication) {
		console.log(" HACK TAB COM DELETED!, RESET");
		_gaq.push(['_trackEvent', 'tab', 'com_deleted']);
		state.communication = false;
		state.hacktab = false;
	}

	var comb_tab = removeInfo.windowId + ":" + tabId;
	var ptr_tab = state.tabs[comb_tab];
	delete state.tabs[comb_tab];
	delete state.tabs[ptr_tab];
}
);

// TODO: update the new tab ID!
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete') {
		//console.log("TAB UPDATED!", tabId, changeInfo, tab);
		/*
		   send_to_webpage({"type":10, "foo":"bar"});

		   chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
		   chrome.tabs.sendMessage(tabs[0].id, {action: "SendIt"}, function(response) {});  
		   });
		   */
	}
});


