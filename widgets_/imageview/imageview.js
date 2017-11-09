function ImageView(config) {
	var that=this;
	
	if (!config) config={};
	config=$.extend({},{},config);
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; schedule_update_layout();};
	this.setTitle=function(title) {m_title=title;};
	this.setImageFile=function(file) {m_image_file=file;};
	this.refresh=function(callback) {return _refresh.apply(this,arguments);};
	this.showDialog=function(params) {_showDialog(params);};
	
	var m_image_file=new RemoteFile();
	var m_div=$('<div style="position:absolute" class="imageview"></div>');
	var m_view=$('<div class=imageview-view></div>');
	var m_view_image=$('<img imageview-viewimage></img>');
	var m_width=0,m_height=0;
	var m_info_div=$('<div class="imageview-info"></div>');
	var m_title_div=$('<div class="imageview-title"></div>');
	var m_status='Initializing...';
	var m_title='';
	var m_dialog_mode=false;
	var m_dialog=null;
	var m_image_width=0;
	var m_image_height=0;
	
	m_view_image.load(check_image_size);
	
	m_view.append(m_view_image);
	m_div.append(m_view);
	m_div.append(m_info_div);
	m_div.append(m_title_div);
	
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
	
	var m_refresh_scheduled=false;
	var global_refresh_code='';
	var _refresh=function(callback) {
		var local_refresh_code=utils.make_random_id(5);
		
		if (m_image_file) {
			set_status('Downloading data...');
			m_image_file.getBytes({bytes:'*'},function(tmp) {
				if (tmp.success) {
					set_status('Ready.');
					var base64=base64ArrayBuffer(tmp.data);
					var suf=m_image_file.fileType();
					var url0='data:image/'+suf+';base64,'+base64;
					m_view_image.attr('src',url0);
				}
				else {
					set_status('Problem downloading image data: '+tmp.error);
				}
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
		
		
		if (m_dialog_mode) {
			m_width=m_dialog.outerWidth();
			m_height=m_dialog.outerHeight();
			m_div.css({position:'absolute',left:0,right:0,top:0,bottom:0});
		}
		else {
			m_div.css({width:m_width,height:m_height});
		}
		
		var Vwidth=m_width-margin0*2;
		var Vheight=m_height-info_height-title_height-margin0*2;
		var Voffsetx=margin0;
		var Voffsety=title_height+margin0;
		
		m_view.css({position:'absolute',width:Vwidth,height:Vheight,left:margin0,top:title_height+margin0});
		m_view_image.css({position:'absolute',width:Vwidth,height:Vheight,left:0,top:0});
		m_info_div.css({position:'absolute',width:m_width-margin0*2,height:info_height,bottom:0,left:margin0});
		update_info();
		m_title_div.css({position:'absolute',width:m_width-margin0*2,height:title_height,top:0,left:margin0});
		m_title_div.html(m_title);
		
		if (m_image_width*Vheight>m_image_height*Vwidth) {
			//constrained by width
			m_view_image.css({position:'absolute',width:'100%',height:'auto',left:margin0,top:0});
		}
		else {
			//constrained by height
			m_view_image.css({position:'absolute',width:'auto',height:'100%',left:margin0,top:0});
		}
	};
	
	function set_status(status) {
		m_status=status;
		update_layout();
	}
	
	function check_image_size() {
		var W0=m_view_image.width();
		var H0=m_view_image.height();
		if (W0*H0===0) {
			if (m_image_file) {
				setTimeout(check_image_size,1000);
			}
			return;
		}
		if ((m_image_width!=W0)||(m_image_height!=H0)) {
			m_image_width=W0;
			m_image_height=H0;
			update_layout();
		}
	}
	
	
	
	var make_canvas=function() {
		var el=document.createElement('canvas'); 
		$(el).css('position','absolute');
		if (typeof(G_vmlCanvasManager)!='undefined') 
			G_vmlCanvasManager.initElement(el);
		return $(el);
	};
	
	
	var update_info=function() {
		
		var txt='';
		if (m_status!='ok') txt+='  '+m_status;
		
		m_info_div.html('<nobr>'+txt+'</nobr>');
		
		/*m_info_div.find('#download_image').click(on_download_image);
		m_info_div.find('#download_file').click(on_download_file);
		m_info_div.find('#show_history').click(on_show_history);
		m_info_div.find('#preload_file').click(on_preload_file);*/
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

