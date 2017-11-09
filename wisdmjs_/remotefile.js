/*** require('wisdmjs:/3rdparty/base64/base64.js'); ***/
/*** require('wisdmjs:/3rdparty/zlib/zlib.inflate.js'); ***/

function RemoteFile(config) {
	var that=this;
	
	this.getBytes=function(params,callback) {return _getBytes(params,callback);};
	this.fileType=function() {return m_config.file_type||'';};
	
	var m_config=$.extend(true,{},config||{});
	
	function _getBytes(params,callback) {
		var compression0=params.compression||'';
		//Note that compression is not yet implemented on the server side!
		if (m_config.processing_node_id) {
			var req0={
				service:'processing',
				command:'getFileBytes',
				processing_node_id:m_config.processing_node_id||'',
				bytes:params.bytes||'',
				compression:compression0
			};
			if ((m_config.process_id)&&(m_config.output_name)) {
				req0.process_id=m_config.process_id;
				req0.output_name=m_config.output_name;
			}
			else {
				callback({success:false,error:'Unrecognized config in remote file *'});
				return;
			}
			WISDM.serverRequest(req0,function(tmp1) {
				if (!tmp1.success) {
					callback(tmp1); return;
				}
				if ((tmp1.data)||(tmp1.data_base64)) {
					if (tmp1.data_base64) {
						handle_downloaded_data(Base64Binary.decode(tmp1.data_base64));
					}
					else if (tmp1.data) {
						handle_downloaded_data(Base64Binary.decode(tmp1.data));
					}
				}
				else if (tmp1.url) {
					GetBase64File(url,function(tmp2) {
						if (!tmp2.success) {
							callback(tmp2);
							return;
						}
						handle_downloaded_data(tmp2.Content);
					});
				}
				else {
					callback({success:false,error:'Unexpected problem (34)'});
				}
			});
		}
		else {
			callback({success:false,error:'Unrecognized config in remote file'});
			return;
		}
		
		function handle_downloaded_data(data) {
			if (compression0=='zlib') {
				try {
					data=(new Zlib.Inflate(data)).decompress();
				}
				catch(err) {
					callback({success:false,error:'Problem decompressing: '+err});
					return;
				}
			}
			if ((params.mode||'')=='text') {
				var str='';
				for (var i=0; i<data.byteLength; i++) {
						str+=String.fromCharCode(data[i]);
				}
				callback({success:true,data:str});
				return;
			}
			callback({success:true,data:data});
		}
	}
	
	function GetBase64File(url,callback) {
		$.get(url,function(txt0) {
			if ((txt0)&&(txt0.length>0)) {
				Wisdm.sessionStats.bytesReceived+=txt0.length;
				var data0=Base64Binary.decode(txt0);
				callback({Content:data0,success:true});
			}
			else callback({success:false});
		}).fail(function() {
			callback({success:false});
		});
	}
	
}
