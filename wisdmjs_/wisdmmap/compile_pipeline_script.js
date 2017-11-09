/*jshint multistr:true*/

/*** require('wisdmmap.js'); ***/
/*** require('wisdmjs:/utils.js'); ***/

function compile_pipeline_script(map,path,callback) {
	var node0=map.findNode(path);
	var parent_node0=map.findNode(utils.get_file_path(path));
	if (!node0) {
		callback({success:false,error:'Unable to find node: '+path});
		return;
	}
	if (!parent_node0) {
		callback({success:false,error:'Unable to find parent node: '+utils.get_file_path(path)});
		return;
	}
	
	var pipeline_script=(node0.attachment||{}).content||'';
	
	var script1='';
	var script2='';
	
	var lines=pipeline_script.split('\n');
	var in_unit=false;
	var units={};
	var unit_names=[];
	var current_unit=null;
	var line_numbers=[];
	for (var i=0; i<lines.length; i++) {
		var line=lines[i];
		var char0=line[0]||'.';
		var vals=line.trim().split(/\s+/);
		var val0=vals[0]||'';
		var val1=vals[1]||'';
		if (in_unit) {
			if ((char0!=' ')&&(char0!='\t')) {
				in_unit=false;
				for (var input_name in current_unit.inputs) {
					script1+=current_unit.name+'.setPipelineInput("'+input_name+'",'+current_unit.inputs[input_name]+');\n';
				}
				script1+=current_unit.name+'.run();\n';
			}
			else if (val0=='SCRIPT') {
				if (!val1) {
					report_error(i,'Script path is empty.');
					return;
				}
				current_unit.script_path=val1;
			}
			else if (val0=='INPUT') {
				var ind1=line.indexOf('INPUT');
				var ind2=line.indexOf('=');
				var tmp1=line.slice((ind1+('INPUT').length),ind2).trim();
				var tmp2=line.slice(ind2+1).trim();
				current_unit.inputs[tmp1]=tmp2;
			}
			else {
				report_error(i,'Unrecognized command in unit '+current_unit.name+': '+line);
				return;
			}
		}
		if (!in_unit) {
			if (val0=='UNIT') {
				in_unit=true;
				var current_unit_name=val1;
				if (!current_unit_name) {
					report_error(i,'Unit name is empty.');
					return;
				}
				if (current_unit_name in units) {
					report_error(i,'Duplicate unit: '+current_unit_name);
					return;
				}
				var UU={name:current_unit_name,line:i,script_path:'',inputs:{}};
				units[current_unit_name]=UU;
				unit_names.push(current_unit_name);
				current_unit=UU;
			}
			else {
				script1+=line+'\n';
			}
		}
	}
	utils.for_each_async(unit_names,function(unit_name,cb) {
		create_unit_code(units[unit_name],function(tmp0) {
			if (!tmp0.success) {
				cb(tmp0);
				return;
			}
			script2+=tmp0.code;
			cb({success:true});
		});
	},function(tmpA) {
		if (!tmpA.success) {
			callback(tmpA);
			return;
		}
		do_finalize();
	},1);
	
	function report_error(line_num,msg) {
		callback({success:false,error:'Problem on line '+line_num+': '+msg});
	}
	
	function do_finalize() {
		script='\n\
var INPUTS={};\n\
var OUTPUTS={};\n\
\n\
function PIPELINE_UNIT(obj) {\n\
	obj.setPipelineInput=function(name,val) {m_pipeline_inputs[name]=val;};\n\
	obj.getPipelineInput=function(name,defaultval) {return _getPipelineInput(name,defaultval);}\n\
	obj.setPipelineOutput=function(name,val) {obj[name]=val;};\n\
\n\
	var m_pipeline_inputs={};\n\
	function _getPipelineInput(name,defaultval) {\n\
		if (name in m_pipeline_inputs)\n\
			return m_pipeline_inputs[name];\n\
		else if (typeof(defaultval)!="undefined")\n\
			return defaultval;\n\
		else {\n\
			console.error("ERROR: Pipeline input not defined: "+name);\n\
			exit(1);\n\
		}\n\
	}\n\
}\n\
\n\
function __pipeline_run(parameters) {\n\
	if (!parameters) parameters={}\n\
	for (var key in parameters) INPUTS[key]=parameters[key];\n\
'+indent_lines(script1)+'\n\
\n\
	////////////////////////////////////////////////\n\
	for (var output_name in OUTPUTS) {\n\
		setResult(output_name,OUTPUTS[output_name]);\n\
	}\n\
	////////////////////////////////////////////////\n\
}\n\
\n\
'+script2+'\n\
';
		
		
		callback({success:true,script:script});
	}
	
	function create_unit_code(unit,callback) {
		
		var node1=map.findNode(unit.script_path);
		if (!node1) {
			callback({success:false,error:'Unable to find node: '+unit.script_path});
			return;
		}
		var script0=(node1.attachment||{}).content||'';
		

		var code='';
		
code+='\
/* '+unit.script_path+' */\n\
var '+unit.name+'=new function() {\n\
	PIPELINE_UNIT(this);\n\
	this.run=function() {\n\
		console.log ("UNIT '+unit.name+' =========================================");\n\
		run();\n\
	};\n\
	var pipelineInput=this.getPipelineInput;\n\
	var pipelineOutput=this.setPipelineOutput;\n\
\n\
';

code+='// WISDM-DEPENDENCY-PATH:'+utils.get_file_path(unit.script_path)+'\n';

code+=script0;
	
code+='\n';
code+='}\n\n';
		
		callback({success:true,code:code});
	}	
	function indent_lines(txt) {
		var lines=txt.split('\n');
		var ret='';
		lines.forEach(function(line) {
			ret+='\t'+line+'\n';
		});
		return ret;
	}
}

