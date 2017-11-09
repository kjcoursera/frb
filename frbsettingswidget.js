/*jshint multistr:true*/

/*** require('widgets/colorbar.js'); ***/
/*** require('widgets/wisdmcolormap.js'); ***/
/*** require('widgets/contextpopup.js'); ***/

function FRBSettingsWidget() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setOverlayParameters=function(params) {return _setOverlayParameters.apply(this,arguments);}; //threshold,minimum,maximum
	this.getOverlayParameters=function() {return _getOverlayParameters.apply(this,arguments);};
	this.setTemplateParameters=function(params) {return _setTemplateParameters.apply(this,arguments);}; //threshold,minimum,maximum
	this.getTemplateParameters=function() {return _getTemplateParameters.apply(this,arguments);};
	this.setPlane=function(plane) {m_div.find('#plane').val(plane);};
	this.getPlane=function() {return m_div.find('#plane').val();};
	this.setLayout=function(plane) {m_div.find('#layout').val(plane);};
	this.getLayout=function() {return m_div.find('#layout').val();};
	this.setSizeMode=function(size_mode) {m_div.find('#size_mode').val(size_mode);};
	this.getSizeMode=function() {return m_div.find('#size_mode').val();};
	this.setDisplayOptions=function(list) {m_display_options=list.splice(0); update_overlay_select_boxes();};
	this.getDisplayOption=function() {return m_div.find('#display_select').val();};
	this.setThresholdOptions=function(list) {m_threshold_options=list.splice(0); update_overlay_select_boxes();};
	this.getThresholdOption=function() {return m_div.find('#threshold_select').val();};
	this.onSettingsChanged=function(callback) {m_div.bind('settings_changed',function(evt,obj) {callback();});};
	this.setEnabled=function(val) {m_div.find('input,select').prop('disabled',!val);};
	this.getColorMap=function() {return m_color_map;};
	this.isHidden=function() {return m_hidden;};
	this.onHiddenChanged=function(callback) {m_div.bind('hidden-changed',function(evt,obj) {callback();});};
	
	var m_div=$('<div></div>');
	var m_display_options=[];
	var m_threshold_options=[];
	var m_color_map='fire';
	var m_hidden=false;
	
	m_div.append(templateHtml('#frbsettingswidget'));
	
	m_div.find('#update_overlay').click(function() {m_div.trigger('settings_changed'); update_colorbar();});
	m_div.find('#overlay_negative').click(function() {m_div.trigger('settings_changed'); update_colorbar();});
	m_div.find('#update_template').click(function() {m_div.trigger('settings_changed'); update_colorbar();});
	m_div.find('#plane').change(function() {m_div.trigger('settings_changed');});
	m_div.find('#layout').change(function() {m_div.trigger('settings_changed');});
	m_div.find('#size_mode').change(function() {m_div.trigger('settings_changed');});
	m_div.find('#display_select').change(function() {m_div.find('#threshold_select').val(m_div.find('#display_select').val());});
	var m_colorbar=m_div.find('#colorbar').WisdmColorBar3();
	m_colorbar.hide();
	
	m_div.find('#toggle_hide').click(function() {
		if (m_hidden) {
			m_div.find('#frbsettingswidget_content').show();
			m_hidden=false;
			m_div.find('#toggle_hide').html('Hide Settings Panel');
		}
		else {
			m_div.find('#frbsettingswidget_content').hide();
			m_hidden=true;
			m_div.find('#toggle_hide').html('Show Settings Panel');
		}
		m_div.trigger('hidden-changed');
	});
	
	m_colorbar.contextPopup({
		items: [
			{label:'Change color map',action:function() {
					WisdmColorMap.selectMap({},function(tmp) {
						if (!tmp) return; 
						m_color_map=tmp; 
						m_div.trigger('settings_changed'); 
						update_colorbar();
					});
				}
			},
			{label:'Copy color map',
				action:function() {
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
					m_colorbar.createImageUrl(function(url0,W0,H0) {
						popup_image(url0,W0,H0);
					});
				}
			}
		]
	});
	m_colorbar.click(function(evt) {evt.type='contextmenu'; m_colorbar.trigger(evt);});
	
	
	var _setOverlayParameters=function(params) {
		m_div.find('#overlay_threshold').val(params.threshold);
		m_div.find('#overlay_minimum').val(params.minimum);
		m_div.find('#overlay_maximum').val(params.maximum);
		if (params.negative) m_div.find('#overlay_negative').attr('checked','checked');
		else m_div.find('#overlay_negative').removeAttr('checked');
		update_colorbar();
	};
	var _getOverlayParameters=function(params) {
		var ret={};
		ret.threshold=Number(m_div.find('#overlay_threshold').val());
		ret.minimum=Number(m_div.find('#overlay_minimum').val());
		ret.maximum=Number(m_div.find('#overlay_maximum').val());
		ret.negative=m_div.find('#overlay_negative').is(':checked');
		return ret;
	};
	var _setTemplateParameters=function(params) {
		m_div.find('#template_minimum').val(params.minimum);
		m_div.find('#template_maximum').val(params.maximum);
	};
	var _getTemplateParameters=function(params) {
		var ret={};
		ret.minimum=m_div.find('#template_minimum').val();
		ret.maximum=m_div.find('#template_maximum').val();
		return ret;
	};
	var update_overlay_select_boxes=function() {
		var display_select=m_div.find('#display_select');
		display_select.empty();
		m_div.find('#display_row').hide();
		var threshold_select=m_div.find('#threshold_select');
		threshold_select.empty();
		m_div.find('#threshold_row').hide();
		var ii;
		if (m_display_options.length>0) {
			for (ii=0; ii<m_display_options.length; ii++) {
				display_select.append('<option value="'+m_display_options[ii]+'">'+m_display_options[ii]+'</option>');
			}
			m_div.find('#display_row').show();
		}
		if (m_threshold_options.length>0) {
			for (ii=0; ii<m_threshold_options.length; ii++) {
				threshold_select.append('<option value="'+m_threshold_options[ii]+'">'+m_threshold_options[ii]+'</option>');
			}
			m_div.find('#threshold_row').show();
		}
		update_colorbar();
	};
	var update_colorbar=function() {
		var params=that.getOverlayParameters();
		if (that.getDisplayOption()=='pctchange') m_colorbar.setUnits('%');
		else if (that.getDisplayOption()=='zscores') m_colorbar.setUnits('z');
		else m_colorbar.setUnits('');
		m_colorbar.setMinimum(params.minimum);
		m_colorbar.setMaximum(params.maximum);
		if (that.getDisplayOption()==that.getThresholdOption()) {
			m_colorbar.setThreshold(params.threshold);
		}
		else {
			m_colorbar.setThreshold(0);
		}
		m_colorbar.show();
		m_colorbar.setColorMap(m_color_map);
		m_colorbar.update();
		/*$colorbar_w.setMaximum(parseFloat($('#max').val(),10));
		$colorbar_w.setThreshold(parseFloat($('#thr').val(),10));
		$colorbar_w.setAlignment($('#hor').is(':checked'));
		$colorbar_w.setWidth(parseFloat($('#width').val(),10));
		$colorbar_w.setHeight(parseFloat($('#height').val(),10));*/
	};
	update_overlay_select_boxes();
}

