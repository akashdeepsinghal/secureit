diff --git a/xssextension/xhrproxy.js b/xssextension/xhrproxy.js
index 8275d95..ae2caac 100644
--- a/xssextension/xhrproxy.js
+++ b/xssextension/xhrproxy.js
@@ -1,282 +1,122 @@
-function replaceXHR() {
-    (function(window, debug){
-
-        function args(a){
-            var s = "";
-            for(var i = 0; i < a.length; i++) {
-                s += "\t\n[" + i + "] => " + a[i];
-            }
-            return s;
-        }
-        var _XMLHttpRequest = window.XMLHttpRequest;
-		var _openargs = null;
-
-        window.XMLHttpRequest = function() {
-            this.xhr = new _XMLHttpRequest();
-        }
-
-        // proxy ALL methods/properties
-        var methods = [ 
-            "open", 
-            "abort", 
-            "setRequestHeader", 
-            "send", 
-            "addEventListener", 
-            "removeEventListener", 
-            "getResponseHeader", 
-            "getAllResponseHeaders", 
-            "dispatchEvent", 
-            "overrideMimeType"
-        ];
-        methods.forEach(function(method){
-            window.XMLHttpRequest.prototype[method] = function() {
-                //console.log("XHR ARGUMENTS", method, args(arguments));
-                if (method == "open") {
-                    this._openargs = arguments;
-					this._openargs.stime = new Date().getTime();
-	
-					console.log("  @@ XHR open  ", this._openargs);
-                }
-				else if (method == "send") {
-                    this._openargs.post = arguments;
-					/*
-					this.addEventListener('readystatechange', function() { 
-						console.log("RS CHANGE!");
-
-					}, false); 
-					*/
-                }
-                return this.xhr[method].apply(this.xhr, arguments);
-            }
-        });
-
-        // proxy change event handler
-		/*
-        Object.defineProperty(window.XMLHttpRequest.prototype, "onreadystatechange", {
-            get: function(){
-                // this will probably never called
-console.log("xml GET", this);
-                return this.xhr.onreadystatechange;
-            },
-            set: function(onreadystatechange) {
-                var that = this.xhr;
-                var realThis = this;
-				console.log("RS", that, realThis);
-                that.onreadystatechange = function() {
-                    // request is fully loaded
-                    if (that.readyState == 4) {
-                        //console.log(" !!!!!!!! RESPONSE RECEIVED:", realThis._openargs, that.status, that.responseText.length);
-						var evt = new CustomEvent("ProtectLogic", {detail: {"req": realThis._openargs, "resp": {"text": that.responseText, "status": that.status} }, bubbles:false});
-						//console.log("DISPATCH", evt);
-						document.dispatchEvent(evt);
-					}
-		
-					console.log("CALL", this.xhr, onreadystatechange, that, realThis);
-                    //return onreadystatechange.call(that);
-                	return this.xhr.readystatechange.apply(this.xhr, arguments);
-                };
-            }
-        });
-		*/
-
-/*
-        var otherscalars = [
-            "onabort",
-            "onerror",
-            "onload",
-            "onloadstart",
-            "onloadend",
-            "onprogress",
-            "readyState",
-            "responseText",
-            "responseType",
-            "responseXML",
-            "status",
-            "statusText",
-            "upload",
-            "withCredentials",
-            "DONE",
-            "UNSENT",
-            "HEADERS_RECEIVED",
-            "LOADING",
-            "OPENED"
-        ];
-        otherscalars.forEach(function(scalar){
-            Object.defineProperty(window.XMLHttpRequest.prototype, scalar, {
-                get: function(){
-                    return this.xhr[scalar];
-                },
-                set: function(obj){
-                    this.xhr[scalar] = obj;
-                }
-            });
-        });
-		*/
-    })(window, false);
-}
-
-
-
-
-
+// TODO: rename openargs, xopenargs
 function replaceXHR2(){
-    (function(window, debug){
-        function args(a){
-            var s = "";
-            for(var i = 0; i < a.length; i++) {
-                s += "\t\n[" + i + "] => " + a[i];
-            }
-            return s;
-        }
-        var _XMLHttpRequest = window.XMLHttpRequest;
-
-        window.XMLHttpRequest = function() {
-            this.xhr = new _XMLHttpRequest();
-        }
-
-        // proxy ALL methods/properties
-        var methods = [ 
-            "open", 
-            "abort", 
-            "setRequestHeader", 
-            "send", 
-            "addEventListener", 
-            "removeEventListener", 
-            "getResponseHeader", 
-            "getAllResponseHeaders", 
-            "dispatchEvent", 
-            "overrideMimeType"
-        ];
-        methods.forEach(function(method){
-            window.XMLHttpRequest.prototype[method] = function() {
-                //if (debug) console.log("ARGUMENTS", method, args(arguments));
-                if (method == "open") {
-                    this._openargs = arguments;
-					//console.log("METHOD OPEN", this._openargs);
-                }
-				else if (method == "send") {
-                    this._openargs.post = arguments;
-					this._openargs.stime = new Date().getTime();
-					this._openargs.cookies = document.cookie;
+	console.log("REPLACE XHR2");
+	(function(window) {
+		var _XMLHttpRequest = window.XMLHttpRequest;
+
+		window.XMLHttpRequest = function() {
+			this.xhr = new _XMLHttpRequest();
+		}
+
+		// proxy ALL methods/properties
+		var methods = [
+		"open", 
+	"abort", 
+	"setRequestHeader", 
+	"send", 
+	"addEventListener", 
+	"removeEventListener", 
+	"getResponseHeader", 
+	"getAllResponseHeaders", 
+	"dispatchEvent", 
+	"overrideMimeType"
+		];
+	methods.forEach(function(method){
+		window.XMLHttpRequest.prototype[method] = function() {
+			console.log("XHR METHOD", method);
+			if (method == "open") {
+				this._openargs = {"args":arguments};
+				if (!this._openargs.set) {
+					this.onreadystatechange = function() {};
 				}
-                return this.xhr[method].apply(this.xhr, arguments);
-            }
-        });
-
-        // proxy change event handler
-        Object.defineProperty(window.XMLHttpRequest.prototype, "onreadystatechange", {
-            get: function(){
-                // this will probably never called
-                return this.xhr.onreadystatechange;
-            },
-            set: function(onreadystatechange){
-                var that = this.xhr;
-                var realThis = this;
-                that.onreadystatechange = function(){
-                    // request is fully loaded
-                    if (that.readyState == 4) {
-						realThis._openargs.ftime = new Date().getTime() - realThis._openargs.stime;
-                        //console.log("RESPONSE RECEIVED:",  typeof that.responseText == "string" ? that.responseText.length : "none");
-						//TODO: diff the cookies and see if we lost or gained JS cookies....
-						// diff realThis._openargs.cookies;
-						//TODO: only test domains that we are checking....
-						var evt = new CustomEvent("ProtectLogic", {detail: {"req": realThis._openargs, "resp": {"text": realThis.responseText, "status": realThis.status, "mime":realThis.getResponseHeader("content-type"), "expires":realThis.getResponseHeader("expires"), "mstime":realThis._openargs.ftime} }, bubbles:false});
-						//console.log("DISPATCH", evt);
+			}
+			else if (method == "send") {
+				this._openargs.post = arguments;
+				this._openargs.stime = new Date().getTime();
+				this._openargs.cookies = document.cookie;
+			}
+	return this.xhr[method].apply(this.xhr, arguments);
+		}
+	});
+
+	// proxy change event handler
+	Object.defineProperty(window.XMLHttpRequest.prototype, "onreadystatechange", {
+		get: function(){
+			// this will probably never be called
+			return this.xhr.onreadystatechange;
+		},
+		set: function(onreadystatechange) {
+			var that = this.xhr;
+			var realThis = this;
+			realThis._openargs.set = true;
+			that.onreadystatechange = function() {
+				if (that.readyState == 1) {
+					realThis._openargs.ctime = new Date().getTime();
+				}
+				// request is fully loaded
+				if (that.readyState == 4) {
+					realThis._openargs.ftime = new Date().getTime();
+					//TODO: only test domains that we are checking....
+					if (!("internalRequest" in realThis)) {
+						var evt = new CustomEvent("ProtectLogic", {detail: {"req": realThis._openargs, "resp": {"text": realThis.responseText, "status": realThis.status, "mime":realThis.getResponseHeader("content-type"), "expires":realThis.getResponseHeader("expires"), "openargs":realThis._openargs} }, bubbles:false});
 						document.dispatchEvent(evt);
 					}
 
-                    onreadystatechange.call(that);
-                };
-            }
-        });
-
-        var otherscalars = [
-            "onabort",
-            "onerror",
-            "onload",
-            "onloadstart",
-            "onloadend",
-            "onprogress",
-            "readyState",
-            "responseText",
-            "responseType",
-            "responseXML",
-            "status",
-            "statusText",
-            "upload",
-            "withCredentials",
-            "DONE",
-            "UNSENT",
-            "HEADERS_RECEIVED",
-            "LOADING",
-            "OPENED"
-        ];
-        otherscalars.forEach(function(scalar){
-            Object.defineProperty(window.XMLHttpRequest.prototype, scalar, {
-                get: function(){
-                    return this.xhr[scalar];
-                },
-                set: function(obj){
-                    this.xhr[scalar] = obj;
-                }
-            });
-        });
-    })(window, false);
-}
-
-
-
-
-/*
-function addXMLRequestCallback(callback) {
-    var oldSend, i;
-    if( XMLHttpRequest.callbacks ) {
-        // we've already overridden send() so just add the callback
-        XMLHttpRequest.callbacks.push( callback );
-    } else {
-        // create a callback queue
-        XMLHttpRequest.callbacks = [callback];
-        // store the native send()
-        oldSend = XMLHttpRequest.prototype.send;
-        oldOpen = XMLHttpRequest.prototype.open;
-        // override the native send()
-        XMLHttpRequest.prototype.send = function() {
-			console.log("  @@ send  ", this, arguments);
-			this._openargs.post = arguments;
-
-// Y U NO EXECUTE?
-            this.onreadystatechange = function ( progress ) {
-				console.log(" RS 4 ", progress);
-                for( i = 0; i < XMLHttpRequest.callbacks.length; i++ ) {
-                	XMLHttpRequest.callbacks[i](progress);
-                }
-            };
-
-            // call the native send()
-            oldSend.apply(this, arguments);
-        };
+					// call our custom onloader
+					if ("onload2" in realThis) {
+						realThis.onload2();
+					}
+				}
 
-		window.XMLHttpRequest.prototype.open = function() {
-				this._openargs = arguments;
-                console.log(" @@  open  ", this, arguments);
-            	oldOpen.apply(this, arguments);
-            };
-    }
+				// call out internal callback...
+				if ("internalRequest" in realThis) {
+					onreadystatechange.call(realThis);
+				}
+				// call the original callback
+				else {
+					onreadystatechange.call(that);
+				}
+			};
+		}   
+	});
+
+
+	/**
+	 * do we need to proxy these?
+	 */
+	var otherscalars = [
+		"onabort",
+		"onload",
+		"onerror",
+		"onloadstart",
+		"onloadend",
+		"onprogress",
+		"readyState",
+		"responseText",
+		"responseType",
+		"responseXML",
+		"status",
+		"statusText",
+		"upload",
+		"withCredentials",
+		"DONE",
+		"UNSENT",
+		"HEADERS_RECEIVED",
+		"LOADING",
+		"OPENED"
+			];
+	otherscalars.forEach(function(scalar){
+		Object.defineProperty(window.XMLHttpRequest.prototype, scalar, {
+			get: function(){
+				return this.xhr[scalar];
+			},
+			set: function(obj){
+				console.log("scalar", scalar, obj);
+				this.xhr[scalar] = obj;
+			}
+		});
+	});
+
+	})(window);
+	console.log("REPLACED?");
 }
-*/
-
-/*
-addXMLRequestCallback( function( progress ) {
-	if (progress.target.readyState == 4 || progress.target.readyState == "4") {
-		console.log("CALLBACK STATE 4", progress);
-		var evt = new CustomEvent("ProtectLogic", {detail: {"req": progress.srcElement._openargs, "resp": {"text": progress.srcElement.responseText, "status": progress.srcElement.status}
-		}, bubbles:true});
-		console.log("DISPATCH", evt);
-		document.dispatchEvent(evt);
-	}
-});
-*/
-
-replaceXHR2();
-console.log("REPLACE XHR!");
-
