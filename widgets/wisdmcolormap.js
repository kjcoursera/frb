/*** require('wisdmcolormap_impl.js'); ***/

WisdmColorMap={_loaded:false, _map_names:[],_map_colors:{}};
WisdmColorMap.loadMaps=function(params,callback) {
	if (WisdmColorMap._loaded) {
		if (callback) callback();
		return;
	}
	var l = wisdmcolormap.list,
			DEFAULT_SIZE = 100;
	
	for (var i = 0, i_len = l.length; i < i_len; i++){
		var name = l[i].name,
				colors = wisdmcolormap.getColorsArray(name, DEFAULT_SIZE);
		WisdmColorMap._map_names.push(name);
		WisdmColorMap._map_colors[name] = colors;
	}
	WisdmColorMap._loaded = true;
	if (callback) callback();
};
WisdmColorMap.getMapNames=function() {
	return WisdmColorMap._map_names;
};
WisdmColorMap.getColors=function(name,callback) {
	if (name in WisdmColorMap._map_colors) return WisdmColorMap._map_colors[name];
	else return [];	
};
WisdmColorMap.selectMap=function(params,callback) {
	wisdmcolormap.selectColorMap(callback, params);
};

