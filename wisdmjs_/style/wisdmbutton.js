/*global $:false */
/*global console:false */
(function($) {
'use strict';
	
$.fn.WisdmButton = function(options) {
	options = $.extend(true,{}, {type:'',modifier:''}, options);
	
	var initialize = function(){
		var type=options.type;
		var modifier=options.modifier;
		var $that=$(this);
		
		$that.addClass('wisdm');
		
		//if there's a text to set for the button, we set it
		if (type===''){
			type = $that.attr('data-button-type')||'';
		}
		if (type==='') {
			if ($that.find('.wisdm-button-label').length===0) {
				type=$that.html();
			}
			else {
				type = $that.find('.wisdm-button-label').html();
			}
		}
		type = type.toLowerCase();
		if (modifier===''){
			modifier = $that.attr('data-button-modifier')||'';
		}
		modifier = modifier.toLowerCase();
		
		//we first attempt to get the right name as is
		var iconname = getIconName(type, modifier);
		
		if (iconname!=='') {
			if ($that.find('.wisdm-button-label').length===0) {
				var tmp_html=$that.html();
				$that.empty();
				$that.append('<div class="wisdm-button-label">'+tmp_html+'</div>');
			}
			if ($that.find('.wisdm-button-icon').length===0) {
				$that.prepend('<div class="wisdm-button-icon"></div>');
			}
			$that.find('.wisdm-button-icon').addClass('wisdm-icon'+iconname);
		}
		else {
			if ($that.find('.wisdm-button-label').length>0) {
				var tmp_html2=$that.find('.wisdm-button-label').html();
				$that.empty();
				$that.append(tmp_html2);
			}
		}
	};
	
	var getIconName = function(type, modifier){
		//We format modifiers
		switch(modifier){
			case 'remove':
			case 'delete':
				modifier = '--minus';
				break;
			
			case 'add':
			case 'plus':
			case 'more':
				modifier = '--plus';
				break;
			
			case 'edit':
			case 'modify':
			case 'change':
				modifier = '--pencil';
				break;
				
			case 'rename':
				//only valid for file/document and folders
				if (type !== 'file' && type !== 'folder' && type !== 'document')
					modifier = '';
				else
					modifier = '-rename';
				break;
				
			case 'search':
			case 'find':
			case 'explore':
			case 'zoom':
			case 'zoomin':
				//only valid for file/document and folders
				if (type !== 'file' && type !== 'folder' && type !== 'document')
					modifier = '';
				else
					modifier = '-search';
				break;
				
			case 'code':
				//only valid for file/document
				if (type !== 'file' && type !== 'document')
					modifier = '';
				else
					modifier = '-code';
				break;
				
			case 'open':
				//only valid for folder
				if (type !== 'folder')
					modifier = '';
				else
					modifier = '-open';
				break;	
				
			default:
				modifier = '';
		}
		
		//And we return the typename
		switch(type){
				
			case 'application':
			case 'program':
			case 'run':
				return '-application';
				
			case 'back':
			case 'previous':
			case '<':
				return '-arrow-180';
				
			case 'forward':
			case 'next':
			case 'go':
			case '>':
				return '-arrow';
				
			case 'up':
			case 'top':
				return '-arrow-090';
				
			case 'down':
			case 'bottom':
				return '-arrow-270';
				
			case 'refresh':
			case 'reset':
			case 'repeat':
			case 'redo':
				return '-arrow-circle';
				
			case 'maximize':
			case 'expand':
			case 'max':
				return '-arrow-in-out';
				
			case 'restore':
			case 'resize':
			case 'normal':
				return '-arrow-in';
				
			case 'start':
			case 'begin':
			case 'beginning':
				return '-arrow-stop-180';
				
			case 'end':
			case 'final':
				return '-arrow-stop';
				
			case 'switch':
			case 'change':
				return '-arrow-switch';
				
			case 'asterisk':
				return '-asterisk';
				
			case 'balloon':
			case 'message':
				return '-balloon';
					
			case 'bookmark':
			case 'ribbon':
				//add modifiers
				return '-bookmark' + modifier;
				
			case 'brain':
			case 'brain1':
				//add modifiers
				return '-brain' + modifier;

			case 'nobrain':
			case 'brain2':
			case 'brainempty':
			case 'emptybrain':
				return '-brain-empty';
				
			case 'broom':
			case 'clean':
			case 'clear':
			case 'cleanup':
				return '-broom';
				
			case 'bug':
			case 'debug':
			case 'problem':
				return '-bug';
					
			case 'calendar':
			case 'date':
				return '-calendar';
			
			case 'paste':
			case 'clipboard':
				return '-clipboard';
				
			case 'clock':
			case 'watch':
			case 'time':
			case 'wait':
			case 'pause':
				return '-clock';
				
			case 'color':
			case 'palette':
			case 'spinner':
			case 'css':
				return '-color';
				
			case 'cancel':
			case 'error':
			case 'x':
				return '-cross';
				
			case 'crown':
			case 'king':
				return '-crown-gold';
				
			
			case 'database':
			case 'server':
			case 'store':
			case 'storage':
				return '-database';
				
			case 'save':
			case 'disk':
			case 's':
				return '-disk';
			
			case 'edit':	
				return '-document--pencil';
				
			case 'document':
			case 'file':
				//add modifiers
				return '-document' + modifier;
				
			case 'drive':
			case 'local':
				return '-drive';
				
			case 'exclamation':
			case 'alert':
			case 'warning':
			case '!':
				return '-exclamation';
			
			case 'eye':
			case 'view':
			case 'preview':
				return '-eye';
				
			case 'flask':
			case 'experiment':
			case 'test':
			case 'probe':
				return '-flask';
				
			case 'folder':
				//add modifiers
				return '-folder' + modifier;
			
			case 'configuration':
			case 'settings':
			case 'control panel':
			case 'dashboard':
				return '-gear';
				
			case 'hand':
			case 'manual':
			case 'stop':
				return '-hand';
				
			case 'info':
			case 'information':
			case 'notice':
			case 'note':
				return '-information';
				
			case 'key':
			case 'pair':
			case 'value':
				//add modifiers
				return '-key' + modifier;
				
			case 'search':
			case 'find':
			case 'explore':
			case 'zoom':
			case 'zoomin':
				return '-magnifier';
				
			case 'remove':
			case 'delete':
			case '-':
				return '-minus';
				
			case 'pin':
			case 'attach':
				return '-pin';
				
			case 'plus':
			case 'more':
			case 'add':
				return '-plus';
			
			case 'process':
			case 'processes':
			case 'processor':
			case 'processors':
			case 'task':
			case 'tasks':
				return '-processor';
				
			case 'question':
			case 'doubt':
			case '?':
				return '-question';
				
			case 'cut':
				return '-scissors';
				
			case 'script':
			case 'javascript':
			case 'js':
				return '-script-code';
				
			case 'tick':
			case 'ok':
				return '-tick';
				
			case 'expand':
				return '-expand';
			case 'collapse':
				return '-collapse';
				
			case 'user':
			case 'participant':
			case 'participants':
			case 'subject':
			case 'subjects':
				//add modifiers
				return '-user' + modifier;
				
			default:
				return '';
		}
	};
	
	return this.each(initialize);
};
})(jQuery);
