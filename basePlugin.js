
function base_test() {

	this._testedUrl = {};
	this._log = Logger.getLogger("attack");
	this._name = "base plugin";
	this._queue = [];
	this._data = {};
	this._tester = null;
	this._testImpl = null;
	this._payloads = null;
	this._comb_id = null;
	this._param_name = null;
	this._method = null;
	this._delay = 500;

	this.set_data = function(key, value) {
		this._data[key] = value;
	}
	this.get_data = function(key) {
		if (key in this._data)
			return this._data[key];
		return null;
	}

	/**
	 * set the name of this plugin
	 */
	this.set_name = function(plugin_name) {
		this._name = plugin_name;
	};

	/**
	 * set the plugin tester.   the tester should be a class that implements start_test and end_test
	 */
	this.set_tester = function(tester) {
		this._tester = tester;
	};

	/**
	 * set the payload to test, an array of values to test
	 */
	this.set_payloads = function(payloads) {
		this._payloads = payloads;
	};

	// called from the UI to test a parameter
	// message contains referer
	this.test_param = function(comb_id, param_name, method, data, message)
	{
		this._log.trace(this._name + " starting", comb_id, param_name, method, data);
		if (this._attackInterval) {
			this._log.error("test is already running?  test_param returning");
		}
		this._referer = message.referer;

		// call the derived class pre_test method.
		// if it returns true, we don't need to test anything...
		if ("pre_test" in this) {
			if (!this.pre_test(message)) {
				return;
			}
		}

		// don't test the url again
		if ((comb_id+param_name+method) in this._testedUrl) {
			this._log.debug("ignore duplicate test for " + param_name);
			chrome.extension.sendMessage({"tabtype":"notice", "comb_id":comb_id, "param_name":param_name, "notice":"This paramater has already been tested.   You must first reload the page to test again"});
			return;
		}

		// add this to the list of tested urls
		this._testedUrl[(comb_id+param_name+method)] = true;


		// fetch all the info we have for the url before we launch the test
		this._comb_id = comb_id;
		this._param_name = param_name;
		this._method = method;

		// if we have no parameters of this type to test, then skip the method test
		var method = this._method.toLowerCase();
		if (!(method in data.request) || countProperties(data.request[method]) < 1) {
			this._log.debug("no " + method + " properties to test");
			return;
		}

		// prepare the test
		for (var i=0; i<this._payloads.length; i++) {
			this.test_param2(data, this._payloads[i]);
		}


		// TEST PREP
		this._failed = false;
		this._testResponse = this._queue.length;
		this._intCtr = 0;
		this._msg = {
			"type":xcon.vuln,
			"method":this._method,
			"status":xcon.test.pass,
			"vuln_type":this._vuln_type,
			"param_name": this._param_name,
			"comb_id":this._comb_id,
			"title": + this._vuln_type + " pass",
			"detail":"The parameter ["+this._param_name+"] does not appear to be vulnerable to " + this._vuln_type
		};


		// we have something to test....
		if (this._queue.length > 0) {
			var me = this;
			this._attackInterval = window.setInterval(function() {me.attack_queue()}, this._delay);
			//this.blocking_attack();
		}

	};


	// once we have all of the url info from the background script, then we can build the list of urls to attack
	this.test_param2 = function(data, payload) {

		var method = this._method.toLowerCase();
		var alt = (method == "get") ? "post" : "get";
		
		//this._log.trace("tp2", this._comb_id, this._param_name, this._method, data);
		//console.nog(detail.data.request[method], countProperties(detail.data.request[method]));

		// construct the request
		var testurl = null;

		var ctr = 0;
		var doesParamExist = false;
		for (var param in data.request[method]) {
			if (this._param_name == param) {
				doesParamExist = true;
			}
		}
		// don't send a seires of tests we don't have parameters for (test_param is probably post param)
		// TODO: add this for "try hard" feature
		if (!doesParamExist) {
			return;
		}

		var newRequest = true;
		var max = 100;

		// TODO: don't use the ctr method, we need a better mapping than parameter order... 
		var valueItr = [];
		for (var i=0;i<100;i++) { valueItr[i] = 0; }
		while (newRequest && --max > 0) {
			type_detail = {"get":{},"post":{}};
			ctr = 0;
			testurl = data.url + "?";

			// get and post could be DRY
			newRequest = false;

			for (var param in data.request.get) {
				type_detail["get"][param] = data.request.get[param].type;
				var itr = valueItr[ctr];
				var val = null;
				//console.log(" @@@ tp2 get param [" + param + "] / ("+itr+")", ctr);
				// use the payload if that's the parameter we are testing
				if (param == this._param_name) {
					val = payload;
				}
				// use a mode parameter if we have one
				else {
					// handle MODE parameters
					if (!newRequest && ("type" in data.request.get[param]) && data.request.get[param].type[0] == "MODE") {
						if (itr < data.request.get[param].values.length) {
							valueItr[ctr] += 1;
							newRequest = true;
						} 
						else {
							valueItr[ctr] = 0;
						}
					}
				}
				if (val === null && "values" in data.request.get[param] && data.request.get[param].values.length > 0) {
					val = data.request.get[param].values[itr];
					//console.log(" @@@ USE ["+param+"] VAL: ", val, itr, data.request.get[param].values);
				}
				// sometimes we can hit this with empty param
				if (param && param != null && param !== undefined && val !== undefined) {
					testurl += param + "=" + val + "&";
					//console.log(" @@@ COOL use param : ", param, val);
				}
				else {
					//console.log(" @@@ WAHHH empty param : ", param, val);
				}
				ctr++;
			}
			testurl = testurl.substr(0, testurl.length-1);

			// POST
			var pdata = {};

			// DRY!
			var pctr = 0;
			if (method == "post") {
				for (var param in data.request.post) {
					type_detail["post"][param] = data.request.post[param].type;
					var itr = valueItr[ctr];
					var val = null;
					// use the payload if that's the parameter we are testing
					if (param == this._param_name) {
						val = payload;
					}
					// use a mode parameter if we have one
					else {
						if (!newRequest && data.request.post[param].type[0] == "MODE") {
							if (itr < data.request.post[param].values.length) {
								valueItr[ctr] += 1;
								newRequest = true;
							}
							else {
								valueItr[ctr] = 0;
							}
						}
					}
					if (val === null) {
						val = data.request.post[param].values[itr];
					}
					pdata[param] = val;
					ctr++;
					pctr++;
				}
			}

			// skip the empty posts
			if (method == "post" && pctr == 0) {
				continue;
			}

			//console.log("build attack 1 " + method, this._queue.length);
			// add the full parameter
			this._queue.push({"url":testurl, "post":pdata, "payload":payload, "type_data":type_detail});
			//console.log("build attack 2 " + method, this._queue.length);

			// remove optional parameters and add those as well
			this.remove_optional({"url":testurl, "post":pdata}, data, method, payload);
			//console.log("build attack 3 " + method, this._queue.length);
		}

	};

	/**
	 * remove optional parameters from the list of attack urls
	 */
	this.remove_optional = function(attack, data, method, payload) {
		for (var param in data.request.get) {
			if (data.request.get.optional) {
				var url = attack.url.replace(new RegExp(param+"=.*?[&?]"), "");
				this._queue.push({"url":url, "post":attack.post, "payload":payload});

				/*
				if (method == "post") {
					for (var param in data.request.post) {
						if (data.request.post.optional) {
							var tmppost = clone(attack.post);
							delete tmppost.param;
							this._queue.push({"url":url, "post":tmppost});
						}
					}
				}
				*/
			}
		}

		if (method == "post") {
			for (var param in data.request.post) {
				if (data.request.post.optional) {
					var tmppost = clone(attack.post);
					delete tmppost.param;
					this._queue.push({"url":attack.url, "post":tmppost, "payload":payload});
				}
			}
		}
	};

	/**
	 *
	 */
	this.attack_queue = function() {
		//console.log("attack()", this);
		if (!this._attackInterval) {
			console.log("attack queue from non internval", this);
			return;
		}

		if (! this._queue || this._queue.length <= 0) {
			console.log("attack queue empty? ", this);
			window.clearInterval(this._attackInterval);


			console.log("start testing results....");
			
			// check if all tests have been recieved every this._delay milliseconds
			this._checkId = window.setInterval(function(realthis) {
				//console.log(realthis._name + " res: " + realthis._msg.status + " OUT: " + realthis._testResponse, realthis._intCtr);

				if (realthis._testResponse <= 0) {
					if ("after_test" in realthis) {
						realthis.after_test();
					}
					var result = window.clearInterval(realthis._checkId);

					//chrome.extension.sendMessage({"type":xcon.hacktab, "hacktab":"notice", "notice":realthis._vuln_type + " test did not complete for url: " + realthis._comb_id + " parameter [" + realthis._param_name + "]"});
					chrome.extension.sendMessage(realthis._msg);
				}
				// check for at most 60 seconds and at least 60 checks...
				if (realthis._intCtr >= (60000 / this._delay) && realthis._intCtr > 60) {
					realthis._msg.detail += ". <span class=\"red\">"+realthis._testResponse+" tests timed out</span>";
					console.log("TIMEOUT: " + realthis);
					if (realthis._msg.status < xcon.test.fail) {
						realthis._msg.status = xcon.test.timeout;
					}
					var result = window.clearInterval(realthis._checkId);
					chrome.extension.sendMessage(realthis._msg);
				}
				realthis._intCtr++;
			}, this._delay, this);

			return;
		}

		
		//console.log("ATTACK QUEUE!!!!", this._queue.length, this._method, this._queue);
		var item = this._queue.pop();
		var url = item.url;
		var parts = parse_url(url);

		this._testImpl = new this._tester(this._comb_id, this._param_name, this._method, url);
		if ("set_options" in this) {
			this._testImpl.set_options(this.set_options);
		}

		// TODO: only keep about 4 tests out at a time
		if (!this._failed) {
			var pdata = {};
			if (this._method == "POST") {
				pdata = item.post;
			}
			// TODO: only send the FINAL result for this plugin, NOT each test!!!!
			Content.net.call(this._method, url, function(xhr, options) {
				//console.log("net callback called", xhr, options);

				var result = options.tester.check_result(xhr, options);
				options.realthis._testResponse--;
				// 1 fail vasili.   1 fail only please
				if (result.result == "fail" && !options.realthis._failed) {
					options.realthis._msg.title = result.title;
					options.realthis._msg.detail = result.detail;
					options.realthis._msg.status = xcon.test.fail;
					options.realthis._failed = true;
					
					// set the proff
					options.realthis._msg.detail += " <span class='base03'>PROOF:</span> <span class='violet'>" + result.proof + "</span> <span class='base02'>" + options.method + " </span> [ <span class='blue'>" + xhr.openargs.args[1] + "</span> (<span class='cyan'>"+param_to_str(options.post)+"</span>) ]";
					console.log(" ## test fail: " + options.realthis._failed + " S: " + options.realthis._msg.status);
					console.log(" ## test fail: ", options);
				}
			}, pdata, xcon.content.form, {"tester":this._testImpl, "url":url, "name":this._name, "post":pdata, "method":this._method, "realthis": this, "host":parts.host, "payload":item.payload});
		}
		else {
			console.log("net skip callback");
			this._testResponse--;
		}
	}


	/**
	 *
	 */
	this.blocking_attack = function() {
		console.log("blocking attack()", this);

		/*
		if (! this._queue || this._queue.length <= 0) {
			console.log("attack queue empty? ", this);

			console.log("start testing results....");
			
			// check if all tests have been recieved every this._delay milliseconds
			this._checkId = window.setInterval(function(realthis) {
				//console.log(realthis._name + " res: " + realthis._msg.status + " OUT: " + realthis._testResponse, realthis._intCtr);

				if (realthis._testResponse <= 0) {
					if ("after_test" in realthis) {
						realthis.after_test();
					}
					var result = window.clearInterval(realthis._checkId);

					//chrome.extension.sendMessage({"type":xcon.hacktab, "hacktab":"notice", "notice":realthis._vuln_type + " test did not complete for url: " + realthis._comb_id + " parameter [" + realthis._param_name + "]"});
					chrome.extension.sendMessage(realthis._msg);
				}
				// check for at most 60 seconds and at least 60 checks...
				if (realthis._intCtr >= (60000 / this._delay) && realthis._intCtr > 60) {
					realthis._msg.detail += ". <span class=\"red\">"+realthis._testResponse+" tests timed out</span>";
					console.log("TIMEOUT: " + realthis);
					if (realthis._msg.status < xcon.test.fail) {
						realthis._msg.status = xcon.test.timeout;
					}
					var result = window.clearInterval(realthis._checkId);
					chrome.extension.sendMessage(realthis._msg);
				}
				realthis._intCtr++;
			}, this._delay, this);

			return;
		}
		*/

		
		// get the next test to send
		var item = this._queue.pop();
		if (!item) {
			if ("after_test" in this) {
				this.after_test();
			}
			chrome.extension.sendMessage(this._msg);
			return;
		}

		var url = item.url;
		var parts = parse_url(url);


		// create the request tester
		this._testImpl = new this._tester(this._comb_id, this._param_name, this._method, url);
		this._testImpl._plugin = this;
		if ("set_options" in this) {
			this._testImpl.set_options(this.set_options);
		}

		// we do this 1 at a time.   this is recursive...
		if (!this._failed) {
			var pdata = {};
			if (this._method == "POST") {
				pdata = item.post;
			}

			// get volatile data...
			// CONTINUE: need to get the referer page here
			
			console.log("GET REF: ...");
			Content.net.call("GET", this._referer.url, function(xhr, options) {
				console.log("GOT REF: ...", options.item, options.item.type_data);
				// find the VOL data, and search for it in xht.responseText
				var tdata = options.item.type_data;
				console.log("TDATA: ...", tdata);

				for (var x in xcon.lmethods) {
					console.log("X: ", x);
					for (var y in tdata[x]) {
						console.log("Y: ", y);
						if (tdata[x][y][0] == "VOLATILE") {
							var reg = new RegExp(tdata[x][y][5].regex);
							var res = reg.exec(xhr.responseText);
							console.log("HAVE VOLATILE", reg, res, xhr);

							console.log("replace " + y + " with res in " + options.item, res);
							// MIGHT BE GET OR POST
							// NEED TO look at item GET and pdata for replacement(s)
						}
					}
				}

				var that = this;
				window.setTimeout(function() {
					console.log("TIMEOUT CALL", that, this);
					that.do_attack(options.item, options.pdata);
				}, 20);

			}, {}, xcon.content.form,  {"item":item, "pdata":pdata});
		}
		else {
			chrome.extension.sendMessage(this._msg);
			console.log("net skip callback");
			this._testResponse--;
		}
	}

	/**
	 * send the actual attack request
	 */
	this.do_attack = function(item, pdata) {

		console.log("DO_ATTACK", item, pdata, this);

		var url = item.url;
		var parts = parse_url(url);

		Content.net.call(this._method, url, function(xhr, options) {
			/* the test callback.   run the tester.  options.realthis is a reference to the plugin */

			var result = options.tester.check_result(xhr, options);
			options.realthis._testResponse--;

			if (result.result == "fail" && !options.realthis._failed) {
				options.realthis._msg.title = result.title;
				options.realthis._msg.detail = result.detail;
				options.realthis._msg.status = xcon.test.fail;
				options.realthis._failed = true;
				
				// set the proof
				options.realthis._msg.detail += " <span class='base03'>PROOF:</span> <span class='violet'>" + result.proof + "</span> <span class='base02'>" + options.method + " </span> [ <span class='blue'>" + xhr.openargs.args[1] + "</span> (<span class='cyan'>"+param_to_str(options.post)+"</span>) ]";
				console.log(" ## test fail: ", options);
				chrome.extension.sendMessage(options.realthis._msg);
			}
			else {
				console.log("RECURSE!");
				options.realthis.blocking_attack();
			}
		}, pdata, xcon.content.form, {"tester":this._testImpl, "url":url, "name":this._name, "post":pdata, "method":this._method, "realthis": this, "host":parts.host, "payload":item.payload});

	}




}

/**
 * node js "tests"
 */
if ("require" in window) {
	var common = require("./common.js");
	var countProperties = common.countProperties;
	var Loger = common.Logger;

	function create_param_info(v, type) { return {"values":v, "type":type, "tested":null, "tests":{}, "vuln":{}, "info":{}, "optional":false}; }

	var param3 = create_param_info(["value1,value2"], xcon.types.comstr);
	param3.optional = true;

	var detail = {
		"comb_id":"1:1",
		"param_name":"boo",
		"method":"GET",
		"type":11,
		"data": {
			"request": {
				"get": {
					"boo": create_param_info(["5"], xcon.types.integer),
					"param2": create_param_info(["ident1", "ident2"], xcon.types.mode),
					"param3": param3,
					"param4": create_param_info(["data1","data2"], xcon.types.mode)
				}
			},
			"url": "http://demo.opendocman.com"
		}
	};

	var t = new base_test();
	//console.log(t);
	t.test_param2(detail);
	console.log(t._queue);
}


