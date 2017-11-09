function AffineTransformation(initial_data) {
	var that=this;
	
	this.get=function(i,j) {return m_data[i][j];};
	this.set=function(val,i,j) {m_data[i][j]=val;};
	this.toList=function() {var ret=[]; for (var i=0; i<4; i++) for (var j=0; j<4; j++) ret.push(that.get(i,j)); return ret;};
	this.fromList=function(list) {var ct=0; for (var i=0; i<4; i++) for (var j=0; j<4; j++) {that.set(list[ct],i,j); ct++;}};
	this.isIdentity=function() {for (var j=0; j<4; j++) for (var i=0; i<4; i++) {if ((i==j)&&(that.get(i,j)!==1)) return false; if ((i!=j)&&(that.get(i,j)!==0)) return false;} return true;};
	this.setIdentity=function() {for (var j=0; j<4; j++) for (var i=0; i<4; i++) {if (i==j) that.set(1,i,j); else that.set(0,i,j);}};
	this.translate=function(dx,dy,dz,right_multiply) {_translate(dx,dy,dz,right_multiply);};
	this.rotateX=function(deg,right_multiply) {_rotateX(deg,right_multiply);};
	this.rotateY=function(deg,right_multiply) {_rotateY(deg,right_multiply);};
	this.rotateZ=function(deg,right_multiply) {_rotateZ(deg,right_multiply);};
	this.scale=function(scalex,scaley,scalez,right_multiply) {_scale(scalex,scaley,scalez,right_multiply);};
	this.leftMultiplyBy=function(M) {_leftMultiplyBy(M);};
	this.rightMultiplyBy=function(M) {_rightMultiplyBy(M);};
	this.copyFrom=function(M) {for (var j=0; j<4; j++) for (var i=0; i<4; i++) that.set(M.get(i,j),i,j);};
	this.map=function(pt) {return _map(pt);};
	this.inverse=function() {return _inverse();};
	
	var m_data=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
	if (initial_data) {
		for (var i=0; i<4; i++)
		for (var j=0; j<4; j++)
			m_data[i][j]=initial_data[i][j];
	}
	
	var _map=function(pt) {
		var ret=[0,0,0];
		for (var i=0; i<3; i++) {
			var tmp0=0;
			for (var j=0; j<3; j++) {
				tmp0+=m_data[i][j]*pt[j];
			}
			tmp0+=m_data[i][3];
			ret[i]=tmp0;
		}
		return ret;
	};
	
	var _translate=function(dx,dy,dz,right_multiply) {
		var MM=new AffineTransformation([[1,0,0,dx],[0,1,0,dy],[0,0,1,dz],[0,0,0,1]]);
		if (right_multiply) that.rightMultiplyBy(MM);
		else that.leftMultiplyBy(MM);
	};
	
	var _rotateX=function(deg,right_multiply) {
		var alpha=deg*Math.PI/180;
		var cc=Math.cos(alpha);
		var ss=Math.sin(alpha);
		var MM=new AffineTransformation([[1,0,0,0],[0,cc,-ss,0],[0,ss,cc,0],[0,0,0,1]]);
		if (right_multiply) that.rightMultiplyBy(MM);
		else that.leftMultiplyBy(MM);
	};
	var _rotateY=function(deg,right_multiply) {
		var alpha=deg*Math.PI/180;
		var cc=Math.cos(alpha);
		var ss=Math.sin(alpha);
		var MM=new AffineTransformation([[cc,0,-ss,0],[0,1,0,0],[ss,0,cc,0],[0,0,0,1]]);
		if (right_multiply) that.rightMultiplyBy(MM);
		else that.leftMultiplyBy(MM);
	};
	var _rotateZ=function(deg,right_multiply) {
		var alpha=deg*Math.PI/180;
		var cc=Math.cos(alpha);
		var ss=Math.sin(alpha);
		var MM=new AffineTransformation([[cc,-ss,0,0],[ss,cc,0,0],[0,0,1,0],[0,0,0,1]]);
		if (right_multiply) that.rightMultiplyBy(MM);
		else that.leftMultiplyBy(MM);
	};
	var _scale=function(scalex,scaley,scalez,right_multiply) {
		var MM=new AffineTransformation([[scalex,0,0,0],[0,scaley,0,0],[0,0,scalez,0],[0,0,0,1]]);
		if (right_multiply) that.rightMultiplyBy(MM);
		else that.leftMultiplyBy(MM);
	};
	var _leftMultiplyBy=function(M) {
		var result_matrix=new AffineTransformation();
		for (var i=0; i<4; i++)
		for (var j=0; j<4; j++) {
			var val=0;
			for (var k=0; k<4; k++) {
				val+=M.get(i,k)*that.get(k,j);
			}
			result_matrix.set(val,i,j);
		}
		that.copyFrom(result_matrix);
	};
	var _rightMultiplyBy=function(M) {
		var result_matrix=new AffineTransformation();
		for (var i=0; i<4; i++)
		for (var j=0; j<4; j++) {
			var val=0;
			for (var k=0; k<4; k++) {
				val+=that.get(i,k)*M.get(k,j);
			}
			result_matrix.set(val,i,j);
		}
		that.copyFrom(result_matrix);
	};
	
	function _inverse() {
		var ret=new AffineTransformation();
		ret.fromList(inverse44(that.toList()));
		return ret;
	}
	function inverse44(matrix) {
		var result=[];
		var tmp_0 = matrix[10] * matrix[15];
		var tmp_1 = matrix[14] * matrix[11];
		var tmp_2 = matrix[6] * matrix[15];
		var tmp_3 = matrix[14] * matrix[7];
		var tmp_4 = matrix[6] * matrix[11];
		var tmp_5 = matrix[10] * matrix[7];
		var tmp_6 = matrix[2] * matrix[15];
		var tmp_7 = matrix[14] * matrix[3];
		var tmp_8 = matrix[2] * matrix[11];
		var tmp_9 = matrix[10] * matrix[3];
		var tmp_10 = matrix[2] * matrix[7];
		var tmp_11 = matrix[6] * matrix[3];
		var tmp_12 = matrix[8] * matrix[13];
		var tmp_13 = matrix[12] * matrix[9];
		var tmp_14 = matrix[4] * matrix[13];
		var tmp_15 = matrix[12] * matrix[5];
		var tmp_16 = matrix[4] * matrix[9];
		var tmp_17 = matrix[8] * matrix[5];
		var tmp_18 = matrix[0] * matrix[13];
		var tmp_19 = matrix[12] * matrix[1];
		var tmp_20 = matrix[0] * matrix[9];
		var tmp_21 = matrix[8] * matrix[1];
		var tmp_22 = matrix[0] * matrix[5];
		var tmp_23 = matrix[4] * matrix[1];
		
		var t0 = ((tmp_0 * matrix[5] + tmp_3 * matrix[9] + tmp_4 * matrix[13]) - (tmp_1 * matrix[5] + tmp_2 * matrix[9] + tmp_5 * matrix[13]));
		var t1 = ((tmp_1 * matrix[1] + tmp_6 * matrix[9] + tmp_9 * matrix[13]) - (tmp_0 * matrix[1] + tmp_7 * matrix[9] + tmp_8 * matrix[13]));
		var t2 = ((tmp_2 * matrix[1] + tmp_7 * matrix[5] + tmp_10 * matrix[13]) - (tmp_3 * matrix[1] + tmp_6 * matrix[5] + tmp_11 * matrix[13]));
		var t3 = ((tmp_5 * matrix[1] + tmp_8 * matrix[5] + tmp_11 * matrix[9]) - (tmp_4 * matrix[1] + tmp_9 * matrix[5] + tmp_10 * matrix[9]));
		
		var d1 = (matrix[0] * t0 + matrix[4] * t1 + matrix[8] * t2 + matrix[12] * t3);
		if (Math.abs(d1) < 1e-5) {
			return null;
		}
		var d = 1.0 / d1;
		
		var out_00 = d * t0;
		var out_01 = d * t1;
		var out_02 = d * t2;
		var out_03 = d * t3;
		
		var out_10 = d * ((tmp_1 * matrix[4] + tmp_2 * matrix[8] + tmp_5 * matrix[12]) - (tmp_0 * matrix[4] + tmp_3 * matrix[8] + tmp_4 * matrix[12]));
		var out_11 = d * ((tmp_0 * matrix[0] + tmp_7 * matrix[8] + tmp_8 * matrix[12]) - (tmp_1 * matrix[0] + tmp_6 * matrix[8] + tmp_9 * matrix[12]));
		var out_12 = d * ((tmp_3 * matrix[0] + tmp_6 * matrix[4] + tmp_11 * matrix[12]) - (tmp_2 * matrix[0] + tmp_7 * matrix[4] + tmp_10 * matrix[12]));
		var out_13 = d * ((tmp_4 * matrix[0] + tmp_9 * matrix[4] + tmp_10 * matrix[8]) - (tmp_5 * matrix[0] + tmp_8 * matrix[4] + tmp_11 * matrix[8]));
		
		var out_20 = d * ((tmp_12 * matrix[7] + tmp_15 * matrix[11] + tmp_16 * matrix[15]) - (tmp_13 * matrix[7] + tmp_14 * matrix[11] + tmp_17 * matrix[15]));
		var out_21 = d * ((tmp_13 * matrix[3] + tmp_18 * matrix[11] + tmp_21 * matrix[15]) - (tmp_12 * matrix[3] + tmp_19 * matrix[11] + tmp_20 * matrix[15]));
		var out_22 = d * ((tmp_14 * matrix[3] + tmp_19 * matrix[7] + tmp_22 * matrix[15]) - (tmp_15 * matrix[3] + tmp_18 * matrix[7] + tmp_23 * matrix[15]));
		var out_23 = d * ((tmp_17 * matrix[3] + tmp_20 * matrix[7] + tmp_23 * matrix[11]) - (tmp_16 * matrix[3] + tmp_21 * matrix[7] + tmp_22 * matrix[11]));
		
		var out_30 = d * ((tmp_14 * matrix[10] + tmp_17 * matrix[14] + tmp_13 * matrix[6]) - (tmp_16 * matrix[14] + tmp_12 * matrix[6] + tmp_15 * matrix[10]));
		var out_31 = d * ((tmp_20 * matrix[14] + tmp_12 * matrix[2] + tmp_19 * matrix[10]) - (tmp_18 * matrix[10] + tmp_21 * matrix[14] + tmp_13 * matrix[2]));
		var out_32 = d * ((tmp_18 * matrix[6] + tmp_23 * matrix[14] + tmp_15 * matrix[2]) - (tmp_22 * matrix[14] + tmp_14 * matrix[2] + tmp_19 * matrix[6]));
		var out_33 = d * ((tmp_22 * matrix[10] + tmp_16 * matrix[2] + tmp_21 * matrix[6]) - (tmp_20 * matrix[6] + tmp_23 * matrix[10] + tmp_17 * matrix[2]));
		
		result[0] = out_00;
		result[1] = out_01;
		result[2] = out_02;
		result[3] = out_03;
		result[4] = out_10;
		result[5] = out_11;
		result[6] = out_12;
		result[7] = out_13;
		result[8] = out_20;
		result[9] = out_21;
		result[10] = out_22;
		result[11] = out_23;
		result[12] = out_30;
		result[13] = out_31;
		result[14] = out_32;
		result[15] = out_33;
	
		return result;
	}
}

