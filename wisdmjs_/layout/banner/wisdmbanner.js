
///SIMPLEST USAGE ///////////////////////////////
//initializeWisdmBanner({content:$('#content')});
/////////////////////////////////////////////////

/*** require('banner.js'); ***/
/*** require('background.js'); ***/
/*** require('wisdmjs:/3rdparty/normalize/normalize.css'); ***/
/*** require('wisdmjs:/3rdparty/contextpopup/contextpopup.js'); ***/
/*** require('actiontoolbar.js'); ***/

function initializeWisdmBanner(options) {
	var X=new WisdmBanner();
	X.initialize(options);
	return X;
}

function WisdmBanner() {
	var that=this;
	
	this.initialize=function(params) {_initialize(params);};
	this.addAction=function(name,action) {_addAction(name,action);};
	this.setMenu=function(name,action_toolbar) {_setMenu(name,action_toolbar);};
	
	var m_div=$('<div></div>');
	var m_background_div=$('<div></div>');
	var m_params={};
	var m_default_status_message='';
	var m_status_message='';
	var m_status_message_timeout=0;
	var m_status_message_timer=new Date();
	var m_actions={};
	
	function _initialize(params) {
		m_params=$.extend(true,{},{content:null,onChangeNode:null,background:true,style:'light',query_params:[],allow_login:true,overflow:'hidden'},params);
		
		if (m_params.content) {
			m_params.content.css({
				position:'absolute',
				left:0,right:0,
				top:35,bottom:15,
				overflow:m_params.overflow
			});
		}
		
		if (m_params.style=='dark') {
			$('body').css({'background-color':'rgb(80,80,80)',color:'rgb(230,255,230)'});
			if (m_params.content) m_params.content.addClass('wisdm-dark');
		}
		else if (m_params.style=='light') $('body').css({'background-color':'rgb(255,255,255)'});
		
		if (m_params.background) {
			$('body').append(m_background_div);
			m_background_div.WisdmBackground({style:m_params.style});
		}
		
		var div0=$('<div></div>');
		$('body').append(m_div);
		m_div.WisdmBanner({},function() {
			
			//HOME
			m_div.find('#home').click(function(evt) {
				//window.location='$approot$/../../wisdmdemo/wisdmdemo.html?node='+Wisdm .sessionNode;
				//window.location='../../apps/wisdmmap/#map=Welcome to WISDM&owner=magland';
				window.location.href='http://wisdmhub.org';
				//window.location.reload(true);
				
			});
			
			//TERMINAL
			/*
			var open_terminal=function(target) {				
				//window.open('$approot$/../../wisdmterminal/wisdmterminal.html?node='+Wisdm .sessionNode,target);
				window.open('../../apps/terminal/?node='+Wisdm .sessionNode,target);
			};
			m_div.find('#terminal').click(function() {
				open_terminal('_self');
			});
			m_div.find('#terminal').contextPopup({
				items: [
					{label:'Open terminal in new tab',action:function() {open_terminal('_blank');} }
				]
			});
			*/
			
			if (!m_params.allow_login) m_div.find('#menuright').hide();
		});
		WISDM.onCurrentUserChanged(function() {
			update_footer();
		});
		WISDM.onProcessingNodeChanged(function() {
			update_footer();
		});
		WISDM.onStatusMessage(function(params) {
			if (params.message) {
				m_status_message=params.message||'';
				m_status_message_timeout=params.timeout||0;
				m_status_message_timer=new Date();
				update_footer();
			}
			else if (params.default_message) {
				m_default_status_message=params.default_message||'';
				update_footer();
			}
		});
		m_div.bind('loginrequest', function(e,logindata){
			//logindata is in the format {user: xxxx, password: xxxx} so it can be directly sent to Wisdm for a login attempt
			
			//m_div.trigger('login',logindata);
			WISDM.authenticate({user:logindata.user,password:logindata.password},function(tmp2) {
			});
		});
		m_div.bind('logoutrequest',function(e,obj) {
			WISDM.logOut(function(tmp2) {
			});
		});
		m_div.bind('loginasrequest',function(e,obj) {
			WISDM.authenticate({force_login:true},function(tmp2) {
			});
		});
		update_footer();
	}
	
	function _addAction(name,action) {
		var link0=$('<a class="outlined" href="javascript:;">'+action.label+'</a>');
		m_div.find('#menuleft').append(link0);
		link0.click(function() {
			if (action.action_toolbar) {
				//okay the -15 and the +20 are hacks!
				action.action_toolbar.popup(link0.position().left-15,link0.position().top+link0.height()+20);
			}
		});
		action.elmt=link0;
		m_actions[name]=action;
	}
	function _setMenu(name,action_toolbar) {
		var A=m_actions[name];
		if (!A) {return;}
		
		action_toolbar.setRemoveOnClose(false); //to prevent the click events from disappearing
		A.action_toolbar=action_toolbar;
	}
	
	var m_processing_summary={};
	function get_processing_summary_text() {
		if ((!m_processing_summary)||(!m_processing_summary.total_process_counts)) return '';
		
		var ret='Processes: ';
		var tmp=m_processing_summary.total_process_counts;
		if (tmp.pending) ret+=tmp.pending+' pending; ';
		if (tmp.queued) ret+=tmp.queued+' queued; ';
		if (tmp.running) ret+=tmp.running+' running; ';
		if (tmp.finished) ret+=tmp.finished+' finished; ';
		if (tmp.error) {
			ret+='<span style="color:rgb(255,200,200)">'
			if (tmp.error==1) ret+=tmp.error+' error; ';
			else ret+=tmp.error+' errors; ';
			ret+='</span>';
		}
		
		return ret;
	}
	
	WISDM.onSignal({signal_name:'processes_handled'},check_processing);
	WISDM.onProcessingNodeChanged(check_processing);
	setTimeout(check_processing,1000);
	
	function check_processing() {
		if (WISDM.processingNodeConnected()) {
			var req0={
				processing_node_id:WISDM.currentProcessingNodeId(),
				service:'processing',
				command:'getProcessingSummary',
				mode:'mode1'
			};
			WISDM.serverRequest(req0,function(tmp) {
				if (tmp.success) {
					m_processing_summary=$.extend(true,{},tmp);
					update_footer();
				}
				else {
					console.error('Problem in getProcessingSummary: '+tmp.error);
					m_processing_summary={};
					update_footer();
				}
			});
		}
		else {
			m_processing_summary={};
			update_footer();
		}
	}
	
	/*
	function periodic_processing_check() {
		if (WISDM.processingNodeConnected()) {
			var req0={
				processing_node_id:WISDM.currentProcessingNodeId(),
				service:'processing',
				command:'getProcessingSummary',
				mode:'mode1'
			};
			try {
				WISDM.serverRequest(req0,function(tmp) {
					if (tmp.success) {
						m_processing_summary=$.extend(true,{},tmp);
						update_footer();
						setTimeout(periodic_processing_check,30000);
					}
					else {
						console.error('Problem in getProcessingSummary: '+tmp.error);
						m_processing_summary={};
						update_footer();
						setTimeout(periodic_processing_check,30000);
					}
				});
			}
			catch(err) {
				console.error(err);
				setTimeout(periodic_processing_check,30000);
			}
		}
		else {
			m_processing_summary={};
			update_footer();
			setTimeout(periodic_processing_check,30000);
		}
	}
	periodic_processing_check();
	*/
	
	var m_last_check_due_to_hover=new Date();
	function update_footer() {
		var X0=m_div.find('.wisdmbanner_footer');
		var txt='';
		if (WISDM.currentUser()) {
			txt+='&nbsp;User: <span class=green>'+WISDM.currentUser()+'</span> ';
		}
		if (WISDM.currentProcessingNodeId()) {
			if (WISDM.processingNodeConnected()) {
				txt+='Processing node: <a id=select_node><span class=green>'+WISDM.currentProcessingNodeId()+'</span></a> ';
				if (m_processing_summary) {
					txt+=get_processing_summary_text();
				}
			}
			else {
				txt+='Processing node: <a id=select_node><span class=red>'+WISDM.currentProcessingNodeId()+' - not connected</span></a> ';
			}
		}
		else {
			txt+='<a id=select_node>Select processing node</a>';
		}
		X0.html(txt);
		var SS=X0.find('#select_node');
		SS.hover(function() {
			var elapsed=((new Date())-m_last_check_due_to_hover);
			if (elapsed>5000) {
				WISDM.updateInfo();
				m_last_check_due_to_hover=new Date();
			}
		});
		SS.click(on_select_node);
		var Y0=m_div.find('.wisdmbanner_status');
		Y0.html(m_status_message||m_default_status_message);
	}
	
	function periodical_check_status_message() {
		if (m_status_message_timeout) {
			var elapsed=(new Date())-m_status_message_timer;
			if (elapsed>m_status_message_timeout) {
				m_status_message='';
				m_status_message_timeout=0;
				update_footer();
			}
		}
		setTimeout(periodical_check_status_message,1000);
	}
	periodical_check_status_message();
	
	function on_select_node() {
		WISDM.trigger('on-select-node');
	}
}

