
function BitCache() {
	this._hosts = {};
	this._urls = {};
	this._cache = {};
	this._resp = {};
	this._vuln = {};
	this._urlCtr = 0;
	this._hostCtr = 0;
	this._log = Logger.getLogger("cache");

	chrome.storage.local.clear();

	chrome.storage.local.get("resp", function(items) {
		//console.log("LOAD url resp", items);
		this._resp = items.resp;
	});
	chrome.storage.local.get("hosts", function(items) {
		this._hosts = items.hosts;
		this._hostCtr = countProperties(this._hosts);
		//console.log(" )))) LOAD host cache", this._hosts, this._hostCtr);
	});
	chrome.storage.local.get("urls", function(items) {
		//console.log("LOAD url cache", items);
		this._urls = items.urls;
		this._urlCtr = countProperties(this._urls);
	});
	chrome.storage.local.get("cache", function(items) {
		//console.log("LOAD cache cache", items);
		this._cache = items.cache;
	});
	//console.log("CACHE LOADED");
}


/**
 * add a response to cache
 * return the url_id response
 */
BitCache.prototype.add_resp = function(comb_id, name, type, op, value) {
	var updated = false;
	this._log.trace("cache response: ", comb_id, name);

	if (!(comb_id in this._resp)) {
		this._resp[comb_id] = {};
		updated = true;
	}
	// the response is not cached
	if (!(name in this._resp[comb_id])) {
		updated = true;
	}
	// the resposne is changed
	if (this._resp[comb_id][name] && 
			(this._resp[comb_id][name].type != type ||
			this._resp[comb_id][name].op != op ||
			this._resp[comb_id][name].value != value)) {
		updated = true;
	}
	// need to update the cache
	if (updated) {
		this._log.warn(" add/update response to cache: ", comb_id, name);
		this._resp[comb_id][name] = {"type": type, "op": op, "value": value};

		// store the data!
		chrome.storage.local.set({"resp": this._resp}, function() {
			var log = Logger.getLogger("cache");
			log.warn("RESP CACHE SET");
		});
		return this._resp[comb_id];
	}

	return this._resp[comb_id];
};

/**
 * return the id of a host, or null if not found
 */
BitCache.prototype.get_resp = function(comb_id) {
	if (comb_id in this._resp) {
		this._log.debug("found response in cache: " + comb_id, this._resp[comb_id]);
		return this._resp[comb_id];
	}
	this._log.trace("resp not in cache", this._resp);
	return null;
};


/**
 * add a host to cache
 */
BitCache.prototype.add_host = function(host, id) {
	this._log.trace("cache host: ", host, id);
	if (!(host in this._hosts)) {
		// no DB id, so create one
		if (!id || typeof id === "undefined") {
			this._hostCtr++;
			id = this._hostCtr;
		}

		this._hosts[host] = id;

		// store on disk
		chrome.storage.local.set({"hosts": this._hosts}, function() {
			var log = Logger.getLogger("cache");
			log.error("host saved");
		});

		// return the host id
		return id;
	}
	return this._hosts[host];
};

/**
 * return the id of a host, or null if not found
 */
BitCache.prototype.get_host_id = function(host) {
	// add it if we don't have it
	if (!(host in this._hosts)) {
		return this.add_host(host);
	}
	else if (host in this._hosts) {
		this._log.debug("found host in cache", host + " = " + this._hosts[host]);
		return this._hosts[host];
	}
	this._log.trace("host not in cache", host);
	return null;
};


/**
 * add a url path to cache
 */
BitCache.prototype.add_url = function(host_id, path, id) {
	this._log.trace("cache url path: ", host_id, path, id);
	// add new host to the list of tracked urls
	if (!(host_id in this._urls)) {
		this._urls[host_id] = {};
	}
	// path is not in the list, add it
	if (!(path in this._urls[host_id])) {
		// no DB id, so create one
		if (!id || typeof id === "undefined") {
			this._urlCtr++;
			id = this._urlCtr;
		}

		// add the path to the list
		this._urls[host_id][path] = id;

		// store the urls in the list
		chrome.storage.local.set({"urls": this._urls}, function() {
			var log = Logger.getLogger("cache");
			log.warn("urls saved");
		});

		return id;
	}

	//console.log("BIT DATA:", this);
	return this._urls[host_id][path];
};


