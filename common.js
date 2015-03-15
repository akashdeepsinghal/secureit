
xcon = {};
xcon.getstate = 1;
xcon.setstate = 2;
xcon.input = 3;
xcon.getcurrent = 4;
xcon.setcurrent = 5;
xcon.getinfo = 6;
xcon.addrequest = 7;
xcon.dotest = 8;
xcon.hacktab = 9;
xcon.updatevar = 10;
xcon.getrequest = 11;
xcon.attack = 12;
xcon.vuln = 13;
xcon.uptype = 14;
xcon.upvuln = 15;
xcon.uptets = 16;
xcon.shouldload = 17;
xcon.settarget = 18;
xcon.gettarget = 19;
xcon.enable = 20;

xcon.apiurl = "http://dev.xsstools.com/api/";
xcon.activeurl = "http://dev.xsstools.com/foobar/boobaz";


// the toggle in devtools for the get and post param drop downs
xcon.toggle = {};
xcon.parameters = {};

xcon.modeNames = ["ajax", "mode"];
xcon.modeRegex = [/[\d-]+\.IBehaviorListener[\.a-zA-Z0-9-]+/];

// TODO: allow custom types, this should be an API call to get the types.
xcon.types = {};
xcon.types.nul = ['null', /^$/, "null or empty value", "", -1];
xcon.types.md5 = ['md5', /^[a-f0-9]{32}$/, "MD5 hash", "i", 0];
xcon.types.sha1 = ['sha1', /^[a-f0-9]{40}$/, "SHA1 hash", "i", 1];
xcon.types.sqldate = ['sql date', /^\d{4}-\d{1,2}-\d{1,2}$/, "SQL Date", "i", 2];
xcon.types.uuid = ['uuid', /^[a-z0-9]{32}$/, "uuids are used to uniquely identify items usually in a DB", "i", 3];
xcon.types.bool = ['boolean', /^(1|true|0|false)$/, "boolean values of true or false", "i", 4];
xcon.types.sqlid = ['SQL id', /^[0-9]{2,11}$/, "SQL ids are usually Primary Keys used to identify an item or row in a table", "", 5];
xcon.types.sqlids = ['SQL ids', /^[0-9,]{2,11}$/, "multiple SQL ids separated by comma", "", 6];
xcon.types.integer = ['integer', /^[0-9]$/, "an integer number", "", 7];
xcon.types.decimal = ['decimal', /^[0-9]+\.[0-9]*$/, "a decimal number", "", 8];
xcon.types.file = ['file', /^[^/].*?\.[a-zA-Z]{2,4}$/, "a filename", "", 9];
xcon.types.file = ['relative file', /^\/.*?\.[a-zA-Z]{2,4}\??$/, "a relative url file", "", 10];
xcon.types.string = ['string', /^\w+$/, "string data", "i", 11];
xcon.types.undef = ['undefined', /^undefined$/, "undefined JavaScript variable", "i", 12];
xcon.types.ident = ['ident', /^\w+$/, "string identity, similar to mode parameter", "i", 13];
xcon.types.base64 = ['base64', /^[a-zA-Z0-9\+\/]=*$/, "string identity, similar to mode parameter", "i", 14];
xcon.types.comnum = [',num', /^[\d,\| ]+$/, "comma or pipe separated numeric data", "", 15];
xcon.types.comstr = [',str', /^[\w,\| ]+$/, "comma or pipe separated string data", "i", 16];
xcon.types.identstr = [',ident', /^[\w,\| ]+$/, "comma or pipe separated string data", "", 17];
xcon.types.domain = ['domain', /^[\w\.]+?\.[A-Za-z]{2}$/, "a domain name with optional host", "", 18];
xcon.types.url = ['url', /^\b(([\w-]+:\/\/?|www[.])[^\s()<>]+(?:\([\w\d]+\)|([^[:punct:]\s]|\/)))$/, "a domain name with optional host", "is", 19];
xcon.types.negone = ['negative one', /^-1$/, "a domain name with optional host", "", 20];
xcon.types.json = ['json', /^\{.*\}$/, "json encoded data", "", 21];
xcon.types.json = ['mime', /^\w+\/[\w\+\.\-]+$/, "mime type", "i", 22];
xcon.types.json = ['html', /^[<>\w='"\?\&\+\%!@#$%^&\*\(\)]+$/, "html markup", "i", 22];
xcon.types.json = ['unknown', /^.*$/, "unknown", "", 99];
xcon.types.mode = ['MODE', /^(ajax|method|module|mode)$/, "mode parameters tell a url to operate in a particular mode or execute a particular function (edit vs view).  This is common for stateful ajax endpoints.", "i", 100] ;
//xcon.types.vol = ['VOLATILE', /^(token|.*csrf.*)$/, "Instructs HackTab to always read this value from the submit form.  Only the value read from the form is used, useful for CSRF tokens. Doubles the number of requests made.", "i", 101] ;


xcon.test = {}
xcon.test.notvuln = 0;
xcon.test.pass = 1;
xcon.test.timeout = 2;
xcon.test.fail = 3;


xcon.umethods = {"GET":"GET", "POST":"POST"};
xcon.lmethods = {"get":"get", "post":"post"};


xcon.tests = {};
xcon.tests.xss = ["Cross Site Scripting", "2014.08.26", "untested", 0];
xcon.tests.sql = ["SQL Injection", "2014.08.26", "untested", 0];

// form encodings for web and api calls
xcon.content = {};
xcon.content.form = "application/x-www-form-urlencoded";

// response operators, and response types (text on page, etc)
xcon.resp = {};
xcon.resp.type = {};
xcon.resp.op = ["equals", "contains", "greater than", "less than", "not equal", "does not contain"];

// list of plugins to run when looking at response data
xcon.responsewatchers = [];
xcon.activetesters = [];

/**
 * list of response types, and code to handle the tests
 */
// handle string contains responses
xcon.resp.type.onpage = {"id": 1, "name": "text on page", "func": function(xhr, op, value) {
	var log = Logger.getLogger("attack");
	log.debug("test on page", op, value);
	var text = xhr.responseText;
	// complete text on page 
	if (op == 0 || op == "0") {
		if (text == value)
			return true;
		return false;
	}
	// text on page contains
	else if (op == 1 || op == "1") {
		if (text.indexOf(value) > -1)
			return true;
		return false;
	}
	// text on page NOT contains
	else if (op == 5 || op == "5") {
		if (text.indexOf(value) == -1)
			return true;
		return false;
	}

	// return false for unsupported operations
	return false;
}};


// handle string contains responses
xcon.resp.type.header = {"id": 2, "name": "header value", "func": function(xhr, op, value) {
	var log = Logger.getLogger("attack");
	log.debug("test header value", op, value);
	var text = xhr.getAllResponseHeaders();
	// all headers (seems unlikely)
	if (op == 0 || op == "0") {
		if (text == value)
			return true;
		return false;
	}
	// value of 1 header
	else if (op == 1 || op == "1") {
		if (text.indexOf(value) > -1)
			return true;
		return false;
	}
	// headers must not contain
	else if (op == 5 || op == "5") {
		if (text.indexOf(value) == -1)
			return true;
		return false;
	}

	// return false for unsupported operations
	return false;
}};


xcon.resp.type.size = {"id": 3, "name": "response size", "func": function(xhr, op, value) {
	var log = Logger.getLogger("attack");
	log.debug("test response size", op, value);
	var text = xhr.responseText;
	// response size =
	if (op == 0 || op == "0") {
		if (text.length == value)
			return true;
		return false;
	}
	// response size >
	else if (op == 2 || op == "2") {
		if (text.length > value)
			return true;
		return false;
	}
	// response size <
	else if (op == 3 || op == "3") {
		if (text.length < value)
			return true;
		return false;
	}
	// response size !=
	if (op == 4 || op == "4") {
		if (text.length != value)
			return true;
		return false;
	}
	// return false for unsupported operations
	return false;
}};

// response code
xcon.resp.type.status = {"id": 4, "name": "response code", "func": function(xhr, op, value) {
	var log = Logger.getLogger("attack");
	log.debug("test response code", op, xhr);
	var stat = xhr.status;
	// response code =
	if (op == 0 || op == "0") {
		if (stat == value)
			return true;
		return false;
	}
	// response code >
	else if (op == 2 || op == "2") {
		if (stat > value)
			return true;
		return false;
	}
	// response code <
	else if (op == 3 || op == "3") {
		if (stat < value)
			return true;
		return false;
	}
	// response code !=
	if (op == 4 || op == "4") {
		if (stat != value)
			return true;
		return false;
	}
	// return false for unsupported operations
	return false;
}};

// status
xcon.resp.type.json = {"id": 5, "name": "json value", "func": function(xhr, op, value) {
	var log = Logger.getLogger("attack");
	log.debug("test json value", op, value);

	// parse json doc
	var jdoc = false;
	try {
		jdoc = JSON.parse(xhr.responseText);
	} catch (err) {
		return false;
	}

	// key is not in doc
	var parts = value.split("=");
	if (!parts[0] in jdoc) {
		return false;
	}
	// the value is not parsed correctly
	if (!parts.length > 1) {
		return false;
	}

	// value =
	if (op == 0 || op == "0") {
		if (jdoc[parts[0]] == parts[1])
			return true;
		return false;
	}
	// response code >
	else if (op == 2 || op == "2") {
		if (jdoc[parts[0]] > parts[1])
			return true;
		return false;
	}
	// response code <
	else if (op == 3 || op == "3") {
		if (jdoc[parts[0]] < parts[1])
			return true;
		return false;
	}
	// response code !=
	if (op == 4 || op == "4") {
		if (jdoc[parts[0]] != parts[1])
			return true;
		return false;
	}

	// return false for unsupported operations
	return false;
}};


/**
 * logger singleton
 * TODO: might be an easier way, like pre-defining all of the loggers?
 */
var Logger = (function () {

	// Instance stores a reference to the Singleton
	var instance = {};

	function init(name) {
		var config = {
			"cache": 1,
			"intercept": 4,
			"info": 4,
			"attack": 4,
			"xss": 4,
			"net": 1,
			"model": 4,
			"internal": 2,
			"message": 2
		};

		return {
			level: config[name],
			nm: name,

	setLevel: function(lvl) {
		this.level = lvl;
	},
	getLevel: function(lvl) {
		return this.level;
	},
	trace: function () {
		if (this.level > 3) {
			console.log(this.nm + " TRACE ", arguments);
		}
	},
	debug: function () {
		if (this.level > 2) {
			console.log(this.nm + " DEBUG ", arguments);
		}
	},
	warn: function () {
		if (this.level > 1) {
			console.log(this.nm + " WARN ", arguments);
		}
	},
	error: function () {
		if (this.level > 0) {
			console.log(this.nm + " ERROR ", arguments);
		}
	},
		};

	};

	return {
		// Get the Singleton instance if one exists or create one if it doesn't
		getLogger: function (nm) {
			if (!(nm in instance) ) { instance[nm] = init(nm); }
			return instance[nm];
		}
	};

})();





/**
 * TODO: replace with parse_url
 */
function process_url(url) {
	console.log(" @@@ DEPRICATED process_url() ");
	// split up the url to host, path and get parameters
	var re = /^(https?:\/\/[^\/]+)([^?&]*)(.*)$/;
	var matches = re.exec(url);
	var param = "";
	var host = "";
	var path = "";
	if (matches[1]) {
		host = matches[1];
	}
	if (matches[2]) {
		path = matches[2];
	}
	// the get parameter string
	if (matches[3] && typeof matches[3] == "string") {
		param = matches[3].substr(1);
	}

	// pull out the get parameters and decode them
	gparams = {};
	if (matches.length > 2) {
		gparams = get_url_params(matches[3]);
	}

	return {"host":host, "path":path, "gparamstr":param, "gparams":gparams};
}


/**
 * Ripped from Cory LaViska (www.abeautifulsite.net)
 */
function parse_url(url) {
	var parser = document.createElement('a'),
		searchObject = {},
		queries, split, i;
	// Let the browser do the work
	parser.href = url;
	// Convert query string to object
	queries = parser.search.replace(/\?/, '').split('&');
	for( i = 0; i < queries.length; i++ ) {
		split = queries[i].split('=');
		if (split.length > 1) {
			searchObject[split[0]] = split[1];
		} else {
			searchObject[split[0]] = "";
		}
	}
	//return {"host":host, "path":path, "gparamstr":param, "gparams":gparams};
	return {"host":parser.protocol + "//" + parser.host, "path":parser.pathname, "gparamstr":parser.search, "gparams":searchObject};
}

/**
 * take a {} and turn it into key=value&key=value
 * does not include a prefix ?
 */
function param_to_str(data) {
	var pdata = "";
	for (var d in data) {
		pdata += d + "=" + data[d] + "&";
	}

	return pdata.substr(0, pdata.length-1);
}

/**
 * content manipulation, network calls and response diffing
 */
var Content = Content || {};
Content.net = {
	// logger
	log: Logger.getLogger('net'),

	// turn a kvp to a string {foo:bar}  foo=bar
	kvp_to_str: function (data) {
		var pdata = "";
		for (var d in data) {
			pdata += d + "=" + data[d] + "&";
		}

		return pdata.substr(0, pdata.length-1);
	},


	call: function (method, url, callback, data, content_type, callback_options) {
		this.log.debug("webcall()", method, url, content_type, data, callback);

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.openargs.internalRequest = true;
		xmlhttp.withCredentials = true;
		xmlhttp.timeout = 60;
	
		if (callback) {
			xmlhttp.addEventListener("load", function(evt) { callback(evt.target, callback_options); }, false);
			xmlhttp.addEventListener("error", function(evt) { callback(evt.target, callback_options); }, false);
		}

		// handle GET requests
		xmlhttp.open(method, url, true);
		if (method == "GET") {
			xmlhttp.send();
		}
		// handle POST requests
		else {
			if (!content_type) {
				xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
			} else {
				xmlhttp.setRequestHeader("Content-type", content_type);
			}
			xmlhttp.send(this.kvp_to_str(data));
		}
	}
}

/**
 * our diff library
 */
Content.diff = {
string: function diffString( o, n ) {
  o = o.replace(/\s+$/, '');
  n = n.replace(/\s+$/, '');

  var out = this.diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/) );
  var res = {"del":0, "ins":0, "same":0, "dh":"", "ih":""};

  var oSpace = o.match(/\s+/g);
  if (oSpace == null) {
    oSpace = ["\n"];
  } else {
    oSpace.push("\n");
  }
  var nSpace = n.match(/\s+/g);
  if (nSpace == null) {
    nSpace = ["\n"];
  } else {
    nSpace.push("\n");
  }

  if (out.n.length == 0) {
      for (var i = 0; i < out.o.length; i++) {
	  	res.del += out.o[i].length;
		res.dh += "l0["+out.o[i]+"]";
      }
  } else {
    if (out.n[0].text == null) {
      for (n = 0; n < out.o.length && out.o[n].text == null; n++) {
	  	res.del += out.o[n].length;
		res.dh += "n0["+out.o[n]+"]";
      }
    }

    for ( var i = 0; i < out.n.length; i++ ) {
      if (out.n[i].text == null) {
	  	res.ins += out.n[i].length;
		res.ih += "in["+out.n[i]+"]";
      } else {
        var pre = "";
		var ln = 0;

        for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++ ) {
		  //ln += out.o[n].length;
		  res.ins += out.o[n].length;
		  res.ih += "in["+out.o[n]+"]";
		  //pre += out.o[n];
		  //red.
	  	  //res.del += out.o[n].length;
		  //res.dh += "["+out.o[i]+"]";
        }
		//res.same += out.n[i].text + pre;
      }
    }
  }
  
  return res;
  },

  diff: function diff( o, n ) {
  var ns = new Object();
  var os = new Object();
  
  for ( var i = 0; i < n.length; i++ ) {
    if ( ns[ n[i] ] == null )
      ns[ n[i] ] = { rows: new Array(), o: null };
    ns[ n[i] ].rows.push( i );
  }
  
  for ( var i = 0; i < o.length; i++ ) {
    if ( os[ o[i] ] == null )
      os[ o[i] ] = { rows: new Array(), n: null };
    os[ o[i] ].rows.push( i );
  }
  
  for ( var i in ns ) {
    if ( ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1 ) {
      n[ ns[i].rows[0] ] = { text: n[ ns[i].rows[0] ], row: os[i].rows[0] };
      o[ os[i].rows[0] ] = { text: o[ os[i].rows[0] ], row: ns[i].rows[0] };
    }
  }
  
  for ( var i = 0; i < n.length - 1; i++ ) {
    if ( n[i].text != null && n[i+1].text == null && n[i].row + 1 < o.length && o[ n[i].row + 1 ].text == null && 
         n[i+1] == o[ n[i].row + 1 ] ) {
      n[i+1] = { text: n[i+1], row: n[i].row + 1 };
      o[n[i].row+1] = { text: o[n[i].row+1], row: i + 1 };
    }
  }
  
  for ( var i = n.length - 1; i > 0; i-- ) {
    if ( n[i].text != null && n[i-1].text == null && n[i].row > 0 && o[ n[i].row - 1 ].text == null && 
         n[i-1] == o[ n[i].row - 1 ] ) {
      n[i-1] = { text: n[i-1], row: n[i].row - 1 };
      o[n[i].row-1] = { text: o[n[i].row-1], row: i - 1 };
    }
  }
  
  return { o: o, n: n };
}

}



