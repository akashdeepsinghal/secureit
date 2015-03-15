// TODO: rename openargs, xopenargs
function replaceXHR2(){
	console.log("REPLACED");
	
	(function(window, debug) {
		var _XMLHttpRequest = window.XMLHttpRequest;

		window.XMLHttpRequest = function() {
			this.xhr = new _XMLHttpRequest();
		}

		// proxy ALL methods/properties
		var methods = [
		"open", 
	"abort", 
	"setRequestHeader", 
	"send", 
	"addEventListener", 
	"removeEventListener", 
	"getResponseHeader", 
	"getAllResponseHeaders", 
	"dispatchEvent", 
	"overrideMimeType"
		];
	methods.forEach(function(method){
		window.XMLHttpRequest.prototype[method] = function() {
			console.log("call xhr method ", method, arguments);

			if (method == "abort") {
	var e = new Error('dummy');
  	var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '').replace(/^\s+at\s+/gm, '').replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@').split('\n');
	console.log(stack);
			}


			if (method == "open") {
				//console.log("create _openargs");
				this._openargs = {"args":arguments};
				/*
				if (!this._openargs.set) {
					this.onreadystatechange = function() {};
				}
				*/
			}
			else if (method == "send") {
				//console.log("send _openargs");
				this._openargs.post = arguments;
				this._openargs.stime = new Date().getTime();
				this._openargs.cookies = document.cookie;
			}
			else {
			}
			return this.xhr[method].apply(this.xhr, arguments);
		}
	});

	// proxy change event handler
	Object.defineProperty(window.XMLHttpRequest.prototype, "onreadystatechange", {
		get: function(){
			// this will probably never be called
			return this.xhr.onreadystatechange;
		},
		set: function(onreadystatechange) {
			console.log("PROXY ORSC");
			var that = this.xhr;
			var realThis = this;

			if ("_openargs" in realThis) {
				realThis._openargs.set = true;
			} else {
			}

			that.onreadystatechange = function() {
				console.log("ORSC", that.readyState, that);
				if (that.readyState == 1) {
					realThis._openargs.ctime = new Date().getTime();
				}
				// request is fully loaded
				if (that.readyState == 4) {
					realThis._openargs.ftime = new Date().getTime();
					//TODO: only test domains that we are checking....
					//console.log("LOG XMLHTTP REQUEST ", realThis._openargs.args[1]);
					/*
					if (!("internalRequest" in realThis)) {
						try {
							var evt = new CustomEvent("ProtectLogic", {detail: {"req": realThis._openargs, "resp": {"text": realThis.responseText, "status": realThis.status, "mime":realThis.getResponseHeader("content-type"), "expires":realThis.getResponseHeader("expires"), "openargs":realThis._openargs} }, bubbles:false});
							document.dispatchEvent(evt);
						} catch (err) {
							console.log(err);
						}
					}
					*/

					// call our custom onloader
					if ("onload2" in realThis) {
						realThis.onload2();
					}
				}

				// call our internal callback...
				if ("internalRequest" in realThis) {
					console.log("INT REQ");
					onreadystatechange.call(realThis);
				}
				// call the original callback
				else {
					console.log("EXT REQ");
					onreadystatechange.call(that);
				}
			};
		}   
	});


	/**
	 * do we need to proxy these?
	 */
	/*
	var otherscalars = [
		"onabort",
		"onload",
		"onerror",
		"onloadstart",
		"onloadend",
		"onprogress",
		"readyState",
		"responseText",
		"responseType",
		"responseXML",
		"status",
		"statusText",
		"upload",
		"withCredentials",
		"DONE",
		"UNSENT",
		"HEADERS_RECEIVED",
		"LOADING",
		"OPENED"
			];
	otherscalars.forEach(function(scalar){
		Object.defineProperty(window.XMLHttpRequest.prototype, scalar, {
			get: function(){
				console.log("get ", scalar);//, this.xhr[scalar]);
				return this.xhr[scalar];
			},
			set: function(obj){
				this.xhr[scalar] = obj;
			}
		});
	});
	*/

	})(window, false);
}

replaceXHR2();