/**
 * return the id of a host, or null if not found
 */
BitCache.prototype.get_url_id = function(host_id, url) {
	//console.log (" !*!*!*!*!*! BROKEN CODE get_url_id");
	// add it if we don't have it
	if (host_id && !(host_id in this._urls)) {
		return this.add_url(host_id, url);
	}
	else if (host_id && (host_id in this._urls) && !(url in this._urls[host_id])) {
		return this.add_url(host_id, url);
	}

	// get the existing url id
	if (host_id in this._urls && url in this._urls[host_id]) {
		this._log.debug("found url in cache", url + " = " + this._urls[host_id]);
		return this._urls[host_id][url];
	}

	this._log.trace("url not in cache", host_id, url);
	return null;
};



/**
 * return the host for an id, or null if not found
 * TODO: if this is called often, we may want to add reverse mappings in add_host method.
 */
BitCache.prototype.id_to_host = function(host_id) {
	for (var t in this._hosts) {
		if (this._hosts[t] == host_id) {
			this._log.debug("found host ID in in cache", host_id + " = " + this._hosts[t]);
			return t;
		}
	}
	this._log.trace("host ID not in cache", host_id);
	return null;
};


/**
 * return the url for an id, or null if not found
 */
BitCache.prototype.id_to_url = function(host_id, url_id) {
	if (host_id in this._urls) {
		for (var t in this._urls[host_id]) {
			if (this._urls[host_id][t] == url_id) {
				this._log.debug("found url id in cache", url_id + " = " + t);
				return t;
			}
		}
	}
	this._log.trace("url not in cache", host_id, url_id);
	return null;
};

/**
 * update persistant parameter type data
 */
BitCache.prototype.update_type = function(comb_id, method, param_name, type, data) {
	var item = this._cache[comb_id];
	if (!(param_name in item[method])) {
		item[method][param_name] = {};
	}

	type.push(data);
	item[method][param_name].type=type;
	item[method][param_name].typeforce=true;
};
/**
 * update persistant test data
 */
BitCache.prototype.update_tests = function(comb_id, method, param_name, tests)
{
	var item = this._cache[comb_id];
	item[method][param_name].tested=new Date().getTime();
	item[method][param_name].tests=tests;
};
/**
 * update persistant vulnerability data
 */
BitCache.prototype.update_vuln = function(comb_id, method, param_name, vuln_type, vuln)
{
	var method = method.toLowerCase();
	var log = Logger.getLogger("model");
	log.warn("update_vuln??", vuln);
	var item = this._cache[comb_id];
	if (!(item) || !(method in item) || !(param_name in item[method])) {
		return log.error("update_vuln() item not found",  comb_id, method, param_name, this._cache);
	}
	if (!(vuln_type in item[method][param_name].vuln)) {
		item[method][param_name].vuln[vuln_type] = {};
	}
	log.error("UPDATED VULN!", item, vuln_type, vuln);
	item[method][param_name].vuln[vuln_type]=vuln;
	item[method][param_name].tested = new Date().getTime();
	this._cache[comb_id] = item;
};


/**
 * cache the gparams and pparams for a url
 * only caches get and post parameters
 * return true if the request was already cached, false if not already cached
 * FIXME:  we are overwriteing the main_frame content with the xmlhttpreqeust content.
 *   need to detect this and find "mode" parameter(s)
 */
