/*** require("array2d.js"); ***/
/*** require("wait_for_visible.js"); ***/

function Array2DOverlayView() {
	var that=this;
	
	/*
	selection modes: rectangle, polygon, draw, erase future:ellipse
	*/
	
	this.div=function() {return m_div;};
	this.setArray=function(X) {return _setArray.apply(this,arguments);};
	this.setRgbArrays=function(R,G,B) {return _setRgbArrays(R,G,B);};
	this.setOverlay=function(X) {return _setOverlay.apply(this,arguments);};
	this.setThresholdMap=function(X) {return _setThresholdMap.apply(this,arguments);};
	this.setColorMap=function(map) {m_color_map=map;};
	this.setColorMapColors=function(colors) {m_colormap_colors=colors;};
	this.array=function() {return m_array;};
	this.overlay=function() {return m_overlay;};
	this.setSize=function(W,H) {m_width=W; m_height=H;};
	this.refresh=function(callback) {return _refresh.apply(this,arguments);};
	this.currentPosition=function() {return m_current_position;};
	this.currentValue=function() {return _currentValue();};
	this.currentValueImag=function() {return _currentValueImag();};
	this.valueAt=function(x,y) {return _valueAt(x,y);};
	this.overlayValueAt=function(x,y) {return _overlayValueAt(x,y);};
	this.currentOverlayValue=function() {return _currentOverlayValue();};
	this.currentValueAt=function(x,y) {return _currentValueAt(x,y);};
	this.onCurrentPositionChanged=function(callback) {m_current_position_changed_handlers.push(callback);};
	this.onPointClicked=function(callback) {m_div.bind('point-clicked',function(evt,obj) {callback(obj.pos);});};
	this.onPointRightClicked=function(callback) {m_div.bind('right-click',function(evt,obj) {callback(obj.pos);});};
	this.setCurrentPosition=function(pos) {return _setCurrentPosition.apply(this,arguments);};
	this.setSelectionMode=function(mode) {if (mode==m_selection_mode) return; m_selection_mode=mode; update_cursor();};
	this.selectionMode=function() {return m_selection_mode;};
	this.setSelectedPolygon=function(points) {m_selected_polygon=JSON.parse(JSON.stringify(points)); update_cursor();};
	this.selectedPoints=function() {return _selectedPoints();};
	this.selectedPolygon=function() {return JSON.parse(JSON.stringify(m_selected_polygon));};
	this.selectedRect=function() {return JSON.parse(JSON.stringify(m_selected_rect));};
	this.onSelectedRectChanged=function(callback) {m_div.bind('selected_rect_changed',function(evt,obj) {callback();});};
	this.setSelectedRect=function(R) {return _setSelectedRect.apply(this,arguments);};
	this.setWindowRange=function(min,max) {m_window_min=min; m_window_max=max; auto_compute_window_range();};
	this.setOverlayThreshold=function(thr) {m_overlay_threshold=thr; auto_compute_overlay_range();};
	this.setOverlayRange=function(min,max,neg) {m_overlay_min=min; m_overlay_max=max; m_overlay_neg=neg||false; auto_compute_overlay_range();};
	this.setSwapX=function(val) {m_swap_x=val;};
	this.setSwapY=function(val) {m_swap_y=val;};
	this.setCursorVisible=function(val) {m_cursor_visible=val;};
	this.createImageUrl=function(callback) {return _createImageUrl.apply(this,arguments);};
	//before calling getOverlayColor, you must call setOverlayRange and setOverlayThreshold
	this.getOverlayColor=function(val) {return get_color(0,val,val);}; //returns an array of length 3, rgb
	this.addCustomCanvas=function(name) {return _addCustomCanvas.apply(this,arguments);};
	this.getCustomCanvasContext=function(name) {return m_custom_canvases[name][0].getContext('2d');};
	this.indexToPixel=function(ind) {return index2pixel(ind);};
	this.imageWidth=function() {return m_image_width;};
	this.imageHeight=function() {return m_image_height;};
	this.setCustomColorer=function(colorer) {m_custom_colorer=colorer;};
	this.setZoomRect=function(ZR) {m_zoom_rect[0]=ZR[0]; m_zoom_rect[1]=ZR[1]; m_zoom_rect[2]=ZR[2]; m_zoom_rect[3]=ZR[3];};
	this.imageRect=function() {return [m_image_left,m_image_top,m_image_width,m_image_height];};
	this.onMouseDrag=function(handler) {m_mouse_drag_handlers.push(handler);};
	this.onRefresh=function(callback) {m_div.bind('on-refresh',function() {callback();});};
	
	var m_div=$('<div style="position:absolute;background-color:black;"></div>');
	var m_image_div=$('<div style="position:absolute"></div>');
	var m_display_mode='magnitude'; 
	m_div.append(m_image_div);
	var m_width=0;
	var m_height=0;
	var m_array=null;
	var m_rgb_arrays=null;
	var m_overlay=null;
	var m_threshold_map=null;
	var m_canvas=null;
	var m_canvas2=null;
	var m_custom_canvases={};
	var m_image_width=0;
	var m_image_height=0;
	var m_image_left=0;
	var m_image_top=0;
	var m_window_min='0%';
	var m_window_max='100%';
	var m_actual_window_min=0;
	var m_actual_window_max=100;
	var m_overlay_threshold=0;
	var m_overlay_min=0;
	var m_overlay_max=1;
	var m_actual_overlay_threshold=0;
	var m_actual_overlay_min=0;
	var m_actual_overlay_max=1;
	var m_overlay_neg=false;
	var m_current_position=[-1,-1];
	var m_selected_rect=[-1,-1,0,0];
	var m_selection_mode='rectangle';
	var m_selected_polygon=[]; //list of pairs
	var m_selected_polygon_complete=false;
	var m_current_position_changed_handlers=[];
	var m_swap_x=false;
	var m_swap_y=false;
	var m_colormap_colors=[];
	var m_color_map='';
	var m_custom_colorer=null;
	var m_zoom_rect=[-1,-1,0,0];
	var m_cursor_visible=true;
	var m_brightness_factor=1;
	var m_factor_x=1; //used internally for optimum display
	var m_factor_y=1;
	var m_last_mouse_drag_index=[0,0];
	var m_mouse_drag_handlers=[];
	
	var make_canvas=function() {
		var el=document.createElement('canvas'); 
		$(el).css('position','absolute');
		if (typeof(G_vmlCanvasManager)!='undefined') 
			G_vmlCanvasManager.initElement(el);
		return $(el);
	};
	
	m_canvas=null;
	m_canvas2=null;
	m_image_width=0;
	m_image_height=0;
	m_image_left=0;
	m_image_top=0;
	m_canvas=make_canvas();
	m_canvas2=make_canvas();
	m_image_div.append(m_canvas);
	m_image_div.append(m_canvas2);
	
	var mouse_is_down=false;
	var mouse_down_point=[0,0];
	var right_mouse_is_down=false;
	var right_mouse_down_point=[0,0];
	m_image_div.bind('contextmenu',function(evt) {return false;});
	m_image_div.mousedown(function(evt) {
		var pt0=[evt.pageX-m_image_div.offset().left,evt.pageY-m_image_div.offset().top];
		var indx0=pixel2index(pt0);
		if ((evt.button||0)==2) {
			//right click
			
			if (m_selection_mode=='polygon') {
				if (m_selected_polygon.length>0) {
					m_selected_polygon_complete=true;
					update_cursor();
				}
			}
			
			m_div.trigger('right-click',{pos:indx0});
			evt.preventDefault();
			right_mouse_is_down=true;
			right_mouse_down_point=pt0;
			return false;
		}
		
		m_last_mouse_drag_index=indx0;
		
		mouse_down_point=pt0;
		mouse_is_down=true;
		that.setSelectedRect([-1,-1,0,0]);
		
		that.setCurrentPosition(indx0);
		if (m_selection_mode=='polygon') {
			if (m_selected_polygon_complete) {
				m_selected_polygon=[];
				m_selected_polygon_complete=false;
			}
			//check to see if polygon is complete
			/*
			var is_complete=false;
			if (m_selected_polygon.length>0) {
				if (compute_distance(m_selected_polygon[0],indx0)<3) {
					is_complete=true;
				}
			}
			if (is_complete) {
				m_selected_polygon_complete=true;
			}
			else */
			m_selected_polygon.push(indx0);
			update_cursor();
		}
		m_div.trigger('point-clicked',{pos:indx0});
	});
	m_image_div.mouseup(function(evt) {
		if (evt.button==2) right_mouse_is_down=false;
		else mouse_is_down=false;
	});
	m_image_div.mousemove(function(evt) {
		if (mouse_is_down) {
			if ((m_selection_mode=='rectangle')||(m_selection_mode=='ellipse')) {
				var pt0=[evt.pageX-m_image_div.offset().left,evt.pageY-m_image_div.offset().top];
				var dx=pt0[0]-mouse_down_point[0];
				var dy=pt0[1]-mouse_down_point[1];
				if (((Math.abs(dx)>2)&&(Math.abs(dy)>2))||(m_selected_rect[0]>=0)) {
					var indx1=pixel2index(mouse_down_point);
					var indx2=pixel2index(pt0);
					that.setSelectedRect([Math.min(indx1[0],indx2[0]),Math.min(indx1[1],indx2[1]),Math.abs(indx1[0]-indx2[0])+1,Math.abs(indx1[1]-indx2[1])+1]);
				}
				else {
					that.setSelectedRect([-1,-1,0,0]);
				}
			}
			else if ((m_selection_mode=='draw')||(m_selection_mode=='erase')) {
				var pt00=[evt.pageX-m_image_div.offset().left,evt.pageY-m_image_div.offset().top];
				var ind00=pixel2index(pt00);
				m_div.trigger('point-clicked',{pos:ind00});
			}
			if (m_mouse_drag_handlers.length>0) {
				var pt00=[evt.pageX-m_image_div.offset().left,evt.pageY-m_image_div.offset().top];
				var ind00=pixel2index(pt00);
				if ((ind00[0]!=m_last_mouse_drag_index[0])||(ind00[1]!=m_last_mouse_drag_index[1])) {
					m_mouse_drag_handlers.forEach(function(handler) {
						handler(ind00,m_last_mouse_drag_index);
					});
					m_last_mouse_drag_index=ind00;
				}
			}
		}
		if (right_mouse_is_down) {
			if ((m_selection_mode=='draw')||(m_selection_mode=='erase')) {
				var pt00=[evt.pageX-m_image_div.offset().left,evt.pageY-m_image_div.offset().top];
				var ind00=pixel2index(pt00);
				m_div.trigger('right-click',{pos:ind00});
			}
		}
	});
	
	m_image_div.attr('tabindex','1');
	m_image_div.css({cursor:'crosshair',outline:'none'});
	m_image_div.keydown(function(evt) {on_key_down(evt);});

	function compute_distance(pt1,pt2) {
		var d1=pt1[0]-pt2[0];
		var d2=pt1[1]-pt2[1];
		return Math.sqrt(d1*d1+d2*d2);
	}
	var _currentValue=function() {
		if (!m_array) return 0;
		if ((m_current_position[0]<0)||(m_current_position[1]<0)) return 0;
		return m_array.value(m_current_position[0],m_current_position[1]);
	};
	var _currentValueImag=function() {
		if (!m_array) return 0;
		if ((m_current_position[0]<0)||(m_current_position[1]<0)) return 0;
		return m_array.valueImag(m_current_position[0],m_current_position[1]);
	};
	var _valueAt=function(x,y) {
		if (!m_array) return 0;
		return m_array.value(x,y);
	};
	var _overlayValueAt=function(x,y) {
		if (!m_overlay) return 0;
		return m_overlay.value(x,y);
	};
	var _currentOverlayValue=function() {
		if (!m_overlay) return null;
		if ((m_current_position[0]<0)||(m_current_position[1]<0)) return 0;
		return m_overlay.value(m_current_position[0],m_current_position[1]);
	};
	var _setArray=function(X) {
		m_array=X;
		auto_compute_window_range();
	};
	var _setRgbArrays=function(R,G,B) {
		if (!R) {
			m_rgb_arrays=null;
			return;
		}
		m_array=R;
		m_rgb_arrays=[R,G,B];
		auto_compute_window_range();
	};
	var _setOverlay=function(X) {
		m_overlay=X;
		auto_compute_overlay_range();
	};
	var _setThresholdMap=function(X) {
		m_threshold_map=X;
	};
	var _setCurrentPosition=function(pos) {
		if (m_selected_rect[0]>0) {
			that.setSelectedRect([-1,-1,0,0]);
		}
		if ((m_current_position[0]==pos[0])&&(m_current_position[1]==pos[1])) return;
		m_current_position=pos;
		for (var ii=0; ii<m_current_position_changed_handlers.length; ii++)
			(m_current_position_changed_handlers[ii])();
		update_cursor();
	};
	var _setSelectedRect=function(R) {
		R=JSON.parse(JSON.stringify(R));
		if (!R.length) return;
		if (R.length!=4) return;
		var changed=false;
		for (var ii=0; ii<4; ii++) {
			if (m_selected_rect[ii]!=R[ii]) {
				m_selected_rect[ii]=R[ii];
				changed=true;
			}
		}
		if (changed) {
			update_cursor();
			m_div.trigger('selected_rect_changed');
		}
	};
	var _refresh=function(callback) {
		m_div.css('width',m_width);
		m_div.css('height',m_height);
		
		/*
		if (!m_array) {
			if (callback) callback();
			return;
		}
		if (m_array.N1()*m_array.N2()===0) {
			if (callback) callback();
			return;
		}
		*/
		
		var W0=m_width;
		var H0=m_height;
		var N1=1;
		var N2=1;
		if (m_array) {
			N1=m_array.N1();
			N2=m_array.N2();
		}
		
		var ZR=[m_zoom_rect[0],m_zoom_rect[1],m_zoom_rect[2],m_zoom_rect[3]];
		if (ZR[0]<0) ZR=[0,0,N1,N2];
		
		var W1=ZR[2];
		var H1=ZR[3];
		var W2=0;
		var H2=0;
		if (W1*H0>W0*H1) {
			W2=W0;
			H2=Math.floor(W0*H1/W1);
		}
		else {
			H2=H0;
			W2=Math.floor(H0*W1/H1);
		}
		//not sure what the purpose of the following was.... removing for now
		/*
		if (W2>ZR[2]) {
			var factor0=Math.floor(W2/ZR[2]);
			W2=ZR[2]*factor0;
			H2=ZR[3]*factor0;
		}
		*/
		
		m_factor_x=Math.round(W2/(ZR[2]));
		m_factor_y=Math.round(H2/(ZR[3]));
		if (m_factor_x===0) m_factor_x=1;
		if (m_factor_y===0) m_factor_y=1;
		W2=Math.floor(W2/m_factor_x)*m_factor_x;
		H2=Math.floor(H2/m_factor_y)*m_factor_y;
		
		m_image_left=(m_width-W2)/2;
		m_image_top=(m_height-H2)/2;
		
		m_image_div.css('width',W2);
		m_image_div.css('height',H2);
		m_image_div.css('left',m_image_left);
		m_image_div.css('top',m_image_top);
		
		m_canvas[0].width=W2;
		m_canvas[0].height=H2;
		
		m_canvas2[0].width=W2;
		m_canvas2[0].height=H2;
		
		for (var kk in m_custom_canvases) {
			var CC=m_custom_canvases[kk];
			CC[0].width=W2;
			CC[0].height=H2;
		}
		
		m_image_width=W2;
		m_image_height=H2;
		
		update_image(function() {
			m_div.trigger('on-refresh');
			if (callback) {
				callback();
			}
		});
	};
	var update_image=function(callback) {
		var W2=m_image_width;
		var H2=m_image_height;
		
		var ctx=m_canvas[0].getContext('2d');
		ctx.fillStyle='black';
		ctx.fillRect(0,0,W2,H2);
		
		if (W2*H2===0) {
			if (callback) callback();
			return;
		}
		update_cursor();
		
		var imageData = ctx.createImageData(W2,H2);
		define_image_data(imageData,function() {
			ctx.putImageData(imageData,0,0);
			if (callback) callback();
		});
		
		
	};
	function define_image_data(imageData,callback) {
		var px=0;
		var py=0;
		var W2=m_image_width;
		var H2=m_image_height;
		function do_define_image_data() {
			var timer=new Date();
			var done=false;
			while (!done) {
				if (py+m_factor_y>H2) {
					callback();
					return;
				}
				if (!m_rgb_arrays) {
					for (var px=0; px+m_factor_x<=W2; px+=m_factor_x) {
						var ind0=pixel2index([px+m_factor_x/2,py+m_factor_y/2]);
						var val0=0;
						if (m_array) val0=m_array.value(ind0[0],ind0[1]);
						var val1=0;
						var val2=0;
						if (m_overlay) val1=m_overlay.value(ind0[0],ind0[1]);
						if (m_overlay_neg) {
							val1=-val1;
						}
						if (m_threshold_map) val2=m_threshold_map.value(ind0[0],ind0[1]);
						else val2=val1;
						var col=get_color(val0,val1,val2);
						for (var dy=0; dy<m_factor_y; dy++)
						for (var dx=0; dx<m_factor_x; dx++) {
							var pos0=((px+dx)+(py+dy)*W2)*4;
							imageData.data[pos0+0]=col[0];
							imageData.data[pos0+1]=col[1];
							imageData.data[pos0+2]=col[2];
							imageData.data[pos0+3]=255;
						}
					}
				}
				else {
					for (var px=0; px+m_factor_x<=W2; px+=m_factor_x) {
						var ind0=pixel2index([px+m_factor_x/2,py+m_factor_y/2]);
						var rval=m_rgb_arrays[0].value(ind0[0],ind0[1]);
						var gval=m_rgb_arrays[1].value(ind0[0],ind0[1]);
						var bval=m_rgb_arrays[2].value(ind0[0],ind0[1]);
						rval=(rval-m_actual_window_min)/(m_actual_window_max-m_actual_window_min)*255;
						gval=(gval-m_actual_window_min)/(m_actual_window_max-m_actual_window_min)*255;
						bval=(bval-m_actual_window_min)/(m_actual_window_max-m_actual_window_min)*255;
						rval=Math.round(Math.max(Math.min(rval,255),0));
						gval=Math.round(Math.max(Math.min(gval,255),0));
						bval=Math.round(Math.max(Math.min(bval,255),0));
						var col=[rval,gval,bval];
						for (var dy=0; dy<m_factor_y; dy++)
						for (var dx=0; dx<m_factor_x; dx++) {
							var pos0=((px+dx)+(py+dy)*W2)*4;
							imageData.data[pos0+0]=col[0];
							imageData.data[pos0+1]=col[1];
							imageData.data[pos0+2]=col[2];
							imageData.data[pos0+3]=255; // alpha
						}
					}
				}
				py+=m_factor_y;
				var elapsed=((new Date())-timer);
				if (elapsed>100) {
					setTimeout(function() {
						do_define_image_data();
					},500);
					return;
				}
			}
		}
		do_define_image_data(0);
	}
	var _addCustomCanvas=function(name) {
		//this is a test!
		m_custom_canvases[name]=make_canvas();
		m_image_div.append(m_custom_canvases[name]);
	};
	var auto_compute_window_range=function() {
		if (!m_array) return;
		var maxval=0;
		if (!m_rgb_arrays) {
			if (m_array) {
				for (var yy=0; yy<m_array.N2(); yy++)
				for (var xx=0; xx<m_array.N1(); xx++) {
					var val0=Math.abs(m_array.value(xx,yy));
					if ((!isNaN(val0))&&(val0>maxval)) maxval=val0;
				}
			}
		}
		else {
			if (m_array) {
				for (var yy=0; yy<m_array.N2(); yy++)
				for (var xx=0; xx<m_array.N1(); xx++)
				for (var dd=0; dd<3; dd++) {
					var val0=Math.abs(m_rgb_arrays[dd].value(xx,yy));
					if ((!isNaN(val0))&&(val0>maxval)) maxval=val0;
				}
			}
		}
		
		if (String(m_window_min).indexOf('%')>=0) {
			m_actual_window_min=maxval*Number(m_window_min.slice(0,m_window_min.length-1))/100;
		}
		else m_actual_window_min=m_window_min;
		
		if (String(m_window_max).indexOf('%')>=0) {
			m_actual_window_max=maxval*Number(m_window_max.slice(0,m_window_max.length-1))/100;
		}
		else m_actual_window_max=m_window_max;
		
		m_actual_window_min/=m_brightness_factor;
		m_actual_window_max/=m_brightness_factor;
	};
	var auto_compute_overlay_range=function() {
		var maxval=0;
		if (m_overlay) {
			for (var yy=0; yy<m_overlay.N2(); yy++)
			for (var xx=0; xx<m_overlay.N1(); xx++) {
				var val0=Math.abs(m_overlay.value(xx,yy));
				if ((!isNaN(val0))&&(val0>maxval)) maxval=val0;
			}
		}
		
		if (String(m_overlay_min).indexOf('%')>=0) {
			m_actual_overlay_min=maxval*Number(m_overlay_min.slice(0,m_overlay_min.length-1))/100;
		}
		else m_actual_overlay_min=m_overlay_min;
		
		if (String(m_overlay_max).indexOf('%')>=0) {
			m_actual_overlay_max=maxval*Number(m_overlay_max.slice(0,m_overlay_max.length-1))/100;
		}
		else m_actual_overlay_max=m_overlay_max;
		
		if (String(m_overlay_threshold).indexOf('%')>=0) {
			m_actual_overlay_threshold=maxval*Number(m_overlay_threshold.slice(0,m_overlay_threshold.length-1))/100;
		}
		else m_actual_overlay_threshold=m_overlay_threshold;
	};
	var update_cursor=function() {
		if (!m_canvas2) return;
		var CC=m_canvas2[0].getContext('2d');
		CC.lineWidth=3;
		CC.clearRect(0,0,m_image_width,m_image_height);
		
		if ((m_selection_mode=='draw')||(m_selection_mode=='erase')) return;
		
		if (!m_cursor_visible) return;
		
		var cursor_color='rgba(255,255,0,0.5)';
		
		var pt0,pt1;
		if (m_selection_mode=='rectangle') {	
			if (m_selected_rect[0]>=0) {
				pt0=index2pixel([m_selected_rect[0],m_selected_rect[1]]);
				pt1=index2pixel([m_selected_rect[0]+m_selected_rect[2]-1,m_selected_rect[1]+m_selected_rect[3]-1]);
				CC.strokeStyle=cursor_color;
				CC.beginPath();
				CC.moveTo(pt0[0],pt0[1]);
				CC.lineTo(pt0[0],pt1[1]);
				CC.lineTo(pt1[0],pt1[1]);
				CC.lineTo(pt1[0],pt0[1]);
				CC.lineTo(pt0[0],pt0[1]);
				CC.stroke();
				return;
			}
		}
		else if (m_selection_mode=='ellipse') {	
			if (m_selected_rect[0]>=0) {
				pt0=index2pixel([m_selected_rect[0],m_selected_rect[1]]);
				pt1=index2pixel([m_selected_rect[0]+m_selected_rect[2]-1,m_selected_rect[1]+m_selected_rect[3]-1]);
				CC.strokeStyle=cursor_color;
				CC.beginPath();
				center=[(pt0[0]+pt1[0])/2,(pt0[1]+pt1[1])/2];
				var dx=Math.abs(pt1[0]-pt0[0]);
				var dy=Math.abs(pt1[1]-pt0[1]);
				drawEllipseByCenter(CC,center[0],center[1],dx,dy);
				CC.stroke();
				return;
			}
		}
		else if (m_selection_mode=='polygon') {
			if (m_selected_polygon.length>0) {
				pt0=index2pixel([m_selected_polygon[0][0],m_selected_polygon[0][1]]);
				CC.strokeStyle=cursor_color;
				CC.beginPath();
				CC.moveTo(pt0[0],pt0[1]);
				var i;
				for (i=0; i<m_selected_polygon.length; i++) {
					pt1=index2pixel([m_selected_polygon[i][0],m_selected_polygon[i][1]]);
					if (i>0) {
						CC.lineTo(pt1[0],pt1[1]);
					}
				}
				CC.stroke();
				if  (m_selected_polygon.length>1) {
					pt1=index2pixel([m_selected_polygon[m_selected_polygon.length-1][0],m_selected_polygon[m_selected_polygon.length-1][1]]);
					if (!m_selected_polygon_complete) CC.strokeStyle='rgba(255,0,255,0.2)';
					else CC.strokeStyle=cursor_color;
					CC.beginPath();
					CC.moveTo(pt0[0],pt0[1]);
					CC.lineTo(pt1[0],pt1[1]);
					CC.stroke();
				}
				if (!m_selected_polygon_complete) {
					CC.strokeStyle='rgba(128,128,255,1)';
					for (i=0; i<m_selected_polygon.length; i++) {
						pt1=index2pixel([m_selected_polygon[i][0],m_selected_polygon[i][1]]);
						drawEllipseByCenter(CC,pt1[0],pt1[1],6,6);
					}
				}
				return;
			}
		}
		
		if ((m_current_position[0]<0)||(m_current_position[1]<0)) return;
		pt0=index2pixel(m_current_position);
		if ((pt0[0]<0)||(pt0[1]<0)) return;
		CC.strokeStyle=cursor_color;
		CC.beginPath();
		CC.moveTo(pt0[0],0); CC.lineTo(pt0[0],m_image_height-1);
		CC.moveTo(0,pt0[1]); CC.lineTo(m_image_width-1,pt0[1]);
		CC.stroke();
	};
	function drawEllipseByCenter(ctx, cx, cy, w, h) {
		drawEllipse(ctx, cx - w/2.0, cy - h/2.0, w, h);
	}
	
	function drawEllipse(ctx, x, y, w, h) {
		var kappa = .5522848,
				ox = (w / 2) * kappa, // control point offset horizontal
				oy = (h / 2) * kappa, // control point offset vertical
				xe = x + w,           // x-end
				ye = y + h,           // y-end
				xm = x + w / 2,       // x-middle
				ym = y + h / 2;       // y-middle
	
		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		ctx.closePath();
		ctx.stroke();
	}
	function _selectedPoints() {
		var ret=[];
		if (!m_array) return ret;
		if (m_selection_mode=='rectangle') {
			if (m_selected_rect[0]>=0) {
				for (y=m_selected_rect[1]; y<m_selected_rect[1]+m_selected_rect[3]; y++)
				for (x=m_selected_rect[0]; x<m_selected_rect[0]+m_selected_rect[2]; x++) {
					ret.push([x,y]);
				}
			}
		}
		else if (m_selection_mode=='polygon') {
			ret=get_filled_polygon_points(m_array.N1(),m_array.N2(),m_selected_polygon);
		}
		if (ret.length===0) {
			ret=[that.currentPosition()];
		}
		return ret;
	}

	var on_key_down=function(evt) {
		if (!m_array) return;
		evt.preventDefault();
		evt.stopPropagation();
		var incr=[0,0];
		if (evt.which==38) { //up
			incr=[0,-1];
		}
		else if (evt.which==40) { //down
			incr=[0,1];
		}
		else if (evt.which==37) { //left
			incr=[-1,0];
		}
		else if (evt.which==39) { //right
			incr=[1,0];
		}
		else if (String.fromCharCode(evt.which)=='L') {
			m_brightness_factor*=1.2;
			auto_compute_window_range();
			update_image();
		}
		else if (String.fromCharCode(evt.which)=='D') {
			m_brightness_factor/=1.2;
			auto_compute_window_range();
			update_image();
		}
		else if (String.fromCharCode(evt.which)=='Z') {
			that.setZoomRect(that.selectedRect());
			that.setSelectedRect([-1,-1,0,0]);
			that.refresh();
		}
		if ((incr[0]!==0)||(incr[1]!==0)) {
			if (m_swap_x) incr[0]*=-1;
			if (m_swap_y) incr[1]*=-1;
			var pos0=that.currentPosition();
			var ZR=[m_zoom_rect[0],m_zoom_rect[1],m_zoom_rect[2],m_zoom_rect[3]];
			if (ZR[0]<0) ZR=[0,0,m_array.N1(),m_array.N2()];
			if (pos0[0]+incr[0]<ZR[0]) return;
			if (pos0[0]+incr[0]>=ZR[0]+ZR[2]) return;
			if (pos0[1]+incr[1]<ZR[1]) return;
			if (pos0[1]+incr[1]>=ZR[1]+ZR[3]) return;
			that.setCurrentPosition([pos0[0]+incr[0],pos0[1]+incr[1]]);
		}
	};
	var _createImageUrl=function(callback) {
		/*var canvas0=make_canvas();
		canvas0[0].width=parseInt(m_div.width(),10);
		canvas0[0].height=parseInt(m_div.height(),10);
		
		var ctx=canvas0[0].getContext('2d');
		ctx.drawImage(m_image[0],
									parseInt(m_image_div.css('left'),10),
									parseInt(m_image_div.css('top'),10),
									parseInt(m_image_div.css('width'),10),
									parseInt(m_image_div.css('height'),10));*/
		callback(m_canvas[0].toDataURL());
	};
			
	var pixel2index=function(pp) {
		if (m_image_width<=1) return [-1,-1];
		if (m_image_height<=1) return [-1,-1];
		if (!m_array) return [-1,-1];
		var ZR=[m_zoom_rect[0],m_zoom_rect[1],m_zoom_rect[2],m_zoom_rect[3]];
		if (ZR[0]<0) ZR=[0,0,m_array.N1(),m_array.N2()];
		var pctx=(pp[0]+0.5)/(m_image_width);
		var pcty=(pp[1]+0.5)/(m_image_height);
		if (m_swap_x) pctx=1-pctx;
		if (m_swap_y) pcty=1-pcty;
		return [ZR[0]+Math.round(pctx*ZR[2]-0.5),ZR[1]+Math.round(pcty*ZR[3]-0.5)];
	};
	var index2pixel=function(pp) {
		if (!m_array) return [-1,-1];
		if (m_array.N1()<=1) return [-1,-1];
		if (m_array.N2()<=1) return [-1,-1];
		var ZR=[m_zoom_rect[0],m_zoom_rect[1],m_zoom_rect[2],m_zoom_rect[3]];
		if (ZR[0]<0) ZR=[0,0,m_array.N1(),m_array.N2()];
		var pctx=(pp[0]-ZR[0]+0.5)/ZR[2];
		var pcty=(pp[1]-ZR[1]+0.5)/ZR[3];
		if (m_swap_x) pctx=1-pctx;
		if (m_swap_y) pcty=1-pcty;
		return [Math.round(pctx*m_image_width-0.5),Math.round(pcty*m_image_height-0.5)];
	};
			
	var get_color=function(val,overlay_val,threshold_val) {
		if (m_custom_colorer) {
			return m_custom_colorer(val,overlay_val);
		}
		var tmp_overlay_val=0;
		if (m_actual_overlay_min<0) {
			if (Math.abs(threshold_val)>m_actual_overlay_threshold) tmp_overlay_val=overlay_val;
		}
		else {
			if (threshold_val>m_actual_overlay_threshold) tmp_overlay_val=overlay_val;
		}
		if ((tmp_overlay_val!==0)||(m_actual_overlay_threshold<0)) {
			var tmpA=get_overlay_color(tmp_overlay_val);
			var tmpB=[0,0,0];
			if ((tmpA.length>=4)&&(tmpA[3]<1)) { //alpha
				var col0=get_color(val,0,0);
				var pp=tmpA[3];
				tmpB[0]=Math.floor(tmpA[0]*pp+col0[0]*(1-pp));
				tmpB[1]=Math.floor(tmpA[1]*pp+col0[1]*(1-pp));
				tmpB[2]=Math.floor(tmpA[2]*pp+col0[2]*(1-pp));
				
			}
			else tmpB=tmpA;
			return [tmpB[0],tmpB[1],tmpB[2]];
		}
		else {
			var gray=Math.floor((val-m_actual_window_min)/(m_actual_window_max-m_actual_window_min)*255);
			if (gray>255) gray=255;
			if (gray<0) gray=0;
			return [gray,gray,gray]; //return 'rgb('+gray+','+gray+','+gray+')';
		}
	};
	var get_overlay_color=function(val) {
		var rgb=[0,0,0];
		var pct;
		if (!m_threshold_map) {
			if (m_color_map=='fire') {
				if (m_actual_overlay_max>m_actual_overlay_min)
					pct=(val-m_actual_overlay_min)/(m_actual_overlay_max-m_actual_overlay_min);
				else
					pct=0.5;
				rgb=sample_color_map(pct,false);
			}
			else if (m_actual_overlay_min<0) {
				pct=0.5;
				if (val>0) {
					if (m_actual_overlay_max>m_actual_overlay_threshold) 
						pct=(val-m_actual_overlay_threshold)/(m_actual_overlay_max-m_actual_overlay_threshold);
				}
				else {
					if (m_actual_overlay_min<-m_actual_overlay_threshold) 
						pct=-(-val-m_actual_overlay_threshold)/(-m_actual_overlay_min-m_actual_overlay_threshold); 
				}
				//rgb=fireIceColorMap(pct);
				//rgb=blueRedColorMap(pct);
				rgb=sample_color_map(pct,true);
			}
			else {
				pct=0;
				if (m_actual_overlay_max>m_actual_overlay_min) 
					pct=(val-m_actual_overlay_min)/(m_actual_overlay_max-m_actual_overlay_min);
				rgb=sample_color_map(pct,false);
				//rgb=fireColorMap(pct);
			}
		}
		else {
			if (m_actual_overlay_min<0) {
				pct=0.5;
				if (val>0) {
					pct=(val)/(m_actual_overlay_max);
				}
				else {
					pct=-(val)/(m_actual_overlay_min); 
				}
				//rgb=fireIceColorMap(pct);
				//rgb=blueRedColorMap(pct);
				rgb=sample_color_map(pct,true);
			}
			else {
				pct=0;
				pct=(val-m_actual_overlay_min)/(m_actual_overlay_max-m_actual_overlay_min);
				//rgb=fireColorMap(pct);
				rgb=sample_color_map(pct,false);
			}
		}
		//return 'rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')';
		return rgb;
	};
	var sample_color_map=function(pct,posneg) {
		if (m_color_map=='fire') {
			return fireColorMap(pct);
		}
		else if (m_color_map=='fireIce') {
			return fireIceColorMap(pct);
		}
		if (posneg) {
			if (m_colormap_colors.length<100) {
				return fireIceColorMap(pct);
			}
			else {
				pct=Math.max(0,Math.min((pct+1)/2,1));
				var ind=Math.floor(pct*99.99);
				return m_colormap_colors[ind];
			}
		}
		else {
			if (m_colormap_colors.length<100) {
				return fireColorMap(pct);
			}
			else {
				pct=Math.max(0,Math.min(pct,1));
				var ind=Math.floor(pct*99.99);
				return m_colormap_colors[ind];
			}
		}
	};
	var disable_selection=function(X) {
		X.attr('unselectable', 'on')
		.css({
				'user-select'         : 'none',
				'-webkit-user-select' : 'none',
				'-moz-user-select'    : 'none',   
				'-ms-user-select'     : 'none',
				'-o-user-select'      : 'none'
		})
		.on('selectstart', false);
	};
	disable_selection(m_div);
}

