function preprocess_script(script,dependency_path,require_contents,callback) {
	var ret={script:'',success:false,error:''};
	var lines=script.split('\n');
	var in_process=false;
	var empty_process_data={
		initial_spaces:'',
		processor_type:'',
		processor_name:'',
		processor_id:'',
		inputs:[],
		outputs:[],
		code:'',
		requires:[]
	};
	var current_process_data=null;
	lines.forEach(function(line) {
		var line0=line.trim();
		
		if (line0.indexOf('WISDM-DEPENDENCY-PATH:')>=0) {
			var ind01=line0.indexOf('WISDM-DEPENDENCY-PATH:');
			var tmp=line0.slice(ind01+('WISDM-DEPENDENCY-PATH:').length).trim();
			dependency_path=tmp;
			ret.script+=line0+'\n';
		}
		else if (line0.indexOf('BEGIN_PROCESS')===0) {
			if (in_process) {
				ret.error='Unexpected BEGIN_PROCESS';
				callback(ret); return;
			}
			in_process=true;
			current_process_data=$.extend(true,{},empty_process_data);
			
			var ind0=line.indexOf('BEGIN_PROCESS');
			var initial_spaces=line.slice(0,ind0);
			
			var ind1=line0.indexOf('[');
			var ind2=line0.indexOf(']');
			var ind3=line0.indexOf('=');
			var ind4=line0.indexOf('(');
			var ind5=line0.indexOf(')');
			if ((ind1<0)||(ind2<0)||(ind3<0)||(ind4<0)||(ind5<0)) {
				ret.error='Syntax error: '+line0;
				callback(ret); return;
			}
			if ((ind1>ind2)||(ind2>ind3)||(ind3>ind4)||(ind4>ind5)) {
				ret.error='Syntax error (*): '+line0;
				callback(ret); return;
			}
			//BEGIN_PROCESS test [txt output]=process_name(txt input)
			current_process_data.processor_type=line0.slice(('BEGIN_PROCESS ').length,ind1).trim();
			current_process_data.processor_name=line0.slice(ind3+1,ind4).trim();
			var inputs=line0.slice(ind4+1,ind5).split(',');
			inputs.forEach(function(input) {
				if (input.trim()) {
					var tmp0=input.trim().split(/\s+/);
					if (tmp0.length!=2) {
						ret.error='Syntax error in input parameters: '+line0+': '+input;
						callback(ret); return;
					}
					current_process_data.inputs.push({parameter_type:tmp0[0],parameter_name:tmp0[1]});
				}
			});
			var outputs=line0.slice(ind1+1,ind2).split(',');
			outputs.forEach(function(output) {
				var tmp0=output.trim().split(/\s+/);
				if (tmp0.length!=2) {
					ret.error='Syntax error in output parameters: '+line0;
					return;
				}
				current_process_data.outputs.push({parameter_type:tmp0[0],parameter_name:tmp0[1]});
			});
			
			ret.script+='// '+line+'\n';
			
		}
		else if (line.trim()=='END_PROCESS') {
			if (!in_process) {
				ret.error='Unexpected END_PROCESS';
				callback(ret); return;
			}
			in_process=false;
			
			ret.script+='// '+line+'\n';
			
			var input_parameters={};
			var input_files={};
			var output_files={};
			var valid_parameter_types=['string','int','real'];
			current_process_data.inputs.forEach(function(input) {
				var type0=input.parameter_type;
				if (input.parameter_type.indexOf('LIST<')===0) {
					var ind1=input.parameter_type.indexOf('<');
					var ind2=input.parameter_type.indexOf('>');
					if ((ind1<0)||(ind2<0)||(ind1>ind2)) {
						console.error('Problem with input type: '+input.parameter_type);
					}
					else {
						type0=input.parameter_type.slice(ind1+1,ind2);
					}
				}
				if (valid_parameter_types.indexOf(type0)>=0) {
					input_parameters[input.parameter_name]={parameter_type:input.parameter_type};
				}
				else {
					input_files[input.parameter_name]={file_type:input.parameter_type};
				}
			});
			current_process_data.outputs.forEach(function(output) {
				output_files[output.parameter_name]={file_type:output.parameter_type};
			});
			
			var processor_obj={
				processor_type:current_process_data.processor_type,
				processor_name:current_process_data.processor_name,
				processor_id:current_process_data.processor_id,
				input_parameters:input_parameters,
				input_files:input_files,
				output_files:output_files,
				code:current_process_data.code,
				requires:current_process_data.requires
			};

			var isp=current_process_data.initial_spaces;
			
			ret.script+='\n';
			ret.script+=isp+'var __processor='+JSON.stringify(processor_obj)+';\n';
			ret.script+=isp+'var __process={processor:__processor,input_parameters:{},input_files:{}};\n';
			for (var input_parameter_name in input_parameters) {
				ret.script+=isp+'__process.input_parameters["'+input_parameter_name+'"]={value:'+input_parameter_name+'};\n';
			}
			for (var input_file_name in input_files) {
				ret.script+=isp+'__process.input_files["'+input_file_name+'"]='+input_file_name+';\n';
			}
			ret.script+=isp+'var __process_output=submitProcess(__process);\n';
			for (var output_file_name in output_files) {
				ret.script+=isp+'var '+output_file_name+'=__process_output.outputs["'+output_file_name+'"]\n';
			}
			ret.script+='\n';
		}
		else if (in_process) {
			if (line0.indexOf('REQUIRE ')===0) {
				var list=line0.split(/\s+/);
				for (var i=1; i<list.length; i++) {
					var full_path=make_full_path(list[i],dependency_path);
					if (!(full_path in require_contents)) {
						ret.error='Unexpected problem: item not in require contents: '+list[i];
						console.error(ret.error);
						callback(ret); return;
					}
					list[i]=list[i].split(':').join('_'); //remove colons from the path!
					current_process_data.requires.push({path:list[i],content:require_contents[full_path]});
				}
			}
			else if (line0.indexOf('PROCESSOR_ID ')===0) {
				current_process_data.processor_id=line0.slice(('PROCESSOR_ID ').length).trim();
			}
			else {
				var line1=line;
				if (line1.indexOf(current_process_data.initial_spaces)===0) {
					line1=line1.slice((current_process_data.initial_spaces).length);
				}
				current_process_data.code+=line1+'\n';
				
				ret.script+='// '+line+'\n';
			}
		}
		else {
			ret.script+=line+'\n';
		}
	});
	ret.success=true;
	callback(ret);
	
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
	function make_full_path(path,refpath) {
		if (!is_anchor_path(path)) {
			return refpath+'/'+path;
		}
		else return path;
	}
}