BitCache.prototype.cache_request = function(comb_id, gparams, pparams, type) {
	this._log.error("cache request", comb_id, gparams, pparams);
	// default to already cached
	var result = true;
	var exists = true;
	// if the url is not cached, add it to the cache and update result
	if (!(comb_id in this._cache)) {
		this._cache[comb_id] = {"get":{},"post":{}, "type":type, "vuln":{}};
		result = false;
		this._log.debug("add new request to cache", comb_id);
		exists = false;
	}

	// load the already? cached data
	var item = this._cache[comb_id];

	// TODO: simplify this and be DRY
	// var method = "get" || "post"
	// item[method][elm] will work fine....

	// check if all get parameters and values are cached
	for (var elm in gparams) {
		// new gparam is not cached, add it return cache updated
		var v = decodeURIComponent(gparams[elm]);
		var type = get_type(v);
		if (!(elm in item.get)) {
			item.get[elm] = create_param_info(v);
			result = false;
		}
		// element is cached, but is the value cached?
		else {
			// TODO: determine "uniqueness" and add more unique values
			// we have cached 10 values, don't update
			if (item.get[elm].values.length > 9) {
				this._log.warn("we have 10 stored values for [" + elm + "]", item.post[elm]);
			}
			// add the new value to the list of cached values
			else {
				// search if we have this value in the list already
				var addit = true;
				for (var i=0; i<item.get[elm].values.length; i++) {
					if (item.get[elm].values[i] == v) {
						addit = false;
					}
				}
				// we don't have it in the list add it
				if (addit) {
	//item[method][param_name].typeforce=true;
					if (type != null && !("typeforce" in item.get[elm])) {
						// if we don't yet have a type, or the existing type priority is less than
						// this priority, then update the type
						if (!item.get[elm].type || item.get[elm].type[4] < type[4]) {
							item.get[elm].type = type;
						}
					}
					item.get[elm].values.push(v);
					result = false;
				}
			}
		}
	}

	// check if all post values are cached
	for (elm in pparams) {
		// new pparam is not cached, add it return cache updated
		var v = decodeURIComponent(pparams[elm]);
		// TODO: TYPE: only 1 get_type
		var type = get_type(v);
		if (!(elm in item.post)) {
			item.post[elm] = {"values":[v], "type":type,  "tested":null, "tests":{}, "vuln":{}, "info":{}};
			result = false;
		} 
		// element is cached, but is the value cached?
		else {
			// TODO: determine "uniqueness" and add more unique values
			// we have cached 10 values, don't update
			if (item.post[elm].values.length > 9) {
				this._log.warn("we have 10 stored values for [" + elm + "]", item.post[elm]);
			}
			// add the new value to the list of cached values
			else {
				// search if we have this value in the list already
				addit = true;
				for (i=0; i<item.post[elm].values.length; i++) {
					if (item.post[elm].values[i] == v) {
						addit = false;
					}
				}
				// we don't have it in the list add it
				if (addit) {
					if (type != null && !("typeforce" in item.post[elm])) {
						// if we don't yet have a type, or the existing type priority is less than
						// this priority, then update the type
						if (!item.post[elm].type || item.post[elm].type[4] < type[4]) {
							item.post[elm].type = type;
						}
					}

					item.post[elm].values.push(v);
					result = false;
				}
			}
		}
	}

	// if we updated the cache
	if (!result) {
		this._cache[comb_id] = item;
		this._log.warn("cache new param values, expect SET. urlid: " + comb_id);
		chrome.storage.local.set({"cache": this._cache}, function() {
			var log = Logger.getLogger("cache");
			log.warn("CACHE SET");
		});
	} else {
		this._log.debug("no new param values to cache");
	}

	return result;	
};

BitCache.prototype.update_var = function(comb_id, varkey, type, index) {
	if (!(item in this._cache[comb_id])) {
		console.log("unable to update var, " + comb_id + " not found in cache");
		return;
	}
	var item = this._cache[comb_id];
	//item.post[elm] = {"values":[pparams[elm]], "tested":null, "tests":{}, "vuln":{}, "info":{}};
	//this._cache[comb_id] = {"get":{},"post":{}};
	// update get var
	var elm = null;
	if (varkey in item.get) {
		elm = item.get[varkey];
	}
	// update post var
	else if (varkey in item.post) {
		elm = item.post[varkey];
	}
	// add the dynamic variable info to the info we have
	if (elm) {
		if (!("dynamic" in elm)) {
			elm.dynamic = {};
		}
		console.log("updated dynamic variable", comb_id, elm, type, index);
		elm.dynamic[comb_id] = {"type":type, "index":index};
	}

};

