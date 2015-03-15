// xssploit.js
// This software is proprietary.
// (c) 2014 hacktab.com, all rights reserved.
// Author: Cory Marsh root@protectlogic.com
//
// This script runs in the context of the web page
//

// inject the XHR proxy if we are loading on this domain...
var s = document.createElement('script');
s.src = chrome.extension.getURL('xhrproxy.js');
s.onload = function() { this.parentNode.removeChild(this); };
(document.head||document.documentElement).appendChild(s);
console.log("injected xhr proxy");

/**
 * listen for XHR requests from xhrproxy.js
 */
document.addEventListener("ProtectLogic", xhrproxy_listener);



// first track input changes for user tainting
// TODO: plumb this into the server API
var page_tracking = {};
var xssstate = {};
xssstate.target = 1;
// list of urls we have tested for the current page.
// some sites request the same url multiple times and we don't want to run
// the smae test each time.  keep track of which urls have been tested.
xssstate.tested_ids = {};

chrome.extension.sendMessage({"type": xcon.shouldload}, function(r) {
	//console.log("SHOULD LOAD", r); 
	if (r && typeof r === "object" && "ignore" in r && r.ignore) {
		xssstate.target = 2;
		//console.log("IGNORE IT");
		return;
	}

	xssstate.target = 3;
	// send current request is done on document load *IF* target=3
	//send_current_request();
	// XHR is always loaded and filtered in the background page
	//replaceXHR2();
	//console.log("ACTIVE TAB");
});

// global bitdata object
var bitdata = new BitData();

/**
 * receive events from the XHR proxy
 */
function xhrproxy_listener(e) {
	var request = parse_url(e.detail.req.args[1]);
	request.type = "xmlhttprequest";
	request.method = e.detail.req.args[0].toUpperCase();
	request.pparams = {};

	//console.log("GOT xhrproxy_listener # # # # # ", e);


	if ("post" in e.detail.req) {
		for (var item in e.detail.req.post) {
			if (e.detail.req.post[item]) {
				var elm = e.detail.req.post[item];
				if (typeof(elm) == "string") { 
					var queries = e.detail.req.post[item].split('&');
					for(var i=0; i<queries.length; i++ ) {
						var split = queries[i].split('=');
						request.pparams[split[0]] = split[1];
					}
				}
			}
		}
	}

	//console.log(" --> PROXY RESPONSE", request);//e.detail.resp);
	update_url_info(request, e.detail.resp);
}




/**
 * TODO: move this to caller
 */
function update_url_info(request, response) {
	var result = bitdata.add_request(request, response, null);
}



// listen for events from the background and popup scripts
chrome.runtime.onMessage.addListener(
	// the message handler 
	function(message, sender, sendResponse) {
		//sender.tab ?  "from a content script:" + sender.tab.url : "from the extension");
		//console.log(sender.tab ?  "from a content script:" + sender.tab.url : "from the extension");
		// why does this not always fire?   what about POST ?????
		//console.log("##### from extension : ", message, sender);

		if (message.type == xcon.setcurrent) {
			xssstate.current = message.current;
			//scan_page(document.documentElement.innerHTML);
		}
		else if (message.type == xcon.hacktab) {
			xssstate.hacktab = message.tabid;
		}
		else if (message.type == xcon.attack) {
			console.log("TEST THIS: ", message);
			for (var i=0; i<xcon.activetesters.length; i++) {
				// use a new tester for each METHOD
				var test = new xcon.activetesters[i]();
				test._delay = message.delay;
				test.test_param(message.comb_id, message.param_name, "GET", message.data, message);

				var test2 = new xcon.activetesters[i]();
				test2._delay = message.delay;
				test2.test_param(message.comb_id, message.param_name, "POST", message.data, message);
			}
		}
		else if (message.type == xcon.getinfo) {
			// cache the main_frame response
			//console.log("message type get info", message.info);
			// set the document response
			/*
			if (message.info.type == "main_frame") {
				bitdata.add_response(message.host_id+":"+message.url_id, "actual_doc", 7, 7, document.documentElement.innetHTML);
			}
			*/
			console.log(" XX xcon.getinfo DEPRICATED ", message.info);
			//get_request_data(message.info, message.host_id, message.url_id, message.request);
		}
		else if (message.type == "record") {
			begin_record(message);
		}
		else if (message.type == "stop") {
			stop_record(message);
		}
		else {
			console.log(" >>> UNKNOWN message", message);
		}

		sendResponse("ACK");
	}
);


// called when the record option is started
function begin_record(message) {
	console.log("begin recording");
}

// called when the recording is stopped
function stop_record(message) {
	console.log("stop recording");
}

