/*jshint multistr:true*/

(function( $ ){

  $.fn.WisdmBackground = function( options ) {  
	
    var $that = this,
				$body = $('body'),
				settings = $.extend( {
					//developers     : ['Oscar Bartra', 'Jeremy Magland'],
					//year           : 2013,
					//footerLeft     : [],
					//footerRight    : [],
					//wisdmbanner    : $('.wisdmbanner')
					//bghtml         : '$wisdmpages$/toexport/backgrounds/raw.html', //jfm
					//addFooter      : true
					style:'light'
				}, options);
				/*createFooter = function(){
					var text = "Software Developed ",
							num_devs = settings.developers.length;
					if (num_devs > 1){
						text += "by ";
						
						for (var i = 0; i < num_devs - 2; i++)
							text += settings.developers[i] + ", ";
						
						text += settings.developers[num_devs - 2];
						text += " and " + settings.developers[num_devs-1]
					}else if (num_devs === 1)
						text += "by " + settings.developers[0] + " ";
					
					
					text += "at University of Pennsylvania " + settings.year;
					var $left = $('<div class="wisdmfooter_leftcorner"></div>').append(settings.footerLeft),
							$right = $('<div class="wisdmfooter_rightcorner"></div>').append(settings.footerRight),
							$text = $('<span>'+text+'</span>');
					
					return $('<div class="wisdmfooter"></div>').append($left, $text, $right);
				};*/

    return this.each(function() {        
			//if (settings.wisdmbanner.length === 0)
				//if there is no wisdmbanner, we have to change the height of this element to take up all space
				//$that.css('top', 0);
			

			
			//we add the class wisdmcontainer so we make sure it takes the place we want
			$that.addClass('wisdmcontainer');
			
			var div0=$('<div class="wisdmbackground"></div>');
			if (settings.style=='dark') div0.addClass('wisdm-dark-style');
			else div0.addClass('wisdm-light-style');
			/*
			$that.append('\n\
				<div id="wisdm_bg_big_W">W</div>\n\
				<div id="wisdm_bg_left_logo">\n\
					<span id="wisdm_bg_left_title">WISDM</span>\n\
					<span id="wisdm_bg_left_def">WEB-INTERACTIVE SCIENTIFIC DATA MANAGER</span>\n\
					<span id="wisdm_bg_left_motto">APPS WITH BRAINS</span>\n\
				</div>\n\
				');
			*/
			div0.append($that);
			$('body').append(div0);

			//$body.append(div0);
				//$('<div class="wisdmbackground">')
					/*.load(settings.bghtml, function(){
						//if we want a header we add it, if not we resize the content element accordingly. Why do we add it after loading the html? to avoid a FOUC since the css is contained in the html
						if (settings.addFooter)
								$body.append(createFooter());
							else
								$that.css('bottom', 0);
					})*/
			//);
    });

  };
})( jQuery );

