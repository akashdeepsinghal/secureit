// test if the LFI is included
function LFI_Response_Tester(comb_id, param_name, method, url) {
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
		//console.log("LFI PLUGIN TESTER TESTING!");

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

function lfi_test() {
	if (!this)
		return new lfi_test();
	base_test.call(this);
	this._vuln_type = "LFI";
	this.set_name("LFI Plugin");
	this.set_tester(LFI_Response_Tester);
	this.set_options = {"complete":"/etc/hosts"};
	this.set_payloads(["/etc/hosts", "../etc/hosts", "../../etc/hosts", "../../../etc/hosts", "../../../../etc/hosts", "../../../../../etc/hosts", "../../../../../../etc/hosts", "../../../../../../../etc/hosts", "../../../../../../../../etc/hosts"]);

	// handle the enable / disable flag
	this.pre_test = function(message) {
		if (("lfi" in message.enabled) && !message.enabled.lfi) {
			return false;
		}
		return true;
	};
}


/**
 * handle plugin startup
 */
xcon.activetesters.push(lfi_test);

