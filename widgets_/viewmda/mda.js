/*** require("array2d.js"); ***/
/*** require('wisdmjs:/remotefile.js'); ***/

function Mda() {
	var that=this;
	
	this.setFile=function(file) {m_file=file;};
	this.file=function() {return m_file;};
	this.initialize=function(callback) {return _initialize.apply(this,arguments);};
	this.isInitialized=function() {return m_is_initialized;};
	this.N1=function() {return m_N[0];};
	this.N2=function() {return m_N[1];};
	this.N3=function() {return m_N[2];};
	this.N4=function() {return m_N[3];};
	this.N5=function() {return m_N[4];};
	this.N6=function() {return m_N[5];};
	this.getDataXY=function(inds,callback,params) {return _getDataXY.apply(this,arguments);};
	this.getDataXZ=function(inds,callback,params) {return _getDataXZ.apply(this,arguments);};
	this.getDataZ=function(inds,callback,params) {return _getDataZ.apply(this,arguments);};
	this.writeArray=function(X,params,callback) {_writeArray(X,params,callback);};
	
	var m_file=new RemoteFile();
	var m_num_dims=2;
	var m_N=[1,1,1,1,1,1];
	var m_data_type='';
	var m_data_type_size=4;
	var m_header_size=0;
	var m_is_initialized=false;

	var _initialize=function(callback) {
		m_file.getBytes({bytes:'0:59'},function(d0) {
			if ((d0.success)&&(d0.data.length>=4)) {
				var XX=new Int32Array(d0.data.buffer);
				var ii=0;
				var code=XX[ii]; ii++;
				var num_dims;
				if (code>0) {
					num_dims=code;
					code=-1;
				}
				else {
					ii++;
					num_dims=XX[ii]; ii++;
				}
				if (num_dims>6) {
					if (callback) callback(false,'Problem reading mda. Too many dimensions: '+num_dims+' code: '+code);
					return;
				}
				var S=[];
				for (var j=0; j<num_dims; j++) {
					var tmp00=XX[ii]; ii++;
					S.push(tmp00);
				}
				
				m_header_size=ii*4;
				
				m_num_dims=num_dims;
				for (var k=0; k<m_num_dims; k++) {
					m_N[k]=S[k];
				}
				
				m_data_type='';
				if (code==-1) {
					m_data_type='complex';
					m_data_type_size=8;
				}
				else if (code==-2) {
					m_data_type='byte';
					m_data_type_size=1;
				}
				else if (code==-3) {
					m_data_type='float32';
					m_data_type_size=4;
				}
				else if (code==-4) {
					m_data_type='int16';
					m_data_type_size=2;
				}
				else if (code==-5) {
					m_data_type='int32';
					m_data_type_size=4;
				}
				else {
					if (callback) callback(false,'Problem reading mda. Invalid code: '+code);
					return;
				}
				
				m_is_initialized=true;
				if (callback) callback(true,'');
			}
			else {
				if (callback) callback(false,'Error reading mda: '+d0.error);
			}
		});
	};
	var m_retrieved_dataXY={};
	var m_retrieved_dataXZ={};
	function _getDataXY(inds,callback,params) {
		if (!params) params={};
		var b1=m_header_size;
		var factor=m_N[0]*m_N[1]*m_data_type_size;
		for (var k=2; k<m_num_dims; k++) {
			b1=b1+factor*(inds[k-2]||0);
			factor=factor*m_N[k];
		}
		var b2=b1+m_N[0]*m_N[1]*m_data_type_size;
		var bytes0=b1+':'+(b2-1);
		if (bytes0 in m_retrieved_dataXY) {
			if (callback) callback(m_retrieved_dataXY[bytes0],'');
			return true;
		}
		if (params.check_only) return false;
		m_file.getBytes({bytes:bytes0},function(d0) {
			if ((d0.success)&&(d0.data.length==(b2-b1))) {
				var ret=new Array2D(m_N[0],m_N[1]);
				if (m_data_type=='complex') {
					var tmp=new Float32Array(d0.data.buffer);
					var tmp_real=new Float32Array(tmp.length/2);
					var tmp_imag=new Float32Array(tmp.length/2);
					for (var i=0; i<tmp_real.length; i++) {
						tmp_real[i]=tmp[i*2];
						tmp_imag[i]=tmp[i*2+1];
					}
					ret.setData(tmp_real);
					ret.setDataImag(tmp_imag);
				}
				else if (m_data_type=='byte') {
					ret.setData(new Uint8Array(d0.data.buffer));
				}
				else if (m_data_type=='float32') {
					ret.setData(new Float32Array(d0.data.buffer));
				}
				else if (m_data_type=='int16') {
					ret.setData(new Int16Array(d0.data.buffer));
				}
				else if (m_data_type=='int32') {
					ret.setData(new Int32Array(d0.data.buffer));
				}
				else {
					if (callback) callback(null,'unexpected data type');
					return;
				}
				
				m_retrieved_dataXY[bytes0]=ret;
				if (callback) callback(ret,'');
			}
			else {
					if (callback) callback(null,'Problem reading data');
			}
		});
	}
	function _getDataXZ(inds,callback,params) {
		if (!params) params={};
		var bytes0='subarray;offset='+m_header_size+';'+'dimensions='+m_N[0]+','+m_N[1]+','+m_N[2]+','+m_N[3]+';index=*,'+inds[0]+',*,'+inds[1]+';size='+m_data_type_size;
		if (bytes0 in m_retrieved_dataXZ) {
			if (callback) callback(m_retrieved_dataXZ[bytes0],'');
			return true;
		}
		if (params.check_only) return false;
		var expected_length=m_N[0]*m_N[2]*m_data_type_size;
		m_file.getBytes({bytes:bytes0},function(d0) {
			if ((d0.success)&&(d0.data.length==(expected_length))) {
				var ret=new Array2D(m_N[0],m_N[2]);
				if (m_data_type=='complex') {
					var tmp=new Float32Array(d0.data.buffer);
					var tmp_real=new Float32Array(tmp.length/2);
					var tmp_imag=new Float32Array(tmp.length/2);
					for (var i=0; i<tmp_real.length; i++) {
						tmp_real[i]=tmp[i*2];
						tmp_imag[i]=tmp[i*2+1];
					}
					ret.setData(tmp_real);
					ret.setDataImag(tmp_imag);
				}
				else if (m_data_type=='byte') {
					ret.setData(new Uint8Array(d0.data.buffer));
				}
				else if (m_data_type=='float32') {
					ret.setData(new Float32Array(d0.data.buffer));
				}
				else if (m_data_type=='int16') {
					ret.setData(new Int16Array(d0.data.buffer));
				}
				else if (m_data_type=='int32') {
					ret.setData(new Int32Array(d0.data.buffer));
				}
				else {
					if (callback) callback(null,'unexpected data type');
					return;
				}
				
				m_retrieved_dataXZ[bytes0]=ret;
				if (callback) callback(ret,'');
			}
			else {
				if (callback) callback(null,'Problem reading data');
			}
		});
	}
	function _getDataZ(inds,callback,params) {
		if (!params) params={};
		
		bytes0='subarray;offset='+m_header_size+';'+'dimensions='+m_N[0]+','+m_N[1]+','+m_N[2]+','+m_N[3]+';index='+inds[0]+','+inds[1]+',*,'+(inds[3]||0)+';size='+m_data_type_size;
		expected_length=m_N[2]*m_data_type_size;		
		
		if (bytes0 in m_retrieved_dataXY) {
			if (callback) callback(m_retrieved_dataXY[bytes0],'');
			return true;
		}
		if (params.check_only) return false;
		m_file.getBytes({bytes:bytes0},function(d0) {
			if ((d0.success)&&(d0.data.length==expected_length)) {
				var ret=new Array2D(m_N[2],1);
				if (m_data_type=='complex') {
					var tmp=new Float32Array(d0.data.buffer);
					var tmp_real=new Float32Array(tmp.length/2);
					var tmp_imag=new Float32Array(tmp.length/2);
					for (var i=0; i<tmp_real.length; i++) {
						tmp_real[i]=tmp[i*2];
						tmp_imag[i]=tmp[i*2+1];
					}
					ret.setData(tmp_real);
					ret.setDataImag(tmp_imag);
				}
				else if (m_data_type=='byte') {
					ret.setData(new Uint8Array(d0.data.buffer));
				}
				else if (m_data_type=='float32') {
					ret.setData(new Float32Array(d0.data.buffer));
				}
				else if (m_data_type=='int16') {
					ret.setData(new Int16Array(d0.data.buffer));
				}
				else if (m_data_type=='int32') {
					ret.setData(new Int32Array(d0.data.buffer));
				}
				else {
					if (callback) callback(null,'unexpected data type');
					return;
				}
				
				m_retrieved_dataXY[bytes0]=ret;
				if (callback) callback(ret,'');
			}
			else {
					if (callback) callback(null,'Problem reading data');
			}
		});
	}
	function _writeArray(X,params,callback) {
		console.error('writeArray is not implemented... need to think about it.');
		callback({success:false,error:'writeArray is not implemented... need to think about it.'});
		
		/*var N1=X.N1();
		var N2=X.N2();
		var N3=1; if (X.N3) N3=X.N3();
		var N4=1; if (X.N4) N4=X.N4();
		var data_type='float32';
		
		var header_size=4+4+4+4*4;
		var data_size=4*N1*N2*N3*N4;
		
		var buffer=new ArrayBuffer(header_size+data_size);
		var HH=new Int32Array(buffer);
		HH[0]=-3; //float32
		HH[1]=4;
		HH[2]=4;
		HH[3]=N1;
		HH[4]=N2;
		HH[5]=N3;
		HH[6]=N4;
		
		var XX=new Float32Array(buffer);
		var ind=header_size/4;
		for (var t=0; t<N4; t++)
		for (var z=0; z<N3; z++)
		for (var y=0; y<N2; y++)
		for (var x=0; x<N1; x++) {
			XX[ind]=X.value(x,y,z,t);
			ind++;
		}
		
		Wisdm.setFileData({path:m_path,data:new Uint8Array(buffer)},function(tmp) {
			if (tmp.success  ==  'true') {
				that.initialize(function(success,err) {
					callback(success,err);
				});
			}
		});*/
	}
}

