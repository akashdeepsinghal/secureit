// TODO: rename openargs, xopenargs
function replaceXHR2(){
	console.log("REPLACE XHR2");
	(function(window) {
        function args(a){
            var s = "";
            for(var i = 0; i < a.length; i++) {
                s += "\t\n[" + i + "] => " + a[i];
            }
            return s;
        }

		var _XMLHttpRequest = window.XMLHttpRequest;
		var _openargs = null;

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
			console.log("XHR METHOD", method);
			if (method == "open") {
				this._openargs = {"args":arguments};
				/*
				if (!this._openargs.set) {
					this.onreadystatechange = function() {};
				}
				*/
			}
			else if (method == "send") {
				this._openargs.post = arguments;
				this._openargs.stime = new Date().getTime();
				this._openargs.cookies = document.cookie;
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
			var that = this.xhr;
			var realThis = this;
			realThis._openargs.set = true;
			that.onreadystatechange = function() {
				if (that.readyState == 1) {
					realThis._openargs.ctime = new Date().getTime();
				}
				// request is fully loaded
				if (that.readyState == 4) {
					realThis._openargs.ftime = new Date().getTime();
					//TODO: only test domains that we are checking....
					if (!("internalRequest" in realThis)) {
						var evt = new CustomEvent("ProtectLogic", {detail: {"req": realThis._openargs, "resp": {"text": realThis.responseText, "status": realThis.status, "mime":realThis.getResponseHeader("content-type"), "expires":realThis.getResponseHeader("expires"), "openargs":realThis._openargs} }, bubbles:false});
						document.dispatchEvent(evt);
					}

					// call our custom onloader
					if ("onload2" in realThis) {
						realThis.onload2();
					}
				}

				// call out internal callback...
				if ("internalRequest" in realThis) {
					onreadystatechange.call(realThis);
				}
				// call the original callback
				else {
					onreadystatechange.call(that);
				}
			};
		}   
	});


	/**
	 * do we need to proxy these?
	 */
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
				return this.xhr[scalar];
			},
			set: function(obj){
				console.log("scalar", scalar, obj);
				this.xhr[scalar] = obj;
			}
		});
	});

	})(window);
	console.log("REPLACED?");
}
