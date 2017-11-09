/*global $:false*/
/*global console:false*/
/*global templateHtml:false*/
/*global Wisdm:false */

var wisdmcolormap={};
wisdmcolormap.list = [
	{name: 'Fire', twotailed: false, colormap: [{position: 0, color: "000000"},{position: 20, color: "7b00ff"},{position: 40, color: "ff0000"},{position: 60, color: "ff7b00"},{position: 80, color: "ffff00"},{position: 100, color: "ffffff"}]},
	{name: 'Fire - Ice', twotailed: true, colormap: [{position: 10, color: "00ffff"},{position: 49, color: "0000ff"},{position: 50, color: "000000"},{position: 51, color: "ff0000"},{position: 80, color: "ffff00"},{position: 100, color: "ffffcc"}]},
	{name: 'Red (HTML)', twotailed: false, colormap: [{position: 0, color: "ff0000"}]},
	{name: 'Red (HTML) - Black', twotailed: false, colormap: [{position: 0, color: "000000"},{position: 100, color: "ff0000"}]},
	{name: 'Red (Burgundy)', twotailed: false, colormap: [{position: 0, color: "800020"}]},
	{name: 'Red (Burgundy) - Black', twotailed: false, colormap: [{position: 0, color: "000000"},{position: 100, color: "800020"}]},
	{name: 'Red (Redwood)', twotailed: false, colormap: [{position: 0, color: "A45A52"}]},
	{name: 'Red (Redwood) - Black', twotailed: false, colormap: [{position: 0, color: "000000"},{position: 100, color: "A45A52"}]},
	{name: 'Green (HTML)', twotailed: false, colormap: [{position: 0, color: "00ff00"}]},
	{name: 'Green (HTML) - Black', twotailed: false, colormap: [{position: 0, color: "000000"},{position: 100, color: "00ff00"}]},
	{name: 'Green (Mantis)', twotailed: false, colormap: [{position: 0, color: "74c365"}]},
	{name: 'Green (Mantis) - Black', twotailed: false, colormap: [{position: 0, color: "000000"},{position: 100, color: "74c365"}]},
	{name: 'Green (Dark Olive)', twotailed: false, colormap: [{position: 0, color: "556B2F"}]},
	{name: 'Green (Dark Olive) - Black', twotailed: false, colormap: [{position: 0, color: "000000"},{position: 100, color: "556B2F"}]},
	{name: 'Yellow (HTML)', twotailed: false, colormap: [{position: 0, color: "ffff00"}]},
	{name: 'Yellow (HTML) - Black', twotailed: false, colormap:[{position: 0, color: "000000"},{position: 100, color: "ffff00"}]},
	{name: 'Yellow (Naples)', twotailed: false, colormap: [{position: 0, color: "fada5e"}]},
	{name: 'Yellow (Naples) - Black', twotailed: false, colormap: [{position: 0, color: "000000"},{position: 100, color: "fada5e"}]},
	{name: 'Blue (HTML)', twotailed: false, colormap:[{position: 0, color: "0000ff"}]},
	{name: 'Blue (HTML)- Black', twotailed: false, colormap:[{position: 0, color: "000000"},{position: 100, color: "0000ff"}]},
	{name: 'Blue (Brandeis)', twotailed: false, colormap:[{position: 0, color: "0070FF"}]},
	{name: 'Blue (Brandeis) - Black', twotailed: false, colormap:[{position: 0, color: "000000"},{position: 100, color: "0070FF"}]},
	{name: 'Blue (Celestial)', twotailed: false, colormap:[{position: 0, color: "4997D0"}]},
	{name: 'Blue (Celestial) - Black', twotailed: false, colormap:[{position: 0, color: "000000"},{position: 100, color: "4997D0"}]},
	{name: 'Orange (HTML)', twotailed: false, colormap:[{position: 0, color: "ff7f00"}]},
	{name: 'Orange (HTML) - Black', twotailed: false, colormap: [{position: 0, color: "000000"},{position: 100, color: "ff7f00"}]},
	{name: 'Orange (Metallic Gold)', twotailed: false, colormap:[{position: 0, color: "D4AF37"}]},
	{name: 'Orange (Metallic Gold) - Black', twotailed: false, colormap: [{position: 0, color: "000000"},{position: 100, color: "D4AF37"}]},
	{name: 'MRIcron (1hot)', twotailed: false, colormap: [{position: 0, color: "000000"},{position: 33, color: "ff0000"},{position: 67, color: "ffff00"},{position: 100, color: "ffffff"}]},
	{name: 'MRIcron (2winter)', twotailed: false, colormap: [{position: 0, color: "0000ff"},{position: 100, color: "00ff81"}]},
	{name: 'MRIcron (3warm)', twotailed: false, colormap: [{position: 0, color: "ff7f00"},{position: 100, color: "ffff00"}]},
	{name: 'MRIcron (4cool)', twotailed: false, colormap: [{position: 0, color: "007fff"},{position: 100, color: "00ffff"}]},
	{name: 'MRIcron (5redyell)', twotailed: false,colormap: [{position: 0, color: "c00000"},{position: 100, color: "ffff00"}]},
	{name: 'MRIcron (6bluegrn)', twotailed: false, colormap: [{position: 0, color: "0000de"},{position: 100, color: "00ff20"}]},
	{name: 'MRIcron (test)', twotailed: true, colormap: [{position: 24, color: "ffffff"},{position: 25, color: "ffb300"},{position: 49, color: "ffb300"},{position: 50, color: "ff4d00"},{position: 74, color: "ff4d00"},{position: 75, color: "ff0000"},{position: 100, color: "ff0000"}]},
	{name: 'MRIcron-like (test-ice)', twotailed: true, colormap: [{position: 24, color: "0000ff"},{position: 25, color: "2989d8"},{position: 49, color: "2989d8"},{position: 50, color: "63ffea"},{position: 74, color: "63ffea"},{position: 75, color: "ffffff"}]},
	{name: 'MRIcron-like (test-fireice)', twotailed: true, colormap: [{position: 24, color: "0000ff"},{position: 25, color: "63ffea"},{position: 49, color: "63ffea"},{position: 50, color: "edc500"},{position: 74, color: "edc500"},{position: 75, color: "ff0000"}]},
	{name: 'MRIcron (x_rain)', twotailed: true, colormap: [{position: 0, color: "000000"},{position: 15, color: "55007f"},{position: 30, color: "0000ff"},{position: 45, color: "00ff00"},{position: 60, color: "ffff00"},{position: 100, color: "ff0000"}]},
	{name: 'MRIcron (NIH)', twotailed: true, colormap: [{position: 0, color: "000000"},{position: 10, color: "5500aa"},{position: 20, color: "00005f"},{position: 30, color: "0000ff"},{position: 40, color: "00f4aa"},{position: 50, color: "00ff00"},{position: 60, color: "ffff00"},{position: 90, color: "ff0000"},{position: 100, color: "ad0000"}]},
	{name: 'MRIcron (NIH_ice)', twotailed: true, colormap: [{position: 0, color: "009c8c"},{position: 50, color: "d059f8"},{position: 100, color: "e6001b"}]},
	{name: 'Grayscale', twotailed: true, colormap: [{position: 0, color: "000000"},{position: 100, color: "ffffff"}]}
];
wisdmcolormap.selectColorMap = function(callback, params){
	if (!params){
		params = {};
	}
	var elems = [],
			horizontal = params.horizontal || false,
			width = params.width || 20,
			ptitle = params.popuptitle || 'Click on a color map to select it',
			height = params.height || 100,
			mincolors = params.mincolors || 2,
			maxcolors = params.maxcolors || Number.MAX_VALUE,
			twotailed = params.twotailed,
			
			onElementClicked = function(){
				$popup.dialog( "destroy" );
				if ($.isFunction(callback)){
					callback($(this).attr('data-name'));
				}
			},
			$popup = $('<div title="'+ptitle+'" class="Wisdm-colorbar-popup" style="overflow: auto; cursor: pointer;"></div>');
	
	for (var i = 0, i_len = wisdmcolormap.list.length; i < i_len; i++){
		var colormap = wisdmcolormap.list[i],
				numcolors = colormap.colormap.length;
		if (numcolors >= mincolors && numcolors <= maxcolors && (twotailed === undefined || twotailed === colormap.twotailed)){
			
			var $colorbar = $('<div data-name="'+colormap.name+'" title="'+colormap.name+'">').WisdmColorBar();
			$colorbar.setMinimum('');
			$colorbar.setMaximum('');
			$colorbar.setAlignment(horizontal);
			$colorbar.setWidth(width);
			$colorbar.setHeight(height);
			$colorbar.setColorMap(colormap.name);
			$colorbar.update();
			$colorbar
				.css({
					'position' : 'relative',
					'float'    : 'left'
				})
				.click(onElementClicked)
				.find('.wisdm-colorbar-base')
					.css({
						'margin'  : '5px'
					});
	
			elems.push($colorbar[0]);
		}
	}
	
	$popup
		.append(elems)
		.dialog({
			width         : 600,
			maxHeight     : 400,
			closeOnEscape : true,
			position      : 'center center',
			modal         : true,
			buttons       : [ { text: "Cancel", click: function() { $( this ).dialog( "destroy" );}}]
		});
};
var getColorAtPosition = function(colordata,length,position, hex){
	var relativeposition = Math.round((position/length)*100),
			closestbelow = {position:-1},
			closestabove = {position:101},
			distancebelow = 0,
			distanceabove = 0,
			totaldistance = 0;
	
	//We get the closest values
	var c;
	for (var i =0, i_len = colordata.length; i < i_len; i++){
		c = parseInt(colordata[i].position, 10);
		if (c > closestbelow.position && c < relativeposition){
			closestbelow = colordata[i];
		}
		if (c < closestabove.position && c >= relativeposition){
			closestabove = colordata[i];
		}
	}
	//We get the relative distance from the current position to the value
	distancebelow = relativeposition - closestbelow.position;
	distanceabove = closestabove.position - relativeposition;
	totaldistance = distancebelow + distanceabove;
	
	//We return the linear average of the color
	var r_above, g_above, b_above,
			r_below, g_below, b_below,
			r      , g      , b;
			
	if (closestabove.position === 101 && closestbelow.position === -1){
		if (hex){
			return 'FFFFFF';
		}else {
			return [255,255,255];
		}
	}
	if (closestbelow.position === -1){
		closestbelow = closestabove;
	}
	if (closestabove.position === 101){
		closestabove = closestbelow;
	}
	
	r_below = parseInt(closestbelow.color.substr(0,2), 16);
	g_below = parseInt(closestbelow.color.substr(2,2), 16);
	b_below = parseInt(closestbelow.color.substr(4,2), 16);
			
	r_above = parseInt(closestabove.color.substr(0,2), 16);
	g_above = parseInt(closestabove.color.substr(2,2), 16);
	b_above = parseInt(closestabove.color.substr(4,2), 16);
			
	r = Math.round((distanceabove/totaldistance)*r_below + (distancebelow/totaldistance)*r_above),
	g = Math.round((distanceabove/totaldistance)*g_below + (distancebelow/totaldistance)*g_above),
	b = Math.round((distanceabove/totaldistance)*b_below + (distancebelow/totaldistance)*b_above);
	
	if (hex){
		return toHex(r) + toHex(g) + toHex(b);
	}else {
		return [r,g,b];
	}
},
toHex = function(d) {
	return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase();
},
_getColorsArray = function(colordata, length, hex){
		var colormap = [];
		
		for (var i = 0; i < length; i++){
			colormap.push(getColorAtPosition(colordata,length, i, hex));
		}
		return colormap;
	};
