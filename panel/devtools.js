var devstate = {};

var l = document.getElementById("output");
l.innerText = 'start of script';
//console.log("IN! DEVTOOLS.JS");




/**
 * display a list of saved tests to replay
 */
function show_recordings(recordings) {
	var elm = document.getElementById("recordings");
	var html = "";
	for (var r in recordings) {
		html += '<li class="rec">' + recordings[r] + "</li>";
	}
	elm.innerHtml = html;
}

/**
 * show the url configuration page
 */
function show_config() {
	console.log("show config");
	var elm = document.getElementById("param");
	elm.className = "bg-base0 hidden";
	elm = document.getElementById("config");
	elm.className = "left bg-base0";
}

/**
 * show the parameter details
 */
function show_param() {
	console.log("show param");
	var elm = document.getElementById("config");
	elm.className = "bg-base0 hidden";
	elm = document.getElementById("param");
	elm.className = "left bg-base0";

	//display_param_values(false);
}	

/**
 * show the saved parameter values 
 */
function list_saved_values(name) {
	console.lof("LSV!");
	var data = {activeurl: xcon.activeurl};
	apicall("GET", "request/param", data, function(r) {
		console.lof("   DPV!");
		display_param_values(r);
	});
}

/**
 * called when the get parameter input is selected.  display dropdown
 * TODO: convert to CSS tranwsitions
 */
function get_selected(elm) {
	var elm = document.getElementById("get_input");
	drop_toggle(elm, 200);
}

/**
 * roll up the get url bar
 */
function get_unselected(elm) {
	var elm = document.getElementById("get_input");
	drop_toggle(elm, 20);
}

/**
 * called when the post parameter input is selected.  display dropdown
 */
function post_selected(elm) {
	var elm = document.getElementById("post_input");
	drop_toggle(elm, 200);
}

/**
 * roll up the post url bar
 */
function post_unselected(elm) {
	var elm = document.getElementById("post_input");
	drop_toggle(elm, 20);
}

/**
 * attach event handlers
 */
var elm = document.getElementById("get_input");
if (elm) {
	elm.onfocus = get_selected;
	elm.onblur = get_unselected;
}

elm = document.getElementById("post_input");
if (elm) {
	elm.onfocus = post_selected;
	elm.onblur = post_unselected;
}

elm = document.getElementById("send_button");
if (elm) { elm.onclick = send_request; }
elm = document.getElementById("show_config");
if (elm) { elm.onclick = show_config; }
elm = document.getElementById("show_param");
if (elm) { elm.onclick = show_param; }
elm = document.getElementById("menu_reload");
if (elm) { elm.onclick = menu_reload; }
elm = document.getElementById("add_new_resp");
if (elm) { elm.onclick = add_new_resp; }

/*
elm = document.getElementById("nav");
addResizeListener(elm, nav_resize);
window.onresize = nav_resize;
*/

var span = create_response_input("new", -1, -1, "");
elm = document.getElementById("add_resp_container");
if (elm) { elm.appendChild(span); }



/**
 * send the get/post custom request
 */
function send_request() {
	console.log("send_request");
}

/**
 * called when a url is clicked in the list of unique urls
 */
function url_selected(elm) {
	console.log("URL_SELECTED", elm);
	var url = elm.innerText;
	var urlid = elm.dataset.urlid;
	devstate.selected_url = urlid;

	apicall("GET", "request/param", {"urlid": urlid}, function(data) {
		console.log("get url", this);
		try {
			var data = JSON.parse(this.responseText);
			if (!data || !data.response || !data.response.item) {
				console.log("error parsing url data", data);
				return
			}
		} catch (err) {
			console.log("error parsing url data", err);
		}
		console.log(data);


		var paramData = {};
		if (data.response && data.response.item) {
			for (var i=0;i<data.response.item.length;i++) {
				var item = data.response.item[i];
				paramData[item.name] = item;
			}
		}

		//set_params({"param1": {"type": "sqlid", "val1": "89", "val2": "91", "issues": {"name": "Cross Site Scripting", "status": "validated secure", "tested": "2014-08-01", "icon": "secure.png"}}});
		set_params(paramData);
	});

	// TODO: replace with api data
	apicall("GET", "url/response", {"url_id": devstate.selected_url}, function(data) {
		console.log("url responses", data, this);
		try {
			var d = JSON.parse(this.responseText);
			if (d.response && d.response.count > 0) {
				console.log("url/response set_messages", d);
				set_messages(d.response.item);
			} else {
				console.log("url/response set_messages DEFAULT");
				//set_messages({"default_success": {"attr_type": 4, "attr_op": "0", "attr_value": 200}});
				set_messages([{"type": "default_success", "attr_type": 4, "attr_op": "0", "attr_value": 200}]);
			}

		} catch (err) {
			console.log("apicall url/response error", err);
		}
	});
}