/**
 * return cached get and post variables and values
 */
BitCache.prototype.get_detail = function(comb_id) {
	if (comb_id in this._cache) {
		var parts = comb_id.split(":");	
//BitCache.prototype.id_to_url = function(host_id, url_id) {
		return {"request": this._cache[comb_id], "response": this._resp[comb_id], "url": this.id_to_host(parts[0]) + this.id_to_url(parts[0],parts[1])};
	}
	return null;
};




function BitData() {

	this._cache = new BitCache();
	this._log = Logger.getLogger("cache");
	this._pageRequests = {};
	this._pageResponses = {};
	this._mainFrames = [];

	/*
	var apiparams = {"host": request.host, "path": btoa(request.path), "query": btoa(request.gparamstr), "method": "%2B" + request.method, "post": request.pparams, "ver": 1};
	apicall("POST", "request/param", apiparams, function(r) {
	*/
}


/**
 * need to map this to the xssploit.js code so we know the hostid and urlid
 */
BitData.prototype.add_request = function(request, response, funcPtr) {

	//console.log("apicall, add_request() request, response", request, response);

	// send the request and response to the background page
	// then  store it here
	chrome.extension.sendMessage({'type':xcon.addrequest, 'request':request, 'response':response}, 
		function(r) {
			//console.log("apicall callback!");
			if (funcPtr) {
				funcPtr(r);
			}
			log = Logger.getLogger("intercept");
			var comb_id = r.host_id + ":" + r.url_id;


			// store the last 5 main frames so we have some thing to search though for csrf and state tokens
			// only cache main frames when looking for content
			// TODO: move this into the background page so we can keep the last 5 main_frame responses
			if (request.type == "main_frame") {
				if (bitdata._mainFrames.length > 5) {
					bitdata.pop();
				}
				bitdata._mainFrames.push(comb_id);
			}

			// store all of the responses (this is page context only, so it wont persist)...
			bitdata._pageRequests[comb_id] = response;


			// look for parameters in the last 5 pages
			for (var i=0; i<bitdata._mainFrames.length; i++) {
				//console.log("search in main frame id: " + bitdata._mainFrames[i]);
				var elm = bitdata._pageRequests[bitdata._mainFrames[i]];	
				//log.warn("SERACH IN", elm);
				if (elm && "text" in elm) {
					var txt = elm.text;
					// search for get params
					for (var g in request.gparams) {
						search_for_key_val_in_docs(txt, comb_id, g, request.gparams[g]);
					}
					// search for post params
					for (var p in request.pparams) {
						search_for_key_val_in_docs(txt, comb_id, p, request.pparams[p]);
					}
				} else {
					console.log(" ??? no text in", elm);
				}
			}
		}
	);
};

/**
 * look in the a document for a key of a value
 */
function search_for_key_val_in_docs(txt, comb_id, key, val) {
	var haveVal = false;
	var fi = null;
	var li = null;

	// search for the VALUE in the document (only if we have a value)
	if (val.length > 2) {
		//console.log (" ~~ " + comb_id + " search for : " + val +  " in " + txt.length);
		fi = txt.indexOf(val);
		if (fi > 0) {
			li = txt.lastIndexOf(val);
			if (fi == li) {
				//console.log("found val [" + val + "] at " + li);
				chrome.extension.sendMessage({'type':xcon.updatevar, 'comb_id':comb_id, 'keytype':"value", 'key':key, 'index':fi});
				haveVal = true;
			}
		}
	} 
	// search for the KEY in the document
	if (!haveVal) {
		//console.log (" ~~ " + comb_id + " search for : " + key +  " in " + txt.length);
		fi = txt.indexOf(key);
		if (fi > 0) {
			li = txt.lastIndexOf(key);
			if (fi == li) {
				console.log("found val [" + key + "] at " + li);
				chrome.extension.sendMessage({'type':xcon.updatevar, 'comb_id':comb_id, 'keytype':"key", 'key':key, 'index':fi});
				haveVal = true;
			}
		}
	}
}

