function ScriptOutputHandler() {
	var that=this;
	
	this.setOutputWindow=function(window) {_setOutputWindow(window);};
	this.setProcessingNodeId=function(id) {m_processing_node_id=id;};
	this.setScriptId=function(id) {m_script_id=id;};
	this.setScriptOutput=function(output) {m_script_output=output;};
	this.setSubmittedProcesses=function(list) {m_submitted_processes=list;};
	this.initialize=function() {_initialize();};
	this.onWisdmView=function(handler) {m_on_wisdm_view_handlers.push(handler);};
	this.onProcessingComplete=function(handler) {m_on_processing_complete_handlers.push(handler);};
	this.hasErrors=function() {return _hasErrors();};
	
	var m_output_window=null;
	var m_processing_node_id='';
	var m_script_id='';
	var m_script_output='';
	var m_submitted_processes=[];
	var m_cleared=false;
	var m_on_wisdm_view_handlers=[];
	var m_status_counts={pending:0,queued:0,running:0,finished:0,error:0};
	var m_instance_code=utils.make_random_id(10);
	var m_on_processing_complete_handlers=[];
	var m_process_output_widgets=[];
	var m_processing_complete=false;
	
	WISDM.onSignal({signal_name:'processes_handled'},function() {update_statuses();});
	setTimeout(function() {update_statuses();},10); //first check should be immediate
	
	function _setOutputWindow(window) {
		window.scriptOutputHandler_code=m_instance_code; //in order to stop checking the status once reassigned
		m_output_window=window;
	}
	function _initialize() {
		if (!m_output_window) return;
		
		m_output_window.clearContent();
		m_output_window.onContentCleared(function() {m_cleared=true;});
		
		var holder=$('<span class=script_output></span>');
		holder.append('<h4>Script output:</h4>');
		var lines=(m_script_output||'').split('\n');
		lines.forEach(function(line) {
			if (line.indexOf('WISDM_VIEW:')===0) {
				var json=line.slice(('WISDM_VIEW:').length).trim();
				var obj=null;
				try {
					obj=JSON.parse(json);
				}
				catch(err) {
					obj=null;
				}
				if (obj) {
					var params=obj.params||{};
					var tmp=$('<a href="javascript:;" class=wisdm_view>'+(params.title||'undef')+'</a>');
					tmp.attr('data-wisdm-view',JSON.stringify(obj));
					var p0=$('<p></p>');
					p0.append(tmp);
					holder.append(p0);
				}
				else {
					holder.append($('<p><span style="color:red">[ERROR PARSING WISDM_VIEW]</span></p>'));
				}
			}
			else if (line.indexOf('WISDM_RESULT:')===0) {
				var ind1=line.indexOf(':');
				var ind2=line.indexOf(':',ind1+1);
				var name0=null;
				var result0=null;
				if ((ind1>=0)&&(ind2>=0)) {
					try {
						name0=line.slice(ind1+1,ind2);
						result0=JSON.parse(line.slice(ind2+1));
					}
					catch(err) {
						console.error('Error parsing result',line,ind2,line.slice(ind2+1));
						result0=null;
					}
				}
				else {
					console.error('Error in result line',line);
				}
				if (result0) {
					var tmp=$('<a href="javascript:;" class=wisdm_result>RESULT: '+name0+'</a>');
					tmp.data('result',result0);
					var p0=$('<p></p>');
					p0.append(tmp);
					holder.append(p0);
				}
				else {
					holder.append($('<p><span style="color:red">[ERROR PARSING WISDM_RESULT]</span></p>'));
					console.log('Error parsing wisdm result: ',line);
				}
			}
			else {
				holder.append($('<p>'+line+'</p>'));
			}
		});
		m_output_window.appendContent(holder);
		holder.find('.wisdm_view').click(function() {
			var obj;
			try {
				obj=JSON.parse($(this).attr('data-wisdm-view'));
			}
			catch(err) {
				console.error(err);
				return;
			}
			m_on_wisdm_view_handlers.forEach(function(handler) {
				handler(obj);
			});
		});
		holder.find('.wisdm_result').click(function() {
			console.log($(this).data('result'));
		});
		
		m_process_output_widgets=[];
		m_submitted_processes.forEach(function(PP) {
			var W=new ProcessOutputWidget();
			W.setProcessingNodeId(m_processing_node_id);
			W.setProcessId(PP.process_id);
			W.setProcessorName(PP.processor_name);
			W.setExpandOnCompleted(m_submitted_processes.length<=10);
			m_output_window.appendContent(W.div());
			W.refresh();
			if (PP.previous_status) {
				W.setStatus(PP.previous_status);
				W.setSubmittedPreviously(true);
			}
			m_process_output_widgets.push(W);
		});
		
		m_output_window.appendContent('<h3><span id=processing_message>Processing ...</span></h3>');
	}
	
	
	function update_statuses(callback) {
		if (!check_current()) return;
		
		var process_ids_to_check=[];
		var output_widgets_by_id={};
		m_process_output_widgets.forEach(function(W) {
			if ((W.status()!='finished')&&(W.status()!='error')) {
				process_ids_to_check.push(W.processId());
			}
			output_widgets_by_id[W.processId()]=W;
		});
		if (process_ids_to_check.length>0) {
			var req0={
				service:'processing',
				processing_node_id:m_processing_node_id,
				command:'find',
				collection:'processes',
				query:{_id:{$in:process_ids_to_check}},
				fields:{_id:1,status:1,error:1}
			};
			WISDM.serverRequest(req0,function(tmp) {
				if (!tmp.success) {
					console.error('Problem finding processes: '+tmp.error);
					if (callback) callback({success:false});
					return;
				}
				else {
					step2(tmp.docs);
				}
			});
		}
		else step2([]);
		
		function step2(docs) {
			if (!check_current()) return;
			docs.forEach(function(doc) {
				if (doc._id in output_widgets_by_id) {
					var W=output_widgets_by_id[doc._id];
					W.setStatus(doc.status);
					W.setError(doc.error);
				}
				else {
					console.error('Unexpected problem (136): '+doc._id);
				}
			});
			for (var status in m_status_counts) m_status_counts[status]=0;
			var num_incomplete=0;
			m_process_output_widgets.forEach(function(W) {
				if ((W.status()!='finished')&&(W.status()!='error')) {
					num_incomplete++;
				}
				if (!(W.status() in m_status_counts)) m_status_counts[W.status()]=0;
				m_status_counts[W.status()]++;
			});
			
			update_processing_message();
			
			if (num_incomplete===0) {
				if (m_output_window) {
					m_output_window.div().find('#processing_message').html('Processing Complete ('+m_status_counts.finished+' finished, '+m_status_counts.error+' errors)');
				}
				m_processing_complete=true;
				//update_statuses();
				m_on_processing_complete_handlers.forEach(function(handler) {
					handler();
				});
				
				m_on_processing_complete_handlers=[];
			}
			if (callback) callback({success:true});
		}
	}
	
	function update_processing_message() {
		if (!check_current()) return;
		var str0='';
		if (m_status_counts.pending>0) {
			if (str0) str0+=', ';
			str0+=m_status_counts.pending+' pending';
		}
		if (m_status_counts.queued>0) {
			if (str0) str0+=', ';
			str0+=m_status_counts.queued+' queued';
		}
		if (m_status_counts.running>0) {
			if (str0) str0+=', ';
			str0+=m_status_counts.running+' running';
		}
		if (m_status_counts.finished>0) {
			if (str0) str0+=', ';
			str0+=m_status_counts.finished+' finished';
		}
		if (m_status_counts.error>0) {
			if (str0) str0+=', ';
			str0+=m_status_counts.error+' errors';
		}
		if (m_output_window) {
			m_output_window.div().find('#processing_message').html('Processing ('+str0+')...');
		}
	}
	function check_current() {
		if (!m_output_window) return true; //important to return true here, because sometimes we don't use an output window
		return (m_output_window.scriptOutputHandler_code==m_instance_code);
	}
	
	function _hasErrors() {
		m_process_output_widgets.forEach(function(W) {
			if (W.status()=='error') return true;
		});
		return false;
	}
	
	
	function get_timeout_from_status_counts() {
		if (m_status_counts.running>0) return 3000;
		if (m_status_counts.queued>0) return 3000;
		if (m_status_counts.pending>0) return 6000;
		return 0;
	}
	
	function periodic_check() {
		console.log('periodic_check');
		if (m_cleared) return;
		
		if (!m_processing_complete) {
			console.log('update_statuses');
			update_statuses(function() {
				console.log('done updating statuses');
				var timeout=0;
				timeout=get_timeout_from_status_counts();
				if (timeout>0) {
					setTimeout(function() {periodic_check();},3000);
				}
			});
		}
		//else setTimeout(function() {periodic_check();},3000);
	}
	setTimeout(periodic_check,1000);
	
}

