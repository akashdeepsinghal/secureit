var tabstate = {"numrows":0,"added":{}, "cached":{}, "testing":{}};
var tablast;

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-57409305-1']);
_gaq.push(['_trackPageview']);


(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();



/**
 * Shows the server response text in a modal.
 * TODO: add a keylister for escape
 */
function showResponse() {
	console.log("show response", this);
	var comb_id = this.getAttribute("data-comb_id");
	console.log("show response", comb_id);
	var elm = document.createElement("div");
	elm.className = "overlay";
	elm.style.cursor = "default";
	elm.innerText = tabstate.cached[comb_id].response.text;
	elm.onclick=delme;
	document.body.appendChild(elm);
}



/**
 * listen for messages from content scripts and background scripts
 * TODO: change the tabtype to be an "enum"
 */
function message_listener(message, sender, sendResponse) {
	var log = Logger.getLogger("internal");
	log.trace("hacktab message", message, sender);
	// ignore messages not for us
	if (!("tabtype" in message)) { return; }
	//if (!(btoa(sender.id) == "ZGFpa2Vkb21oZGhpcGpjYmFhaG9pY2FjZmpjaG1pYXA=")) { console.log("untrusted", message); return; }

	//console.log("tab message, verify our extension?", message, sender);
	// clear the contents...
	if (message.tabtype == "clear") {
		log.trace("clear hacktab");
		document.getElementById("urlbody").innerHTML = "";
		document.getElementById("notice").innerHTML = "";
		document.getElementById("alert").innerHTML = "";
		// clear the page state
		tablast = tabstate;
		tabstate = {"numrows":0,"added":{}, "cached":{}, "testing":{}};
	}
	// add a notice, message.notice
	else if (message.tabtype == "notice") { 
		var newnotice = document.createElement("li");
		var newimg = document.createElement("img");
		newimg.src = "/important.png";
		newimg.style.width=24;
		newnotice.appendChild(newimg);
		newnotice.innerText = message.notice;
		document.getElementById("notice").appendChild(newnotice);

		// TODO:  move this to a common function
		/*
		if ("comb_id" in message && "param_name" in message) {
			var icon_container = document.getElementById("td:"+message.comb_id+":icon:"+message.param_name);
			icon_container.innerHTML = "";
			var img = create_elm("img", {"src":"/target.png", "className":"icon", "onclick":attack, "id":"img:"+message.comb_id+":action:"+message.param_name}, {"marginLeft": 10,"marginRight":10}, {"data-comb_id": message.comb_id, "data-param_name": message.param_name});
			icon_container.appendChild(img);
		}
		*/
	}
	else if (message.tabtype == "addrequest") {
		log.warn("add request", message);

		// if we have seen this url before, update it
		// TODO: merge this down for urls with modes
		/*
		if (message.comb_id in tabstate.cached) {
			log.error("MERGE request", message);
			//merge_request(message.comb_id, message.request);
			tabstate.cached[message.comb_id].request = message.request;
			tabstate.cached[message.comb_id].response = message.response;
			tabstate.cached[message.comb_id].tabid = message.tabid;
			tabstate.cached[message.comb_id].info = message.info;
			append_unique(tabstate.cached[message.comb_id].referer, message.referer);
		}
		// new url
		else {
			//log.error("NEW request", message, countProperties(tabstate.cached));
			//console.log("NOT 'IN'", message.comb_id, tabstate.cached);
		}
		// if we have vulnerability data, update it
		*/
		/*
		if ("request" in message.info) {
			for (var param_name in message.info.request.get) {
				update_vuln(message.comb_id, "get", param_name);
				//update_vuln(message.comb_id, "post", param_name);
			}
			for (var param_name in message.info.request.post) {
				//update_vuln(message.comb_id, "get", param_name);
				update_vuln(message.comb_id, "post", param_name);
			}
		}
		*/
		
		tabstate.cached[message.comb_id] = {"request":message.request ,"response":message.response, 'tabid':message.tabid, "info":message.info, "vuln": {"tested":null}, "referer":message.referer};
		// TODO: this data is in tabstate, we should just read from there
		add_row(message.comb_id, message.request.method, message.request.host.replace(/^https?:\/\//i, ""), message.request.path, (message.response.text) ? message.response.text.length : 0, countProperties(message.info.request.get) + countProperties(message.info.request.post), message.response.mime);
		log.warn("POST add request", countProperties(tabstate.cached));
	}
	else if (message.tabtype == "vuln") {
		//if (!(message.param_name in tabstate.cached[message.comb_id].vuln)) {
		//	tabstate.cached[message.comb_id].vuln[message.param_name] = {};
		//}
		//if (message.method == "GET") {
		console.log(" @@@@ set vuln", message);
		
		if (message.comb_id+":"+message.param_name in tabstate.testing) {
			var t = tabstate.testing[message.comb_id+":"+message.param_name];
			t--;
			console.log("OUTSTANDING TESTS: " + t);
			if (t <= 0) {
				setActionImg(message.comb_id, message.param_name, "/target.png");
			}
			tabstate.testing[message.comb_id+":"+message.param_name] = t;
		}

		var method = message.method.toLowerCase();
		if (method in tabstate.cached[message.comb_id].info.request) {
			
			log.warn("update vuln", tabstate.cached[message.comb_id].info.request);
			// TODO: clean this up, we are requesting GET and POST for each param, but we only have 1 to update here....
			if (message.param_name in tabstate.cached[message.comb_id].info.request[method]) {
				var param = tabstate.cached[message.comb_id].info.request[method][message.param_name];
				param.tested = message.tested;
				param.vuln[message.vuln_type] = message;
				console.log("SET VULN: ", param.vuln)
				tabstate.cached[message.comb_id].info.request[method][message.param_name] = param;

				//tabstate.cached[message.comb_id].info.request[method][message.param_name].tested = message.tested
				//tabstate.cached[message.comb_id].info.request[method][message.param_name].vuln[message.vuln_type] = message;
				//log.warn("update cache, add_detail()", tabstate.cached[message.comb_id].info.request[method][message.param_name]);
				//tabstate.cached[message.comb_id].vuln[message.param_name][message.vuln_type] = message;
				//tabstate.cached[message.comb_id].vuln.tested = message.tested;
				add_detail(message.comb_id);
				console.log("M", message);
				console.log("V", message.vuln_type);
				update_vuln(message.comb_id, method, message.param_name, message.vuln_type);
			}
		}
		else {
			log.error("WTF, no vuln for mesage?", message, tabstate.cached);
		}
	}
	// ACK
	sendResponse("hacktab ACK");
}

/**
 * display all of the vulnerability information for a url and parameter
 */
function update_vuln(comb_id, method, param_name, vuln) {

	var data = tabstate.cached[comb_id].info.request[method][param_name];
	if (!data) {
		console.log("unable to update_vuln param_name does not exist???", comb_id, method, param_name);
		return;
	}

	// add the vulnerability information to the top of the page
	console.log("update vuln", comb_id, method, param_name, data);
	//for (var vuln in data.vuln) {
		var issue = data.vuln[vuln];

		//console.log("disp:", vuln, issue);
		// don't show alerts for clean vulnerabilities
		if (issue.status == xcon.test.pass || issue.status == xcon.test.notvuln) { return; }
		
		
		var img = create_elm("img", {"src":"/important.png", "className":"left"}, {"width":16,"marginRight":30}, {});
		var li = create_elm("li", {}, {}, {});
		var ospan = create_elm("span", {}, {}, {});
		ospan.innerHTML = "Warning: [";
		//var ispan = create_elm("span", {"className":"red"}, {}, {});
		ospan.innerHTML += "<span class=\"red\">" + escape(param_name) + "</span>";
		//ospan.appendChild(ispan);
		ospan.innerHTML += "] parameter in url: ";

		// TODO: display the correct vulnerability message here
		ospan.innerHTML += "[<span class='blue'>" +  escape(tabstate.cached[comb_id].request.host + tabstate.cached[comb_id].request.path) + "</span>] is vulnerable to <span class='red'>" + issue.title + "</span>. " + issue.detail;

		var alrt = document.getElementById("alert");
		li.appendChild(img);
		li.appendChild(ospan);
		alrt.appendChild(li);
	//}
	return;
	//TODO: remove this
	// update the row detail if that's on the page
	/*
	var elm = document.getElementById("td:"+comb_id+":tested:"+param_name);
	if (elm) {
		console.log("update vuln", elm);

		if (!(comb_id in tabstate.cached)) { return; }
		console.log("update vuln 2", elm);
		if (!(param_name in tabstate.cached[comb_id].vuln)) { return; }
		console.log("update vuln 3", elm);

		var vuln = tabstate.cached[comb_id].vuln[param_name];
		elm.innerText = get_time_since(vuln.tested);


		var icon_container = document.getElementById("td:"+comb_id+":icon:"+param_name);
		icon_container.innerHTML = "";

		var img = create_elm("img", {"src":"/target.png", "className":"icon", "onclick":attack, "id":"img:"+comb_id+":action:"+param_name}, {"marginLeft": 10,"marginRight":10}, {"data-comb_id": comb_id, "data-param_name": param_name});
		icon_container.appendChild(img);
	}
	*/
}


/**
 * insert the detail data
 */
function add_detail(comb_id) {
	var log = Logger.getLogger("internal");
	var info = tabstate.cached[comb_id].info.request;
	log.error("add_detail()", comb_id, info);

	var tbl = document.getElementById("dbody"+comb_id);
	tbl.innerHTML = "";

	// map get and post, possible change gparams and pparams to GET / POST
	var method_map = {'get':'GET', 'post':'POST'};


	// TODO: CONTINUE here to add the type of persistent storage we are working with (name, type CRUD)
	/*
	var tr = document.createElement("tr");	
	tr.id = "tr:"+comb_id+":"+
	var td = document.createElement("td");
	tbl.appendChild(tr);
	*/

	for (var method in method_map) {
	for (var param_name in info[method]) {
		if (! param_name || param_name.length < 1) { continue; } // skip empty param names...
		var param = info[method][param_name];

		var tr = document.createElement("tr");	
		tr.id = "tr:"+comb_id+":"+method+":"+param_name;
		// method type
		var td = document.createElement("td");
		td.innerText = method_map[method];
		td.style.marginLeft = 20;
		tr.appendChild(td);

		// parameter name
		td = document.createElement("td");
		td.innerText = param_name;
		tr.appendChild(td);

		// parameter type
		td = document.createElement("td");
		td.id = "td:"+comb_id+":type:"+param_name;
		var istype = (param.type) ? param.type[0] : null;
		td.appendChild(type_select(istype, comb_id, param_name, method));
		//td.innerText = (param.type) ? param.type[0] : "unknown";
		tr.appendChild(td);

		// tested time
		td = document.createElement("td");
		td.id = "td:"+comb_id+":tested:"+param_name;
		td.innerText = (param.tested) ? get_time_since(param.tested) : "never tested";
		tr.appendChild(td);


		var data = tabstate.cached[comb_id].info.request[method][param_name];
		var havetest = false;
		log.debug("  update detail vulns", data);

		// tests
		td = document.createElement("td");
		for (var vtype in data.vuln) {
			havetest = true;
			var vuln = data.vuln[vtype];

			var vuln_span = create_elm("span", {"className":"vulnissue", "onmouseover":show_vuln}, {}, {"data-comb_id":comb_id, "data-param_name":escape(param_name), "data-vtype":escape(vtype)});
			vuln_span.innerText = "[" + escape(vtype) + "]";
			log.debug("vtype", vuln, vtype, vuln_span);

			var vuln_img;
			if (vuln.status == xcon.test.notvuln) {
				vuln_img = create_elm("img", {"src":"approve.png", "className":"icon"}, {}, {});
			} else if (vuln.status == xcon.test.pass) {
				vuln_img = create_elm("img", {"src":"approve.png", "className":"icon"}, {}, {});
			} else if (vuln.status == xcon.test.timeout) {
				vuln_img = create_elm("img", {"src":"important.png", "className":"icon"}, {}, {});
			}
			else if (vuln.status == xcon.test.fail) {
				vuln_img = create_elm("img", {"src":"horns.png", "className":"icon"}, {}, {});
			}

			vuln_span.appendChild(vuln_img);
			td.appendChild(vuln_span);
		}
		if (!havetest) {
			td.innerText = "[no tests]";
		}

		td.id = "td:"+comb_id+":tests:"+param_name;

		td.style.cursor = "pointer";
		td.onclick=showResponse;
		td.setAttribute("data-comb_id", comb_id);
		tr.appendChild(td);

		// values
		td = document.createElement("td");
		if (param.values) {
			var teststr = "[";
			for (var i=0;i<param.values.length-1; i++) { 
				teststr += param.values[i] + "] , [";
			}
			teststr += param.values[i] + "]";
			td.innerText = teststr;
		} else {
			td.innerText = "no values";
		}
		td.id = "td:"+comb_id+":values:"+param_name;
		td.className = "values";
		tr.appendChild(td);

		td = document.createElement("td");
		td.id = "td:"+comb_id+":icon:"+param_name;

		// the target action
		console.log(tabstate.testing);
		var ident = comb_id+":"+param_name;
		console.log("redrawing testing", tabstate);
		var img_name = (ident in tabstate.testing && tabstate.testing[ident] > 0) ? "/loading.gif" : "target.png";
		console.log("img_name:", img_name, comb_id+":"+param_name, tabstate.testing[comb_id+":"+param_name]);

		var img = create_elm("img", {"src":img_name, "title":"Test " + param_name + " for security errors", "className":"icon", "onclick":attack, "id":"img:"+comb_id+":action:"+param_name}, {}, {"data-comb_id": comb_id, "data-param_name": param_name, "data-method":method_map[method]});
		td.appendChild(img);
		

		tr.appendChild(td);
		tbl.appendChild(tr);
	}
	}

	//document.getElementById("urltab").appendChild(tr);
	var toptr = document.getElementById("detail"+comb_id);
	toptr.style.height = "auto";
}

/**
 * the right hand status icon
 */
function setActionImg(comb_id, param_name, img) {
	var simg = document.getElementById("img:"+comb_id+":action:"+param_name);
	simg.src = img;
}

function attack() {

	// get the comb_id
	// get the param_name
	// send them to the content sscript for testing....
	var comb_id = this.getAttribute("data-comb_id");
	var param_name = this.getAttribute("data-param_name");
	var method = this.getAttribute("data-method");
	var log = Logger.getLogger("attack");
	log.debug("attack " + method + " comb_id: " + comb_id + " param_name " + param_name);

	// get the number of enabled plugins so we know how many to wait for
	chrome.extension.sendMessage({"type":xcon.enable}, function(r) {
		var tests = 0;
		for (var plugin in r) {
			if (r[plugin])
				tests++;
		}
		console.log("OUTSTANDING TESTS SET TO: "+ tests, r);
		tabstate.testing[comb_id+":"+param_name] = tests;
	});


	setActionImg(comb_id, param_name, "/loading.gif");
	if (comb_id in tabstate.cached) {
		log.debug(" attack cached: ", tabstate.cached[comb_id]);
	}
	else {
		log.debug(" attack non cached: ", comb_id, param_name);
	}

	// TODO: send a message to the xssploit script comb_id, param_name
	// CONTINUE: 

	//chrome.tabs.sendMessage(state.hacktab, {"tabtype":"addrequest", "comb_id":comb_id, "data": data, "response": message.response, "request": message.request, "info": bitcache.get_request(comb_id), "tabid": sender.tab.id}, function (r) { console.log("from tab", r); });
		//tabstate.cached[message.comb_id] = {"get":message.info.get ,"post":message.info.post, 'src':message.tabid};

	//chrome.tabs.sendMessage(tabstate.cached[comb_id].tabid, {"type":xcon.attack, "comb_id":comb_id, "param_name": param_name, "request": tabstate.cached[comb_id].request, "response": tabstate.cached[comb_id].response}, function (r) { console.log("from tab", r); });
	//chrome.tabs.sendMessage(tabstate.cached[comb_id].tabid, {"type":xcon.attack, "method":method, "comb_id":comb_id, "param_name": param_name}, function (r) { 
	chrome.extension.sendMessage({"hacktab":true, "type":xcon.attack, "method":method, "comb_id":comb_id, "param_name": param_name}, function (r) {
		// do nothing here ....
	});
}


/**
 * called when a row is expanded.   the current cached data values are dynamically added to the page
 */
function add_row(comb_id, method, host, path, resp_bytes, num_param, squash) {

	if (comb_id in tabstate.added) {
		return;
	}
	tabstate.added[comb_id] = true;

	

	var te = null;
	var se = null;
	var tr = document.createElement("tr");
	tabstate.numrows++;
	var cn = (tabstate.numrows % 2 === 0) ? "bg-white" : "bg-white2";
	tr.className = cn;
	tr.id = "tr"+comb_id;
	tr.style.height = 0;
	tr.setAttribute("data-comb_id", comb_id);
	//tr.onclick = expand;

	// add the status icon
	te = document.createElement("td");
	var img = document.createElement("img");
	img.src = "/loading.gif";
	img.id = "status"+comb_id;
	img.width=16;
	te.style.paddingRight=0;
	//te.appendChild(img);
	tr.appendChild(te);

	var style = [
	{"st":"base1","pre":"","post":""},
	{"st":"violet", "pre":"", "post":""},
	{"st":"green", "pre":"", "post":""},
	{"st":"blue", "pre":"", "post":""},
	//{"st":"violet", "pre":"", "post":""},
	{"st":"orange", "pre":"", "post":" bytes"},
	{"st":"green", "pre":"", "post":""},
	{"st":"blue", "pre":"", "post":""}
	];

	// we won't ever know the method of the main frame =(
	if (!method || method == undefined) { method = "main_frame"; }

	for(var idx in arguments) {
		//if (idx < 1 || idx >= style.length) { continue; } // skip comb_id
		// create the visible row information
		te = document.createElement("td");
		if (style[idx].pre) {
			se = document.createElement("span");
			se.className = "info";
			se.innerText = style[idx].pre;
			te.appendChild(se);
		}
		se = document.createElement("span");
		se.innerText = arguments[idx];
		se.className = style[idx].st;
		te.appendChild(se);
		if (style[idx].post) {
			se = document.createElement("span");
			se.className = "info";
			se.innerText = style[idx].post;
			te.appendChild(se);
		}
		tr.appendChild(te);
	}

	// the expand icon
	if (num_param > 0) {	
		var img = create_elm("img", {"src":"/expand.png", "onclick":expand, "id":"exp:"+comb_id, "className":"icon"}, {"marginTop":9}, {"data-comb_id":comb_id});
		tr.appendChild(document.createElement("td").appendChild(img));
	} else {
		tr.appendChild(document.createElement("td"));
	}



	document.getElementById("urlbody").appendChild(tr);

	// add the detail drop down
	tr = document.createElement("tr");
	tr.id = "detail"+comb_id;

	// can not appy height here, but we can wrap the <td> contdents in a <div> and
	// animate that
	/*
tr div {
  max-height:0;
  transition: max-height 1s ease-in-out;
}
tr.open div {
  max-height: 500px;
}
*/
	tr.className = "h0 " + cn;
	tr.style.height = "0";
	//tr.style.display="block";
	//tr.style.display="none";

	te = document.createElement("td");
	te.colSpan = 10;
	te.style.margin=0;
	te.style.padding=0;

	var container = document.getElementById("urlbody");

	// add the visible row and a placeholder detail table
	var tbl = document.createElement("table");
	tbl.id = "dtable"+comb_id;
	tbl.style.margin=0;
	tbl.style.maxWidth = container.clientWidth;
	//tbl.innerHTML = "<thead><tr><th>method</th><th>parameter</th><th>type></th><th>last test</th><th>test results</th><th>values</th></tr></thead>";
	var bdy = document.createElement("tbody");
	bdy.id = "dbody"+comb_id;
	bdy.className="bg-base1";
	bdy.style.width="100%";
	tbl.appendChild(bdy);
	var div = document.createElement("div");
	div.id = "div:"+comb_id;
	div.appendChild(tbl);
	te.appendChild(div);
	tr.appendChild(te);

	container.appendChild(tr);
}


/**
 * collapse the url request row
 * TODO:  add a collapse icon
 */
function collapse(elm) {
	console.log("collapse", elm, this);
	this.onclick = expand;
	this.src="/expand.png";

	var comb_id = this.getAttribute("data-comb_id");
	var tbl = document.getElementById("dbody"+comb_id);
	tbl.innerHTML = "";
	_gaq.push(['_trackEvent', 'row', 'collapse']);
}


/**
 * expand the url request row
 * TODO:  add an expand icon
 */
function expand(elm) {
	this.onclick = collapse;
	this.src="/collapse.png";
	var comb_id = this.getAttribute("data-comb_id");
	_gaq.push(['_trackEvent', 'row', 'expand']);
	add_detail(comb_id);
}

/**
 * display the type select box with the current value selected
 */
function type_select(selected, comb_id, param_name, method) {
	var sel = create_elm("select", {"onchange":update_type},{},{"data-comb_id":comb_id, "data-param_name":param_name, "data-method":method.toLowerCase()});

	for (var type in xcon.types) {
		var opt = create_elm("option", {"value":type, "innerText": xcon.types[type][0], "title":xcon.types[type][2]});
		if (xcon.types[type][0] == selected) {
			opt.setAttribute("selected", "selected");
		}
		sel.appendChild(opt);
	}
	return sel;
}

/**
 * handle type selection
 */
function update_type() {
	console.log("update_type", this, this.value);
	var comb_id = this.getAttribute("data-comb_id");
	var param_name = this.getAttribute("data-param_name");
	var method = this.getAttribute("data-method");
	var data = {};
	//console.log("update type:", comb_id, param_name, method);
	_gaq.push(['_trackEvent', 'type', this.value, param_name]);
	if (this.value == "vol") {
		// NEED REFERER
		//tabstate.cached[comb_id].response.text;
		//alert("VOLATILE!");

		console.log("referer", tabstate.cached[comb_id].referer);
		var elm = document.getElementById("volatile");
		elm.className = "overlay";

		var ref = tabstate.cached[comb_id].referer;
		var elm = document.getElementById("volatile_url");
		elm.value = ref.url;
		elm = document.getElementById("volatile_comb_id");
		elm.value = ref.comb_id;
		//elm.value = tablast.cached[tabstate.cached[comb_id].referer.id] + " "
		
		var info = tabstate.cached[comb_id].info.request;
		var values = info[method][param_name].values;


		elm = document.getElementById("volatile_regex");
		if (tablast) {
			var volregex = new RegExp("((.|[\r\n]){5,20})"+values[values.length-1]+"((.|[\r\n]){5,20})");
			var res = volregex.exec(tablast.cached[comb_id].response.text);
			if (res) {
				elm.value = res[1] + "(.*?)" + res[3];
			}
			else {
				elm.value = "<custom regex to capture token>";
			}
		}
		else {
			elm.value = "<custom regex to capture token>";
		}

		tabstate.vol = {"comb_id":comb_id, "param_name":param_name, "method":method};
	}
	else {
		tabstate.cached[comb_id].info.request[method][param_name].type = xcon.types[this.value];
		chrome.extension.sendMessage({"hacktab":true, "comb_id":comb_id, "param_name":param_name, "method":"get", "type":xcon.uptype, "param_type":xcon.types[this.value]});
	}
}

function volatile_save() {
	var elm = document.getElementById("volatile_regex");
	var regex = elm.value;
	var elm = document.getElementById("volatile_comb_id");
	var comb_id = elm.value 
	
	tabstate.cached[tabstate.vol.comb_id].info.request[tabstate.vol.method][tabstate.vol.param_name].type = xcon.types.vol;

	chrome.extension.sendMessage({"hacktab":true, "type":xcon.uptype, "comb_id":tabstate.vol.comb_id, "param_name":tabstate.vol.param_name, "method":tabstate.vol.method, "param_type":xcon.types.vol, "data":{"regex":regex, "comb_id":comb_id}});
	volatile_cancel();
}

function volatile_cancel() {
	var elm = document.getElementById("volatile");
	elm.className = "hidden";
}


function hide_vuln(evt) {
	var src = evt.srcElement;
	var comb_id = src.getAttribute("data-comb_id");
	var param_name = src.getAttribute("data-param_name");
	var vtype = src.getAttribute("data-vtype");
	var elm = document.getElementById("detail:"+comb_id+":"+param_name+":"+vtype);
	elm.parentNode.removeChild(elm);	
}


function show_vuln(evt) {
	var src = evt.srcElement;
	//console.log("show vuln", evt.srcElement, evt.target);
	return;
	var comb_id = src.getAttribute("data-comb_id");
	var param_name = src.getAttribute("data-param_name");
	var vtype = src.getAttribute("data-vtype");

	var tmp = tabstate.cached[comb_id];
	console.log("show vuln", tmp);
	var vuln = tmp.vuln[param_name][vtype];


	//if (param_name in vulns) {
	//for (var vtype in vulns[param_name]) {
	var elm = document.createElement("div");
	elm.className = "overlay";
	elm.style.cursor = "default";
	elm.innerText = vuln.detail; 
	elm.id="detail:"+comb_id+":"+param_name+":"+vtype;
	document.body.appendChild(elm);
}

// volatile button clicks
var elm = document.getElementById("volatile_save");
elm.onclick = volatile_save;
var elm = document.getElementById("volatile_cancel");
elm.onclick = volatile_cancel;

// listen for events
chrome.runtime.onMessage.addListener(message_listener);
