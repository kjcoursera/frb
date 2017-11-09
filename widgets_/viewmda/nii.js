/*** require("array2d.js"); ***/
/*** require('affinetransformation.js'); ***/
/*** require('wisdmjs:/remotefile.js'); ***/

function Nii() {
	var that=this;
	
	this.setFile=function(file,use_memory_cache) {m_file=file; m_use_memory_cache=use_memory_cache||'';};
	this.initialize=function(callback) {return _initialize.apply(this,arguments);};
	this.isInitialized=function() {return m_is_initialized;};
	this.N1=function() {return m_N[0];};
	this.N2=function() {return m_N[1];};
	this.N3=function() {return m_N[2];};
	this.N4=function() {return m_N[3];};
	this.N5=function() {return m_N[4];};
	this.N6=function() {return m_N[5];};
	this.transformation=function() {return m_transformation;};
	this.getDataXY=function(inds,callback,params) {return _getDataXY.apply(this,arguments);};
	this.getDataXZ=function(inds,callback,params) {return _getDataXZ.apply(this,arguments);};
	this.getDataYZ=function(inds,callback,params) {return _getDataYZ.apply(this,arguments);};
	this.getDataT=function(inds,callback,params) {return _getDataT.apply(this,arguments);};
	this.getHeader=function() {return JSON.parse(JSON.stringify(m_header));};
	
	var m_file=new RemoteFile();
	var m_num_dims=2;
	var m_N=[1,1,1,1,1,1];
	var m_data_type='';
	var m_data_type_size=0;
	var m_header_size=348;
	var m_voxel_offset=0;
	var m_header={};
	var m_transformation=new AffineTransformation();
	var m_use_memory_cache='';
	var m_is_initialized=false;
	var m_nii_parser=new NiiParser();
	
	var _initialize=function(callback) {
		var file0=m_file;
		var suf=file0.fileType();
		//if ((suf=='hdr')||(suf=='img')) path0=utils.get_file_path(m_path)+'/'+utils.get_file_name_without_suffix(m_path)+'.hdr';
		file0.getBytes({bytes:'0:359'},function(d0) {
			if ((d0.success)&&(d0.data.length>=348)) {
				m_header=m_nii_parser.parseHeader(d0.data.buffer);
				
				m_num_dims=m_header.dim[0];
				for (var k=0; k<m_num_dims; k++) {
					m_N[k]=m_header.dim[k+1];
				}
				m_data_type=m_header.datatype_name;
				m_data_type_size=m_header.datatype_size;
				m_voxel_offset=m_header.vox_offset;
				if ((suf=='hdr')||(suf=='img')) m_voxel_offset=0;
				
				m_transformation.setIdentity();
				for (var i=0; i<=3; i++) {
					m_transformation.set(m_header.srow_x[i]||0,0,i);
					m_transformation.set(m_header.srow_y[i]||0,1,i);
					m_transformation.set(m_header.srow_z[i]||0,2,i);
				}
				
				m_is_initialized=true;
				if (callback) callback(true,'');
			}
			else {
				if (callback) callback(false,'Error reading header: '+d0.error);
			}
		});
	};
	var _getDataXY=function(inds,callback,params) {
		return _getData(inds,'XY',callback,params);
	};
	var _getDataXZ=function(inds,callback,params) {
		return _getData(inds,'XZ',callback,params);
	};
	var _getDataYZ=function(inds,callback,params) {
		return _getData(inds,'YZ',callback,params);
	};
	var _getDataT=function(inds,callback,params) {
		return _getData(inds,'T',callback,params);
	};
	var _getData=function(inds,plane,callback,params) {
		if (!m_is_initialized) {
			that.initialize(function() {
				if (m_is_initialized) {
					_getData(inds,plane,callback,params);
				}
			});
			return;
		}
		if (!params) params={};
		var b1=m_voxel_offset;
		
		var file0=m_file;
		var suf=file0.fileType();
		//if ((suf=='hdr')||(suf=='img')) path0=utils.get_file_path(m_path)+'/'+utils.get_file_name_without_suffix(m_path)+'.img';
		
		var bytes0='';
		var expected_length=0;
		if (plane=='XY') {
			bytes0='subarray;offset='+m_voxel_offset+';'+'dimensions='+m_N[0]+','+m_N[1]+','+m_N[2]+','+m_N[3]+';index=*,*,'+inds[0]+','+inds[1]+';size='+m_data_type_size;
			expected_length=m_N[0]*m_N[1]*m_data_type_size;
		}
		else if (plane=='XZ') {
			bytes0='subarray;offset='+m_voxel_offset+';'+'dimensions='+m_N[0]+','+m_N[1]+','+m_N[2]+','+m_N[3]+';index=*,'+inds[0]+',*,'+inds[1]+';size='+m_data_type_size;
			expected_length=m_N[0]*m_N[2]*m_data_type_size;
		}
		else if (plane=='YZ') {
			bytes0='subarray;offset='+m_voxel_offset+';'+'dimensions='+m_N[0]+','+m_N[1]+','+m_N[2]+','+m_N[3]+';index='+inds[0]+',*,*,'+inds[1]+';size='+m_data_type_size;
			expected_length=m_N[1]*m_N[2]*m_data_type_size;
		}
		else if (plane=='T') {
			bytes0='subarray;offset='+m_voxel_offset+';'+'dimensions='+m_N[0]+','+m_N[1]+','+m_N[2]+','+m_N[3]+';index='+inds[0]+','+inds[1]+','+inds[2]+',*'+';size='+m_data_type_size;
			expected_length=m_N[3]*m_data_type_size;
		}
		//implement the retrieved stuff
		if (params.check_only) return false;
		file0.getBytes({bytes:bytes0/*,compression:'zlib'*/},function(d0) {
			if ((d0.success)&&(d0.data.length==expected_length)) {
				var ret;
				if (plane=='XY') ret=new Array2D(m_N[0],m_N[1]);
				else if (plane=='XZ') ret=new Array2D(m_N[0],m_N[2]);
				else if (plane=='YZ') ret=new Array2D(m_N[1],m_N[2]);
				else if (plane=='T') ret=new Array2D(m_N[3],1);
				var data0=null;
				var chunk_size=1;
				if (m_data_type=='uchar') {
					data0=new Uint8Array(d0.data.buffer);
					chunk_size=1;
				}
				else if (m_data_type=='sshort') {
					data0=new Int16Array(d0.data.buffer);
					chunk_size=2;
				}
				else if (m_data_type=='sint') {
					data0=new Int32Array(d0.data.buffer);
					chunk_size=4;
				}
				else if (m_data_type=='float') {
					data0=new Float32Array(d0.data.buffer);
					chunk_size=4;
				}
				else if (m_data_type=='complex') {
					data0=new Float64Array(d0.data.buffer);
					chunk_size=8;
				}
				else if (m_data_type=='double') {
					data0=new Float64Array(d0.data.buffer);
					chunk_size=8;
				}
				else if (m_data_type=='schar') {
					data0=new Int8Array(d0.data.buffer);
					chunk_size=1;
				}
				else if (m_data_type=='ushort') {
					data0=new Uint16Array(d0.data.buffer);
					chunk_size=2;
				}
				else if (m_data_type=='uint') {
					data0=new Uint32Array(d0.data.buffer);
					chunk_size=4;
				}
				else {
					if (callback) callback(null,'unexpected data type: '+m_data_type);
					return;
				}
				if (m_nii_parser.swapNeeded()) {
					data0=flip_endianness(data0,chunk_size);
				}
				ret.setData(data0);
				
				if (callback) callback(ret,'');
			}
			else {
				if (callback) callback(null,'Problem reading data: '+(d0.error||''));
			}
		});
	};
}


