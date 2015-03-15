// Testing codes can be built using : https://www.owasp.org/index.php/Testing_for_CSRF_(OTG-SESS-005)

// test if the CSRF is included
function CSRF_Response_Tester(comb_id, param_name, method, url) {
	this._start = new Date().getTime();
	this._comb_id = comb_id;
	this._param_name = param_name;
	this._method = method;
	this._url = url;
	this._title = "Local File Inclusion";
	this._detail = "The parameter is vulnerable to Local File Inclusion";

	this.set_options = function(options) {
		this._options = options;
	};

	this.check_result = function(xhr, options) {
		console.log("CSRF PLUGIN TESTER TESTING!");

		// sinktxt1 is the prefix to the suffix
		var regstr = "(localhost|127.0.0.1)";

		var sinkreg1 = new RegExp(regstr);
		var t1 = sinkreg1.exec(xhr.responseText);
		if (t1) {
			return {"result":"fail", "title":this._title, "detail":"The parameter ["+this._param_name+"] contains a Local File Inclusion vulnerability that may allow arbitrary code execution.", "proof": "/etc/hosts file was included"};
		}

		return {"result":"pass"};
	};
}

function csrf_test() {
	if (!this)
		return new csrf_test();
	base_test.call(this);
	this._vuln_type = "CSRF";
	this.set_name("CSRF Plugin");
	this.set_tester(CSRF_Response_Tester);
	this.set_options = {"complete":"/etc/hosts"};
	this.set_payloads(["/etc/hosts", "../etc/hosts", "../../etc/hosts", "../../../etc/hosts", "../../../../etc/hosts", "../../../../../etc/hosts", "../../../../../../etc/hosts", "../../../../../../../etc/hosts", "../../../../../../../../etc/hosts"]);

	// handle the enable / disable flag
	this.pre_test = function(message) {
		if (("csrf" in message.enabled) && !message.enabled.csrf) {
			return false;
		}
		return true;
	};
}


/**
 * handle plugin startup
 */
xcon.activetesters.push(csrf_test);