//this is a test change

/*** require('wisdmjs:/wisdm.js'); ***/

function WisdmLoginWidget(config) {
	var that=this;
	
	if (!config) config={};
	
	this.div=function() {return m_div;};
	this.setMessage=function(message) {m_message=message;};
	this.setTitle=function(title) {m_title=title;};
	this.showDialog=function(params) {_showDialog(params);};
	this.onOkay=function(callback) {m_div.bind('on-okay',function() {callback();});};
	this.onCancel=function(callback) {m_div.bind('on-cancel',function() {callback();});};
	
	var m_div=templateHtml('.wisdmloginwidget');
	var m_dialog_mode=false;
	var m_message='';
	var m_title='';
	
	m_div.find('#use_google').click(on_use_google);
	m_div.find('#use_github').click(on_use_github);
	m_div.find('.okay_button').click(on_okay);
	m_div.find('.cancel_button').click(on_cancel);
	
	m_div.find('input').keypress(function(e) {
		if (e.which == 13) {
			on_okay();
			e.preventDefault();
		}
	});
	
	m_div.find('#wisdmlogin_authenticating').hide();
	
	var _showDialog=function(params) {
		
		m_div.find('#message').html(m_message);
		
		if (!params) params={};
		m_dialog=$('<div></div>');
		m_dialog.css({overflow:'auto'});
		m_dialog.append(m_div);
		$('body').append(m_dialog);
		m_dialog.dialog({
			width:params.width||260,
			//height:params.height||220,
			modal:params.modal||false,
			resize:function() {},
			title:m_title
		});
		m_dialog.parent().addClass('wisdmloginwidget_dialog');
		m_dialog_mode=true;
		
		WISDM.checkAuthentication(function() {
			if ((!config.user)&&((WISDM.currentUser()||'').indexOf('@')<0))
				config.user=WISDM.currentUser();
			var user0=m_dialog.find('#wisdmlogin_user');
			var password0=m_dialog.find('#wisdmlogin_password');
			if (config.user) {
				user0.val(config.user);
				password0.focus();
				if (config.password) {
					password0.select();
				}
			}
			else {
				user0.focus();
			}
			
		},10);
	};
	
	var auth_url='http://'+window.location.host+'/dev2/apps/wisdmauth/';
	function on_use_google() {
		m_div.find('#wisdmlogin_authenticating').show();
		m_div.find('#wisdmlogin_choices').hide();
		m_div.find('#wisdmlogin_message').html('Authenticating with google...');
		
		window.open(auth_url+'?mode=step1&resource=google','_blank');
		localStorage.wisdm_authentication_complete='false';
		wait_for_authentication_complete();
	}
	function on_use_github() {
		m_div.find('#wisdmlogin_authenticating').show();
		m_div.find('#wisdmlogin_choices').hide();
		m_div.find('#wisdmlogin_message').html('Authenticating with github...');
		
		window.open(auth_url+'?mode=step1&resource=github','_blank');
		localStorage.wisdm_authentication_complete='false';
		wait_for_authentication_complete();
	}
	
	function on_cancel() {
		m_dialog.dialog('close');
		m_div.trigger('on-cancel');
	}
	function on_okay() {
		var user0=m_dialog.find('#wisdmlogin_user').focus();
		var password0=m_dialog.find('#wisdmlogin_password').focus();
		var req0={
			service:'authentication',
			command:'authenticate',
			user:user0.val(),
			password:password0.val(),
			resource:'wisdm'
		};
		WISDM.serverRequest(req0,function(tmp) {
			if (tmp.success) {
				localStorage.browser_code=tmp.browser_code;
				WISDM.checkAuthentication();
				m_dialog.dialog('close');
				m_div.trigger('on-okay');
			}
			else {
				setTimeout(function() {
					jAlert(tmp.error);
				},1000);
			}
		});
	}
	
	var check_complete_scheduled=false;
	function wait_for_authentication_complete() {
		schedule_check_complete();
		function schedule_check_complete() {
			if (check_complete_scheduled) {
				return;
			}
			check_complete_scheduled=true;
			setTimeout(function() {
				check_complete_scheduled=false;
				do_check_complete();
				if (m_dialog.is(":visible")) {
					schedule_check_complete();
				}
			},500);
		}
		function do_check_complete() {
			if (localStorage.wisdm_authentication_complete=='true') {
				m_dialog.dialog('close');
				WISDM.checkAuthentication();
				m_div.trigger('on-okay');
			}
		}
		
	}
	
}
