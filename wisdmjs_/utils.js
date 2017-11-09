//This file should not use jQuery or any other dependencies -- i.e. pure javascript

window.utils={};

function makeRandomId(numchars) {
	console.error('WARNING: use utils.make_random_id instead of makeRandomId!');
	return utils.make_random_id();
}

utils.make_random_id=function(numchars) {
	if (!numchars) numchars=10;
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for( var i=0; i < numchars; i++ ) text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
};

utils.parse_ini_text=function(txt) {
	var ret={};
	var lines=txt.split('\n');
	for (var ii=0; ii<lines.length; ii++) {
		var ind0=lines[ii].indexOf('=');
		if (ind0>0) {
			ret[lines[ii].substr(0,ind0)]=lines[ii].substr(ind0+1);
		}
	}
	return ret;
};
utils.append_paths=function(path1,path2,path3,path4,path5) {
	var paths_list=[path1,path2,path3,path4,path5];
	var ret='';
	for (var ii=0; ii<paths_list.length; ii++) {
		if ((paths_list[ii])&&(paths_list[ii]!=='')) {
			if (ret!=='') ret+='/';
			ret+=paths_list[ii];
		}
	}
	return ret;
};
utils.get_file_suffix=function(str) {
	if (!str) return '';
	var ind=str.lastIndexOf('.');
	if (ind>=0) return str.substr(ind+1);
	else return '';
};
utils.get_file_name=function(str) {
	if (!str) return '';
	var ind=str.lastIndexOf('/');
	if (ind>=0) return str.substr(ind+1);
	else return str;
};
utils.get_file_name_without_suffix=function(str) {
	if (!str) return '';
	var ret=str;
	var ind=ret.lastIndexOf('/');
	if (ind>=0) ret=ret.substr(ind+1);
	var ind2=ret.lastIndexOf('.');
	if (ind2>=0) ret=ret.substr(0,ind2);
	return ret;
};
utils.get_file_path=function(str) {
	if (!str) return '';
	var ind=str.lastIndexOf('/');
	if (ind>=0) return str.substr(0,ind);
	else return '';
};

utils.replace_all=function(str,substr1,substr2) {
	return str.split(substr1).join(substr2);
};
utils.pseudorandseed=0;
utils.pseudorandindex=0;
utils.pseudorand=function() {
	utils.pseudorandindex++;
	return Number('0.'+Math.sin(utils.pseudorandindex+utils.pseudorandseed).toString().substr(6));
};
utils.parse_json=function(jsontxt) {
	try {
		var ret=eval('_aaaa='+jsontxt);
		return ret;
	}
	catch(err) {
		return {};
	}
};
utils.for_each_async=function(list,func,callback,max_simultaneous) {
	var ind=0;
	var num_running=0;
	var did_callback=false;
	do_next();
	function do_next() {
		if (ind==list.length) {
			if (!did_callback) {
				did_callback=true;
				callback({success:true});
				return;
			}
		}
		if (num_running>=max_simultaneous) return;
		ind++;
		num_running++;
		func(list[ind-1],function(tmp) {
			num_running--;
			if (tmp.success) do_next();
			else {
				if (!did_callback) {
					callback(tmp); did_callback=true;
				}
			}
		});
	}
};