function get_filled_polygon_points(N1,N2,polygon) {
	var ret=[];
	if (polygon.length===0) return ret;
	
	// A line scan algorithm!
	var j;
	var filled_points={};

	//Loop through the y locations
	for (var y=0; y<N2; y++) {
		var nodes=[];
		for (var i=0; i<polygon.length; i++) {
			j=i-1;
			if (j<0) j=polygon.length-1;
			var k=i+1;
			if (k>=polygon.length) k=0;
			if (
				((polygon[i][1]<y) && (polygon[j][1]>=y)) ||
				((polygon[j][1]<y) && (polygon[i][1]>=y))
			) {
				var invslope0=(polygon[j][0]-polygon[i][0])/(polygon[j][1]-polygon[i][1]);
				var x0=polygon[i][0]+(y-polygon[i][1])*invslope0;
				nodes.push(x0);
			}
		}
		
		nodes.sort();

		//  Fill the pixels between node pairs.
		for (i=0; i<nodes.length-1; i+=2) {
			var min0=Math.min(nodes[i],nodes[i+1]);
			var max0=Math.max(nodes[i],nodes[i+1]);
			for (j=Math.ceil(min0); j<=Math.floor(max0); j++) {
				if ((0<=j)&&(j<N1)) {
					var pt=[j,y];
					if (!filled_points[pt[0]+'-'+pt[1]]) {
						ret.push(pt);
						filled_points[pt[0]+'-'+pt[1]]=true;
					}
				}
			}
		}
	}
	return ret;
}