BitData.prototype.add_response = function(comb_id, type_name, attr_type, attr_op, attr_value, funcPtr) {
	//bitdata.add_response(xssstate.current.host_id+":"+xssstate.current.url_id, "actual_doc", 7, 7, document.documentElement.innerHTML);
	console.log(" !! DEPRICATED");
	alert("add_response");

	chrome.extension.sendMessage({'type':xcon.addresponse, 'id':comb_id, 'typename':type_name, 'attrtype':attr_type, 'attrop':attr_op, 'attrvalue':attr_value}, function(r) {
		//log = Logger.getLogger("intercept");
		//log.debug("add request response", request, r);
		//this._pageResponses.push({'type':xcon.addresponse, 'id':comb_id, 'typename':type_name, 'attrtype':attr_type, 'attrop':attr_op, 'attrvalue':attr_value, "response": r});
		bitdata._pageResponses[comb_id] = {'type':xcon.addresponse, 'id':comb_id, 'typename':type_name, 'attrtype':attr_type, 'attrop':attr_op, 'attrvalue':attr_value, "response": r};

		if (funcPtr) {
			funcPtr(this._pageResponses[comb_id]);
		}
	});
};

/*
function(r) { 
	var host_id = this._cache.add_host(request.host);
	this._log.error(request.host + " = " + host_id);
	//console.log("ADD HOST: " + host_id, request.host);
	var url_id = this._cache.add_url(host_id, request.path);
	this._log.error(request.path + " = " + url_id);
	//console.log("ADD URL: " + url_id, request.path);
	var is_cached = this._cache.cache_request(host_id+":"+url_id, request.gparams, request.pparams);
	//console.log("CACHED? ", is_cached);
	return {"host_id":host_id, "url_id":url_id, "cached":is_cached};
};
*/


/**
 * checks if a response exists in the cache. if it does, it is not added again
 	// {host, path, gparamstr, gparams, pparams, method, type (main_frame, xmlhttprequest) }
BitCache.prototype.add_resp = function(url_id, name, type, op, value) {
	bitdata.add_response(xssstate.current.host_id+":"+xssstate.current.url_id, "actual_doc", 7, 7, document.documentElement.innerHTML);
 */
/*
 * WRONG - OLD
BitData.prototype.add_response = function(comb_id, type_name, attr_type, attr_op, attr_value) {
	// check if the response is already cached
	var responses = this._cache.get_resp(comb_id);
	for (var idx in responses) {
		// it's cached so bail out early
		if (responses[idx].type == type_name) {
			return false;
		}
	}

	// we don't have this one yet, so add it
	this._cache.add_resp(comb_id, type_name, attr_type, attr_op, attr_value);
	return true;
};

*/




/**
 * send an API request to the server
 */
function apicall(verb, method, data, callback)
{
	var log = Logger.getLogger('net');
	log.debug("apicall()", verb, method, data, callback);

	var xmlhttp = new XMLHttpRequest();
	if (callback) { 
		xmlhttp.onload = callback;
	}
	else {
		xmlhttp.onload = function(r) {
			// TODO: test for new url cached parameter
			// TODO: store max (10) different parameter values
			log.debug(" * apicall() default result: ", this);
		};
	}
	xmlhttp.onerror = function(r) {
		log.error(" * apicall() ERROR: " + method, this);
	};

	// build the key value pairs
	var pdata = "";
	for (var d in data) {
		pdata += d + "=" + data[d] + "&";
	}
	pdata = pdata.substr(0, pdata.length-1);

	// handle API GET, DELETE
	if (verb == "GET" || verb == "DELETE") {
		xmlhttp.open(verb,  xcon.apiurl + method + "?" + pdata, true);
		xmlhttp.send();
	}
	// handle API POST
	else {
		xmlhttp.open(verb,  xcon.apiurl + method, true);
		xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		xmlhttp.send(pdata);
	}
}

