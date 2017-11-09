/*** require('wisdmjs:/wisdm.js'); ***/
/*** require('wisdmjs:/wisdmmap/wisdmmap.js'); ***/
/*** require('frbview.js'); ***/

document.onWisdm=function() {
	var banner=initializeWisdmBanner({content:$('#content'),overflow:'auto'});
	
	var WW=new FRBView();
	$('#content').append(WW.div());
	
	var folder=WISDM.queryParameter('folder','BAC003_WK1/SPM8_sinc_wcbf');
	var template_path=WISDM.queryParameter('template_path','');
	WW.setTitle(folder);
	WW.initializeWidgets();
	
	$('title').html(utils.get_file_name(folder));
	
	var output_window=new OutputWindow();
	$('#content').append(output_window.div());
	output_window.setSize(300,300);
	output_window.div().css({left:50,top:50});
	
	submit_script({folder:folder,template_path:template_path},function(results) {
		setTimeout(function() {
			output_window.div().hide();
		},2000);
		var output=results.output||{};
		WW.setOutput(output);
		WW.initialize();
	});
	
	//WW.setFolder('BAC003_WK1/SPM8_sinc_wcbf');
	//WW.refresh();
	
	update_layout();
	$(window).resize(update_layout);
	function update_layout() {
		var W0=$('#content').width();
		var H0=$('#content').height();
		
		WW.div().css({left:10,top:10,width:W0-20,height:H0-20});

	}
	
	WISDM.authenticate({force_login:false},function() {
		//set the processing node
		var default_processing_node='';
		if (location.host.indexOf('wisdmhub')>=0)
			default_processing_node='mamut';
		else
			default_processing_node='node1';
		WISDM.setCurrentProcessingNodeId(WISDM.queryParameter('node',default_processing_node));
	});
	
	function submit_script(run_params,callback) {
		//var default_fshost='bbvhub.org:8080';
		
		//var default_host='bbvhub.org:8080';
		//var default_host='bbvhub.org:6022';
		var default_host='165.123.113.143:8006';
		if (location.host.indexOf('localhost')>=0)
			default_host='localhost:8006';
		var fshost=WISDM.queryParameter('fshost',default_host);
	
		run_params.fshost=WISDM.queryParameter('fshost',default_host);
		var MAP=new WisdmMap();
		MAP.load({name:'frb',owner:'magland'},function(tmp) {
			MAP.submitScript('frb:/frb.ws',{
				output_window:output_window,
				run_parameters:run_params,
				wait_for_processing:true
			},function(tmp1) {
				if (tmp1.success) {
					callback(tmp1.results);
				}
				else {
					jAlert(tmp1.error);
				}
			});
		});
	}
	
};


