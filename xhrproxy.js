// TODO: rename openargs, xopenargs
function httransferComplete(evt) {
	var realThis = evt.target;
	realThis.openargs.ftime = new Date().getTime();
	//console.log("COMPLETE openargs", realThis.openargs);

	if (!("internalRequest" in realThis.openargs)) {
		try {
			var cevt = new CustomEvent("ProtectLogic", {detail: {"req": realThis.openargs, "resp": {"text": realThis.responseText, "status": realThis.status, "mime":realThis.getResponseHeader("content-type"), "expires":realThis.getResponseHeader("expires"), "openargs":realThis.openargs} }, bubbles:false});
			document.dispatchEvent(cevt);
		} catch (err) {
			console.log(err);
		}
	}
}

function httransferFailed(evt) {
	var realThis = evt.target;
	realThis.openargs.ftime = new Date().getTime();

	if (!("internalRequest" in realThis.openargs)) {
		try {
			var cevt = new CustomEvent("ProtectLogic", {detail: {"req": realThis.openargs, "resp": {"text": realThis.responseText, "status": realThis.status, "mime":realThis.getResponseHeader("content-type"), "expires":realThis.getResponseHeader("expires"), "openargs":realThis.openargs} }, bubbles:false});
			document.dispatchEvent(cevt);
		} catch (err) {
			console.log(err);
		}
	}

}

var ctr = 0;
function replaceXHR2() {
	//console.log("REPLACED 2");
	window.XMLHttpRequest.prototype.openargs = {};

	window.XMLHttpRequest.open2 = window.XMLHttpRequest.prototype.open;
	window.XMLHttpRequest.prototype.open = function(arg1, arg2, arg3, arg4, arg5) {
		this.openargs.args = arguments;
		window.HTXMLHttpRequest.open2.apply(this, arguments);//[arg1, arg2, arg3]);
	};


	window.XMLHttpRequest.send2 = window.XMLHttpRequest.prototype.send;
	window.XMLHttpRequest.prototype.send = function(arg1) {
		this.openargs.post = arguments
		this.openargs.stime = new Date().getTime();
		this.openargs.cookies = document.cookie;
		window.HTXMLHttpRequest.send2.apply(this, arguments);
	}


	window.HTXMLHttpRequest = window.XMLHttpRequest;
	window.XMLHttpRequest = function() {
		var ht = new HTXMLHttpRequest();
		ht.addEventListener("load", httransferComplete, false);
		ht.addEventListener("error", httransferFailed, false);
		ht.openargs = {};
		return ht;
	}
}

replaceXHR2();
