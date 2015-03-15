// TODO: send a sample request, get the time and default response
// save that then compare.   We may have an injection that does not work for benchmark
function SQLi_Response_Tester(comb_id, param_name, method, url) {
	this._start = new Date().getTime();
	this._comb_id = comb_id;
	this._param_name = param_name;
	this._method = method;
	this._url = url;
	this._title = "SQL Injection";
	this._detail = "The parameter [" + param_name + "] is vulnerable to SQL Injection.";

	this.check_result = function(xhr, options) {

		this._end = new Date().getTime();
		var rmin = this._end - this._start;
		var rmin = xhr._openargs.ftime - xhr._openargs.ctime;

		if (rmin > 2000) {
			console.log(" ***  LIKELY INJECTION TYPE: " + this._vuln_type + " benchmark took: " + rmin);
			return {"title":this._title, "detail":this._detail + " benchmark took: " + (rmin/1000) + " seconds", "result":"fail"};
		}

		return {"result":"pass"};
	}
}

function sql_test() {
	if (!this)
		return new sql_test();
	base_test.call(this);
	this._vuln_type = "SQLi";
	this.set_name("SQLi Plugin");
	this.set_tester(SQLi_Response_Tester);
	this.set_payloads([
		"BENCHMARK(9900000,sha1(0x41414141414141414141))", 
			"1234 or BENCHMARK(9900000,sha1(0x41414141414141414141))", 
			"1234' or BENCHMARK(9900000,sha1(0x41414141414141414141))", 
			"1234\" or BENCHMARK(9900000,sha1(0x41414141414141414141))", 
			"BENCHMARK(9900000,sha1(0x41414141414141414141)) -- f", 
			"1234 or BENCHMARK(9900000,sha1(0x41414141414141414141)) -- f", 
			"1234' or BENCHMARK(9900000,sha1(0x41414141414141414141)) -- f",
			"1234\" or BENCHMARK(9900000,sha1(0x41414141414141414141)) -- f"
				]
			);
}

//xcon.activetesters.push(sql_test);
