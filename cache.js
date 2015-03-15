
function Cache() {
	this._hosts = {};
	this._urls = {};
	this._cache = {};
	this._resp = {};
	this._log = Logger.getLogger("cache");

	//chrome.storage.local.clear();

	chrome.storage.local.get("resp", function(items) {
		console.log("url resp", items);
		this._resp = items.resp;
	});
	chrome.storage.local.get("hosts", function(items) {
		console.log("host cache", items);
		this._hosts = items.hosts;
	});
	chrome.storage.local.get("urls", function(items) {
		console.log("url cache", items);
		this._urls = items.urls;
	});
	chrome.storage.local.get("cache", function(items) {
		console.log("cache cache", items);
		this._cache = items.cache;
	});
};

/**
 * add a response to cache
 */
Cache.prototype.add_resp = function(url_id, resp) {
	this._log.warn("cache response: ", url_id, resp);
	if (!(url_id in this._resp)) {
		this._resp[url_id] = [];
	}
	this._resp[url_id].push(resp);
	chrome.storage.local.set({"resp": this._resp}, function() {
		var log = Logger.getLogger("cache");
		log.warn("RESP CACHE SET");
	});
};

/**
 * return the id of a host, or null if not found
 */
Cache.prototype.get_resp = function(url_id) {
	if (url_id in this._resp) {
		this._log.debug("found resp in cache: " + url_id,  this._resp[url_id]);
		return this._resp[url_id];
	}
	this._log.trace("resp not in cache", this._resp);
	return null;
};


/**
 * add a host to cache
 */
Cache.prototype.add_host = function(host, id) {
	this._log.trace("cache host: ", host, id);
	this._hosts[host] = id;
};

/**
 * return the id of a host, or null if not found
 */
Cache.prototype.host_to_id = function(host) {
	if (host in this._hosts) {
		this._log.debug("found host in cache", host + " = " + this._hosts[host]);
		return this._hosts[host];
	}
	this._log.trace("host not in cache", host);
	return null;
};

/**
 * return the host for an id, or null if not found
 * TODO: if this is called often, we may want to add reverse mappings in add_host method.
 */
Cache.prototype.id_to_host = function(id) {
	for (var t in this._hosts) {
		if (this._hosts[t] == id) {
			this._log.debug("found host ID in in cache", id + " = " + this._hosts[t]);
			return t;
		}
	}
	this._log.trace("host ID not in cache", id);
	return null;
}

/**
 * add a url to cache
 */
Cache.prototype.add_url = function(hostId, url, id) {
	this._log.trace("cache url: ", hostId, url, id);
	if (hostId in this._urls) {
		this._urls[hostId][url] = id;
	} else {
		this._urls[hostId] = {};
		this._urls[hostId][url] = id;
	}
};

/**
 * return the id of a url, or null if not found
 */
Cache.prototype.url_to_id = function(hostId, url) {
	if (hostId in this._urls && url in this._urls[hostId]) {
		this._log.debug("found url in cache", url + " = " + this._urls[hostId][url]);
		return this._urls[hostId][url];
	}
	this._log.trace("url not in cache", hostId, url);
	return null;
};

/**
 * return the url for an id, or null if not found
 */
Cache.id_to_url = function(hostId, url_id) {
	if (hostId in this._urls) {
		for (var t in this._urls[hostId]) {
			if (this._urls[hostId][t] == url_id) {
				this._log.debug("found url id in cache", url_id + " = " + t);
				return t;
			}
		}
	}
	this._log.trace("url not in cache", hostId, url);
	return null;
};


/**
 * cache the gparams and pparams for a url
 * return true if the request was already cached, false if not already cached
 */
Cache.prototype.cache_request = function(urlid, gparams, pparams) {
	this._log.trace("cache request", urlid, gparams, pparams);
	// default to already cached
	var result = true;
	// if the url is not cached, add it to the cache and update result
	if (!(urlid in this._cache)) {
		this._cache[urlid] = {"get":{},"post":{}};
		result = false;
		this._log.debug("add new request to cache", urlid);
	}

	var item = this._cache[urlid];
	// check if all get parameters and values are cached
	for (var elm in gparams) {
		// new gparam is not cached, add it return cache updated
		if (!(elm in item.get)) {
			item.get[elm] = [gparams[elm]];
			result = false;
		} 
		// element is cached, but is the value cached?
		else {
			// TODO: determine "uniqueness" and add more unique values
			// we have cached 10 values, don't update
			if (item.get[elm].length > 9) {
			}
			// add the new value to the list of cached values
			else {
				item.get[elm].push(gparams[elm]);
			}
		}
	}

	// check if all post values are cached
	for (var elm in pparams) {
		// new pparam is not cached, add it return cache updated
		if (!(elm in item.post)) {
			item.post[elm] = [pparams[elm]];
			result = false;
		} 
		// element is cached, but is the value cached?
		else {
			// TODO: determine "uniqueness" and add more unique values
			// we have cached 10 values, don't update
			if (item.post[elm].length > 9) {
			}
			// add the new value to the list of cached values
			else {
				item.post[elm].push(pparams[elm]);
			}
		}
	}

	if (!result) {
		this._log.warn("cache new param values, expect SET. urlid: " + urlid);
		chrome.storage.local.set({"hosts": this._hosts}, function() {
			var log = Logger.getLogger("cache");
			log.warn("HOST SET");
		});
		chrome.storage.local.set({"urls": this._urls}, function() {
			var log = Logger.getLogger("cache");
			log.warn("URL SET");
		});
		chrome.storage.local.set({"cache": this._cache}, function() {
			var log = Logger.getLogger("cache");
			log.warn("CACHE SET");
		});
	} else {
		this._log.debug("no new param values to cache");
	}

	return result;	
};
