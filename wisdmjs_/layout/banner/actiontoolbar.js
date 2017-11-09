function ActionToolbar() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setOrientation=function(orientation) {m_orientation=orientation;}; //'horizontal' or 'vertical'
	this.setIconSize=function(icon_size) {m_icon_size=icon_size;}; //e.g., 32
	this.addAction=function(name,params) {return _addAction(name,params);};
	this.refresh=function() {return _refresh();};
	this.width=function() {return m_width;};
	this.height=function() {return m_height;};
	this.allActionNames=function() {var ret=[]; m_action_list.forEach(function(action) {ret.push(action.name);}); return ret;};
	this.showAllActions=function() {that.showActions(that.allActionNames());};
	this.hideAllActions=function() {that.hideActions(that.allActionNames());};
	this.showActions=function(names) {return _showActions(names);}; //need to call refresh after these -- note that clone also uses hideActions, so we don't want to include the refresh in these
	this.hideActions=function(names) {return _hideActions(names);};
	this.clone=function() {return _clone();};
	this.popup=function(x,y,bounding_div) {return _popup(x,y,bounding_div);};
	this.setRemoveOnClose=function(val) {m_do_remove_on_close=val;};
	
	var m_div=$('<div class=actiontoolbar></div>');
	m_div.css({position:'absolute'});
	var m_actions={};
	var m_action_list=[];
	var m_orientation='horizontal';
	var m_icon_size=32;
	var m_width=0;
	var m_height=0;
	var m_popped_up=false;
	var m_label_width=240; //for popped_up=true only
	var m_do_remove_on_close=true;
	
	function _addAction(name,params) {
		var AA={name:name,params:params};
		AA.elmt=$('<div class=action_item><div class=item_icon></div><div class=item_label></div></div>');
		AA.elmt.prop('name',name);
		AA.elmt.click(on_action_clicked);
		
		if (params.title) AA.elmt.attr('title',params.title);
		if (params.image_url) AA.elmt.find('.item_icon').css({"background-image":"url("+params.image_url+")"});
		if (params.image_size) AA.image_size=JSON.parse(JSON.stringify(params.image_size));
		else AA.image_size=[32,32];
		AA.visible=true;
		
		m_div.append(AA.elmt);
		
		AA.callback=params.callback||null;
		m_actions[name]=AA;
		m_action_list.push(AA);
	}
	
	function _refresh() {
		if (m_orientation=='horizontal') {
			var x0=0;
			for (var i=0; i<m_action_list.length; i++) {
				var AA=m_action_list[i];
				if (AA.visible) {
					var W0=Math.floor(AA.image_size[0]*m_icon_size/AA.image_size[1]);
					var H0=m_icon_size;
					
					AA.elmt.css({position:'absolute',left:x0,top:0,width:W0,height:H0});
					AA.elmt.find('.item_icon').css({position:'absolute',left:0,top:0,width:W0,height:H0});
										
					AA.elmt.show();
					
					x0+=W0+1;
				}
				else AA.elmt.hide();
			}
			m_width=x0;
			m_height=m_icon_size;
		}
		else if (m_orientation=='vertical') {
			var y0=0;
			for (var i=0; i<m_action_list.length; i++) {
				var AA=m_action_list[i];
				if (AA.visible) {
					var H0=Math.floor(AA.image_size[1]*m_icon_size/AA.image_size[0]);
					var W0=m_icon_size;
					if (m_popped_up) {
						AA.elmt.css({position:'absolute',left:0,top:y0,width:W0+m_label_width,height:H0});
						AA.elmt.find('.item_icon').css({position:'absolute',left:0,top:0,width:W0,height:H0});
						AA.elmt.find('.item_label').css({position:'absolute',left:W0+3,top:7,width:m_label_width-3,height:H0});
						AA.elmt.find('.item_label').html(AA.params.label||AA.params.title||'');
					}
					else {
						AA.elmt.css({position:'absolute',left:0,top:y0,width:W0,height:H0});
						AA.elmt.find('.item_icon').css({position:'absolute',left:0,top:0,width:W0,height:H0});
					}
					
					AA.elmt.show();
					
					y0+=H0+1;
				}
				else AA.elmt.hide();
			}
			m_width=m_icon_size;
			m_height=y0;
			if (m_popped_up) {
				m_width=m_icon_size+m_label_width;
				//m_div.css({'background-color':'rgb(220,220,200)'});
			}
		}
		m_div.css({width:m_width,height:m_height});
	}
	
	function _clone() {
		var ret=new ActionToolbar();
		var actions_to_hide=[];
		for (var key in m_actions) {
			ret.addAction(m_actions[key].name,m_actions[key].params);
			if (!m_actions[key].visible) actions_to_hide.push(key);
		}
		ret.hideActions(actions_to_hide);
		ret.setIconSize(m_icon_size);
		ret.setOrientation(m_orientation);
		return ret;
	}
	function _popup(x,y,bounding_div) {
		$('body').append(m_div);
		m_popped_up=true;
		that.refresh();
		m_div.addClass('popped_up');
		m_div.show();
		
		x+=15;
		
		if (bounding_div) {
			var margin=15;
			x=Math.max(x,bounding_div.offset().left+margin);
			x=Math.min(x,bounding_div.offset().left+bounding_div.width()-that.width()-margin);
			y=Math.max(y,bounding_div.offset().top+margin);
			y=Math.min(y,bounding_div.offset().top+bounding_div.height()-that.height()-margin);
		}
		
		m_div.css({left:x,top:y});
	}
	
	function on_action_clicked() {
		var name=$(this).prop('name');
		var AA=m_actions[name]||{};
		if (AA.callback) AA.callback();
		if (m_popped_up) {
			if (m_do_remove_on_close) {
				m_div.remove();
			}
			else m_div.hide();
			m_popped_up=false;
		}
	}
	
	//maybe a better way to do this?
	$('body').mousedown(function() {
		if (!m_div.is(':visible')) return; //important to check this so we don't schedule a hide before the element actually appears!
		setTimeout(function() { //i think we need to pause a bit here so we can process the actual click!
			if (m_popped_up) {
				if (m_do_remove_on_close) {
					m_div.remove();
				}
				else {
					m_div.hide();
				}
			}
		},100);
	});
	
	function _showActions(names) {
		for (var i=0; i<names.length; i++) {
			if (m_actions[names[i]]) {
				m_actions[names[i]].visible=true;
			}
		}
	}
	function _hideActions(names) {
		for (var i=0; i<names.length; i++) {
			if (m_actions[names[i]]) {
				m_actions[names[i]].visible=false;
			}
		}
	}
}