function process_request(message) {
	var method	= message.request.method;
	var url	= message.request.url;
	var type = message.request.type;
	var post_data = {};
	if  (message.request.requestBody) {
		var post_params = message.request.requestBody.formData;
		if (post_params) {
			for (param_name in post_params) {
				//for (val in post_params[param_name]) {
				for (var i=0;i<post_params[param_name].length;i++) {
					post_data[param_name ]= post_params[param_name][i];
				}
			}
		}
	}


	result = log_request(method, url, post_data);
	if (result) {
		sendResponse({hresponse: "url tracked", "status": 200});
	} else {
		sendResponse({hresponse: "error communicating with server", "status": 500});
	}
}


function get_url_params(url) {
  var re = /(?:\?|&(?:amp;)?)([^=&#]+)(?:=?([^&#]*))/g,
      match, params = {},
      decode = function (s) {return decodeURIComponent(s.replace(/\+/g, " "));};

  if (typeof url == "undefined") url = document.location.href;

  while ((match = re.exec(url))) {
    params[decode(match[1])] = decode(match[2]);
  }
  return params;
}

// get all forms, log all paramters, actions and methods
function get_forms() {
	//var forms = document.getElementsByName("form");
	//console.log(document.forms);
	//for (form in document.forms) {
	var forms = document.forms;
	for (var i=0;i<forms.length;i++) {
		var form = forms[i];
		console.log(form.getAttribute("method") + " " + form.getAttribute("action"));
		var inputs = form.getElementsByTagName("input");
		//console.log(inputs);
		var params = [];
		for (var x=0;x<inputs.length;x++) {
			var input = inputs[x];
			var tmp = "";
			tmp += input.getAttribute("name") + "|";
			tmp += input.getAttribute("type") + "|";
			tmp += input.getAttribute("size") + "|";
			tmp += input.getAttribute("maxLength") + "=";
			tmp += input.value;
			params.push(tmp);
		}
		console.log("params: " + params);
		log_request(form.getAttribute("method"), form.getAttribute("action"), params);
	}
}


/**
 * called when an input element changes
 */
function track_input_change(elm) {
	//elm.srcElement.value
	var form = elm.srcElement.form;
	console.log("track input change!", elm, form);

	// TODO: add input type here
	chrome.extension.sendMessage({"type": "input_change","name": elm.srcElement.name, "value": elm.srcElement.value, "form": form.getAttribute("action")}, function(r) { console.log(r); });
}




// attach input listeners
// TODO: save existing change handler so we can call it from ours
var inputs = document.getElementsByTagName("input");
for (var i=0; i<inputs.length; i++) {
	inputs[i].onchange = track_input_change;
}



// scan the current document
function scan_page(comb_id, param_name, request, response) {

	console.log("SCAN PAGE", comb_id, request, response) ;
	// send this data to all of the response watchers
	for (var i=0; i<xcon.responsewatchers.length; i++) {
		var watcher = xcon.responsewatchers[i];
		watcher.handleWatch(comb_id, request, response, param_name);
	}

	//UI.setTitle("scan complete");
	//BitUISetTitle("scan complete");
}

//window.setTimeout(function() { getForms() }, 1000);
//window.setTimeout(function() { scan_sinks(document.body) }, 1000);


// collect additional data only
// if we get bad auto responses, we won't be able to update them with this code
// need to test and see the best way to handle it

	//get_request_data(request, e.detail.resp);



function get_request_data(info, host_id, url_id, request) {
	var log = Logger.getLogger("intercept");
	if (host_id+":"+url_id in xssstate.tested_ids) {
		log.warn("url already tested response for", host_id+":"+url_id);
		return;
	}

	var resp = bitdata._cache.get_resp(host_id+":"+url_id);
	log.error("SKIPIO! get_request_data!", host_id, url_id, request, resp);
	console.log("   #### ", bitdata);
	return;

	// add to the list of urls we have tested for the current main_frame page
	xssstate.tested_ids[host_id+":"+url_id] = true;


	// add default 500 server error
	bitdata.add_response(host_id+":"+url_id, "server_error", 4, 2, 499);


 	// {host, path, gparamstr, gparams, pparams, method, type (main_frame, xmlhttprequest) }
	var m = info.method;
	var u = info.url;
	//apicall(verb, method, data, callback);
	
	// this callback needs to look at the response, determine replayability and capture enough data to determine response type automagically
	var xmlhttp = new XMLHttpRequest();
	var d = new Date();
	var mstime = d.getTime();

	xmlhttp.onload = function (data) {

		var d2 = new Date();
		var mstime2 = d2.getTime();

		var creds = this.withCredentials;
		var stats = this.status;

		var len = this.responseText.length;
		var resp = "";
		var type = this.getResponseHeader("Content-Type");
		var out = "";

		// the return type check to perform, default is page contains text
		var attr_type = 1;
		var attr_op = 1;

		// we have an actual response, with data, so if we don't get one in the future, we should count that as an error
		if (len > 60) {
			bitdata.add_response(host_id+":"+url_id, "empty_error", 3, 3, 60);
		}



		// SEARCH FOR A VALID RESPONSE IDENTIFIER
		// TODO: add xml response handling
		var jdoc = false;
		// if we have a JSON doc, try to get a key value pair from the doc
		try {
			jdoc = JSON.parse(this.responseText);
			for (var key in jdoc) {
				if ((typeof jdoc[key] == "string" && jdoc[key].length > 1) || typeof jdoc[key] == "number") {
					out = key + "=" + jdoc[key];
					// json value is = to
					attr_type = 5;
					attr_op = 1;
					break;
				}
			}
		} catch (err) {
			// log.error("error parsing JSON 
		}


		// text / html documents
		if (out === "") {
			if (len < 60) {
				resp = this.responseText;
				// set to json attribute type and = check (not indexOf)
				attr_type = 1;
				attr_op = 0;
			}
			else {
				var found = false;
				var div = 10;
				var finder = new RegExp(">\s*([^<]*[a-zA-Z][^<]+)");
				// look 10% out from center, then 15,20,30,50
				while (!found && div > 0) {
					var mid = len / 2;
					var size = mid / div;
					var tst = this.responseText.substr(mid - size, size);
					out = finder.exec(tst);
					if (out) {
						log.trace("found text response in data", out);
						out = out[1];
						found = true;
					} else {
						log.debug("no response text in data", out, tst);
						div -= 2;
					}
				}
			}
		}

		if (type == "text/plain" || type == "text/html") {
			console.log("TEST PLAIN TEXT!", url_id, u);
		}

		
		//console.log(" ~~~ BIT DATA:", bitdata);
		var respdata = bitdata._cache.get_resp(host_id+":"+url_id);
		console.log(" ~~~ REPLAY TEST AGAINST;", respdata);
		console.log(" ~~~ ORIG RESP SIZE:", this.responseText.length);

		// store the auto created valid response
		//bitdata.add_response(url_id, "auto_success", attr_type, attr_op, out);

		// time to search through the content for XSS
		//scan_page(this.responseText);
		for (var i=0; i<xcon.responsewatchers.length; i++) {
			var watcher = xcon.responsewatchers[i];
			//watcher.handleWatch(comb_id, request, response_text, param_name);
			// TODO: wrong sig here
			watcher.handleWatch(url_id, request, this.responseText, mstime2-mstime);
		}
	};
	xmlhttp.onerror = function (data) {
		log.error(" *!*!* error replaying url: " + u, this);
	};

	var url = request.host + request.path;
	if (request.gparamstr) {
		url += "?" + request.gparamstr + "&QVzp=3";
	} else {
		url += "?QVzp=3";
	}

	// handle GET requests
	if (request.method == "GET") {
		xmlhttp.open(request.method, url, true);
		xmlhttp.send();
	}
	// handle POST requests
	else {
		xmlhttp.open(request.method, url, true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
		xmlhttp.send(Content.net.kvp_to_str(request.pparams));
	}
}


/*
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (sender.url == blacklistedWebsite)
      return;  // don't allow this web page access
    if (request.openUrlInEditor)
      openUrl(request.openUrlInEditor);
	console.log("EXTERNAL MSG FROM page: ", request, sender);
  });
*/



// create our global logger
var log = Logger.getLogger("internal");
log.trace("CONTENT SCRIPT loaded!");


// load the UI panel IF the document is ready
if (document.readyState == "complete" || document.readyState == "interactive") {
	xssstate.loaded = true;
	// cache the document response
	//log.error(" @@ LOADED COMPLETE ALREADY", xssstate.current);
	window.setTimeout(send_current_request, 250);
}

// load the UI panel AFTER the document is ready
if (!xssstate.loaded) {
	document.onreadystatechange = function() {
	if ((document.readyState == "complete" || document.readyState == "interactive") && !xssstate.loaded) {
		// cache the document response
		//log.error(" @@ LOADED COMPLETE waited", xssstate);
		//bitdata.add_response(xssstate.current.host_id+":"+xssstate.current.url_id, "actual_doc", 7, 7, document.documentElement.innerHTML);
		xssstate.loaded = true;
		window.setTimeout(send_current_request, 250);
	}
};
}


// header on should load, and all document loaded states
function send_current_request() {
	if (xssstate.target == 3) {
		chrome.extension.sendMessage({'type':xcon.getstate, 'plugins':xcon.activetesters}, function(r) {
			var log = Logger.getLogger("internal");
			//log.error(" @@ send_current_request() LOADED COMPLETE", r);
			if (r && r.current && "request" in r.current) {
				var result = bitdata.add_request(r.current.request, {"text":document.documentElement.innerHTML, "status":0}, null);
			} else {
				log.debug(" @@ WOAH WOAH WOAH, no state for main frame content!");
			}
		});
	} else if (xssstate.target == 1) {
		window.setTimeout(send_current_request, 250);
	}
}



// INJECT the xhr proxy into the page
/*
var s = document.createElement('script');
s.src = chrome.extension.getURL('xhrproxy.js');
s.onload = function() { this.parentNode.removeChild(this); };
(document.head||document.documentElement).appendChild(s);
*/


