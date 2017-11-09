function OutputWindow() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; update_layout();};
	this.clearContent=function(html) {m_div_content.empty(); m_div.trigger('on-content-cleared');};
	this.appendContent=function(X) {m_div_content.append(X); if (X[0].nodeName=='DIV') X.css('position','relative'); scroll_to_bottom();};
	this.onContentCleared=function(handler) {m_div.bind('on-content-cleared',function() {handler();});};
	
	var m_div=$('<div class=outputwindow></div>');
	var m_div_content=$('<div class=outputwindow_content></div>');
	m_div.append(m_div_content);
	m_div.css({position:'absolute',overflow:'auto'});
	
	function update_layout() {
		m_div.css({width:m_width,height:m_height});
	}
	function scroll_to_bottom() {
		setTimeout(function() {
			m_div[0].scrollTop=m_div[0].scrollHeight;
		},100);
	}
	
	that.appendContent('<p>No output.</p>');
}