// TODO: callback need a parameter
/**
 * Make a call to the site we are testing
 * You can define GET url parameters and POST parameters by sending the GET parameters 
 * as extensions of the url
 */

/**
 * Change to CSS transitions
 */
function animate(elm, state) {
	var finished = false;
	if (state) {
		if (state.anim > 0) {
			if (state.start + state.anim >= state.target) {
				state.start = state.target;
				finished = true;
			}
		} else {
			if (state.start + state.anim <= state.target) {
				state.start = state.target;
				finished = true;
			}
		}
		// fail safe
		if (state.start > 500 || state.start < 0) {
			finished = true;
		}

		//console.log("start: " + state.start);
		if (state.dir == "height") {
			state.elm.style.height = state.start + "px";
			//console.log("FIN: ", state.elm.style.height);
		} else if (state.dir == "width") {
			state.elm.style.width = state.start + "px";
		}
		xcon.toggle[xcon.toggle.active] = state;
		if (!finished) {
			state.start = state.start + state.anim;
			window.setTimeout(function() {
				animate(elm, state);
			}, state.speed);
		}
	}
}

// TODO: replace with css animation
function drop_toggle(elm, target) {

	if (elm.style.height != target) {
		if (elm.clientHeight < target) {
			xcon.toggle[elm.id] = {"tgl": false, "start": elm.clientHeight, "target": target, "anim": 10, "elm": elm, "dir": "height", "speed": 10};
		} else {
			xcon.toggle[elm.id] = {"tgl": false, "start": elm.clientHeight, "target": target, "anim": -10, "elm": elm, "dir": "height", "speed": 10};
		}

		xcon.toggle.active = elm.id;
		var state = xcon.toggle[elm.id];
		animate(elm, state);
	}
}