function select_message_type(typeValue, elm) {
	var nodes = elm.childNodes;
	for (var i=0; i<nodes.length; i++) {
		if (nodes[i].value == typeValue) {
			nodes[i].setAttribute("selected", "selected");
			return;
		}
	}
}	

function create_response_input(type, select_type_id, select_op_id, v) {
	// response type
	var container = document.createElement("span");
	var select = document.createElement("select");
	select.id = type + "_type";
	select.name = type + "_type";
	select.style.display = "block";
	select.style.float = "left";

	console.log("create response input", xcon.resp.type);
	for (var typ in xcon.resp.type) {
		var option = document.createElement("option");
		option.value = xcon.resp.type[typ].id;
		option.innerText = xcon.resp.type[typ].name;
		if (xcon.resp.type[typ].id == select_type_id) {
			option.selected = true;
		}
		select.appendChild(option);
	}
	container.appendChild(select);

	// response type operation
	select = document.createElement("select");
	select.id = type + "_op";
	select.name = type + "_op";
	select.style.display = "block";
	select.style.float = "left";

	for (var i=0;i<xcon.resp.op.length;i++) {
		var option = document.createElement("option");
		option.value = i;
		option.innerText = xcon.resp.op[i];
		if (i == select_op_id) {
			option.selected = true;
		}
		select.appendChild(option);
	}
	container.appendChild(select);

	// response type value
	var input = document.createElement("input");
	input.id = type + "_value";
	input.name = type + "_value";
	input.type = "text";
	input.value = v;
	input.style.display = "block";
	input.style.width = "400";
	input.style.height = "21";
	input.style.float = "left";
	//input.innerText = "INPUT!";
	container.appendChild(input);

	return container;
}

/**
 * set the url success and error
 */
function set_messages(data) {
	console.log("^^^ set messages: ", data);

	var config_elm = document.getElementById("resp_list");
	config_elm.innerHTML = "";


	//for (var type in data) {
	for (var i=0;i<data.length;i++) {
		var d = data[i];
		console.log("  ### message: ", d);

		var lbl = document.createElement("label");
		lbl.innerText = d['type'];
		lbl.style.display = "block";
		lbl.style.float = "left";
		lbl.style.width = "150px";
		lbl.style.paddingTop = "3px";
		//lbl.style="display:block;width:150px;float:left;";
		config_elm.appendChild(lbl);
		var span = create_response_input(d.type, d.attr_type, d.attr_op, d.attr_value);
		console.log("SPAN!", span);
		config_elm.appendChild(span);

		var br = document.createElement("br");
		br.style.clear = "left";
		config_elm.appendChild(br);
	}


	/*
	   <label class="info" >Success Message:</label>
	   <select id="success_type" name="success_type">
	   <option value="cookie-exists">cookie exists</option>
	   <option value="text-exists">text on page</option>
	   </select>
	   <input type="text" name="success" size="48" id="success_input" /><br />
	   */

	/*
	   var elm = document.getElementById("success_input");
	   elm.value = data["success"]["content"];
	   select_message_type(data["success"]["type"], document.getElementById("success_type"));

	   elm = document.getElementById("error_input");
	   elm.value = data["error"]["content"];
	   select_message_type(data["error"]["type"], document.getElementById("error_type"));

	   elm = document.getElementById("failure_input");
	   elm.value = data["failure"]["content"];
	   select_message_type(data["failure"]["type"], document.getElementById("failure_type"));

	   elm = document.getElementById("other_input");
	   elm.value = data["other"]["content"];
	   select_message_type(data["other"]["type"], document.getElementById("other_type"));
	   */
}

/**
 * display the list of saved input parameters
 */
function set_params(params) {
	console.log("set_params: ",params);
	var tbl = document.getElementById("param_tablw");
	ol.innerHTML = "";
	xcon.parameters = params;
	for (var p in params) {
		var tr = document.createElement("tr");
		var td1 = document.createElement("td");
		var td2 = document.createElement("td");
		var td3 = document.createElement("td");
		var td4 = document.createElement("td");
		td1.innerText = p;
		td2 = create_param_type_select(params[p].hard_type);
		td3 = create_param_value_select(params[p].values);
		td4.innerText = "TEST RESULT";
		tr.appendChild(td1).appendChild(td2).appendChild(td3).appendChild(td4);
		tbl.appendChild(tr);


		/*
		   var elm = document.createElement("li");
		   elm.innerHTML = p;
		   elm.onclick = function() { select_param(this) };
		   ol.appendChild(elm);
		   */
	}	
}

