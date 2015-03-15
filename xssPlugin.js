// TODO: send a sample request, get the time and default response
// save that then compare.   We may have an injection that does not work for benchmark
function XSS_Response_Tester(comb_id, param_name, method, url) {
	this._start = new Date().getTime();
	this._comb_id = comb_id;
	this._param_name = param_name;
	this._method = method;
	this._url = url;
	this._title = "Reflected XSS";
	this._detail = "The parameter is vulnerable to Reflected Cross Site Scripting.";

	this.set_options = function(options) {
		this._options = options;
	};

	this.check_result = function(xhr, options) {
		console.log("XSS PLUGIN TESTER TESTING!");
		// fail regexes
		var fail = /[<>]/g;
		var tagfail = /["']/g;

		// sinktxt1 is the prefix to the suffix
		var sinktxt1 = this._options.prefix + ".*?" + this._options.post;
		var regstr = "([>'\"]?)[^>'\"]{0,128}(" + sinktxt1 + ")[^><'\"]{0,128}([><'\"]?)";
		//console.log("search for: [ " + regstr + " ] in [" + xhr.responseText);

		var sinkreg1 = new RegExp(regstr, "g");
		var sinkoutput1;
		var sinkctr = 0
		var haveFail = false;
		var log = Logger.getLogger("attack");

		// look for each output in the response
		while ((sinkoutput1 = sinkreg1.exec(xhr.responseText)) && sinkctr < 20) {
			sinkctr++;

			// we have a sink
			//log.warn("found sink output: ", sinktxt1, sinkoutput1);

			var failResult;
			var ctr = 0;
			var failChars = "";
			//var host = options.url.split("?")[0];


			// find if we are in a tag
			// we are in a tag
			if (sinkoutput1 && sinkoutput1[1] && (sinkoutput1[1] == "<")) {
				//console.log("SINK, in a tag ", sinkoutput1[1]);
				// pretty sure we are in an attribute
				if (sinkoutput1[1] == sinkoutput1[3]) {	
					if (sinkoutput1[2].indexOf(sinkoutput1[1]) != -1) {
						log.error("      FAIL      XSS ATTRIBUTE", sinkoutput1, xhr.openargs);

						return {"result":"fail", "title":"Reflected XSS attribute markup", "detail":"The parameter ["+param_name+"] contains a Cross Site Scripting flaw in an HTML attribute.  The error occurs because the <span class=\"orange\">"+encodeURIComponent(sinkoutput1[1])+"</span> character is not encoded correctly near byte: <span class=\"base03\">"+sinkoutput1.index+"</span>. This can allow a malicious user to execute JavaScript in the security context of <span class=\"blue\">"+options.host+"</span> possibly allowing them to impersonate other users.", "proof": sinkoutput1[0]};

							//+ "</span> " + xhr._openargs.args[0] + " [ <span class='blue'>" + xhr._openargs.args[1] + "</span> (<span class='orange'>"+xhr._openargs.post[0]+"</span>) ]" };

					}
				}
			}
			else {// if (sinkoutput1 && sinkoutput1[1] && (sinkoutput1[1] == ">")) {
				//console.log("SINK, not in a tag ", sinkoutput1);
				if (sinkoutput1[2].indexOf("<") != -1) {
					log.error("      FAIL      XSS TAG", sinkoutput1, xhr.openargs);

					return {"result":"fail", "title":"Reflected XSS tag markup", "detail":"The parameter ["+param_name+"] contains a Cross Site Scripting flaw reflecting unencoded html entities.  The error occurs because the <span class=\"orange\">&lt;</span> character is not encoded correctly near byte: <span class=\"base03\">"+sinkoutput1.index+"</span>. This can allow a malicious user to execute JavaScript in the security context of <span class=\"blue\">"+options.host+"</span> possibly allowing them to impersonate other users.", "proof": sinkoutput1[0]};

					//return {"result":"fail", "title":"Reflected XSS tag markup", "detail":"The parameter ["+param_name+"] contains a Cross Site Scripting flaw in an HTML attribute.  The error occurs because the &lt; and &gt; characters are not encoded correctly near byte: "+sinkoutput1[4]+". This can allow a malicious user to execute JavaScript in the security context of the application possibly allowing them to impersonate other users. <span class='base02'>PROOF:</span> <span class='violet'>" + sinkoutput1[0] + "</span> " + xhr._openargs.args[0] + " [ <span class='blue'>" + xhr._openargs.args[1] + "</span> (<span class='orange'>"+xhr._openargs.post[0]+"</span>) ]" };
				}
			}
		}

		return {"result":"pass"};
	};

	this._origTest = this.test_param;

	this.test_param = function(comb_id, param_name, method, data, message) {
	};
}

function xss_test() {
	if (!this)
		return new xss_test();
	base_test.call(this);
	this._vuln_type = "XSS";
	this.set_name("XSS Plugin");
	this._prefix = makeid(4);
	this._post = makeid(4);
	this.set_tester(XSS_Response_Tester);
	this.set_options = {"prefix":this._prefix, "post":this._post, "complete":this._prefix + encodeURIComponent("\"'<>&quot;&lt;&gt;") + this._post};
	this.set_payloads([this.set_options.complete]);

	// handle the enable / disable flag
	this.pre_test = function(message) {
		if (("xss" in message.enabled) && !message.enabled.xss) {
			return false;
		}
		return true;
	};
}


/**
 * handle plugin startup
 */
xcon.activetesters.push(xss_test);

