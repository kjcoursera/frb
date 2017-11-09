/*** require("widgets:/viewmda/viewmda.js"); ***/
/*** require('widgets/wisdmcolormap.js'); ***/

function FRBActivationView() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H;};
	this.setTitle=function(title) {m_title=title; m_title_label.html(m_title);};
	this.setTemplate=function(X) {m_template=X;};
	this.setOverlay=function(X) {m_overlay=X;};
	this.setOverlayThreshold=function(thr) {m_overlay_threshold=thr;};
	this.setOverlayRange=function(min,max,neg) {m_overlay_min=min; m_overlay_max=max; m_overlay_neg=neg||false;};
	this.setTemplateRange=function(min,max) {m_template_min=min; m_template_max=max;};
	this.setColorMap=function(colormap) {m_colormap=colormap;};
	this.setLayout=function(layout) {m_layout=layout;}; //'mosaic' or '3-plane'
	this.setMosaicSliceCounts=function(num_rows,num_cols) {m_mosaic_num_rows=num_rows; m_mosaic_num_cols=num_cols;};
	this.setMosaicPlane=function(plane) {m_mosaic_plane=plane;};
	this.setLoading=function() {m_status='<span class="loading_message">Loading...</span>'; update_info();};
	this.addButton=function(button) {if (typeof(button)=='string') {add_button_by_string(button); return;} button.addClass('fmriactivationview-button'); m_div.find('#title_buttons').prepend(button);};
	this.clearButtons=function() {m_div.find('#title_buttons').empty();};
	this.refresh=function(params,callback) {return _refresh.apply(this,arguments);};
	this.currentPosition=function() {return JSON.parse(JSON.stringify(m_current_position));};
	this.setCurrentPosition=function(pos) {return _setCurrentPosition.apply(this,arguments);};
	this.selectedRect=function() {return _selectedRect.apply(this,arguments);};
	this.setSelectedRect=function(R) {return _setSelectedRect.apply(this,arguments);};
	this.template=function() {return m_template;};
	this.overlay=function() {return m_overlay;};
	this.mosaicSliceCounts=function() {return [m_mosaic_num_rows,m_mosaic_num_cols];};
	this.createImageUrl=function(callback) {return _createImageUrl.apply(this,arguments);};
	this.onCurrentPositionChanged=function(callback) {m_current_position_changed_handlers.push(callback);};
	this.onSelectedRectChanged=function(callback) {m_div.bind('selected_rect_changed',function(evt,obj) {callback();});};
	this.onPointClicked=function(callback) {m_div.bind('fav_point_clicked',function(evt,obj) {callback(obj.position);});};
	this.setOverlayIndex=function(ind) {m_overlay_index=ind;};
	this.layout=function() {return m_layout;};
	this.setSignalsEnabled=function(val) {m_signals_enabled=val;};
		
	var m_div=$('<div style="position:relative;overflow:hidden"></div>');
	var m_info_div=$('<div class="fmriactivationview-info"></div>');
	var m_title_label=$('<div class="fmriactivationview-title"></div>');
	var m_title_buttons=$('<div class="fmriactivationview-title-buttons"><span id=title_buttons></span></div>');
	var m_views_div=$('<div class="fmriactivationview-views"></div>');
	m_div.append(m_info_div);
	m_div.append(m_title_label);
	m_div.append(m_title_buttons);
	m_div.append(m_views_div);
	
	var m_width=0,m_height=0;
	var m_template=null,m_overlay=null/*,m_threshold_map=''*/;
	var m_overlay_threshold=0,m_overlay_min=0,m_overlay_max=1,m_overlay_neg=false;
	var m_template_min='0%',m_template_max='100%';
	var m_layout='mosaic';
	var m_mosaic_num_rows=1,m_mosaic_num_cols=1;
	var m_mosaic_plane='XY';
	var m_N1=0,m_N2=0,m_N3=0,m_N4=0;
	var m_transformation=new AffineTransformation();
	var m_slice_views=[];
	var m_current_position=[-1,-1,-1];
	var m_overlay_index=0;
	
	var m_status='<span class="loading_message">Loading...</span>';
	var m_title='';
	var m_current_position_changed_handlers=[];
	var m_colormap='Fire';
	var m_colormap_colors=[];
	
	var m_signals_enabled=true;
	
	var m_refresh_code='';
	var _refresh=function(params,callback) {
		
		var refresh_code=utils.make_random_id();
		m_refresh_code=refresh_code;
		
		var timer_222=new Date();
		
		params=$.extend({},{load_data:true},params);
		m_status='<span class="loading_message">Loading...</span>';
		update_info();
		var margin0=5;
		var info_height=12;
		var title_height=14;
		m_div.css({width:m_width,height:m_height});
		m_div.addClass('fmriactivationview-box');
		
		m_info_div.css({position:'absolute',width:m_width-margin0*2,height:info_height,bottom:margin0,left:margin0});
		update_info();
		
		m_title_label.css({position:'absolute',width:m_width-margin0*2,height:title_height,top:margin0,left:margin0});
		m_title_buttons.css({position:'absolute',width:m_width-margin0*2,height:title_height,top:margin0,left:margin0});
		
		
		var call_callbacks=function(ret) {
			if (callback) callback(ret);
		};
		
		if ((!m_template)||(!params.load_data)) {
			call_callbacks({success:true});
			return;
		}
		
		update_dimensions_and_colormap(function(tmp) { //retrieves m_N1,m_N2,m_N3,m_N4,m_colormap_colors
			if (refresh_code!=m_refresh_code) return;
			
			if (!tmp.success) {
				console.log ('Problem getting dimensions: '+tmp.error); 
				call_callbacks(tmp);
				return;
			}
			
			if ((m_current_position[0]<0)&&(m_N1>0)) {
				that.setCurrentPosition([Math.floor(m_N1/2),Math.floor(m_N2/2),Math.floor(m_N3/2)]);
			}
			
			var mosaic_num_rows=m_mosaic_num_rows;
			var mosaic_num_cols=m_mosaic_num_cols;
			
			//define slices, W1 and H1
			slices=[];
			var W1=0;
			var H1=0;
			if (m_layout=='mosaic') {
				var M1=m_N1,M2=m_N2,M3=m_N3,M4=m_N4;
				if (m_mosaic_plane=='XY') {
					M1=m_N1; M2=m_N2; M3=m_N3; M4=m_N4;
				}
				else if (m_mosaic_plane=='XZ') {
					M1=m_N1; M2=m_N3; M3=m_N2; M4=m_N4;
				}
				else if (m_mosaic_plane=='YZ') {
					M1=m_N2; M2=m_N3; M3=m_N1; M4=m_N4;
				}
				
				if (M3==1) {
					mosaic_num_rows=mosaic_num_cols=1;
				}
				
				W1=(m_width-margin0*2)/mosaic_num_cols;
				H1=(m_height-margin0*2-info_height-title_height)/mosaic_num_rows;
				
				var num_slices=mosaic_num_rows*mosaic_num_cols;
				var slice_increment=1;
				if (num_slices>1) slice_increment=M3/(num_slices+1);
				var slice0=M3/2-slice_increment*(num_slices-1)/2;
				for (var ii=0; ii<num_slices; ii++) {
					slices.push({
						slice:Math.floor(slice0+slice_increment*ii),
						col:(ii % mosaic_num_cols),
						row:Math.floor(ii/mosaic_num_cols),
						plane:m_mosaic_plane
					});
				}
			}
			else if (m_layout=='3-plane') {
				W1=Math.floor((m_width-margin0*2)/3);
				H1=Math.floor((m_height-margin0*2-info_height-title_height)/1);
				slices.push({
					slice:m_current_position[2],
					col:0,row:0,
					plane:'XY'
				});
				slices.push({
					slice:m_current_position[1],
					col:1,row:0,
					plane:'XZ'
				});
				slices.push({
					slice:m_current_position[0],
					col:2,row:0,
					plane:'YZ'
				});
			}
			
			if (refresh_code!=m_refresh_code) return;
			
			m_views_div.css({position:'absolute',left:margin0,top:margin0+title_height,width:m_width-margin0*2,height:m_height-margin0*2-info_height-title_height});
			
			(function() {
				m_slice_views=[];
				for (var ii=0; ii<slices.length; ii++) {
					var VV=new Array2DOverlayView();
					VV.slice0=slices[ii];
					if (VV.slice0.plane=='XY') {
						if (m_transformation.get(0,0)>0) VV.setSwapX(true); //changed on 9/15/14, changed back on 10/27/14, changed back on 2/25/15
						if (m_transformation.get(1,1)>0) VV.setSwapY(true);
					}
					else if (VV.slice0.plane=='XZ') {
						if (m_transformation.get(0,0)>0) VV.setSwapX(true); //changed on 9/15/14, changed back on 10/27/14, changed back on 2/25/15
						if (m_transformation.get(2,2)>0) VV.setSwapY(true);
					}
					else if (VV.slice0.plane=='YZ') {
						if (m_transformation.get(1,1)>0) VV.setSwapX(false); //changed on 9/15/14
						if (m_transformation.get(2,2)>0) VV.setSwapY(true);
					}
					//if (m_transformation[10]<0) VV.setSwapZ(true);
					
					VV.setSize(W1,H1);
					VV.div().css({left:(W1)*VV.slice0.col,top:(H1)*VV.slice0.row});
					VV.setOverlayThreshold(m_overlay_threshold);
					VV.setOverlayRange(m_overlay_min,m_overlay_max,m_overlay_neg);
					VV.setWindowRange(m_template_min,m_template_max);
					VV.setColorMapColors(m_colormap_colors);
					connect_view(VV);
					
					m_slice_views.push(VV);
					VV.refresh();
				}
			})();
			
			var timer0=new Date();
			var refresh_views=function() {
				if (refresh_code!=m_refresh_code) return;
				var refresh_next_view=function(ii) {
					if (refresh_code!=m_refresh_code) return;
					if (ii>=m_slice_views.length) {
						update_info();
						call_callbacks({success:true});
						return;
					}
					var VV=m_slice_views[ii];
					m_views_div.append(VV.div());
					VV.refresh();
					
					//we don't want to freeze the user interface, so pause for 20 ms every 100ms
					var elapsed0=((new Date())-timer0);
					if (elapsed0>100) {
						timer0=new Date();
						setTimeout(function() {refresh_next_view(ii+1);},20);
					}
					else {
						refresh_next_view(ii+1);
					}
				};
				m_views_div.empty();
				refresh_next_view(0);
			};
			
			var num_loaded=0;
			var load_next_view=function(ii) {
				if (refresh_code!=m_refresh_code) return;
				if (ii>=m_slice_views.length) {return;}
				var VV=m_slice_views[ii];
				get_slice_data({array:m_template,plane:VV.slice0.plane,slice:VV.slice0.slice},function(tmp2) {
					if (refresh_code!=m_refresh_code) return;
					var func1=function() {
						if (refresh_code!=m_refresh_code) return;
						num_loaded++;
						if (num_loaded==m_slice_views.length) {
							if (m_slice_views.length>0) m_status='ok';
							refresh_views();
						}
						//load_next_view(ii+1); //use this one if we want to load sequentially
					};
					if (tmp2.success) {
						VV.setArray(tmp2.data);
						var pos2=to_useful_position(VV.slice0.plane,m_current_position);
						if (VV.slice0.slice==pos2[2]) VV.setCurrentPosition([pos2[0],pos2[1]]);
						if (m_overlay) {
							get_slice_data({array:m_overlay,plane:VV.slice0.plane,slice:VV.slice0.slice,t:m_overlay_index},function(tmp3) {
								if (refresh_code!=m_refresh_code) return;
								if (tmp3.success) {
									VV.setOverlay(tmp3.data);
									func1();
								}
								else {
									func1();
								}
							});
						}
						else {
							func1();
						}
					}
					else {
						func1();
					}
				});
				load_next_view(ii+1); //otherwise, use this one to load simultaneously (more efficient)
			};
			if (refresh_code!=m_refresh_code) return;
			load_next_view(0);
		});
	};
	var m_refresh_scheduled=false;
	var schedule_refresh=function() {
		if (m_refresh_scheduled) return;
		m_refresh_scheduled=true;
		setTimeout(function() {m_refresh_scheduled=false; _refresh();},100);
	};
	var update_info=function() {
		if (m_status!=='ok') m_info_div.html(m_status);
		else {
			var txt='';
			txt+=m_N1+'x'+m_N2+'x'+m_N3+' ';
			if (m_N4>1) txt+='x'+m_N4;
			if (m_current_position[0]>=0) {
				var pppp=m_current_position;
				pppp=m_transformation.map(pppp);
				pppp[0]=-pppp[0]; //it's a hack!
				if (m_transformation.get(0,0)<0) pppp[0]=-pppp[0]; //added 10/27/14
				txt+='| <a href="javascript:;" id=change_pos>Pos</a>: '+formatnum(pppp[0])+', '+formatnum(pppp[1])+', '+formatnum(pppp[2])+' ';
				var val0=get_current_value();
				if (val0!==null) {
					txt+='| Value: '+formatnum(val0)+' ';
				}
				txt+='| <a href="javascript:;" id=local_maximum>max</a>';
				txt+=' <a href="javascript:;" id=local_minimum>min</a>';
			}
			m_info_div.html('<nobr>'+txt+'</nobr>');
			m_info_div.find('#change_pos').click(on_change_pos);
			m_info_div.find('#local_maximum').click(on_local_maximum);
			m_info_div.find('#local_minimum').click(on_local_minimum);
		}
	};
	var formatnum=function(num) {
		num=Number(num);
		if (num>100) return Math.floor(num+0.5);
		else return num.toPrecision(3).replace(/\.?0+$/,"");
	};
	
	function on_change_pos() {
		var pppp=m_current_position;
		pppp=m_transformation.map(pppp);
		pppp[0]=-pppp[0]; //it's a hack!
		if (m_transformation.get(0,0)<0) pppp[0]=-pppp[0]; //added 10/27/14
		var txt=formatnum(pppp[0])+', '+formatnum(pppp[1])+', '+formatnum(pppp[2]);
		jPrompt('Position:',txt,'Change position',function(tmp) {
			if (!tmp) return;
			var vals=tmp.split(',');
			if (vals.length!=3) return;
			for (var i=0; i<vals.length; i++) vals[i]=Number(vals[i].trim());
			var pppp=vals;
			pppp[0]=-pppp[0]; //it's a hack!
			pppp=m_transformation.inverse().map(pppp);
			pppp[0]=Math.floor(pppp[0]+0.5);
			pppp[1]=Math.floor(pppp[1]+0.5);
			pppp[2]=Math.floor(pppp[2]+0.5);
			setTimeout(function() {
				that.setCurrentPosition(pppp);
			},1000);
		});
	}
	function on_local_minimum() {
		do_local_maximum(true);
	}
	function on_local_maximum() {
		do_local_maximum(false);
	}
	function do_local_maximum(do_min) {
		if (!m_overlay) return;
		var VV=m_slice_views[0];
		var pp=JSON.parse(JSON.stringify(m_current_position));
		var rr=6;
		check_next_slice(VV.slice0.slice-rr);
		var maxval=0;
		var xmax,ymax,zmax;
		if (VV.slice0.plane=='XY') {
			xmax=pp[0];
			ymax=pp[1];
			zmax=VV.slice0.slice;
		}
		else if (VV.slice0.plane=='XZ') {
			xmax=pp[0];
			zmax=pp[1];
			ymax=VV.slice0.slice;
		}
		else if (VV.slice0.plane=='YZ') {
			ymax=pp[0];
			zmax=pp[1];
			xmax=VV.slice0.slice;
		}
		
		function check_next_slice(slice) {
			if (slice>=VV.slice0.slice+rr) {
				if (VV.slice0.plane=='XY') {
					pp[0]=xmax;
					pp[1]=ymax;
					pp[2]=zmax;
				}
				else if (VV.slice0.plane=='XZ') {
					pp[0]=xmax;
					pp[1]=zmax;
					pp[2]=ymax;
				}
				else if (VV.slice0.plane=='YZ') {
					pp[0]=ymax;
					pp[1]=zmax;
					pp[2]=xmax;
				}
				that.setCurrentPosition(pp);
				jAlert(null);
				return;
			}
			jAlert('Checking slice: '+slice);
			get_slice_data({array:m_overlay,plane:VV.slice0.plane,slice:slice,t:m_overlay_index},function(tmp3) {
				if (tmp3.success) {
					var X=tmp3.data;
					for (var dy=-rr; dy<=rr; dy++)
					for (var dx=-rr; dx<=rr; dx++) {
						var x0=pp[0]+dx;
						var y0=pp[1]+dy;
						if ((x0>0)&&(x0<X.N1())&&(y0>=0)&&(y0<X.N2())) {
							if (!do_min) {
								if (X.value(x0,y0)>maxval) {
									maxval=X.value(x0,y0);
									xmax=x0;
									ymax=y0;
									zmax=slice;
								}
							}
							else {
								if (X.value(x0,y0)<maxval) {
									maxval=X.value(x0,y0);
									xmax=x0;
									ymax=y0;
									zmax=slice;
								}
							}
						}
					}
					
				}
				check_next_slice(slice+1);
			});
		}
	}
	
	var to_useful_position=function(plane,pos) {
		if (plane=='XY') {
			var ret=[pos[0],pos[1],pos[2]];
			if (m_transformation.get(0,0)<0) ret[0]=m_N1-1-ret[0]; //added 10/27/14
			return ret;
		}
		else if (plane=='XZ') {
			var ret=[pos[0],pos[2],pos[1]];
			if (m_transformation.get(0,0)<0) ret[0]=m_N1-1-ret[0]; //added 10/27/14
			return ret;
		}
		else if (plane=='YZ') {
			var ret=[pos[1],pos[2],pos[0]];
			if (m_transformation.get(0,0)<0) ret[2]=m_N1-1-ret[2]; //added 10/27/14
			return ret;
		}
	};
	var from_useful_position=function(plane,pos) {
		if (plane=='XY') {
			var ret=[pos[0],pos[1],pos[2]];
			if (m_transformation.get(0,0)<0) ret[0]=m_N1-1-ret[0]; //added 10/27/14
			return ret;
		}
		else if (plane=='XZ') {
			var ret=[pos[0],pos[2],pos[1]];
			if (m_transformation.get(0,0)<0) ret[0]=m_N1-1-ret[0]; //added 10/27/14
			return ret;
		}
		else if (plane=='YZ') {
			var ret=[pos[2],pos[0],pos[1]];
			if (m_transformation.get(0,0)<0) ret[2]=m_N1-1-ret[2]; //added 10/27/14
			return ret;
		}
	};
	var get_current_value=function() {
		var plane='XY';
		if (m_layout=='mosaic') plane=m_mosaic_plane;
		var pos=to_useful_position(plane,m_current_position);
		var VV=find_slice_view(plane,pos[2]);
		if (!VV) return null;
		var XX=VV.overlay();
		if (!XX) XX=VV.array();
		if (!XX) return 0;
		return XX.value(pos[0],pos[1]);
	};
	
	var _setCurrentPosition=function(pos) {
		if ((m_current_position[0]==pos[0])&&(m_current_position[1]==pos[1])&&(m_current_position[2]==pos[2])) {
			return;
		}
		m_current_position[0]=pos[0];
		m_current_position[1]=pos[1];
		m_current_position[2]=pos[2];
		
		var ii;
		if (m_layout=='mosaic') {
			for (var kk=0; kk<m_slice_views.length; kk++) m_slice_views[kk].setCurrentPosition([-1,-1]);
			var pos2=to_useful_position(m_mosaic_plane,m_current_position);
			//{
				VV=find_slice_view(m_mosaic_plane,pos2[2]);
				if (VV) {
					VV.setCurrentPosition([pos2[0],pos2[1]]);
				}
			//}
		}
		update_info();
		if (m_signals_enabled) { //added 3/30/15
			for (ii=0; ii<m_current_position_changed_handlers.length; ii++)
				(m_current_position_changed_handlers[ii])();
		}
	};
	var find_slice_view=function(plane,slice) {
		for (var kk=0; kk<m_slice_views.length; kk++) {
			if ((m_slice_views[kk].slice0.plane==plane)&&(m_slice_views[kk].slice0.slice==slice))
				return m_slice_views[kk];
		}
		return null;
	};
	var _selectedRect=function() {
		if (m_layout=='mosaic') {
			var pos0=to_useful_position(m_mosaic_plane,m_current_position);
			var VV=find_slice_view(m_mosaic_plane,pos0[2]);
			if (VV) {
				return VV.selectedRect();
			}
			else return [-1,-1,0,0];
		}
		else {
			return [-1,-1,0,0]; //fix
		}
	};
	var _setSelectedRect=function(R) {
		if (m_layout=='mosaic') {
			var pos0=to_useful_position(m_mosaic_plane,m_current_position);
			var VV=find_slice_view(m_mosaic_plane,pos0[2]);
			if (VV) {
				VV.setSelectedRect(R);
			}
		}
		else {
			//fix
		}
	};
	
	var connect_view=function(VV) {
		VV.onCurrentPositionChanged(function() {
			var pos0=VV.currentPosition();
			if ((pos0[0]>=0)&&(pos0[1]>=0)) {
				var slice0=VV.slice0.slice;
				var pos2=from_useful_position(VV.slice0.plane,[pos0[0],pos0[1],slice0]);
				that.setCurrentPosition(pos2);
			}
		});
		VV.onSelectedRectChanged(function() {
			m_div.trigger('selected_rect_changed');
		});
		VV.onPointClicked(function() {
			var pos=VV.currentPosition();
			m_div.trigger('fav_point_clicked',{position:[pos[0],pos[1],VV.slice0.slice]});
		});
	};
	
	var update_dimensions_and_colormap=function(callback) {
		WisdmColorMap.loadMaps({},function() {
			var colors=WisdmColorMap.getColors(m_colormap);
			m_colormap_colors=colors;
			
			var NN=new Nii();
			NN.setFile(new RemoteFile(m_overlay)); //changed on 10/27/14
			NN.initialize(function(success,err) {
				if (success) {
					m_N1=NN.N1();
					m_N2=NN.N2();
					m_N3=NN.N3();
					m_N4=NN.N4();
					m_transformation=NN.transformation();
					
					callback({success:true,error:''});
				} else {
					callback({success:false,error:err});
				}
			});
			
		});
	};
	
	var _createImageUrl=function(callback) {
		var canvas0=make_canvas();
		var W0=m_views_div.width();
		var H0=m_views_div.height();
		canvas0[0].width=W0;
		canvas0[0].height=H0;
		
		var ctx=canvas0[0].getContext('2d');
		ctx.fillStyle='black';
		ctx.fillRect(0,0,m_div.width(),m_div.height());
		
		var draw_view=function(ind) {
			if (ind>=m_slice_views.length) {
				callback(canvas0[0].toDataURL(),W0,H0);
			}
			else {
				m_slice_views[ind].createImageUrl(function(url0) {
					draw_image_from_data_url(
						canvas0,url0,parseInt(m_slice_views[ind].div().css('left'),10),parseInt(m_slice_views[ind].div().css('top'),10),function() {
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
	
	var add_button_by_string=function(str) {
		if (str=='download') {
			var B0=$('<div class=fmriactivationview-copy-button title="copy or save image"></div>');
			B0.click(function() {on_download();});
			that.addButton(B0);
		}
	};
	
	var on_download=function() {
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


var get_slice_data=function(params,callback) {
	if (!('t' in params)) params.t=0;
	
	if (!params.array) {
		callback({success:false,error:'array is empty'}); return;
	}
	
	var NN=new Nii();
	NN.setFile(new RemoteFile(params.array));
	NN.initialize(function(success,err) {
		if (success) {
			if (params.plane=='XY') {
				NN.getDataXY([params.slice,params.t],function (data0,err) {
					if (data0) {
						callback({success:true,data:data0});
					}
					else {
						console.log ('ERROR getting XY data for .nii file.');
						callback({success:false,error:err});
					}
				});
			}
			else if (params.plane=='XZ') {
				NN.getDataXZ([params.slice,params.t],function (data0,err) {
					if (data0) {
						callback({success:true,data:data0});
					}
					else {
						console.log ('ERROR getting XZ data for .nii file.');
						callback({success:false,error:err});
					}
				});
			}
			else if (params.plane=='YZ') {
				NN.getDataYZ([params.slice,params.t],function (data0,err) {
					if (data0) {
						callback({success:true,data:data0});
					}
					else {
						console.log ('ERROR getting YZ data for .nii file.');
						callback({success:false,error:err});
					}
				});
			}
		}
		else {
			console.log ('ERROR INITIALIZING .nii file.');
			callback({success:false,error:err});
		}
	});
};