wisdmcolormap.getColorsArray = function(colormapname, length, hex){
	if (!colormapname){
		return;
	}
	colormapname = colormapname.toLowerCase();
	
	var l = wisdmcolormap.list;
	
	for (var i = 0, i_len = l.length; i < i_len; i++){
		if (colormapname === l[i].name.toLowerCase()){
			return _getColorsArray(l[i].colormap, length, hex);
		}
	}
};
	
(function($) {
'use strict';

$.fn.WisdmColorBar = function(options) {
	//Defaults
	$.fn.WisdmColorBar.defaultOptions = {
			min            : -5,
			max            : 5,
			thr            : 2,
			horizontal     : false,
			width          : 20,
			height         : 100,
			colormap       : 'Autumn'
	};
	
	var that           = this,
			$colorbar      = (templateHtml('.wisdm-colorbar').length > 0) ? templateHtml('.wisdm-colorbar') : $('.wisdm-colorbar'),
			$colorbar_base = $('.wisdm-colorbar-base', $colorbar),
			canvas         = $colorbar_base[0],
			context        = canvas.getContext('2d'),
			$colorbar_max  = $('.wisdm-colorbar-max', $colorbar),
			$colorbar_min  = $('.wisdm-colorbar-min', $colorbar);
			
	options = $.extend({}, $.fn.WisdmColorBar.defaultOptions, options);
	
	this.setMaximum    = function(max){options.max = max;};
	this.setMinimum    = function(min){options.min = min;};
	this.setAlignment  = function(hor){options.horizontal = hor;};
	this.setWidth      = function(width){options.width = width;};
	this.setHeight     = function(height){options.height = height;};
	this.setSize       = function(width, height){that.setWidth(width); that.setHeight(height);};
	this.setColorMap   = function(colormap){options.colormap = colormap;};
	this.update        = function(){updateMaxMin(options.max, options.min); updateColorBar(options.horizontal, options.width, options.height, options.colormap);};

	var updateColorBar = function (horizontal, width, height, colormap){
		
		var length = horizontal ? width : height,
				linesize = horizontal ? height :width;

		canvas.width = width;
		canvas.height = height;
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
		
		context.clearRect (0, 0, width, height);

		var hex = true,
				colorpoints = wisdmcolormap.getColorsArray(colormap,  length, hex);
		if (!colorpoints){
			return;
		}

		for (var i = 0, i_len = colorpoints.length; i < i_len; i++){
			context.fillStyle=colorpoints[i];
			if (horizontal){
				context.fillRect(i,0,1,height);
			}else{
				context.fillRect(0,length-i,width,-1);
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
				'left'       : '25px',
				'width'      : width + 'px',
				'height'     : 'auto',
				'right'      : 'auto'
			});
			$colorbar_min.css({
				'bottom'     : '0',
				'top'        : 'auto',
				'width'      : width + 'px',
				'height'     : 'auto',
				'left'       : '25px'
			});
		
		}
	};
	var updateMaxMin = function(max,min){
		$colorbar_min.text(min);
		$colorbar_max.text(max);
	};
	var initialize = function(){
		updateMaxMin(options.max, options.min);		
		updateColorBar(options.horizontal, options.width, options.height, options.colormap);
		that.append($colorbar);
	};
	
	return this.each(initialize);
};
})(jQuery);