function ProcessOutputWidget() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.processId=function() {return m_process_id;};
	this.setProcessingNodeId=function(id) {m_processing_node_id=id;};
	this.setProcessId=function(id) {m_process_id=id;};
	this.setProcessorName=function(name) {m_processor_name=name;};
	this.setSubmittedPreviously=function(val) {m_submitted_previously=val; update_content();};
	this.setExpandOnCompleted=function(val) {m_expand_on_completed=val;};
	this.setStatus=function(status) {_setStatus(status);};
	this.setError=function(error) {m_error=error; update_content();};
	this.refresh=function() {_refresh();};
	this.submittedPreviously=function() {return m_submitted_previously;};
	this.status=function() {return m_status;};
	this.updateStatus=function(callback) {get_process_output_and_status(callback);};
	
	var m_div=$('<div class=processoutputwidget></div>');
	var m_processing_node_id='';
	var m_process_id='';
	var m_processor_name='';
	var m_status='';
	var m_error='';
	var m_submitted_previously=false;
	var m_process_output=null;
	var m_expanded=false;
	var m_expand_on_completed=false;
	
	function _refresh() {
		m_div.empty();
		var link0=$('<a href="javascript:;"><b>PROCESS:</b> '+m_processor_name+' (<span class=status></span>)</a>');
		m_div.append(link0);
		m_div.append('<span class=error style="color:red"></span>');
		m_div.append('<span class=process_output></span>');
		link0.click(on_toggle_expanded);
	}
	function on_toggle_expanded() {
		if (!m_expanded) {
			m_div.find('.process_output').show();
			m_expanded=true;
			on_update();
		}
		else {
			m_div.find('.process_output').hide();
			m_expanded=false;
		}
	}
	function update_content() {
		if (m_submitted_previously) {
			m_div.find('.status').html('submitted previously - '+m_status);
		}
		else {
			m_div.find('.status').html(m_status);
		}
		m_div.find('.error').html(m_error);
		if (m_process_output) {
			m_div.find('.process_output').html('<pre>'+m_process_output+'</pre>');
		}
	}
	
	function _setStatus(status) {
		if (m_status==status) return;
		m_status=status; 
		if ((m_expand_on_completed)&&((m_status=='finished')||(m_status=='error'))) {
			//if (!m_expanded) {
			//	on_toggle_expanded();
			//}
		}
		update_content();
	}
	
	function on_update() {
		get_process_output_and_status(function() {
			update_content();
		});
	}
	function get_process_output_and_status(callback) {
		if (m_process_output!==null) {
			callback();
			return;
		}
		
		var req0={
			service:'processing',
			processing_node_id:m_processing_node_id,
			command:'find',
			collection:'processes',
			query:{_id:m_process_id},
			fields:{status:1,error:1,process_output:1}
		};
		WISDM.serverRequest(req0,function(tmp) {
			if (!tmp.success) {
				console.error('Problem finding process: '+tmp.error);
				return;
			}
			else {
				step2(tmp.docs[0]||{});
			}
		});
		
		function step2(doc) {
			m_status=doc.status;
			if (m_status=='error') m_error=doc.error;
			if ((doc.status=='finished')||(doc.status=='error')) {
				m_process_output=doc.process_output;
			}
			callback();
		}
		
	}
	
}

