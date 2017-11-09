/*** require('layout/banner/wisdmbanner.js'); ***/
/*** require('style/wisdmstyle.js'); ***/
/*** require('utils.js'); ***/
/*** require('wisdmjs:/3rdparty/md5/md5.js'); ***/
/*** require('wisdmloginwidget/wisdmloginwidget.js'); ***/

var WISDM=new WISDMManager();

function WISDMManager() {
	var that=this;
	
	this.initializeSession=function() {console.log ('WARNING: initializeSession is no longer used.');};
	this.authenticate=function(params,callback) {_authenticate(params,callback);};
	this.logOut=function(callback) {_logOut(callback);};
	this.currentUser=function() {return m_current_user;};
	this.onCurrentUserChanged=function(callback) {m_user_changed_handlers.push(callback);};
	this.serverRequest=function(req,callback) {_serverRequest(req,callback);};
	this.currentProcessingNodeId=function() {return m_current_processing_node_id;};
	this.setCurrentProcessingNodeId=function(id) {_setCurrentProcessingNodeId(id);};
	this.onProcessingNodeChanged=function(callback) {m_processing_node_changed_handlers.push(callback);};
	this.processingNodeConnected=function() {return m_processing_node_connected;};
	this.updateInfo=function(callback) {_updateInfo(callback);};
	this.getCookieOrStorage=function(c_name,default_val) {return get_cookie_or_storage(c_name,default_val);};
	this.setCookieOrStorage=function(c_name,val) {return set_cookie_or_storage(c_name,val);};
	this.checkAuthentication=function(callback) {get_auth_info(callback);};
	this.setStatusMessage=function(params) {m_status_message_handlers.forEach(function(handler) {handler(params);});};
	this.onStatusMessage=function(handler) {m_status_message_handlers.push(handler);};
	this.trigger=function(name,obj) {_trigger(name,obj);};
	this.bind=function(name,callback) {_bind(name,callback);};
	this.getProcessingWebServerUrl=function(callback) {_getProcessingWebServerUrl(callback);};
	this.onSignal=function(params,callback) {m_signal_handlers.push({params:params,callback:callback});};
	
	var m_current_user='';
	var m_user_changed_handlers=[];
	var m_browser_code='';
	var m_current_processing_node_id='';
	var m_processing_node_changed_handlers=[];
	var m_processing_node_connected=false;
	var m_wisdm_storage_version='1.02'; //when this value changes, user will be prompted to clear local storage and cookies
	var m_wisdm_server_config=null;
	var m_status_message_handlers=[];
	var m_trigger_handlers={};
	var m_session_id='';
	var m_signal_handlers=[];
	
	setTimeout(function() {
		var old_wisdm_storage_version=get_cookie_or_storage('wisdm_storage_version','');
		if ((old_wisdm_storage_version)&&(m_wisdm_storage_version!=old_wisdm_storage_version)) {
			jConfirm('The WISDM storage version has changed. Would you like to clear your local browser storage? This will help free up space, but you will lose any data that is stored in the local storage. Usually this is okay.','Delete local browser storage?',function(tmp) {
				if (tmp) {
					clear_local_storage();
					set_cookie_or_storage('wisdm_storage_version',m_wisdm_storage_version);
				}
			});
		}
		if (!old_wisdm_storage_version) {
			console.log ('setting cookie or storage: wisdm_storage_version',m_wisdm_storage_version);
			set_cookie_or_storage('wisdm_storage_version',m_wisdm_storage_version);
		}
	},1000);
	
	function _authenticate(params,callback) {
		
		var resource=params.resource||'wisdm';
		if (resource=='wisdm') {
			get_auth_info(function(info) {
				if (!that.currentUser()) {
					do_authenticate(params,callback);
				}
				else if ( ((params.user)&&(params.user!=that.currentUser())) || (params.force_login) ) {
					do_authenticate(params,callback);
				}
				else {
					callback({success:true});
				}
			});
			
			function do_authenticate(params,callback2) {
				
				var X=new WisdmLoginWidget();
				X.setMessage(params.message||'');
				X.setTitle('Log on to WISDM');
				X.showDialog({});
				X.onOkay(function() {
					callback2({success:true});
				});
				X.onCancel(function() {
					callback2({success:false,error:'Login cancelled by user'});
				});
				
				/*
				var user=params.user||'';
				var password=params.password||'';
				if ((!user)||(!password)) {
					
					var msg=(params.message||'')+'<br>';
					msg+='<center>Log on to WISDM using<br><a href="#">a Google account</a>,<br> <a href="#">a Github account</a>,<br> or your WISDM login:<br></center>';					
					jLogin(msg,user,password,'Log in to WISDM',function(tmp1) {
						if (tmp1) {
							var params2=$.extend(true,{},params,{user:tmp1[0],password:tmp1[1]});
							do_authenticate_step2(params2,callback2);
						}
					});
				}
				else do_authenticate_step2(params,callback2);
					
				function do_authenticate_step2(params,callback3) {
					var req0={
						service:'authentication',
						command:'authenticate',
						user:params.user||'',
						password:params.password||'',
						resource:'wisdm'
					};
					that.serverRequest(req0,function(tmp) {
						if (tmp.success) {
							set_browser_code(tmp.browser_code);
							callback3({success:true});
							get_auth_info();
						}
						else {
							callback3(tmp);
							get_auth_info();
						}
					});
				}
				*/
			}
		}
		else if (resource=='github') {
			authenticate_github(params,callback);
		}
		else if (resource=='google') {
			authenticate_google(params,callback);
		}
		else {
			callback({success:false,error:'Unknown resource: '+resource});
		}
	}
	function _logOut(callback) {
		//in future we should send a request to close the session
		set_browser_code('logged_out');
		get_auth_info(callback);
	}
	function _bind(name,handler) {
		if (!(name in m_trigger_handlers)) {
			m_trigger_handlers[name]=[];
		}
		m_trigger_handlers[name].push(handler);
	}
	function _trigger(name,obj) {
		if (name in m_trigger_handlers) {
			m_trigger_handlers[name].forEach(function(handler) {
				handler(obj);
			});
		}
	}
	function get_auth_info(callback) {
		var req0={
			service:'authentication',
			command:'getAuthInfo'
		};
		that.serverRequest(req0,function(tmp1) {
			if (tmp1.success) {
				var user0='';
				user0=tmp1.user_id;
				//handle github authentication, etc
				set_current_user(user0);
			}
			else {
				set_current_user('');
			}
			if (callback) callback(tmp1);
		});
	}
	var m_get_auth_info_scheduled=false;
	function periodic_get_auth_info() {
		get_auth_info(function() {
			if (!m_get_auth_info_scheduled) {
				m_get_auth_info_scheduled=true;
				setTimeout(function() {
					m_get_auth_info_scheduled=false;
					periodic_get_auth_info();
				},20000);
			}
		});
	}
	setTimeout(periodic_get_auth_info,1000);
	
	function check_processing_node_connected(callback)  {
		var req0={
			service:'processing',
			command:'checkNodeConnected',
			processing_node_id:m_current_processing_node_id
		};
		that.serverRequest(req0,function(tmp) {
			var connected=false;
			if (tmp.success) connected=true;
			if (connected!=m_processing_node_connected) {
				m_processing_node_connected=connected;
				for (var i=0; i<m_processing_node_changed_handlers.length; i++) {
					m_processing_node_changed_handlers[i]();
				}
			}
			if (callback) callback();
		});
	}
	var m_check_processing_node_connected_scheduled=false;
	function periodic_check_processing_node_connected() {
		check_processing_node_connected(function() {
			if (!m_check_processing_node_connected_scheduled) {
				m_check_processing_node_connected_scheduled=true;
				setTimeout(function() {
					m_check_processing_node_connected_scheduled=false;
					periodic_check_processing_node_connected();
				},20000);
			}
		});
	}
	periodic_check_processing_node_connected();
	
	function _updateInfo(callback) {
		get_auth_info(function() {
			check_processing_node_connected(function() {
				if (callback) callback();
			});
		});
	}
	
	
	function authenticate_github(params,callback) {
		var code=params.code||'';
		if (!code) {
			callback({success:false,error:'code is empty'});
			return;
		}
		
		var req0={
			service:'authentication',
			command:'authenticate',
			code:code,
			resource:'github'
		};
		that.serverRequest(req0,function(tmp) {
			if (tmp.success) {
				set_browser_code(tmp.browser_code);
				callback({success:true});
				get_auth_info();
			}
			else {
				callback(tmp);
				get_auth_info();
			}
		});
		
	}
	function authenticate_google(params,callback) {
		var code=params.code||'';
		if (!code) {
			callback({success:false,error:'code is empty'});
			return;
		}
		
		var req0={
			service:'authentication',
			command:'authenticate',
			code:code,
			resource:'google'
		};
		that.serverRequest(req0,function(tmp) {
			if (tmp.success) {
				set_browser_code(tmp.browser_code);
				callback({success:true});
				get_auth_info();
			}
			else {
				callback(tmp);
				get_auth_info();
			}
		});
	}
	function get_wisdm_server_config(callback) {
		if (m_wisdm_server_config) {
			callback(m_wisdm_server_config);
			return;
		}
		that.serverRequest({service:'config',command:'getConfig'},function(tmp) {
			if (!tmp.success) {
				console.error('Problem getting server config: '+tmp.error);
				callback(tmp);
				return;
			}
			m_wisdm_server_config=tmp;
			callback(tmp);
		});
	}
	function _getProcessingWebServerUrl(callback) {
		get_wisdm_server_config(function() {
			var url=m_wisdm_server_config.processingwebserver_url;
			callback(url);
		});
	}
	
	function run_server_request_locally(req,callback) {
		if ((req.service=='processing')&&(req.command=='submitScript')) {
			var scripts=req.dependency_scripts||req.scripts;
			var run_params=req.run_parameters||{};
			var script0='';
			for (var key in scripts) {
				script0+=scripts[key]+'\n';
			}
			script0+='run(JSON.parse(\''+JSON.stringify(run_params)+'\'));';
			var old_console=console.log;
			var output='';
			function stringify(X) {
				if (typeof(X)=='string') return X;
				if (typeof(X)=='number') return String(X);
				return JSON.stringify(X);
			}
			console.log=function(A,B,C,D) {
				if (A) output+=stringify(A)+'\n';
				if (B) output+=stringify(B)+'\n';
				if (C) output+=stringify(C)+'\n';
				if (D) output+=stringify(D)+'\n';
			};
			var results={};
			try {
				results=eval(script0);
			}
			catch(err) {
				output+='ERROR==============\n';
				output+=err.message;
				output+=err.stack;
			}
			console.log=old_console;
			callback({success:true,results:results,output:output});
		}
		else {
			callback({success:false,error:'Unable to run server request locally.'});
		}
	}
	
	function _serverRequest(req,callback) {
		
		if (req.run_locally) {
			run_server_request_locally(req,callback);
			return;
		}
		
		var url='http://'+location.host+'/wisdmserver';
		req.browser_code=get_browser_code();
		
		if (req.service=='processing') {
			get_wisdm_server_config(function() {
				url=m_wisdm_server_config.processingwebserver_url+'/processingwebserver';
				do_post_request();
			});
		}
		else if (req.service=='temporaryfileserver') {
			get_wisdm_server_config(function() {
				url=m_wisdm_server_config.processingwebserver_url+'/processingwebserver';
				do_post_request();
			});
		}
		else {
			do_post_request();
		}
			
		function do_post_request() {
			$.post(url,JSON.stringify(req),function(tmp) {
				if (!tmp.success) {
					if (tmp.authorization_error) {
						if (!(req.do_not_prompt_login)) {
							that.authenticate({user:'',force_login:true,message:tmp.error},function(tmp2) {
								if (tmp2.success) {
									_serverRequest(req,callback);
								}
								else if (callback) callback(tmp);
							});
						}
						else {
							callback({success:false,error:tmp.error});
						}
					}
					else if (callback) callback(tmp);
				}
				else {
					finalize_on_success(tmp);
				}
			});
		}
		function finalize_on_success(tmp) {
			if ('data_base64_url' in tmp) {
				$.get(tmp.data_base64_url,function(txt0) {
					tmp.data_base64=txt0;
					if (callback) callback(tmp);
				});
			}
			else {
				if (callback) callback(tmp);
			}
		}
	}
	function set_current_user(user) {
		if (user==m_current_user) return;
		m_current_user=user||'';
		for (var i=0; i<m_user_changed_handlers.length; i++) {
			m_user_changed_handlers[i]();
		}
	}
	
	function _setCurrentProcessingNodeId(id) {
		if (m_current_processing_node_id==id) return;
		m_current_processing_node_id=id;
		m_processing_node_connected=false;
		for (var i=0; i<m_processing_node_changed_handlers.length; i++) {
			m_processing_node_changed_handlers[i]();
		}
		initialize_session();
		setTimeout(function() {
			check_processing_node_connected();
		},500);
	}
	function initialize_session() {
		if (!m_session_id) m_session_id=utils.make_random_id(10);
		var req0={
			service:'processing',
			command:'setSessionParameters',
			session_id:m_session_id,
			parameters:{
				processing_node_id:m_current_processing_node_id
			}
		};
		WISDM.serverRequest(req0,function(tmp0) {
			if (!tmp0.success) {
				console.error('Problem in setSessionParameters: '+tmp0.error);
			}
		});
	}
	
	var last_get_signals_timestamp=null;
	function do_get_signals() {
		return; //don't get session signals because it could be blocking
		if (last_get_signals_timestamp) {
			var elapsed=(new Date())-last_get_signals_timestamp;
			if (elapsed<20000) {
				return;
			}
		}
		if (m_session_id) {
			var req0={
				service:'processing',
				command:'getSessionSignals',
				session_id:m_session_id
			};
			last_get_signals_timestamp=new Date();
			WISDM.serverRequest(req0,function(tmp0) {
				if (tmp0.success) {
					last_get_signals_timestamp=null;
					tmp0.signals.forEach(function(signal) {
						on_signal(signal);
					});
					do_get_signals();
				}
				else {
					console.error('Problem in getSessionSignals: '+tmp0.error);
					if (tmp0.error.indexOf('not found')>=0) { //note: we should not use the error message text here
						m_session_id='';
						initialize_session();
					}
					last_get_signals_timestamp=null;
				}
			});
		}
	}
	function on_signal(signal) {
		m_signal_handlers.forEach(function(H) {
			if (H.params.signal_name==signal.signal_name) {
				H.callback(signal);
			}
		});
	}
	
	function periodic_get_signals() {
		return; //don't get session signals because it could be blocking
		do_get_signals();
		setTimeout(periodic_get_signals,5000);
	}
	setTimeout(periodic_get_signals,5000);
	
	function get_browser_code() {
		return get_cookie_or_storage('browser_code','');
	}
	function set_browser_code(code) {
		set_cookie_or_storage('browser_code',code);
	}
	var m_has_local_storage=(function() {
		try {
			localStorage.setItem('test','test');
			localStorage.removeItem('test');
			return true;
		} catch(e) {
			return false;
		}
	}());
	function get_cookie_or_storage(c_name,default_val) {
		if (m_has_local_storage) {
			return localStorage[c_name]||default_val;
		}
		else {
			var i,x,y,ARRcookies=document.cookie.split(";");
			for (i=0;i<ARRcookies.length;i++) {
				x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
				y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
				x=x.replace(/^\s+|\s+$/g,"");
				if (x==c_name) {
					return unescape(y);
				}
			}
			return default_val;
		}
	}
	
	function set_cookie_or_storage(c_name,val) {
		if (m_has_local_storage) {
			localStorage[c_name]=val;
		}
		else {
			var exdays=1;
			var exdate=new Date();
			exdate.setDate(exdate.getDate() + exdays);
			var c_value=escape(val) + ((exdays===null) ? "" : ";path=/;expires="+exdate.toUTCString());
			document.cookie=c_name + "=" + c_value;
		}
	}
	
	function clear_local_storage() {
		try {
			if (m_has_local_storage) {
				localStorage.clear();
			}
		}
		catch(err) {
			console.error('Error while clearing local storage',err);
		}
	}
}

//retrieve a query parameter from the url
WISDM.queryParameter=function(name,defaultval) {
	var url=window.location.href;
	var ind1=url.indexOf('?');
	var ind2=url.indexOf('#');
	var ind0=ind1;
	if ((ind2>=0)&&((ind1<0)||(ind2<ind1))) ind0=ind2;
	
	var val=null;
	if (ind0>=0) {
		var query='?'+url.slice(ind0+1);
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regexS = "[\\?&]" + name + "=([^&#]*)";
		var regex = new RegExp(regexS);
		var results = regex.exec(query);
		if (results) val=decodeURIComponent(results[1].replace(/\+/g, " "));
	}
	if (typeof(defaultval)=='undefined') defaultval='';
	if (!val) val=defaultval;
	
	return val;
};