/**
 * return an ID of a-zA-Z0-9 * len bytes
 */
function makeid(len)
{
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < len; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

/**
 * helper function for creating elements: 
 * element name, {} of top level attributes (id, className, etc), {} of styles, {} of setAttribute() calls
 */
function create_elm(elm_name, attrs, styles, attributes) {
	var elm = document.createElement(elm_name);
	for(var attr in attrs) {
		elm[attr] = attrs[attr];
	}
	for(var style in styles) {
		elm.style[style] = styles[style];
	}
	for(var attr in attributes) {
		elm.setAttribute(attr, attributes[attr]);
	}
	return elm;
}



function countProperties(obj) {
    var count = 0;
    for(var prop in obj) {
		// skip empty values in the count
		if (prop == "" && obj[prop] == "") { continue; }

		count++;
    }
    return count;
}

function get_type(value) {
	//xcon.types = {};
	//xcon.types.md5 = ['md5', /^[a-f0-9]{32}$/, "MD5 hash", "i"];
	for (var typ in xcon.types) {
		var test = xcon.types[typ];
		//console.log("TEST", value, test[1], test[0]);
		if (value.match(test[1], test[3])) {
		//	console.log("MATCH!");
			test.v = value;
			return test;
		}
	}
	return null;
}

/**
 * escape xml characters for HTML display
 */
function escape(s) {
    var n = s;
    n = n.replace(/&/g, "&amp;");
    n = n.replace(/</g, "&lt;");
    n = n.replace(/>/g, "&gt;");
    n = n.replace(/"/g, "&quot;");

    return n;
}


/**
 * return a string represting the time in the past
 */
function get_time_since(ms) {
	if (ms == undefined || !ms || ms < 2)
		return "never";
	var diff = new Date().getTime();
	diff -= ms;
	diff /= 1000;
	diff = Math.round(diff);
	if (diff < 3) {
		return "just now";
	}
	else if (diff < 60) {
		return Math.round(diff) + " seconds ago";
	}
	else if (diff < 600) {
		return Math.round(diff / 60) + " minutes ago";
	}
	else if (diff < 7200) {
		return Math.round(diff / 7200) + " hours ago";
	}
	return Math.round(diff / 86400) + " days ago";
}


/**
 * the method name, combined_id, param_name, vulnerability type (xss, sqli, etc)
 * status from xcon.test, title string and detailed description
 */
function set_vuln(method, comb_id, param_name, vuln_type, stat, title, detail) {
	var now = new Date().getTime();
	chrome.extension.sendMessage({"type":xcon.upvuln, "complete": true, "method": method, "comb_id":comb_id, "param_name":param_name, "vuln_type":vuln_type, "status":stat, "title": title, "tested":now, "detail":detail});
}

function create_param_info(v) {
	return {"values":[v], "type":get_type(v), "tested":null, "tests":{}, "vuln":{}, "info":{}};
}

/**
 * clone an object
 */
function clone(obj) {
    if(obj == null || typeof(obj) != 'object')
        return obj;

    var temp = obj.constructor(); // changed

    for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
            temp[key] = clone(obj[key]);
        }
    }
    return temp;
}


/**
 * append a unique value to an array (append only if value does not exist)
 */
function append_unique(arr, elm) {
	for (var x=0;x<arr.length;x++) {
		console.log("compare", arr[x], elm);
		if (arr[x] == elm) {
			console.log("EQUAL");
			return;
		}
	}
	console.log("not equal, pushing");
	arr.push(elm);
}
/**
 * helper method for hacktab.js
 */
function append_referer(arr, elm) {
	for (var x=0;x<arr.length;x++) {
		console.log("compare", arr[x], elm);
		if (arr[x].comb_id == elm.comb_id) {
			console.log("EQUAL");
			return;
		}
	}
	console.log("not equal, pushing");
	arr.push(elm);
}



/**
 * called as on click event to remve an element
 */
function delme() { this.parentNode.removeChild(this);	} 

/**
 * node.js unit testing
 */
if ("module" in window) {
module.exports = {
	create_param_info:create_param_info,
	"get_type":get_type,
	"xcon":xcon,
	"Logger":Logger,
	"countProperties":countProperties
};
}

