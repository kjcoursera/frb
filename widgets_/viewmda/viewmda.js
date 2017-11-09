/*** require("array2doverlayview.js"); ***/
/*** require("mda.js"); ***/
/*** require("nii.js"); ***/

function ViewMda(config) {
	var that=this;
	
	if (!config) config={};
	config=$.extend(true,{},{
		num_mosaic_rows:1,
		num_mosaic_cols:1
	},config);
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; schedule_update_layout();};
	this.setTitle=function(title) {m_title=title;};
	this.setArrayFile=function(file) {m_array_file=file; m_array=null;};
	this.setOverlayFile=function(file) {m_overlay_file=file; m_overlay=null;};
	this.setRgbMode=function(val) {m_rgb_mode=val;};
	this.refresh=function(callback) {return _refresh.apply(this,arguments);};
	this.currentPosition=function() {return _currentPosition();};
	this.setCurrentPosition=function(pos) {return _setCurrentPosition.apply(this,arguments);};
	this.onCurrentPositionChanged=function(callback) {m_div.bind('current-position-changed',function(evt,obj) {callback();});};
	this.selectedRect=function() {var current_view=get_current_view(); if (!current_view) return [-1,-1,0,0]; return current_view.selectedRect();};
	this.setSelectedRect=function(R) {var current_view=get_current_view(); if (!current_view) return; current_view.setSelectedRect(R);};
	this.onSelectedRectChanged=function(callback) {m_div.bind('selected-rect-changed',function(evt,obj) {callback();});};
	this.selectedPoints=function() {var VV=get_current_view(); if (!VV) return []; return VV.selectedPoints();};
	this.showDialog=function(params) {_showDialog(params);};
	this.setOverlayThreshold=function(thr) {m_overlay_threshold=thr; for_each_view(function(V) {V.setOverlayThreshold(thr);});};
	this.setOverlayRange=function(omin,omax) {m_overlay_min=omin; m_overlay_max=omax; for_each_view(function(V) {V.setOverlayRange(omin,omax);});};
	this.setWindowRange=function(wmin,wmax) {m_window_min=wmin; m_window_max=wmax; for_each_view(function(V) {V.setWindowRange(wmin,wmax);});};
	this.setOverlayIndex=function(indx) {_setOverlayIndex(indx);};
	this.linkView=function(view) {_linkView(view);};
	this.createImageUrl=function(callback) {_createImageUrl(callback);};
	this.setColorMapColors=function(colors) {_setColorMapColors(colors);};
	this.setColorMap=function(map) {_setColorMap(map);};
	this.view=function(index) {return m_views[index]||null;};
	this.initializeArray=function(callback) {initialize_array(callback);};
	this.array=function() {return m_array;};
	this.setSelectionMode=function(mode) {m_selection_mode=mode; m_views.forEach(function(V) {V.setSelectionMode(mode);});};
	this.onViewInitialized=function(callback) {m_div.bind('on-view-initialized',function() {callback();});};
	this.onRefresh=function(callback) {m_div.bind('on-refresh-',function() {callback();});};
	
	var m_views=[];
	var m_array_file=null;
	var m_array=null;
	var m_overlay_file=null;
	var m_overlay=null;
	var m_selection_mode='rectangle';
	var m_div=$('<div style="position:absolute" class="fmriactivationview-box"></div>');
	var m_width=0,m_height=0;
	var m_N1=0,m_N2=0,m_N3=0,m_N4=0;
	var m_info_div=$('<div class="fmriactivationview-info"></div>');
	var m_title_div=$('<div class="fmriactivationview-title"></div>');
	var m_status='Initializing...';
	var m_title='';
	var m_dialog_mode=false;
	var m_dialog=null;
	var m_slider=$('<div></div>'); //slice
	var m_slider2=$('<div></div>'); //frame
	var m_slider3=$('<div></div>'); //overlay index
	var m_overlay_index=0;
	var m_overlay_threshold=0;
	var m_overlay_min=0;
	var m_overlay_max=1;
	var m_window_min='0%';
	var m_window_max='100%';
	var m_slice_offset=0;
	var m_rgb_mode=false;
	var m_color_map_colors=null;
	var m_color_map='';
	
	m_div.append(m_slider);
	m_div.append(m_slider2);
	m_div.append(m_slider3);
	m_div.append(m_info_div);
	m_div.append(m_title_div);
	
	m_slider.slider({
		slide: function(event, ui) {
			var pos=that.currentPosition();
			pos[2]=ui.value;
			that.setCurrentPosition(pos);
		}
	});
	m_slider.css({background:'black',boder:'solid 1px gray'});
	
	m_slider2.slider({
		slide: function(event, ui) {
			var pos=that.currentPosition();
			pos[3]=ui.value;
			that.setCurrentPosition(pos);
		}
	});
	m_slider2.css({background:'black',boder:'solid 1px gray'});
	
	m_slider3.slider({
		slide: function(event, ui) {
			that.setOverlayIndex(ui.value);
		}
	});
	m_slider3.css({background:'black',boder:'solid 1px gray'});
	
	
	function for_each_view(callback) {
		for (var i=0; i<m_views.length; i++) {
			callback(m_views[i]);
		}
	}
	
	function _linkView(view) {
		that.onCurrentPositionChanged(function() {
			view.setCurrentPosition(that.currentPosition());
		});
		view.onCurrentPositionChanged(function() {
			that.setCurrentPosition(view.currentPosition());
		});
		that.onSelectedRectChanged(function() {
			view.setSelectedRect(that.selectedRect());
		});
		view.onSelectedRectChanged(function() {
			that.setSelectedRect(that.selectedRect());
		});
	}
	
	function connect_view(V) {
		V.onCurrentPositionChanged(function() {
			var pos0=V.currentPosition();
			if ((pos0[0]>=0)&&(pos0[1]>=0)) {
				for (var i=0; i<m_views.length; i++) {
					var V2=m_views[i];
					if ((V2.position[2]!=V.position[2])||(V2.position[3]!=V.position[3])) {
						V2.setCurrentPosition([-1,-1]);
					}
				}
				that.setCurrentPosition([pos0[0],pos0[1],V.position[2],V.position[3]]);
			}
			update_info();
			m_div.trigger('current-position-changed');
		});
		V.onSelectedRectChanged(function() {
			schedule_update_info();
			m_div.trigger('selected-rect-changed');
		});
		V.onRefresh(function() {
			m_div.trigger('on-refresh-');
		});
	}
	
	var do_initialize=function() {
		var num_mosaic_slices=config.num_mosaic_rows*config.num_mosaic_cols;
		for (var i=0; i<num_mosaic_slices; i++) {
			var row=Math.floor(i/config.num_mosaic_cols);
			var col=i % config.num_mosaic_cols;
			var V=new Array2DOverlayView();
			V.setSelectionMode(m_selection_mode);
			V.position=[-1,-1,-1,0];
			V.window_width=1.0/config.num_mosaic_cols;
			V.window_height=1.0/config.num_mosaic_rows;
			V.window_left=col*V.window_width;
			V.window_top=row*V.window_height;
			V.slice_pct=1/(2*num_mosaic_slices)+1/(num_mosaic_slices)*i;
			connect_view(V);
			m_views.push(V);
			m_div.append(V.div());
		}
		if (m_color_map_colors) that.setColorMapColors(m_color_map_colors);
		if (m_color_map) that.setColorMap(m_color_map);
		m_div.trigger('on-view-initialized');
	};		
	
	var _showDialog=function(params) {
		if (!params) params={};
		m_dialog=$('<div></div>');
		m_dialog.css({overflow:'hidden'});
		m_dialog.append(m_div);
		$('body').append(m_dialog);
		m_dialog.dialog({
			width:params.width||300,
			height:params.height||300,
			modal:params.modal||false,
			resize:function() {schedule_update_layout();}
		});
		m_dialog_mode=true;
		that.refresh();
	};
	var initialize_array=function(callback) {
		if ((m_array)||(!m_array_file)) {
			if (callback) callback();
		}
		else {
			var suf=m_array_file.fileType();
			if ((suf=='nii')||(suf=='hdr')||(suf=='img')) //need to work on support for hdr/img (not sure about this)
				m_array=new Nii();
			else
				m_array=new Mda();
			m_array.setFile(m_array_file);
			m_array.initialize(function(success,err) {
				if (success) {
					m_N1=m_array.N1();
					m_N2=m_array.N2();
					m_N3=m_array.N3();
					m_N4=m_array.N4();
				}
				else {
					console.log ('Error initializing array: '+err);
					m_array=null;
				}
				if (callback) callback();
			});
		}
	};
	var initialize_overlay=function(callback) {
		if ((m_overlay)||(!m_overlay_file)) {
			if (callback) callback();
		}
		else {
			var suf=m_overlay_file.fileType();
			if ((suf=='nii')||(suf=='hdr')||(suf=='img'))
				m_overlay=new Nii();
			else
				m_overlay=new Mda();
			m_overlay.setFile(m_overlay_file);
			m_overlay.initialize(function(success,err) {
				if (success) {
					//m_N1=m_overlay.N1();
					//m_N2=m_overlay.N2();
					//m_N3=m_overlay.N3();
					//m_N4=m_overlay.N4();
				}
				else {
					console.log ('Error initializing overlay: '+err);
					m_overlay=null;
				}
				if (callback) callback();
			});
		}
	};
	
	function everything_is_loaded_for_current_slices() {
		var i,V;
		if (!m_array) return false;
		if (!m_array.isInitialized()) return false;
		for (i=0; i<m_views.length; i++) {
			V=m_views[i];
			if (!m_rgb_mode) {
				if (!m_array.getDataXY([V.position[2],V.position[3]],null,{check_only:true})) return false;
			}
			else {
				for (var dd=0; dd<3; dd++) {
					if (!m_array.getDataXY([V.position[2],dd],null,{check_only:true})) return false;
				}
			}
		}
		if (m_overlay_file) {
			if (!m_overlay) return false;
			if (!m_overlay.isInitialized()) return false;
			for (i=0; i<m_views.length; i++) {
				V=m_views[i];
				var slice0=V.position[2];
				if (m_overlay.N3()==1) slice0=0;
				if (!m_overlay.getDataXY([slice0,m_overlay_index],null,{check_only:true})) return false;
			}
		}
		return true;
	}
	
	var m_refresh_scheduled=false;
	var global_refresh_code='';
	var _refresh=function(callback) {
		var local_refresh_code=utils.make_random_id(5);
		
		if (everything_is_loaded_for_current_slices()) {
			m_status='Refreshing...';
			update_info();
			global_refresh_code=local_refresh_code;
			do_refresh(callback);
			return;
		}
		
		if (m_refresh_scheduled) return;
		
		/*
		if ((m_status.indexOf('Refreshing')===0)||(m_status.indexOf('Waiting')===0)) return;
		if (m_status.indexOf('Loading')===0) {
			setTimeout(function() {that.refresh(callback);},500);
			return;
		}
		*/
		
		global_refresh_code=local_refresh_code;
		
		m_refresh_scheduled=true;
		m_status='Refreshing...';
		update_info();
		setTimeout(function() {
			if (global_refresh_code!=local_refresh_code) return;
			do_refresh(callback);
		},200);
		
		function load_array_data_into_views(callback) {
			if (!m_array) {
				for_each_view(function(V) {
					V.setArray(null);
					V.refresh();
				});
				if (callback) callback();
				return;
			}
			var num_loaded=0;
			for_each_view(function(V) {
				if (!m_rgb_mode) {
					m_array.getDataXY([V.position[2],V.position[3]],function(data0,err) {
						if (data0) {
							V.data0=data0; //don't actually set the data until they have all been loaded
							//V.setArray(data0);
							num_loaded++;
							check_all_loaded();
						}
						else {
							m_status='Error in getDataXY: '+err;
							update_info();
							console.log ('Error in getDataXY: '+err);
						}
					});
				}
				else {
					V.data0={};
					function local_function(dd) {
						m_array.getDataXY([V.position[2],dd],function(data0,err) {
							if (data0) {
								V.data0[dd]=data0; //don't actually set the data until they have all been loaded
								//V.setArray(data0);
								if ((V.data0[0])&&(V.data0[1])&&(V.data0[2])) {
									num_loaded++;
									check_all_loaded();
								}
							}
							else {
								m_status='Error in getDataXY: '+err;
								update_info();
								console.log ('Error in getDataXY: '+err);
							}
						});
					}
					for (var dd=0; dd<3; dd++) {
						local_function(dd);
					}
				}
			});
			
			function check_all_loaded() {
				if (num_loaded>=m_views.length) {
					
					var maxabs=0;
					for (var k=0; k<m_views.length; k++) {
						var data0=m_views[k].data0;
						if (!m_rgb_mode) {
							maxabs=Math.max(maxabs,Math.abs(data0.max()),Math.abs(data0.min()));
						}
						else {
							for (var dd=0; dd<3; dd++) {
								maxabs=Math.max(maxabs,Math.abs(data0[dd].max()),Math.abs(data0[dd].min()));
							}
						}
					}
					var wmin=m_window_min;
					if (is_percent(wmin)) {
						wmin=maxabs*Number(wmin.slice(0,wmin.length-1))/100;
					}
					var wmax=m_window_max;
					if (is_percent(wmax)) {
						wmax=maxabs*Number(wmax.slice(0,wmax.length-1))/100;
					}
					
					for_each_view(function(V) {
						V.setWindowRange(wmin,wmax);
						if (!m_rgb_mode) {
							V.setRgbArrays(null);
							V.setArray(V.data0);
						}
						else {
							V.setRgbArrays(V.data0[0],V.data0[1],V.data0[2]);
						}
					});
					
					if (callback) callback();
				}
			}
			check_all_loaded();
		}
		function load_overlay_data_into_views(callback) {
			if (!m_overlay) {
				for_each_view(function(V) {
					V.setOverlay(null);
				});
				if (callback) callback();
				return;
			}
			var num_loaded=0;
			for_each_view(function(V) {
				var slice0=V.position[2];
				if (m_overlay.N3()==1) slice0=0;
				m_overlay.getDataXY([slice0,m_overlay_index],function(data0,err) {
					if (data0) {
						V.overlay_data0=data0;
						//V.setOverlay(data0);
						num_loaded++;
						check_all_loaded();
					}
					else {
						m_status='Error in overlay getDataXY: '+err;
						update_info();
						console.log ('Error in overlay getDataXY: '+err);
					}
				});
			});
			
			function check_all_loaded() {
				if (num_loaded>=m_views.length) {
					
					var maxabs=0;
					for (var k=0; k<m_views.length; k++) {
						var data0=m_views[k].overlay_data0;
						maxabs=Math.max(maxabs,Math.abs(data0.max()),Math.abs(data0.min()));
					}
					var omin=m_overlay_min;
					if (is_percent(omin)) {
						omin=maxabs*Number(omin.slice(0,omin.length-1))/100;
					}
					var omax=m_overlay_max;
					if (is_percent(omax)) {
						omax=maxabs*Number(omax.slice(0,omax.length-1))/100;
					}
					var othr=m_overlay_threshold;
					if (is_percent(othr)) {
						othr=maxabs*Number(othr.slice(0,othr.length-1))/100;
					}
					
					for_each_view(function(V) {
						V.setOverlayThreshold(othr);
						V.setOverlayRange(omin,omax);
						V.setOverlay(V.overlay_data0);
					});
					
					
					if (callback) callback();
				}
			}
			check_all_loaded();
		}
		
		function do_refresh(callback) {
			m_refresh_scheduled=false;
			if (global_refresh_code!=local_refresh_code) return;
			update_layout();
		
			m_status='Waiting...';
			update_info();
			wait_for_visible(m_div,function() {
				if (global_refresh_code!=local_refresh_code) return;
				m_status='Loading...';
				update_info();
				initialize_array(function() {
					if (global_refresh_code!=local_refresh_code) return;
					
					var T0;
					if ((m_array)&&(m_array.transformation))
						T0=m_array.transformation();
					else
						T0=new AffineTransformation();
					var swapx=(T0.get(0,0)<0);
					var swapy=(T0.get(1,1)>0);
					for_each_view(function(V) {
						V.setSwapX(swapx);
						V.setSwapY(swapy);
					});
					
					initialize_overlay(function() {
						if (global_refresh_code!=local_refresh_code) return;
						//set default slices
						update_slice_positions();
						update_layout();
						update_info();
						
						if (m_array) {
							if (global_refresh_code!=local_refresh_code) return;
							m_status='Loading data...';
							update_info();
							load_array_data_into_views(function() {
								if (global_refresh_code!=local_refresh_code) return;
								m_status='Loading overlay data...';
								update_info();
								load_overlay_data_into_views(function() {
									if (global_refresh_code!=local_refresh_code) return;
									m_status='Rendering...';
									update_info();
									for_each_view(function(V) {
										V.refresh(function() {
											m_status='ok';
											update_info();
											if (callback) callback();
										});
									});
								});
							});
						}
						else {
							load_array_data_into_views(function() {
								m_status='';
								update_info();
							});
						}
					});
				});
			});
		}
	};
	var m_update_layout_scheduled=false;
	function schedule_update_layout() {
		if (m_update_layout_scheduled) return;
		m_update_layout_scheduled=true;
		setTimeout(function() {
			m_update_layout_scheduled=false;
			update_layout();
		},100);
	}
	var update_layout=function() {
		var info_height=11;
		var slider_height=10;
		var slider2_height=10;
		var slider3_height=10;
		var title_height=10;
		var margin0=1;
		
		if (m_dialog_mode) {
			title_height=0;
			m_title_div.hide();
			m_dialog.dialog('option','title',m_title);
		}
		else {
			m_title_div.show();
		}
		
		var current_position=that.currentPosition();
		
		if (m_N3<=1) {
			slider_height=0;
			m_slider.hide();
		}
		else {
			m_slider.show();
			m_slider.slider('option','min',0);
			m_slider.slider('option','max',m_N3-1);
			m_slider.slider('option','value',current_position[2]);
		}
		
		if ((m_N4<=1)||(m_rgb_mode)) {
			slider2_height=0;
			m_slider2.hide();
		}
		else {
			m_slider2.show();
			m_slider2.slider('option','min',0);
			m_slider2.slider('option','max',m_N4-1);
			m_slider2.slider('option','value',current_position[3]);
		}
		
		if ((m_overlay)&&(m_overlay.N4()>1)&&(!m_rgb_mode)) {
			m_slider3.show();
			m_slider3.slider('option','min',0);
			m_slider3.slider('option','max',m_overlay.N4()-1);
			m_slider3.slider('option','value',m_overlay_index);
		}
		else {
			slider3_height=0;
			m_slider3.hide();
		}
		
		if (m_dialog_mode) {
			m_width=m_dialog.outerWidth();
			m_height=m_dialog.outerHeight();
			m_div.css({position:'absolute',left:0,right:0,top:0,bottom:0});
		}
		else {
			m_div.css({width:m_width,height:m_height});
		}
		
		var Vwidth=m_width-margin0*2;
		var Vheight=m_height-info_height-slider_height-slider2_height-slider3_height-title_height-margin0*2;
		var Voffsetx=margin0;
		var Voffsety=title_height+margin0;
		
		for_each_view(function(V) {
			V.div().css({position:'absolute',left:Voffsetx+V.window_left*Vwidth,top:Voffsety+V.window_top*Vheight});
			V.setSize(V.window_width*Vwidth,V.window_height*Vheight);
		});
		
		m_info_div.css({position:'absolute',width:m_width-margin0*2,height:info_height,bottom:0,left:margin0});
		m_slider.css({position:'absolute',width:m_width-margin0*2,height:slider_height-5,bottom:info_height+slider2_height+slider3_height,left:margin0});
		m_slider2.css({position:'absolute',width:m_width-margin0*2,height:slider2_height-5,bottom:info_height+slider3_height,left:margin0});
		m_slider3.css({position:'absolute',width:m_width-margin0*2,height:slider3_height-5,bottom:info_height,left:margin0});
		update_info();
		m_title_div.css({position:'absolute',width:m_width-margin0*2,height:title_height,top:0,left:margin0});
		m_title_div.html(m_title);
		
		for_each_view(function(V) {
			V.refresh();
		});
	};
	
	var _createImageUrl=function(callback) {
		if (m_views.length==1) {
			m_views[0].createImageUrl(callback);
			return;
		}
		var canvas0=make_canvas();
		
		var xmin=9999,xmax=0;
		var ymin=9999,ymax=0;
		for (var i=0; i<m_views.length; i++) {
			var RR=m_views[i].imageRect();
			xmin=Math.min(xmin,parseInt(m_views[i].div().css('left'),10)+RR[0]);
			xmax=Math.max(xmax,parseInt(m_views[i].div().css('left'),10)+RR[0]+RR[2]);
			ymin=Math.min(ymin,parseInt(m_views[i].div().css('top'),10)+RR[1]);
			ymax=Math.max(ymax,parseInt(m_views[i].div().css('top'),10)+RR[1]+RR[3]);
		}
		
		var W0=xmax-xmin;
		var H0=ymax-ymin;
		canvas0[0].width=W0;
		canvas0[0].height=H0;
		
		var ctx=canvas0[0].getContext('2d');
		ctx.fillStyle='black';
		ctx.fillRect(0,0,W0,H0);
		
		var draw_view=function(ind) {
			if (ind>=m_views.length) {
				callback(canvas0[0].toDataURL(),W0,H0);
			}
			else {
				m_views[ind].createImageUrl(function(url0) {
					var RR=m_views[ind].imageRect();
					var x0=parseInt(m_views[ind].div().css('left'),10)+RR[0]-xmin;
					var y0=parseInt(m_views[ind].div().css('top'),10)+RR[1]-ymin;
					draw_image_from_data_url(
						canvas0,url0,x0,y0,function() {
							draw_view(ind+1);
						}
					);
				});
			}
		};
		draw_view(0);
	};
	var draw_image_from_data_url=function(canvas,url,left,top,callback) {
		var ctx = canvas[0].getContext('2d');
		var img = new Image();
		img.onload = function(){
			ctx.drawImage(img,left,top);
			callback();
		};
		img.src = url;
	};
	var make_canvas=function() {
		var el=document.createElement('canvas'); 
		$(el).css('position','absolute');
		if (typeof(G_vmlCanvasManager)!='undefined') 
			G_vmlCanvasManager.initElement(el);
		return $(el);
	};
	
	function is_percent(str) {
		return (String(str).indexOf('%')>=0);
	}
	function compute_mean(X) {
		var ret=0;
		for (var i=0; i<X.length; i++) {
			ret+=(X[i]||0);
		}
		if (X.length>0) ret/=X.length;
		return ret;
	}
	function compute_min(X) {
		var ret=X[0]||0;
		for (var i=0; i<X.length; i++) {
			if (X[i]<ret) ret=X[i];
		}
		return ret;
	}
	function compute_max(X) {
		var ret=X[0]||0;
		for (var i=0; i<X.length; i++) {
			if (X[i]>ret) ret=X[i];
		}
		return ret;
	}
	function compute_stdev(X) {
		var mean0=compute_mean(X);
		var ret=0;
		for (var i=0; i<X.length; i++) {
			var tmp=(X[i]-mean0)*(X[i]-mean0);
			ret+=tmp;
		}
		if (X.length>=2) {
			ret/=(X.length-1);
		}
		return Math.sqrt(ret);
	}
	function compute_stats(V,R0) {
		var nums=[];
		for (var y=R0[1]; y<R0[1]+R0[3]; y++)
		for (var x=R0[0]; x<R0[0]+R0[2]; x++) {
			if (m_overlay) nums.push(V.overlayValueAt(x,y)||0);
			else nums.push(V.valueAt(x,y)||0);
		}
		return [compute_mean(nums),compute_min(nums),compute_max(nums),compute_stdev(nums)];
	}
	function get_current_view() {
		for (var i=0; i<m_views.length; i++) {
			var V=m_views[i];
			var pos=V.currentPosition();
			if ((pos[0]>=0)&&(pos[1]>=0)) return V;
		}
		if (m_views.length>=0) return m_views[0];
		return null;
	}
	var update_info=function() {
		var current_view=get_current_view();
		
		
		var txt='';
		if (m_array) {
			var current_position=that.currentPosition();
			
			m_slider.slider('option','value',current_position[2]);
			
			var ndims=2; if (m_N2>1) ndims=2; if (m_N3>1) ndims=3; if (m_N4>1) ndims=4;
			if (m_N1*m_N2*m_N3*m_N4>0) {
				txt+=m_N1;
				if (ndims>=2) txt+='x'+m_N2;
				if (ndims>=3) txt+='x'+m_N3;
				if (ndims>=4) txt+='x'+m_N4;
				if (current_view) {
					if (current_view.selectedRect()[0]>=0) {
						var R0=current_view.selectedRect();
						txt+='| Pos: '+current_position[0];
						if (ndims>=2) txt+=', '+current_position[1];
						if (ndims>=3) txt+=', '+current_position[2];
						if (ndims>=4) txt+=', '+current_position[3];
						txt+=' | ';
						txt+=R0[2];
						txt+='x';
						txt+=R0[3];
						txt+=' ';
						var stats0=compute_stats(current_view,R0);
						txt+='mean='+formatnum(stats0[0])+'; min/max='+formatnum(stats0[1])+'/'+formatnum(stats0[2])+'; stdev='+formatnum(stats0[3])+';';
					}
					else if (current_position[0]>=0) {
						txt+='| Pos: '+current_position[0];
						if (ndims>=2) txt+=', '+current_position[1];
						if (ndims>=3) txt+=', '+current_position[2];
						if (ndims>=4) txt+=', '+current_position[3];
						txt+=' ';
						var val0=get_current_value();
						if (val0!==null) {
							txt+='| Value: ';
							var val0_imag=get_current_value_imag();
							if (val0_imag) {
								txt+=formatcomplex(val0,val0_imag);
								
							}
							else {
								txt+=formatnum(val0);
							}
						}
						var val1=get_current_overlay_value();
						if (val1!==null) {
							txt+='| Overlay: '+formatnum(val1);
						}
					}
					else {
						txt+='| Pos: *, *, ';
						if (ndims>=3) txt+=', '+current_position[2];
						if (ndims>=4) txt+=', '+current_position[3];
					}
					
					if (current_view.selectedRect()[0]<0) {
						txt+=' <a href="#" id="download_image" title="download image">di</a>';
						//txt+=' <a href="#" id="download_file" title="download file">da</a>';
						//txt+=' <a href="#" id="show_history" title="show history">h</a>';
						//if (m_array_file.fileType()=='mda')
						//	txt+=' <a href="#" id="preload_file" title="preload images">p</a>';
					}
				}
			}
		}
		
		if (m_status!='ok') txt+='  '+m_status;
		
		m_info_div.html('<nobr>'+txt+'</nobr>');
		
		m_info_div.find('#download_image').click(on_download_image);
		//m_info_div.find('#download_file').click(on_download_file);
		//m_info_div.find('#show_history').click(on_show_history);
		//m_info_div.find('#preload_file').click(on_preload_file);
	};
	var m_update_info_scheduled=false;
	function schedule_update_info() {
		if (m_update_info_scheduled) return;
		m_update_info_scheduled=true;
		setTimeout(function() {
			m_update_info_scheduled=false;
			update_info();
		},200);
	}
	var formatnum=function(num) {
		num=Number(num);
		if (num>100) return Math.floor(num+0.5);
		else return num.toPrecision(3);
	};
	var formatcomplex=function(re,im) {
		re=Number(re);
		im=Number(im);
		if ((re)&&(im)) {
			if (im>0) {
				return re.toPrecision(3)+' + '+im.toPrecision(3)+'i';
			}
			else {
				return re.toPrecision(3)+' - '+(-im).toPrecision(3)+'i';
			}
		}
		else if (im) {
			return im.toPrecision(3)+'i';
		}
		else {
			return re.toPrecision(3);
		}
	};
	var get_current_value=function() {
		var current_view=get_current_view();
		if (!current_view) return 0;
		return current_view.currentValue();
	};
	var get_current_value_imag=function() {
		var current_view=get_current_view();
		if (!current_view) return 0;
		return current_view.currentValueImag();
	};
	var get_current_overlay_value=function() {
		var current_view=get_current_view();
		if (!current_view) return 0;
		return current_view.currentOverlayValue();
	};
	
	function _currentPosition() {
		var V=get_current_view();
		if (!V) return [-1,-1,-1,-1];
		var pos0=V.currentPosition();
		return [pos0[0],pos0[1],V.position[2],V.position[3]];
	}
	function update_slice_positions() {
		if (m_array) {
			for_each_view(function(V) {
				V.position[2]=Math.round((m_array.N3()-1)*V.slice_pct)+m_slice_offset;
			});
		}
	}
	var _setCurrentPosition=function(pos) {
		var current_position=that.currentPosition();
		if ((current_position[0]==pos[0])&&(current_position[1]==pos[1])&&(current_position[2]==pos[2])&&(current_position[3]==pos[3])) return;
		
		var refresh_required=false;
		var found_view=false;
		for (var i=0; i<m_views.length; i++) {
			var V=m_views[i];
			if (V.position[3]!=pos[3]) {
				refresh_required=true;
				V.position[3]=pos[3];
			}
			if ((V.position[2]==pos[2])&&(V.position[3]==pos[3])) {
				V.setCurrentPosition([pos[0],pos[1]]);
				found_view=true;
			}
			else {
				V.setCurrentPosition([-1,-1]);
			}
		}
		if (!found_view) {
			var closest_view=null;
			var closest_absdiff=9999;
			update_slice_positions();
			for (var k=0; k<m_views.length; k++) {
				var V=m_views[k];
				var absdiff=Math.abs(V.position[2]-m_slice_offset-pos[2]);
				if ((absdiff<closest_absdiff)&&(V.position[2]>=0)) {
					closest_view=V;
					closest_absdiff=absdiff;
				}
			}
			if (closest_view) {
				m_slice_offset+=pos[2]-closest_view.position[2];
				update_slice_positions();
				refresh_required=true;
			}
			for (var i=0; i<m_views.length; i++) {
				var V=m_views[i];
				if ((V.position[2]==pos[2])&&(V.position[3]==pos[3])) {
					V.setCurrentPosition([pos[0],pos[1]]);
				}
				else {
					V.setCurrentPosition([-1,-1]);
				}
			}
		}
		
		update_info();
		
		if (refresh_required) {
			that.refresh();
		}
		
		m_div.trigger('current-position-changed');
	};
	var _setOverlayIndex=function(indx) {
		if (m_overlay_index==indx) return;
		m_overlay_index=indx;
		update_info();
		that.refresh();
	};
	
	/*
	function on_show_history() {
		var path0=m_overlay_path;
		if (path0==='') path0=m_array_path;
		var url0='$approot$/../../processhistoryview/processhistoryview.html?node='+Wisdm.sessionNode+'&path='+path0;
		window.open(url0,'_blank');
	}
	function on_download_file() {
		var path0=m_overlay_path;
		if (!path0) path0=m_array_path;
		Wisdm.downloadFile({
			path:path0
		});
	}
	*/
	var on_download_image=function() {
		that.createImageUrl(function(url0,W0,H0) {
			popup_image(url0,W0,H0);
		});
	};
	var popup_image=function(url,W,H) {
		var div0=$('<div></div>');
		var img1=$('<center><p><img /></p></center>');
		var img0=img1.find('img');
		div0.append(img1);
		div0.append('<p>Right-click the image to copy or save.</p>');
		img0.attr('src',url);
		var scale=400/W;
		if (250/H<scale) scale=250/H;
		img0.css('width',Math.floor(W*scale));
		img0.css('height',Math.floor(H*scale));
		div0.dialog({
			width:450,
			resizable: false,
			modal: true,
			position: 'center',
			closeOnEscape: true,
			title:'Copy or save image'
		});
	};
	/*
	function on_preload_file() {
		jAlert('Please wait while slices are preloaded...');
		var current_position=that.currentPosition();
		var num_loaded=0;
		for (var i=0; i<m_array.N3(); i++) {
			m_array.getDataXY([i,current_position[3]],function() {
				num_loaded++;
			});
		}
		function check_loaded() {
			jAlert('Please wait while slices are preloaded ('+num_loaded+'/'+m_array.N3()+') ...');
			if (num_loaded>=m_array.N3()) {
				jAlert('Slices have been preloaded.');
			}
			else {
				setTimeout(check_loaded,1000);
			}
		}
		check_loaded();
	}
	*/
	
	function _setColorMapColors(colors) {
		m_color_map_colors=colors;
		for_each_view(function(V) {
			V.setColorMapColors(colors);
		});
	}
	function _setColorMap(map) {
		m_color_map=map;
		for_each_view(function(V) {
			V.setColorMap(map);
		});
	}
			
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
	do_initialize();
}