/**
 * called when a parameter is selected
 */
function select_param(elm) {
	console.log("select param: ", elm);
}

/**
 * called when the url list reload button is pressed
 */
function menu_reload() {
	console.log("MENU RELOAD");
	apicall("GET", "request/url", {"host":"http://api.hacktab.com"}, function(data) {
		console.log("url/list callback", this.responseText);
		var par = document.getElementById("url_list");

		try {
			var data = JSON.parse(this.responseText);
			console.log(data);
			console.log(data.response);
			console.log(data.response.item);
		} catch (err) {
			console.log("JSON PARSE ERROR", err);
			alert("unable to parse server response: " + err);
			return;
		}

		//for (var item in data.response.item) {
		for (var i=0;i<data.response.item.length;i++) {
			var item = data.response.item[i];
			console.log(item);

			var elm = document.createElement("li");
			elm.innerHTML = item.path;
			var css = "img "
				if (item.get)  { css += "get "; }
			if (item.post) { css += "post "; }
			if (item.delete)  { css += "delete "; }
			elm.className = css;
			elm.dataset.urlid = item.id;

			elm.onclick = function() { url_selected(this); };
			par.appendChild(elm);
		}
	});
}

/**
 * display the detailed information about the parameter configuration and list of saved paramater values
 */
function display_param_values(data) {
	console.log("@@@@@ display_param_values: ", data);

	if (!data) {
		data = {"userid": 99, "showfriends": 1, "othervalue": "somestring"};
	}

	// show the type
	var paramelm = document.getElementById("pattach");
	paramelm.innerHTML = "";

	/*
	   var lbl = document.createElement("label");
	   lbl.innerHTML = "type:";
	   lbl.className = "info";
	   paramelm.appendChild(lbl);

	// show the available types
	var sel = document.createElement("select");
	sel.id = "param_type_opt";
	sel.setAttribute("name", "param_type_opt");
	for (var type in xcon.types) {
	console.log(type, xcon.types[type][0]);
	var elm = document.createElement("option");
	elm.setAttribute("value", type);
	elm.innerHTML = xcon.types[type][0];
	sel.appendChild(elm);
	}
	paramelm.appendChild(sel);
	*/


	// show all of the stored data values
	for (var e in data) {
		var elm = document.createElement("label");
		elm.innerHTML = e + ":";
		elm.className = "info";

		var elm2 = document.createElement("input");
		elm2.value = data[e];
		elm2.setAttribute("type", "text");
		elm2.className = "pvalue";

		//paramelm.appendChild(elm);
		paramelm.appendChild(elm2);
	}

	for (var e in xcon.tests) {
		var elm = document.createElement("label");
		elm.innerHTML = e + ": " + xcon.tests[e][2];
		paramelm.appendChild(elm);
	}

}

function nav_resize() {
	var containter_elm = document.getElementById("container");
	var nav_elm = document.getElementById("nav");
	var content_elm = document.getElementById("content");

	var rem = containter_elm.offsetWidth - nav_elm.offsetWidth;
	content_elm.style.width = rem;
	//console.log(content_elm.offsetWidth, containter_elm.offsetWidth, nav_elm.offsetWidth);
}

function add_new_resp() {
	if (devstate.selected_url) {
		var resp_name = document.getElementById('new_resp_name').value;
		var resp_type = document.getElementById('new_type').value;
		var resp_op = document.getElementById('new_op').value;
		var resp_value = document.getElementById('new_value').value;

		apicall("POST", "url/response", {"url_id": devstate.selected_url, "type": resp_name, "attr_type": resp_type, "attr_op": resp_op, "attr_value": resp_value, "content_type": null, "status": null, "creds": null});

	} else {
		alert("select a url first");
	}
}


		/*
chrome.devtools.network.onRequestFinished.addListener(function(req) {
	// Displayed sample TCP connection time here
	//console.log(req);

	//chrome.extension.sendMessage({"type": "devrequest","data":req});
	if (req.request.url.indexOf(".xsstools.com")) {
		console.log("REQUEST!", req);
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			//var log = Logger.getLogger("internal");
			//log.warn("send_to_webpage", req, tabs);
			chrome.tabs.sendMessage(tabs[0].id, req, function(response) { console.log("From Web Page Response: ", response); });
		});
	}
});
		*/

//alert("devtool");
//console.log("FROM DEVTOOLS.JS");
var l = document.getElementById("output");
l.innerText = 'end of script';

chrome.devtools.inspectedWindow.eval("alert(1)");
l.innerText = 'sent alert';