function fireColorMap(pct) {
	if (pct>1) pct=1;
	if (pct<0) pct=0;
	var r=0,g=0,b=0;
	
	if (pct<0.5) r=pct/0.5*255;
	else r=255;
	
	if (pct<0.4) g=0;
	else if (pct<0.9) g=(pct-0.4)/0.5*255;
	else g=255;
	
	if (pct<0.5) b=220-Math.abs(pct-0.25)/0.25*220;
	else if (pct<0.8) b=0;
	else b=255-(1-pct)/0.2*255;
	
	return [Math.floor(r),Math.floor(g),Math.floor(b)];
}
function fireIceColorMap(pct) {
	if (pct>1) pct=1;
	if (pct<-1) pct=-1;
	var r=0,g=0,b=0;
	
	if (pct>=0) {
		r=255;
		if (pct<0.8) g=(pct)/0.8*255;
		else g=255;
		if (pct<0.6) b=0;
		else b=128-(1-pct)/0.4*128;
	}
	else {
		b=255;
		if (pct>-0.8) g=(-pct)/0.8*255;
		else g=255;
		if (pct>-0.6) r=0;
		else r=128-(-pct)/0.4*128;
	}
	
	return [Math.floor(r),Math.floor(g),Math.floor(b)];
}
function blueRedColorMap(pct) {
	return fireIceColorMap(pct);
	var h=0,s=0,v=0;
	if (pct<0) pct=0; if (pct>1) pct=1;
	if (pct<0.5) h=240-(0.5-pct)/0.5*60;
	else h=0+(pct-0.5)/0.5*60;
	s=100-20*Math.abs(pct-0.5)/0.5;
	v=70+30*Math.abs(pct-0.5)/0.5;
	return hsvToRgb(h,s,v);
}
/**
 * HSV to RGB color conversion
 *
 * H runs from 0 to 360 degrees
 * S and V run from 0 to 100
 * 
 * Ported from the excellent java algorithm by Eugene Vishnevsky at:
 * http://www.cs.rit.edu/~ncs/color/t_convert.html
 */
function hsvToRgb(h, s, v) {
	var r, g, b;
	var i;
	var f, p, q, t;
	
	// Make sure our arguments stay in-range
	h = Math.max(0, Math.min(360, h));
	s = Math.max(0, Math.min(100, s));
	v = Math.max(0, Math.min(100, v));
	
	// We accept saturation and value arguments from 0 to 100 because that's
	// how Photoshop represents those values. Internally, however, the
	// saturation and value are calculated from a range of 0 to 1. We make
	// That conversion here.
	s /= 100;
	v /= 100;
	
	if(s === 0) {
		// Achromatic (grey)
		r = g = b = v;
		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}
	
	h /= 60; // sector 0 to 5
	i = Math.floor(h);
	f = h - i; // factorial part of h
	p = v * (1 - s);
	q = v * (1 - s * f);
	t = v * (1 - s * (1 - f));

	switch(i) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
			
		case 1:
			r = q;
			g = v;
			b = p;
			break;
			
		case 2:
			r = p;
			g = v;
			b = t;
			break;
			
		case 3:
			r = p;
			g = q;
			b = v;
			break;
			
		case 4:
			r = t;
			g = p;
			b = v;
			break;
			
		default: // case 5:
			r = v;
			g = p;
			b = q;
	}
	
	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

