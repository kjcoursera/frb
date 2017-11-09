/*** require('widgets:/viewmda/viewmda.js'); ***/
/*** require('widgets:/imageview/imageview.js'); ***/

function wisdm_view(obj) {
	/*var obj;
	try {
		obj=JSON.parse($(this).attr('data-wisdm-view'));
	}
	catch(err) {
		return;
	}*/
	
	if (!obj.params) obj.params={};
	
	var image_types={jpg:1,png:1,bmp:1,gif:1,tif:1};
	
	if (obj.object) {
		wait_for_objects_ready([obj.object],function() {
			var object=obj.object||{};
			var file_type=object.file_type||'';
			if ((file_type=='mda')||(file_type=='nii')) {
				var X=new ViewMda();
				X.setArrayFile(new RemoteFile(object));
				X.setTitle(obj.params.title||'');
				X.showDialog();
				X.refresh();
			}
			else if (file_type in image_types) {
				var X=new ImageView();
				X.setImageFile(new RemoteFile(object));
				X.setTitle(obj.params.title||'');
				X.showDialog();
				X.refresh();
			}
		});
	}
	else if (obj.command) {
		var params=obj.params;
		if (obj.command=='overlay') {
			wait_for_objects_ready([params.array,params.overlay],function() {
				var X=new ViewMda();
				X.setArrayFile(new RemoteFile(params.array));
				X.setTitle(obj.params.title||'');
				X.setOverlayFile(new RemoteFile(params.overlay));
				if ('omax' in params) {
					X.setOverlayRange(params.omin||0,params.omax);
				}
				if ('othr' in params) {
					X.setOverlayThreshold(params.othr);
				}
				X.showDialog();
				X.refresh();
			});
		}
		else if (obj.command=='app') {
			console.log(obj);
			var url='http://'+location.host+'/dev2/apps/'+obj.params.app+'/?'+obj.params.query;
			console.log(url);
			window.open(url,'_blank');
		}
	}
}

function wait_for_objects_ready(objects,callback) {
	if (objects.length===0) {
		callback({success:true});
		return;
	}
	var dialog_closed=false;
	var current_status='';
	jAlert('Finding process...');
	utils.for_each_async(objects,function(object,cb) {
		do_wait_for_object_ready(object,function(tmp) {
			cb(tmp);
		});
	},function(tmp1) {
		callback(tmp1);
	},1);
	
	function do_wait_for_object_ready(object,callback2) {
		if ((object.processing_node_id)&&(object.process_id)) {
			var req0={
				service:'processing',
				processing_node_id:object.processing_node_id,
				command:'find',
				collection:'processes',
				query:{_id:object.process_id},
				fields:{_id:1,status:1,error:1}
			};
			WISDM.serverRequest(req0,function(tmp) {
				if (!tmp.success) {
					jAlert('Problem finding process: '+tmp.error);
					return;
				}
				var process=tmp.docs[0]||{status:''};
		
				if (process.status=='finished') {
					jAlert(null);
					callback2({success:true});
					return;
				}
				else if (process.status=='pending') {
					if (current_status!=process.status) {
						jAlert('Process is pending...','Process pending',on_dialog_closed);
					}
				}
				else if (process.status=='queued') {
					if (current_status!=process.status) {
						jAlert('Process is queued...','Process queued',on_dialog_closed);
					}
				}
				else if (process.status=='running') {
					if (current_status!=process.status) {
						jAlert('Process is running...','Process running',on_dialog_closed);
					}
				}
				else if (process.status=='error') {
					jAlert('Error in process: '+process.error);
					return;
				}
				else {
					jAlert('Unable to find process.');
					return;
				}
				current_status=process.status;
				setTimeout(function() {
					if (!dialog_closed) {
						do_wait_for_object_ready();
					}
				},1000);				
			});
		}
		else {
			jAlert(null);
			callback2({success:true});
		}
	}
	
	function on_dialog_closed() {
		dialog_closed=true;
	}
}


