/*** require('localcontentsbychecksum.js'); ***/
/*** require('preprocess_script.js'); ***/
/*** require('maptransferhandler.js'); ***/
/*** require('outputwindow.js'); ***/
/*** require('scriptoutputhandler.js'); ***/
/*** require('compile_pipeline_script.js'); ***/
/*** require('wisdm_view.js'); ***/

var WisdmMap_cache={};

function WisdmMap() {
	var that=this;
	
	this.setMapData=function(map_data) {m_map_data=$.extend(true,{},map_data); m_owner='';};
	this.getMapData=function() {return $.extend(true,{},m_map_data);};
	this.load=function(params,callback) {_load(params,callback);}; //params.name, params.owner
	this.save=function(params,callback) {_save(params,callback);}; //params.owner
	this.name=function() {return (m_map_data.root||{}).title||'missing root node';};
	this.owner=function() {return m_owner;};
	this.findNode=function(path) {return _findNode(path);};
	this.submitScript=function(path,params,callback) {return _submitScript(path,params,callback);};
	this.addNode=function(parent_path,node) {return _addNode(parent_path,node);};
	
	var m_owner='';
	var m_local_contents_by_checksum=new LocalContentsByChecksum();
	var m_map_data={};
	
	function _load(params,callback) {
		load_map(params,callback);
	}
	function _save(params,callback) {
		save_map(params,callback);
	}
	function _findNode(path) {
		return find_node_from_path(path);
	}
	function _addNode(parent_path,node) {
		var N=that.findNode(parent_path);
		if (!N) return;
		if (!N.children) N.children=[];
		N.children.push(node);
	}
	function _submitScript(path,params,callback) {
		var node0=that.findNode(path);
		var parent_node0=that.findNode(utils.get_file_path(path));
		if (!node0) {
			if (callback) callback({success:false,error:'Unable to find map node: '+path});
			return;
		}
		if (!parent_node0) {
			if (callback) callback({success:false,error:'Unable to find parent map node: '+path});
			return;
		}
		
		var script;
		
		var suf=utils.get_file_suffix(path);
		if (suf=='ws') {
			script=(node0.attachment||{}).content||'';
			submit_script_part_A();
		}
		else if (suf=='pipeline') {
			compile_pipeline_script(that,path,function(compile_pipeline_output) {
				if (!compile_pipeline_output.success) {
					callback({success:false,error:'Problem compiling pipeline: '+compile_pipeline_output.error});
					return;
				}
				script=compile_pipeline_output.script;
				submit_script_part_A();
			});
		}
		else {
			if (callback) callback({success:false,error:'Invalid suffix for script or pipeline: '+path});
			return;
		}
		
		function check_connected_to_node(CB) {
			if (params.run_locally) {
				CB({success:true});
			}
			else {
				set_status('checking on whether we are connected to the node...');
				WISDM.updateInfo(function() {
					if (WISDM.processingNodeConnected()) {
						set_status('Yes, connected.');
						CB({success:true});
					}
					else {
						set_status('Not connected.');
						CB({success:false});
					}
				});
			}
		}
		
		
		function submit_script_part_A() {
			set_status('compiling dependent scripts...');
			
			var dependency_scripts={};
			compile_dependency_scripts(script,parent_node0,path,dependency_scripts,function(compile_output) {
				if (!compile_output.success) {
					set_status('Error compiling dependent scripts: '+compile_output.error);
					jAlert('Error compiling dependent scripts: '+compile_output.error);
					if (callback) callback({success:false,error:'Error compiling dependent scripts: '+compile_output.error});
					return;
				}
				check_connected_to_node(function(tmpCC) {
					if (!tmpCC.success) {
						jAlert('Cannot submit script: Not connected to any processing node.');
						set_status('Cannot submit script: Not connected to any processing node.');
						if (callback) callback({success:false,error:'Not connected to any processing node.'});
						return;
					}
				
					set_status('Submitting script to: '+WISDM.currentProcessingNodeId()+'...');
					var processing_node_id=WISDM.currentProcessingNodeId();
					var req0={
						service:'processing',
						command:'submitScript',
						scripts:dependency_scripts,
						run_parameters:params.run_parameters||{},
						processing_node_id:processing_node_id,
						run_locally:params.run_locally||false
					};
					if (params.output_window) {
						params.output_window.clearContent();
						params.output_window.appendContent($('<p>Submitting script...</p>'));
					}
			
					WISDM.serverRequest(req0,function(tmp1) {
						if (tmp1.success) {
							set_status('Script submitted.',3000);
							var XX=new ScriptOutputHandler();
							XX.setProcessingNodeId(processing_node_id);
							XX.setScriptId(tmp1.script_id);
							if (params.output_window) XX.setOutputWindow(params.output_window);
							XX.setScriptOutput(tmp1.output||'');
							XX.setSubmittedProcesses(tmp1.submitted_processes||[]);
							XX.initialize();
							XX.onWisdmView(function(obj) {
								wisdm_view(obj);
							});
							if (!params.run_locally) {
								tmp1.results=parse_results_from_output(tmp1.output||''); //fix this for future
							}
							if (params.wait_for_processing) {
								wait_for_processing_complete(tmp1.submitted_processes||[],function(tmp2) {
									if (tmp2.success) callback(tmp1);
									else callback(tmp2);
								});
							}
							else {
								if (callback) callback(tmp1);
							}
						}
						else {
							if (params.output_window) {
								var XX=new ScriptOutputHandler();
								XX.setProcessingNodeId(processing_node_id);
								XX.setOutputWindow(params.output_window);
								XX.setScriptOutput('Problem running script: '+tmp1.error+'\n\n\n'+tmp1.output||'');
								XX.initialize();
							}
							
							set_status('Problem running script: '+tmp1.error,8000);
							if (callback) callback(tmp1);
						}
					});
				});
			});
		}
	}
	
	function wait_for_processing_complete(submitted_processes,callback) {
		
		var processes_to_check=[];
		for (var i=0; i<submitted_processes.length; i++) {
			var PP=submitted_processes[i];
			var need_to_check=true;
			if (PP.previous_status=='finished') need_to_check=false;
			if ((PP.status||'')=='finished') need_to_check=false;
			if (PP.status=='error') {
				callback({success:false,error:'Processing has one or more errors.'});
				return;
			}
			if (need_to_check) processes_to_check.push(PP);
		}
		if (processes_to_check.length===0) {
			callback({success:true});
			return;
		}
		var process_ids_to_check=[];
		processes_to_check.forEach(function(PP) {
			process_ids_to_check.push(PP.process_id);
		});
		var req0={
			service:'processing',
			processing_node_id:WISDM.currentProcessingNodeId(),
			command:'find',
			collection:'processes',
			query:{_id:{$in:process_ids_to_check}},
			fields:{status:1,error:1,process_output:1}
		};
		WISDM.serverRequest(req0,function(tmp) {
			if (!tmp.success) {
				callback({success:false,error:'Problem finding process: '+tmp.error});
				return;
			}
			else {
				var docs=tmp.docs;
				var results_by_id={};
				docs.forEach(function(doc) {
					results_by_id[doc._id]=doc;
				});
				var done=true;
				submitted_processes.forEach(function(PP) {
					if (PP.process_id in results_by_id) {
						var doc=results_by_id[PP.process_id];
						PP.status=doc.status;
						if (PP.status=='error') {
							callback({success:false,error:'Processing has one or more errors (*).'});
							return;
						}
						if (PP.status!='finished') done=false;
					}
				});
				if (done) {
					callback({success:true});
					return;
				}
				setTimeout(function() {
					wait_for_processing_complete(submitted_processes,callback);
				},2000);
			}
		});
	}
	
	function parse_results_from_output(output) {
		var ret={};
		var lines=output.split('\n');
		lines.forEach(function(line) {
			if (line.indexOf('WISDM_RESULT:')==0) {
				var ind1=line.indexOf(':');
				var ind2=line.indexOf(':',ind1+1);
				if ((ind1>=0)&&(ind2>=0)) {
					try {
						ret[line.slice(ind1+1,ind2)]=JSON.parse(line.slice(ind2+1));
					}
					catch(err) {
						console.error('Error parsing result',line);
					}
				}
				else {
					console.error('Error in result line',line);
				}
			}
		});
		return ret;
	}
	
	function parse_include_paths_and_require_paths(script,dependency_path) {
		var include_paths=[];
		var require_paths=[];
		var script2='';
		var lines=script.split('\n');
		var in_process=false;
		for (var i=0; i<lines.length; i++) {
			var line=lines[i];
			var line_trimmed=line.trim();
			if (in_process) {	
				if (line_trimmed.indexOf('REQUIRE')===0) {
					var list=line_trimmed.split(/\s+/);
					for (var k=1; k<list.length; k++) {
						require_paths.push(make_full_path(list[k],dependency_path));
					}
				}
				
				if (line_trimmed.indexOf('END_PROCESS')===0) {
					in_process=false;
				}
				
				script2+=line+'\n';
			}
			else {
				if (line_trimmed.indexOf('WISDM-DEPENDENCY-PATH:')>=0) {
					var ind01=line_trimmed.indexOf('WISDM-DEPENDENCY-PATH:');
					var tmp=line_trimmed.slice(ind01+('WISDM-DEPENDENCY-PATH:').length).trim();
					dependency_path=tmp;
					script2+=line+'\n';
				}
				else if (line_trimmed.indexOf('include(')===0) {
					var ind1=line_trimmed.indexOf('(');
					var ind2=line_trimmed.indexOf(')');
					if ((ind1>0)&&(ind2>ind1)) {
						var path0=line_trimmed.slice(ind1+1,ind2);
						path0=path0.replace("'",'').replace("'",'');
						path0=path0.replace('"','').replace('"','');
						if (path0.length>0) {
							include_paths.push(make_full_path(path0,dependency_path));
							script2+='/*** '+line+' ***/\n';
						}
						else script2+=line+'\n';
					}
					else script2+=line+'\n';
				}
				else script2+=line+'\n';
				
				if (line_trimmed.indexOf('BEGIN_PROCESS')===0) {
					in_process=true;
				}
			}
		}
		return {include_paths:include_paths,require_paths:require_paths,script:script2};
	}
	
	function find_node_from_anchor(anchor_name,start_node) {
		if (anchor_name=='ROOT') return m_map_data.root||{};
		if (!start_node) start_node=m_map_data.root||{};
		if ((start_node.title||'')==anchor_name+':') {
			return start_node;
		}
		var ret=null;
		(start_node.children||[]).forEach(function(child_node) {
			if ((!ret)&&(child_node)) {
				var tmp=find_node_from_anchor(anchor_name,child_node);
				if (tmp) ret=tmp;
			}
		});
		return ret;
	}
	function is_anchor_path(path) {
		var ind_colon=path.indexOf(':');
		var ind_slash=path.indexOf('/');
		if ((ind_slash<0)&&(ind_colon>=0)) {
			return (ind_colon==path.length-1);
		}
		if ((ind_slash>=0)&&(ind_colon>=0)) {
			return (ind_colon+1==ind_slash);
		}
		return false;
	}
	function find_node_from_path(path,ref_node) {
		if (!ref_node) ref_node={children:[m_map_data.root]}; //changed on 4/23/14
		
		if (!path) return ref_node;
		
		var ind_colon=path.indexOf(':');
		var ind_slash=path.indexOf('/');
		if (!is_anchor_path(path)) {
			//relative path
			var path1='',path2='';
			if (ind_slash>=0) {
				path1=path.slice(0,ind_slash);
				path2=path.slice(ind_slash+1);
			}
			else {
				path1=path;
				path2='';
			}
			var child_nodes_by_title={};
			(ref_node.children||[]).forEach(function(child_node) {
				if (child_node) child_nodes_by_title[child_node.title||'']=child_node;
			});
			if (path1 in child_nodes_by_title) {
				var tmp_node=child_nodes_by_title[path1];
				if (!path2) {
					return tmp_node;
				}
				else {
					return find_node_from_path(path2,tmp_node);
				}
			}
			else return null;
		}
		else {
			//anchor path
			var anchor_name=path.slice(0,ind_colon);
			var path2=path.slice(ind_colon+2);
			var anchor_node=find_node_from_anchor(anchor_name);
			if (anchor_node) {
				return find_node_from_path(path2,anchor_node);
			}
			else return null;
		}
	}
	function make_full_path(path,refpath) {
		if (!is_anchor_path(path)) {
			return refpath+'/'+path;
		}
		else return path;
	}
	
	function collect_require_contents(require_paths,callback) {
		var ret={};
		utils.for_each_async(require_paths,function(require_path,cb) {
			var node_2=find_node_from_path(require_path);
			if (!node_2) {
				cb({success:false,error:'Unable to find file: '+require_path});
				return;
			}
			var content0=(node_2.attachment||{}).content||'';
			ret[require_path]=content0;
			cb({success:true});
		},function(tmp) {
			if (!tmp.success) {
				callback(tmp);
				return;
			}
			callback({success:true,contents:ret});
		},1);
	}
	
	function compile_dependency_scripts(script,parent_node,path,dependency_scripts,callback) {
		if (!parent_node) {
			callback({success:false,error:'parent node is null'});
			return;
		}
		
		if (dependency_scripts.length>1000) {
			console.error('More than 1000 dependent scripts... most likely an infinite recursion');
			callback({success:false,error:'More than 1000 dependent scripts... most likely infinite recursion'});
			return;
		}
		
		var parent_path=utils.get_file_path(path);
		var parse_output=parse_include_paths_and_require_paths(script,utils.get_file_path(path));
		var include_paths=parse_output.include_paths;
		var require_paths=parse_output.require_paths;
	
		
		collect_require_contents(require_paths,function(tmpC) {
			if (!tmpC.success) {
				callback({success:false,error:tmpC.error});
				return;
			}
			var require_contents=tmpC.contents;
		
			preprocess_script(parse_output.script,parent_path,require_contents,function(ret_preprocess) {
				if (!ret_preprocess.success) {
					callback({success:false,error:'Error preprocessing script: '+ret_preprocess.error});
					return;
				}
				dependency_scripts[path]=ret_preprocess.script;
				
				utils.for_each_async(include_paths,function(include_path,cb) {
					var report_include_path=include_path;
					/*if ((include_path.indexOf('ROOT:')!==0)&&(parent_path)) {
						report_include_path=parent_path+'/'+include_path;
					}*/
					if (!(report_include_path in dependency_scripts)) {
						var node_2=find_node_from_path(include_path/*,parent_node*/);
						var parent_node_2=parent_node;
						if (utils.get_file_path(include_path)) {
							parent_node_2=find_node_from_path(utils.get_file_path(include_path)/*,parent_node*/);
						}
						if (!node_2) {
							cb({success:false,error:'Unable to find file: '+include_path});
							return;
						}
						if (!parent_node_2) {
							cb({success:false,error:'Unable to find parent file: '+include_path});
							return;
						}
						var script2=(node_2.attachment||{}).content||'';
						compile_dependency_scripts(script2,parent_node_2,report_include_path,dependency_scripts,function(output) {
							if (!output.success) {
								cb(output);
								return;
							}
							cb({success:true});
						});
					}
					else cb({success:true});
				},function(tmp) {
					callback(tmp);
				},1);
			});
		});
	}
	
	function save_map(params,callback) {
		var MMM=new MapTransferHandler();
		
		var map=m_map_data;
		var name=that.name();
		var owner=params.owner||''; //by default, will be the user_id
		
		var contents_by_checksum={};
		var timer0=new Date();
		MMM.replaceLargeContentsWithChecksums(map,contents_by_checksum);
		var req0={service:'maps',command:'setMap',name:name,owner:owner,data:map,do_not_prompt_login:params.do_not_prompt_login||false};
		set_status('Saving map: '+name+'...');
		WISDM.serverRequest(req0,function(tmp1) {
			if (tmp1.success) {
				if ((tmp1.checksums_for_contents_needed)&&(tmp1.checksums_for_contents_needed.length>0)) {
					var contents_needed_by_checksum={};
					tmp1.checksums_for_contents_needed.forEach(function(checksum) {
						contents_needed_by_checksum[checksum]=contents_by_checksum[checksum];
					});
					console.log ('Sending '+tmp1.checksums_for_contents_needed.length+' contents');
					var req1={
						service:'maps',
						command:'setMap_send_contents',
						name:that.name(),
						contents_needed_by_checksum:contents_needed_by_checksum,
						owner:owner
					};
					WISDM.serverRequest(req1,function(tmp2) {
						if (tmp2.success) {
							wrap_it_up();
						}
						else {
							set_status('Problem saving map (problem sending contents): '+tmp2.error,8000);
							jAlert('Problem saving map (problem sending contents): '+tmp2.error);
							if (callback) callback(tmp2);
						}
					});
				}
				else {
					wrap_it_up();
				}
			}
			else {
				set_status('Problem saving map: '+tmp1.error,8000);
				jAlert('Problem saving map: '+tmp1.error);
				if (callback) callback(tmp1);
			}
			
			function wrap_it_up() {
				WisdmMap_cache[owner+'::'+name]=m_map_data;
				set_status('Map saved.',4000);
				if (callback) callback({success:true});
			}
		});
	}
	
	function load_map(params,callback) {
		if ((params.owner+'::'+params.name) in WisdmMap_cache) {
			m_map_data=WisdmMap_cache[params.owner+'::'+params.name];
			if (callback) callback({success:true});
			return;
		}
		
		set_status('Getting map '+params.name+'...');
		var req0={service:'maps',command:'getMap',name:params.name,owner:params.owner||'',do_not_prompt_login:params.do_not_prompt_login||false};
		WISDM.serverRequest(req0,function(tmp1) {
			if (!tmp1.success) {
				set_status('Problem loading map: '+JSON.stringify(tmp1.error),8000);
				callback({success:false,error:tmp1.error});
				return;
			}
			if (!tmp1.data) {
				set_status('Unexpecected problem loading map: data is null or empty',8000);
				callback({success:false,error:'data is null or empty'});
				return;
			}
			
			var map=tmp1.data;
			
			var MMM=new MapTransferHandler();
			var checksums_needed=[];
			MMM.getChecksumsFromMap(map,checksums_needed);
			
			var local_contents={};
			var new_checksums_needed=[];
			checksums_needed.forEach(function(checksum) {
				var content0=m_local_contents_by_checksum.getContent(checksum);
				if (content0) {
					local_contents[checksum]=content0;
				}
				else {
					new_checksums_needed.push(checksum);
				}
			});
			MMM.addContentsToMap(map,local_contents);
			
			if (new_checksums_needed.length>0) {
				console.log ('Retrieving '+new_checksums_needed.length+' contents');
				var req1={service:'maps',command:'getMap_retrieve_contents',checksums_needed:new_checksums_needed};
				WISDM.serverRequest(req1,function(tmp2) {
					if (!tmp2.success) {
						set_status('Problem retrieving contents: '+tmp2.error,8000);
						callback({success:false,error:tmp2.error});
						return;
					}
					if (!MMM.addContentsToMap(map,tmp2.contents_by_checksum)) {
						console.error('Not all contents found.',tmp2.contents_by_checksum);
						jAlert('Warning: There was an unexpected problem loading the map. Not all contents were found.');
					}
					m_local_contents_by_checksum.addContents(tmp2.contents_by_checksum);
					wrap_it_up();
				});
			}
			else wrap_it_up();
			
			function wrap_it_up() {
				set_status('Setting map...');
				m_map_data=map;
				WisdmMap_cache[params.owner+'::'+params.name]=m_map_data;
				m_owner=tmp1.owner;
				if (callback) callback({success:true});
			}
		});
	}
	
	function set_status(status) {
		console.log ('STATUS: '+status);
	}
}