//the below code is based on parsenii.js from:
//https://github.com/xtk/X/tree/master/io

function NiiParser() {
	var that=this;
	
	var m_data=null;
	var m_data_pos=0;
	var m_nativeLittleEndian=(new Int8Array(new Int16Array([ 1 ]).buffer)[0] > 0); //See https://github.com/kig/DataStream.js/blob/master/DataStream.js
	var m_littleEndian=true;
	var m_swap_needed=false;
	
	this.swapNeeded=function() {return m_swap_needed;};
	this.parseHeader=function(X) {
		m_data=X;
		m_data_pos=0;
		var OUTPUT = {
			sizeof_hdr: 0,
			data_type: null, /* !< ++UNUSED++ *//* char data_type[10]; */
			db_name: null, /* !< ++UNUSED++ *//* char db_name[18]; */
			extents: 0, /* !< ++UNUSED++ *//* int extents; */
			session_error: 0, /* !< ++UNUSED++ *//* short session_error; */
			regular: 0, /* !< ++UNUSED++ *//* char regular; */
			dim_info: null,/* !< MRI slice ordering. *//* char hkey_un0; */
			dim: null, // *!< Data array dimensions.*/ /* short dim[8]; */
			intent_p1: 0, // *!< 1st intent parameter. */ /* short unused8; */
			intent_p2: 0, // *!< 2nd intent parameter. */ /* short unused10; */
			intent_p3: 0, // *!< 3rd intent parameter. */ /* short unused12; */
			intent_code: 0, // *!< NIFTI_INTENT_* code. */ /* short unused14; */
			datatype: 0, // *!< Defines data type! */ /* short datatype; */
			bitpix: 0, // *!< Number bits/voxel. */ /* short bitpix; */
			slice_start: 0, // *!< First slice index. */ /* short dim_un0; */
			pixdim: null, // *!< Grid spacings. */ /* float pixdim[8]; */
			vox_offset: 0, // *!< Offset into .nii file */ /* float vox_offset; */
			scl_slope: 0, // *!< Data scaling: slope. */ /* float funused1; */
			scl_inter: 0, // *!< Data scaling: offset. */ /* float funused2; */
			slice_end: 0, // *!< Last slice index. */ /* float funused3; */
			slice_code: null, // *!< Slice timing order. */
			xyzt_units: null, // *!< Units of pixdim[1..4] */
			cal_max: 0, // *!< Max display intensity */ /* float cal_max; */
			cal_min: 0, // *!< Min display intensity */ /* float cal_min; */
			slice_duration: 0, // *!< Time for 1 slice. */ /* float compressed; */
			toffset: 0, // *!< Time axis shift. */ /* float verified; */
			glmax: 0,/* !< ++UNUSED++ *//* int glmax; */
			glmin: 0, /* !< ++UNUSED++ *//* int glmin; */
			descrip: null, // *!< any text you like. */ /* char descrip[80]; */
			aux_file: null, // *!< auxiliary filename. */ /* char aux_file[24]; */
			qform_code: 0, // *!< NIFTI_XFORM_* code. */ /*-- all ANALYZE 7.5 ---*/
			sform_code: 0, // *!< NIFTI_XFORM_* code. */ /* fields below here */
			quatern_b: 0, // *!< Quaternion b param. */
			quatern_c: 0, // *!< Quaternion c param. */
			quatern_d: 0, // *!< Quaternion d param. */
			qoffset_x: 0, // *!< Quaternion x shift. */
			qoffset_y: 0, // *!< Quaternion y shift. */
			qoffset_z: 0, // *!< Quaternion z shift. */
			srow_x: null, // *!< 1st row affine transform. */
			srow_y: null, // *!< 2nd row affine transform. */
			srow_z: null, // *!< 3rd row affine transform. */
			intent_name: null, // *!< 'name' or meaning of data. */
			magic: null, // *!< MUST be "ni1\0" or "n+1\0". */
			data: null,
			min: Infinity,
			max: -Infinity
		};
		
		// header_key substruct
		OUTPUT.sizeof_hdr = _scan('uint');
		OUTPUT.data_type = _scan('uchar', 10);
		OUTPUT.db_name = _scan('uchar', 18);
		OUTPUT.extents = _scan('uint');
		OUTPUT.session_error = _scan('ushort');
		OUTPUT.regular = _scan('uchar');
		OUTPUT.dim_info = _scan('uchar');
		
		// image_dimension substruct
		OUTPUT.dim = _scan('ushort', 8);
		OUTPUT.intent_p1 = _scan('float');
		OUTPUT.intent_p2 = _scan('float');
		OUTPUT.intent_p3 = _scan('float');
		OUTPUT.intent_code = _scan('ushort');
		OUTPUT.datatype = _scan('ushort');
		OUTPUT.bitpix = _scan('ushort');
		OUTPUT.slice_start = _scan('ushort');
		OUTPUT.pixdim = _scan('float', 8);
		OUTPUT.vox_offset = _scan('float');
		OUTPUT.scl_slope = _scan('float');
		OUTPUT.scl_inter = _scan('float');
		OUTPUT.slice_end = _scan('ushort');
		OUTPUT.slice_code = _scan('uchar');
		OUTPUT.xyzt_units = _scan('uchar');
		OUTPUT.cal_max = _scan('float');
		OUTPUT.cal_min = _scan('float');
		OUTPUT.slice_duration = _scan('float');
		OUTPUT.toffset = _scan('float');
		OUTPUT.glmax = _scan('uint', 1);
		OUTPUT.glmin = _scan('uint', 1);
		
		// data_history substruct
		OUTPUT.descrip = _scan('uchar', 80);
		OUTPUT.aux_file = _scan('uchar', 24);
		OUTPUT.qform_code = _scan('ushort');
		OUTPUT.sform_code = _scan('ushort');
		OUTPUT.quatern_b = _scan('float');
		OUTPUT.quatern_c = _scan('float');
		OUTPUT.quatern_d = _scan('float');
		OUTPUT.qoffset_x = _scan('float');
		OUTPUT.qoffset_y = _scan('float');
		OUTPUT.qoffset_z = _scan('float');
		
		OUTPUT.srow_x = _scan('float', 4);
		OUTPUT.srow_y = _scan('float', 4);
		OUTPUT.srow_z = _scan('float', 4);
		
		OUTPUT.intent_name = _scan('uchar', 16);
		
		OUTPUT.magic = _scan('uchar', 4);
		
	
		// jump to vox_offset which is very important since the
		// header can be shorter as the usual 348 bytes
		m_data_pos=parseInt(OUTPUT.vox_offset, 10);
		
		// number of pixels in the volume
		//var volsize = OUTPUT.dim[1] * OUTPUT.dim[2] * OUTPUT.dim[3];
		
		// scan the pixels regarding the data type
		switch (OUTPUT.datatype) {
		case 2:
			// unsigned char
			OUTPUT.datatype_name='uchar';
			OUTPUT.datatype_size=1;
			//OUTPUT.data = _scan('uchar', volsize);
			break;
		case 4:
			// signed short
			OUTPUT.datatype_name='sshort';
			OUTPUT.datatype_size=2;
			//OUTPUT.data = _scan('sshort', volsize);
			break;
		case 8:
			// signed int
			OUTPUT.datatype_name='sint';
			OUTPUT.datatype_size=4;
			//OUTPUT.data = _scan('sint', volsize);
			break;
		case 16:
			// float
			OUTPUT.datatype_name='float';
			OUTPUT.datatype_size=4;
			//OUTPUT.data = _scan('float', volsize);
			break;
		case 32:
			// complex
			OUTPUT.datatype_name='complex';
			OUTPUT.datatype_size=8;
			//OUTPUT.data = _scan('complex', volsize);
			break;
		case 64:
			// double
			OUTPUT.datatype_name='double';
			OUTPUT.datatype_size=8;
			//OUTPUT.data = _scan('double', volsize);
			break;
		case 256:
			// signed char
			OUTPUT.datatype_name='schar';
			OUTPUT.datatype_size=1;
			//OUTPUT.data = _scan('schar', volsize);
			break;
		case 512:
			// unsigned short
			OUTPUT.datatype_name='ushort';
			OUTPUT.datatype_size=2;
			//OUTPUT.data = _scan('ushort', volsize);
			break;
		case 768:
			// unsigned int
			OUTPUT.datatype_name='uint';
			OUTPUT.datatype_size=4;
			//OUTPUT.data = _scan('uint', volsize);
			break;
		
		default:
			
			if (m_littleEndian) {
				//try big Endian
				m_littleEndian=false;
				m_swap_needed=true;
				var OUTPUT2=that.parseHeader(X);
				if (!OUTPUT2) {
					throw new Error('Unsupported NII data type: ' + OUTPUT.datatype+' (also tried big endian)');
				}
				return OUTPUT2;
			}
			else {	
				return null;
			}
		}		
		return OUTPUT;
		
	};
	
	var _scan=function(type, chunks) {
		if (typeof(chunks)=='undefined') chunks=1;
	
		var _chunkSize = 1;
		var _array_type = Uint8Array;
	
		switch (type) {
	
		// 1 byte data types
		case 'uchar':
			break;
		case 'schar':
			_array_type = Int8Array;
			break;
		// 2 byte data types
		case 'ushort':
			_array_type = Uint16Array;
			_chunkSize = 2;
			break;
		case 'sshort':
			_array_type = Int16Array;
			_chunkSize = 2;
			break;
		// 4 byte data types
		case 'uint':
			_array_type = Uint32Array;
			_chunkSize = 4;
			break;
		case 'sint':
			_array_type = Int32Array;
			_chunkSize = 4;
			break;
		case 'float':
			_array_type = Float32Array;
			_chunkSize = 4;
			break;
		case 'complex':
			_array_type = Float64Array;
			_chunkSize = 8;
			break;
		case 'double':
			_array_type = Float64Array;
			_chunkSize = 8;
			break;
	
		}
	
		var _bytes=new _array_type(m_data.slice(m_data_pos,m_data_pos+chunks*_chunkSize));
		m_data_pos=m_data_pos+chunks*_chunkSize;
	
		// if required, flip the endianness of the bytes
		if (m_nativeLittleEndian != m_littleEndian) {
			// we need to flip here since the format doesn't match the native endianness
			_bytes = flip_endianness(_bytes, _chunkSize);
		}
	
		if (chunks == 1) {
			// if only one chunk was requested, just return one value
			return _bytes[0];
	
		}
	
		// return the byte array
		return _bytes;
	
	};
  
}

function flip_endianness(array,chunksize) {
	var u8=new Uint8Array(array.buffer,array.byteOffset,array.byteLength);
	for (var i=0; i<array.byteLength; i+=chunksize) {
		for (var j=i+chunksize-1,k=i; j>k; j--, k++) {
			var tmp=u8[k];
			u8[k]=u8[j];
			u8[j]=tmp;
		}
	}
	return array;
}

