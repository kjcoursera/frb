/*** require('widgets:/viewmda/array2doverlayview.js'); ***/
/*** require('wisdmcolormap.js'); ***/

/*global $:false */
/*global console:false */
/*global Array2DOverlayView:false */
/*global templateHtml:false */
(function($) {
'use strict';
	
$.fn.WisdmColorBar3 = function(options) {
	//Defaults
	$.fn.WisdmColorBar3.defaultOptions = {
			min            : -5,
			max            : 5,
			thr            : 2,
			horizontal     : false,
			width          : 20,
			height         : 100
	};
	
	var that           = this,
			$colorbar      = templateHtml('.wisdm-colorbar3'),
			$colorbar_base = $('.wisdm-colorbar3-base', $colorbar),
			canvas         = $colorbar_base[0],
			context        = canvas.getContext('2d'),
			$colorbar_max  = $('.wisdm-colorbar3-max', $colorbar),
			$colorbar_min  = $('.wisdm-colorbar3-min', $colorbar),
			colorer        = new Array2DOverlayView();
	var m_colormap='Fire';
	var m_units='';
			
	options = $.extend({}, $.fn.WisdmColorBar3.defaultOptions, options);
	
	this.setMaximum    = function(max){options.max = max;};
	this.setMinimum    = function(min){options.min = min;};
	this.setThreshold  = function(thr){options.thr = thr;};
	this.setAlignment  = function(hor){options.horizontal = hor;};
	this.setWidth      = function(width){options.width = width;};
	this.setHeight     = function(height){options.height = height;};
	this.setSize       = function(width, height){that.setWidth(width); that.setHeight(height);};
	this.setColorMap   = function(colormap) {m_colormap=colormap;};
	this.setUnits=function(units) {m_units=units;};
	this.createImageUrl=function(callback) {callback(canvas.toDataURL(),canvas.width,canvas.height);};
	this.update        = function(){updateColorBar(options.min, options.max, options.thr, options.horizontal, options.width, options.height);};
	
	var updateColorBar = function (min, max, thr, horizontal, width, height){
		
		WisdmColorMap.loadMaps({},function() {
			var colors=WisdmColorMap.getColors(m_colormap);
			
			colorer.setColorMapColors(colors);
		
			var rmin = null;
			if (min >= 0 && thr > min){
				rmin = thr;
			}else{
				rmin = min;
			}
			
			var length = horizontal ? width : height,
					linesize = horizontal ? height :width;
			
			colorer.setOverlayThreshold(thr);
			colorer.setOverlayRange(rmin,max);
			
			var excursion = max - rmin,
					stepsize = excursion / length;
	
			canvas.width = width;
			canvas.height = height;
			canvas.style.width = width + 'px';
			canvas.style.height = height + 'px';
			
			context.clearRect (0, 0, width, height);
			
			var position, color, rgb;
			
			for (var i = 0, i_len = length; i <= i_len; i++){
				position = rmin + i*(excursion/length),
				color = colorer.getOverlayColor(position),
				rgb = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
				context.fillStyle=rgb;
	
				if (horizontal){
					context.fillRect(i,0,1,linesize);
				}else{
					context.fillRect(0,length-i,linesize,1);
				}
	
			}
			
			//position max and min absolutely
			if (horizontal){
				$colorbar_max.css({
					'top'        : '20px',
					'right'      : 0,
					'width'      : 'auto',
					'height'     : height + 'px',
					'left'       : 'auto'
				});
				$colorbar_min.css({
					'top'        : '20px',
					'bottom'     : 'auto',
					'width'      : 'auto',
					'height'     : height + 'px',
					'left'       : 0
				});
			}else{
				$colorbar_max.css({
					'top'        : 0,
					'left'       : '10px',
					'width'      : '50px',
					'height'     : 'auto',
					'right'      : 'auto'
				});
				$colorbar_min.css({
					'bottom'     : '0',
					'top'        : 'auto',
					'width'      : '50px',
					'height'     : 'auto',
					'left'       : '10px'
				});
			
			}
			//set max and min values
			var mintxt=rmin;
			var maxtxt=max;
			if (m_units=='%') {
				mintxt=mintxt+'%';
				maxtxt=maxtxt+'%';
			}
			else if ((m_units=='t')||(m_units=='z')) {
				maxtxt=m_units+' = '+maxtxt;
			}
			$colorbar_min.text(mintxt);
			$colorbar_max.text(maxtxt);
		});
	};
	
	//$colorbar_base.mousemove(function(e){
	//	var x = e.offsetX,
	//			y = e.offsetY;
	//	
	//	if (horizontal){
	//	
	//	}else{
	//	
	//	}
	//});
	
	var initialize = function(){
		updateColorBar(options.min, options.max, options.thr, options.horizontal, options.width, options.height);
		that.append($colorbar);
	};
	
	return this.each(initialize);
};
})(jQuery);