/*
function ScriptOutputHandler() {
	var that=this;
	
	this.setOutputWindow=function(window) {m_output_window=window;};
	this.setProcessingNodeId=function(id) {m_processing_node_id=id;};
	this.setScriptId=function(id) {m_script_id=id;};
	this.setScriptOutput=function(output) {m_script_output=output;};
	this.setSubmittedProcesses=function(list) {m_submitted_processes=list;};
	this.initialize=function() {_initialize();};
	this.onWisdmView=function(handler) {m_on_wisdm_view_handlers.push(handler);};
	this.onProcessingComplete=function(handler) {m_on_processing_complete_handlers.push(handler);};
	this.statusCounts=function() {return $.extend(true,{},m_status_counts);};
	this.hasErrors=function() {return _hasErrors();};
	
	var m_output_window=null;
	var m_processing_node_id='';
	var m_script_id='';
	var m_script_output='';
	var m_submitted_processes=[];
	var m_cleared=false;
	var m_on_wisdm_view_handlers=[];
	var m_on_processing_complete_handlers=[];
	var m_status_counts={pending:0,queued:0,running:0,finished:0,error:0};
	var m_process_output_widgets=[];
	
	//console.log('test #########################################');
	WISDM.onSignal({signal_name:'processes_handled'},function() {update_statuses();});
	setTimeout(function() {update_statuses();},10); //first check should be immediate
	
	function _initialize() {
		if (!m_output_window) return;
		
		m_output_window.clearContent();
		m_output_window.onContentCleared(function() {m_cleared=true;});
		
		var holder=$('<span class=script_output></span>');
		holder.append('<h4>Script output:</h4>');
		var lines=(m_script_output||'').split('\n');
		lines.forEach(function(line) {
			if (line.indexOf('WISDM_VIEW:')===0) {
				var json=line.slice(('WISDM_VIEW:').length).trim();
				var obj=null;
				try {
					obj=JSON.parse(json);
				}
				catch(err) {
					obj=null;
				}
				if (obj) {
					var params=obj.params||{};
					var tmp=$('<a href="javascript:;" class=wisdm_view>'+(params.title||'undef')+'</a>');
					tmp.attr('data-wisdm-view',JSON.stringify(obj));
					var p0=$('<p></p>');
					p0.append(tmp);
					holder.append(p0);
				}
				else {
					holder.append($('<p><span style="color:red">[ERROR PARSING WISDM_VIEW]</span></p>'));
				}
			}
			else {
				holder.append($('<p>'+line+'</p>'));
			}
		});
		m_output_window.appendContent(holder);
		holder.find('.wisdm_view').click(function() {
			var obj;
			try {
				obj=JSON.parse($(this).attr('data-wisdm-view'));
			}
			catch(err) {
				console.error(err);
				return;
			}
			m_on_wisdm_view_handlers.forEach(function(handler) {
				handler(obj);
			});
		});
		
		m_submitted_processes.forEach(function(PP) {
			var W=new ProcessOutputWidget();
			W.setProcessingNodeId(m_processing_node_id);
			W.setProcessId(PP.process_id);
			W.setProcessorName(PP.processor_name);
			W.setExpandOnCompleted(m_submitted_processes.length<=10);
			m_output_window.appendContent(W.div());
			W.refresh();
			if (PP.previous_status) {
				W.setStatus(PP.previous_status);
				W.setSubmittedPreviously(true);
			}
			m_process_output_widgets.push(W);
		});
		
		m_output_window.appendContent('<h3><span id=processing_message>Processing ...</span></h3>');
		
	}
	
	function _hasErrors() {
		m_process_output_widgets.forEach(function(W) {
			if (W.status()=='error') return true;
		});
		return false;
	}
	
	
	function update_statuses(callback) {
		//console.log('update_statuses');
		var process_ids_to_check=[];
		var output_widgets_by_id={};
		m_process_output_widgets.forEach(function(W) {
			if ((W.status()!='finished')&&(W.status()!='error')) {
				process_ids_to_check.push(W.processId());
			}
			output_widgets_by_id[W.processId()]=W;
		});
		if (process_ids_to_check.length>0) {
			var req0={
				service:'processing',
				processing_node_id:m_processing_node_id,
				command:'find',
				collection:'processes',
				query:{_id:{$in:process_ids_to_check}},
				fields:{_id:1,status:1,error:1}
			};
			WISDM.serverRequest(req0,function(tmp) {
				if (!tmp.success) {
					console.error('Problem finding processes: '+tmp.error);
					if (callback) callback({success:false});
					return;
				}
				else {
					step2(tmp.docs);
				}
			});
		}
		else step2([]);
		
		function step2(docs) {
			docs.forEach(function(doc) {
				if (doc._id in output_widgets_by_id) {
					var W=output_widgets_by_id[doc._id];
					W.setStatus(doc.status);
					W.setError(doc.error);
				}
				else {
					console.error('Unexpected problem (136): '+doc._id);
				}
			});
			for (var status in m_status_counts) m_status_counts[status]=0;
			var num_incomplete=0;
			m_process_output_widgets.forEach(function(W) {
				if ((W.status()!='finished')&&(W.status()!='error')) {
					num_incomplete++;
				}
				if (!(W.status() in m_status_counts)) m_status_counts[W.status()]=0;
				m_status_counts[W.status()]++;
			});
			
			update_processing_message();
			
			if (num_incomplete===0) {
				if (m_output_window) {
					m_output_window.div().find('#processing_message').html('Processing Complete ('+m_status_counts.finished+' finished, '+m_status_counts.error+' errors)');
				}
				m_on_processing_complete_handlers.forEach(function(handler) {
					handler();
				});
				
				m_on_processing_complete_handlers=[];
			}
			if (callback) callback({success:true});
		}
	}
	
	function update_processing_message() {
		var str0='';
		if (m_status_counts.pending>0) {
			if (str0) str0+=', ';
			str0+=m_status_counts.pending+' pending';
		}
		if (m_status_counts.queued>0) {
			if (str0) str0+=', ';
			str0+=m_status_counts.queued+' queued';
		}
		if (m_status_counts.running>0) {
			if (str0) str0+=', ';
			str0+=m_status_counts.running+' running';
		}
		if (m_status_counts.finished>0) {
			if (str0) str0+=', ';
			str0+=m_status_counts.finished+' finished';
		}
		if (m_status_counts.error>0) {
			if (str0) str0+=', ';
			str0+=m_status_counts.error+' errors';
		}
		if (m_output_window) {
			m_output_window.div().find('#processing_message').html('Processing ('+str0+')...');
		}
	}
}

function ProcessOutputWidget() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.processId=function() {return m_process_id;};
	this.setProcessingNodeId=function(id) {m_processing_node_id=id;};
	this.setProcessId=function(id) {m_process_id=id;};
	this.setProcessorName=function(name) {m_processor_name=name;};
	this.setSubmittedPreviously=function(val) {m_submitted_previously=val; update_content();};
	this.setExpandOnCompleted=function(val) {m_expand_on_completed=val;};
	this.setStatus=function(status) {_setStatus(status);};
	this.setError=function(error) {m_error=error; update_content();};
	this.refresh=function() {_refresh();};
	this.submittedPreviously=function() {return m_submitted_previously;};
	this.status=function() {return m_status;};
	this.updateStatus=function(callback) {get_process_output_and_status(callback);};
	
	var m_div=$('<div class=processoutputwidget></div>');
	var m_processing_node_id='';
	var m_process_id='';
	var m_processor_name='';
	var m_status='';
	var m_error='';
	var m_submitted_previously=false;
	var m_process_output=null;
	var m_expanded=false;
	var m_expand_on_completed=false;
	
	function _refresh() {
		m_div.empty();
		var link0=$('<a href="javascript:;"><b>PROCESS:</b> '+m_processor_name+' (<span class=status></span>)</a>');
		m_div.append(link0);
		m_div.append('<span class=error style="color:red"></span>');
		m_div.append('<span class=process_output></span>');
		link0.click(on_toggle_expanded);
	}
	function on_toggle_expanded() {
		if (!m_expanded) {
			m_div.find('.process_output').show();
			m_expanded=true;
			on_update();
		}
		else {
			m_div.find('.process_output').hide();
			m_expanded=false;
		}
	}
	function update_content() {
		if (m_submitted_previously) {
			m_div.find('.status').html('submitted previously - '+m_status);
		}
		else {
			m_div.find('.status').html(m_status);
		}
		m_div.find('.error').html(m_error);
		if (m_process_output) {
			m_div.find('.process_output').html('<pre>'+m_process_output+'</pre>');
		}
	}
	
	function _setStatus(status) {
		if (m_status==status) return;
		m_status=status; 
		if ((m_expand_on_completed)&&((m_status=='finished')||(m_status=='error'))) {
			//if (!m_expanded) {
			//	on_toggle_expanded();
			//}
		}
		update_content();
	}
	
	function on_update() {
		get_process_output_and_status(function() {
			update_content();
		});
	}
	function get_process_output_and_status(callback) {
		if (m_process_output!==null) {
			callback();
			return;
		}
		
		var req0={
			service:'processing',
			processing_node_id:m_processing_node_id,
			command:'find',
			collection:'processes',
			query:{_id:m_process_id},
			fields:{status:1,error:1,process_output:1}
		};
		WISDM.serverRequest(req0,function(tmp) {
			if (!tmp.success) {
				console.error('Problem finding process: '+tmp.error);
				return;
			}
			else {
				step2(tmp.docs[0]||{});
			}
		});
		
		function step2(doc) {
			m_status=doc.status;
			if (m_status=='error') m_error=doc.error;
			if ((doc.status=='finished')||(doc.status=='error')) {
				m_process_output=doc.process_output;
			}
			callback();
		}
		
	}
	
}
*/

