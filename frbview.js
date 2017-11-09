/*** require('frbactivationview.js'); ***/
/*** require('frbsettingswidget.js'); ***/

function FRBView() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.initializeWidgets=function() {return _initializeWidgets.apply(this,arguments);};
	this.setOutput=function(output) {m_output=output;};
	this.setTitle=function(title) {m_title=title;};
	this.initialize=function() {return _initialize.apply(this,arguments);};
	
	var m_div=$('<div style="position:absolute;left:0px;right:0px;top:0px;bottom:0px"></div>');
	var m_settings_widget=null;
	var m_boxes=[];
	var m_output={};
	var m_current_position=[-1,-1,-1];
	var m_expanded_mode=false;
	var m_expanded_view=new ExpandedView();
	var m_widgets_initialized=false;
	var m_title='Unknown Title';
	
	load_current_position();
	
	var _initializeWidgets=function() {
		if (m_widgets_initialized) return;
		m_widgets_initialized=true;
		
		m_settings_widget=new FRBSettingsWidget();
		m_settings_widget.onHiddenChanged(function() {schedule_refresh_layout();});
		m_settings_widget.div().attr('id','settings');
		m_settings_widget.div().css({"z-index":100}); //this is important so we can click the link to re-show the window
		
		m_settings_widget.onSettingsChanged(function() {refresh_views({only_visible:true});});
		m_settings_widget.setEnabled(false);
		m_div.append(m_settings_widget.div());
		
		m_div.append('<div id=views></div>');
		m_div.append(m_expanded_view.div());
		
		refresh_layout();
	};
	
	var refresh_layout=function() {
		if (!m_widgets_initialized) return;
		
		var settings_panel_width=300;
		if (m_settings_widget.isHidden()) {
			settings_panel_width=0;
		}
		
		var views_width=0,views_height=0;
		
		views_width=m_div.width()-settings_panel_width-30;
		views_height=m_div.height()-20;
		m_div.find('#views').css({left:0,right:settings_panel_width+10,top:0,bottom:0});
		m_expanded_view.div().css({left:0,right:settings_panel_width+10,top:0,bottom:0});
		
		m_settings_widget.div().css({width:300,right:0,top:0,bottom:0});
		if (!m_expanded_mode) {
			m_div.find('#views').show();
			m_expanded_view.div().hide();
		}
		else {
			m_div.find('#views').hide();
			m_expanded_view.div().show();
			m_expanded_view.div().css({left:0,top:0});
			m_expanded_view.setSize(views_width,views_height);
			m_expanded_view.refresh();
		}
	};
	var m_refresh_layout_scheduled=false;
	var schedule_refresh_layout=function() {
		if (m_refresh_layout_scheduled) return;
		m_refresh_layout_scheduled=true;
		setTimeout(function() {
			m_refresh_layout_scheduled=false;
			refresh_layout();
		},100);
	};
	$(window).resize(schedule_refresh_layout);
	
	function lsTest(){
		var test = 'test';
		try {
			localStorage.setItem(test, test);
			localStorage.removeItem(test);
			return true;
		}
		catch(e) {return false;}
	}
	function save_current_position() {
		if (!lsTest()) return;
		localStorage.frb_current_position=JSON.stringify(m_current_position);
		localStorage.frb_current_position_date=JSON.stringify(new Date());
	}
	function load_current_position() {
		if (!lsTest()) return;
		if (!localStorage.frb_current_position) return;
		try {
			var DD=new Date(JSON.parse(localStorage.frb_current_position_date));
			elapsed=((new Date())-DD)/1000;
			if (elapsed<60*5) {
				var tmp=JSON.parse(localStorage.frb_current_position);
				if (tmp.length==3) {
					m_current_position=tmp;
				}
				localStorage.frb_current_position_date=JSON.stringify(new Date());
			}
		}
		catch(err) {
		}
	}
	
	var connect_view=function(X) {
		X.is_expanded=false;
		X.onCurrentPositionChanged(function() {
			var pos=X.currentPosition();
			console.log('onCurrentPositionChanged',pos,m_current_position);
			if ((pos[0]!=m_current_position[0])||(pos[1]!=m_current_position[1])||(pos[2]!=m_current_position[2])) {
				m_current_position[0]=pos[0];
				m_current_position[1]=pos[1];
				m_current_position[2]=pos[2];
				save_current_position();
				for (var ii=0; ii<m_boxes.length; ii++) {
					//remove this (3/27/15) to see if fixes ARC's viewing problem
					//put it back for testing
					if (m_boxes[ii]!=X) {
						m_boxes[ii].setSignalsEnabled(false);
						m_boxes[ii].setCurrentPosition(pos);
						m_boxes[ii].setSignalsEnabled(true);
					}
				}
				//remove this (3/27/15) to see if fixes ARC's viewing problem
				//put it back for testing
				if (m_settings_widget.getLayout()=='3-plane')
					refresh_views({only_visible:true,do_first:X});
				//replaced by this
				//if (m_settings_widget.getLayout()=='3-plane') 
				//	X.refresh({load_data:true});
					
			}
		});
		update_buttons(X);
	};
	var update_buttons=function(X) {
		X.clearButtons();
		var B0;
		X.addButton('download');
		if (!X.is_expanded) {
			B0=$('<div class="maximize_button" title="maximize view"></div>');
			X.addButton(B0);
			B0.click(function() {on_expand(X);});
		}
		else {
			B0=$('<div class="restore_button" title="restore view"></div>');
			X.addButton(B0);
			B0.click(function() {on_restore(X);});
		}
		if (!X.is_expanded) {
			B0=$('<div class="close_button" title="close view"></div>');
			X.addButton(B0);
			B0.click(function() {on_close(X);});
			X.addButton(B0);
		}
	};
	
	var on_close=function(X) {
		var index0=-1;
		for (var ii=0; ii<m_boxes.length; ii++) 
			if (m_boxes[ii]===X)
				index0=ii;
		if (index0<0) {console.log ('Unexpected problem (101)'); return;}
		
		m_boxes.splice(index0,1);
		X.div().hide('slow',function() {X.div().remove();});
		refresh_views();
	};
	
	var on_expand=function(X) {
		var index0=-1;
		for (var ii=0; ii<m_boxes.length; ii++) 
			if (m_boxes[ii]===X)
				index0=ii;
		if (index0<0) {console.log ('Unexpected problem (101)'); return;}
		
		m_expanded_mode=true;
		
		m_expanded_view.setBox(X);
		X.box_index=index0;
		X.is_expanded=true;
		update_buttons(X);
		refresh_layout();
	};
	var insert_child_at=function(par,ind,elmt) {
		if (ind<=0) par.prepend(elmt);
		else if (ind>=par.children().length) par.append(elmt);
		else $(par.children()[ind]).before(elmt);
	};
	var on_restore=function(X) {
		insert_child_at(m_div.find('#boxes'),X.box_index,X.div());
		X.is_expanded=false;
		update_buttons(X);
		m_expanded_mode=false;
		refresh_layout();
		refresh_views({only_visible:true});
	};
	
	function array_to_string(X) {
		if (!X) return '';
		var ret='';
		for (var i=0; (i in X); i++) {
			if (X[i]) ret+=String.fromCharCode(X[i]);
		}
		return ret;
	}
	var add_activation_view=function(params) {
		params=$.extend({},{title:'undefined',template:null,overlay:null},params);
		var W=new FRBActivationView();
		W.setMosaicSliceCounts(3,3);
		m_div.find('#boxes').append(W.div());
		W.div().css({float:'left',margin:'5px'});
		connect_view(W);
		//m_VPL.addView(W);
		W.setTitle(params.title);
		W.initially_loaded=false;
		m_boxes.push(W);
		W.setTemplate(params.template);
		W.setOverlay(params.overlay);
		if (m_current_position[0]>=0) {
			W.setCurrentPosition(m_current_position);
		}
		
		W.onPointClicked(function(pos) {on_point_clicked(pos,W);});
		
		return W;
	};
	
	function find_files_in_path(path,pattern,callback) {
		Wisdm.fileSystemCommand({command:'ls '+path+'/'+pattern},function(tmp) {
			if (tmp.success=='true') {
				callback(tmp.files);
			}
			else {
				callback([]);
			}
		});
	}
	
	function read_json_file(path,callback) {
		Wisdm.getFileData({mode:'text',path:path},function(tmp) {
			if (tmp.success=='true') {
				if (tmp.data) {
					var ret=utils.parse_json(tmp.data);
					callback(ret);
				}
				else callback({});
			}
		});
	}
	
	function get_multiple_text_file_data(paths,callback) {
		var ret=[];
		var num_retrieved=0;
		for (var i=0; i<paths.length; i++) ret.push('');
		for (var j=0; j<paths.length; j++) do_retrieve(j);
		function do_retrieve(ind) {
			Wisdm.getFileData({path:paths[ind],mode:'text'},function(tmp0) {
				if (tmp0.success=='true') {
					ret[ind]=tmp0.data;
				}
				num_retrieved++;
				if (num_retrieved==paths.length) {
					callback(ret);
				}
			});
		}
	}
	
	function get_view_parameters(path,callback) {
		var ret={};
		
		var json_paths=[];
		var list=path.split('/');
		var tmppath='';
		for (var i=0; i<list.length; i++) {
			if (i>0) tmppath+='/';
			tmppath+=list[i];
			if (i>0) json_paths.push(tmppath+'/frb.json');
		}
		json_paths.push(path+'/wisdmview.json');
		get_multiple_text_file_data(json_paths,function(data0) {
			for (var i=0; i<data0.length; i++) {
				if (data0[i]) {
					ret=$.extend({},ret,utils.parse_json(data0[i]));
				}
			}
			var query_parameters={};
			var qqq=['layout','size_mode'];
			for (var j=0; j<qqq.length; j++) {
				if (Wisdm.queryParameter(qqq[j],null)) query_parameters[qqq[j]]=Wisdm.queryParameter(qqq[j]);
			}
			ret=$.extend({},ret,query_parameters);
			callback(ret);
		});
	}
	
	var _initialize=function() {
		if (!m_widgets_initialized) that.initializeWidgets();
		
		var time0=new Date();
		
		m_div.find('#views').append('<h3 style="margin:10px"><span id=the_title></span></h3>');
		m_div.find('#views').append('<span id=boxes></span>');
		
		//var title0=m_title; if (title0===null) title0=utils.get_file_name(m_path);
		var title0=m_title;
		
		m_div.find('#the_title').html(title0);
		
		//get_view_parameters(m_path,function(tmp4) {
		var tmp4={};
			m_settings_widget.setOverlayParameters({
				threshold:tmp4.overlay_threshold||2,
				minimum:tmp4.overlay_minimum||-5,
				maximum:tmp4.overlay_maximum||5,
				negative:tmp4.overlay_negative||false
			});
			m_settings_widget.setTemplateParameters({
				minimum:tmp4.template_minimum||'20%',
				maximum:tmp4.template_maximum||'150%'
			});
			//var template_path=tmp4.template||'data:/appdata/frb/templates/MNI152_T1_2mm.nii';
			m_settings_widget.setPlane(tmp4.plane||'XY');
			m_settings_widget.setLayout(tmp4.layout||'3-plane');
			m_settings_widget.setSizeMode(tmp4.size_mode||'very_large');
			m_settings_widget.setEnabled(true);
		
			/*find_files_in_path(m_path,'*.nii;*.hdr',function(nii_files) {
				console.log(nii_files);
		
				var timer0=new Date();
				var do_create_box=function(nii_file_path) {
					add_activation_view({
						//title:utils.get_file_name(nii_file_path),
						overlay_path:nii_file_path,
						template_path:template_path
					});
				};
				var num_initialized=0;
				var jj;
				for (jj=0; jj<nii_files.length; jj++) {
					if (nii_files[jj]!='template.nii') {
						do_create_box(m_path+'/'+nii_files[jj]);
					}
				}
				refresh_views({shape_only:true},function() { //refresh initially to get the shape
					refresh_views({only_visible:true},function() { //refresh again, only the visible
					}); 
				});
			});*/
		
			var overlays=m_output.overlays||[];
			var template=m_output.template||null;
			if (template) {
				for (var i=0; i<overlays.length; i++) {
					var overlay=overlays[i];
					add_activation_view({
						title:overlay.name||'unknown',
						overlay:overlay.array,
						template:template
					});
				}
			}
			refresh_views({shape_only:true},function() { //refresh initially to get the shape
				refresh_views({only_visible:true},function() { //refresh again, only the visible
				}); 
			});
		
		//});
		
		m_div.find('#views').scroll(schedule_handle_scroll);
	};
	var refresh_views_code='';
	var refresh_views=function(params_in,callback) {
		
		var params=$.extend({},{only_visible:false,shape_only:false,handle_scroll:false,do_first:null},params_in);
		refresh_views_code=utils.make_random_id();
		var local_refresh_views_code=refresh_views_code;
		
		var overlay_params0=m_settings_widget.getOverlayParameters();
		var template_params0=m_settings_widget.getTemplateParameters();
		var plane0=m_settings_widget.getPlane();
		var layout0=m_settings_widget.getLayout();
		var size_mode0=m_settings_widget.getSizeMode();
		var colormap0=m_settings_widget.getColorMap();
		
		for (var jj=0; jj<m_boxes.length; jj++) {
			m_boxes[jj].setOverlayThreshold(overlay_params0.threshold);
			m_boxes[jj].setOverlayRange(overlay_params0.minimum,overlay_params0.maximum,overlay_params0.negative);
			m_boxes[jj].setTemplateRange(template_params0.minimum,template_params0.maximum);
			m_boxes[jj].setMosaicPlane(plane0);
			m_boxes[jj].setColorMap(colormap0);
			do_set_layout(m_boxes[jj],layout0);
			if (!m_boxes[jj].is_expanded) do_set_size(m_boxes[jj],size_mode0);
			if (!params.handle_scroll) {
				m_boxes[jj].refresh({load_data:false});
				m_boxes[jj].needs_refresh=true;
				m_boxes[jj].setLoading();
			}
		}
		
		var do_refresh_views=function() {
			var refresh_box=function(jj,callback2) {
				if (jj>=m_boxes.length) return;
				if (refresh_views_code!==local_refresh_views_code) return;
				
				var W=m_boxes[jj];
				
				var ok_to_refresh=true;
				if (params.only_visible) {
					if (!box_is_visible(m_boxes[jj])) ok_to_refresh=false;
				}
				if (params.handle_scroll) {
					if (!m_boxes[jj].needs_refresh) ok_to_refresh=false;
				}
				
				if (ok_to_refresh) {
					m_boxes[jj].needs_refresh=false;
					m_boxes[jj].refresh({load_data:true},function(tmp000) {
						if (!tmp000.success) {
							jAlert('Error refreshing view: '+tmp000.error);
						}
						else {
							if (callback2) callback2();
						}
					});
				}
				else {
					if (callback2) callback2();
				}
			};
			var refresh_all_boxes=function(ppp) {
				if (!ppp) ppp={};
				var refresh_next_box=function(index) {
					if (index>=m_boxes.length) {
						if (callback) callback();
						return;
					}
					if ((ppp.except)&&(ppp.except==m_boxes[index]))
							refresh_next_box(index+1);
					else {
						refresh_box(index,function() {
							refresh_next_box(index+1);
						});
					}
				};
				refresh_next_box(0);
			};
			if (!params.shape_only) {
				var found=false;
				if (params.do_first) {
					for (var kk=0; kk<m_boxes.length; kk++) 
						if (m_boxes[kk]===params.do_first) {
							found=true;
							refresh_box(kk,function() {
								refresh_all_boxes({except:params.do_first});
							});
						}
				}
				if (!found) refresh_all_boxes();
			}
			else {
				if (callback) callback();
			}
		};
		setTimeout(do_refresh_views,10); //delay so the elements will be updated, so we can see who is visible
	};
	
	var box_is_visible=function(W) {
		var offset=W.div().offset().top-m_div.find('#views').offset().top;
		if ((offset+W.div().height()>0)&&(offset<m_div.find('#views').height()))
			return true;
		else 
			return false;
	};
	
	var handle_scroll_scheduled=false;
	var schedule_handle_scroll=function() {
		if (handle_scroll_scheduled) return;
		handle_scroll_scheduled=true;
		var do_handle_scroll=function() {
			handle_scroll_scheduled=false;
			refresh_views({only_visible:true,handle_scroll:true});
		};
		setTimeout(do_handle_scroll,500);
	};
		
	var do_set_layout=function(W,layout0) {
		if (layout0.indexOf('mosaic_')===0) {
			W.setLayout('mosaic');
			var tmp=layout0.substr(('mosaic_').length);
			var list=tmp.split('x');
			if (list.length==2) {
				W.setMosaicSliceCounts(Number(list[0]),Number(list[1]));
			}
		}
		else if (layout0=='3-plane') {
			W.setLayout('3-plane');
		}
	};
	var do_set_size=function(W,size_mode0) {
		var counts=[1,1];
		if (W.layout()=='mosaic') counts=W.mosaicSliceCounts();
		else if (W.layout()=='3-plane') counts=[1,3];
		var val1,val2,maxwidth,maxheight;
		if (size_mode0=='small') {
			val1=100; val2=40; maxwidth=150; maxheight=150;
		}
		else if (size_mode0=='medium') {
			val1=200; val2=60; maxwidth=300; maxheight=300;
		}
		else if (size_mode0=='large') {
			val1=300; val2=100; maxwidth=500; maxheight=500;
		}
		else if (size_mode0=='very_large') {
			val1=500; val2=220; maxwidth=1000; maxheight=1000;
		}
		
		var W0=100;
		var H0=100;
		
		if ((counts[0]==1)&&(counts[1]==1)) {
			W0=val1;
			H0=val1;
		}
		else {
			W0=20+counts[1]*val2;
			H0=50+counts[0]*val2;
		}
		
		if (W0>maxwidth) W0=maxwidth;
		if (H0>maxheight) H0=maxheight;
			
		W.setSize(W0+30,H0+10);
	};
	
	var on_point_clicked=function(pos,W) {
		//
	};
	
	
}	

function ExpandedView() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H;};
	this.setBox=function(box) {m_box=box; m_div.append(m_box.div());};
	this.refresh=function() {return _refresh.apply(this,arguments);};
	
	var m_div=$('<div style="position:absolute"></div>');
	var m_box=null;
	var m_width=0;
	var m_height=0;
	
	var _refresh=function() {
		if (!m_box) return;
		m_div.css({width:m_width,height:m_height});
		m_box.setSize(m_width,m_height);
		m_box.refresh();		
	};
}

