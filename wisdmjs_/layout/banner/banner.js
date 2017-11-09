/*jshint multistr:true*/

(function($) {
var _onMenuLoaded = function($that){
	//Now we are ready to process everything else
	
	var $loggedin_submenu = $('.loggedin', $that),
			$tologin_submenu = $('.tologin', $that),
			$outliner = $('#menuoutliner', $that),
			$login_button = $('#wisdmbanner_loginbutton', $that),
			$logout_button = $('#wisdmbanner_logout', $that), //jfm
			$loginas_button = $('#wisdmbanner_loginas', $that), //jfm
			$profile_button = $('#wisdmbanner_profile', $that), //jfm
			timeout = 50;
	
	var isLoggedIn=function(){
		if (!window.WISDM) return false;
		return ((WISDM.currentUser()||'')!=='');
	};
	
	var showMenus = function(showmenu){
		var hide = function($elem){ if ($elem.is(':visible')) $elem.stop().hide(timeout).fadeTo(timeout, 0);},
				show = function($elem){ if (!$elem.is(':visible')) $elem.stop().fadeTo(timeout, 1, function(){ $elem.show();});};
		
		switch (showmenu){
			case 'tologin':
				show($tologin_submenu);
				hide($loggedin_submenu);
				break;
			case 'loggedin':
				hide($tologin_submenu);
				show($loggedin_submenu);
				break;
			case 'none':
				hide($tologin_submenu);
				hide($loggedin_submenu);
				break;
		}
	};
	
	/* Outline follows link hover */
	$('a.outlined, .sign', $that).mouseenter(function(){
		var $this = $(this);
		if ($this.hasClass('sign')) $this = $('a#user', $that);
		
		var position = $this.offset().left,
				width = $this.width() + 30;
		$outliner
			.stop()
			.animate({
				'left': position -15,
				'width': width
			}, 400);
	});
	/* Input text shows/hides information on the input content  */
	$('input[data-defaulttext]', $that)
		.focus(function(){
			var $this = $(this);
			
			if ($this.val() === $this.attr('data-defaulttext'))
					$this
						.val('')
						.removeClass('emptyfield');
		})
		.blur(function(){
			var $this = $(this);
			if ($this.val() === '')
					$this
						.val($this.attr('data-defaulttext'))
						.addClass('emptyfield');
		});
	
	/* On user click, hide/show appropriate menu*/
	$('.sign, a#user', $that).click(function(){
		var isamenuvisible = $tologin_submenu.is(':visible') || $loggedin_submenu.is(':visible');
		
		if (isamenuvisible){
			showMenus('none');
		}
		//else if (isLoggedIn()){
		else {
			showMenus('loggedin');
		}
		//else{
		//	showMenus('tologin');
		//}
	});
	
	/* On click outside the menu, hide the submenus*/
	$(document).click(function (e){
    if (!$that.is(e.target) && $that.has(e.target).length === 0)
        showMenus('none');
	});
	var initialize = function() {
		if (window.WISDM){
			WISDM.onCurrentUserChanged(function(){
				on_user_changed();
			});
		}
		function on_user_changed() {
			if (isLoggedIn())
				$('a#user', $that).text(WISDM.currentUser());
			else
				$('a#user', $that).text('Log in');
		}
			on_user_changed();
	};
	
	$('#wisdmbanner_password', $that).keydown(function(e){
		if (e.which === 13)
			$login_button.click();
	});
	$login_button.click(function(){
		var $username = $('#wisdmbanner_username', $that),
				username_val = $username.attr('data-defaulttext') === $username.val() ? '' : $username.val();
		
		var $password = $('#wisdmbanner_password', $that),
				password_val = $password.attr('data-defaulttext') === $password.val() ? '' : $password.val();
		
		$that.trigger('loginrequest', {user: username_val, password: password_val}); //jfm added the "$"
		showMenus('none');
	});
	$loginas_button.click(function(){
		$that.trigger('loginasrequest', {}); //jfm
		showMenus('none');
	});
	$logout_button.click(function(){ //jfm
		$that.trigger('logoutrequest', {}); 
		showMenus('none');
	});
	$profile_button.click(function(){ //jfm
		$that.trigger('profilerequest', {}); 
		showMenus('none');
	});

	initialize();
};
	
$.fn.WisdmBanner = function(options,callback) { //jfm added callback
	//Synonyms		
	var that = this,
			$that = $(this);

	//Defaults
	//$.fn.WisdmBanner.defaultOptions = {
	//	bannerhtml      : '$wisdmpages$/core/layout/banner/raw.html' //jfm
	//};
	
	options = $.extend(true,{}, $.fn.WisdmBanner.defaultOptions, options);

	
	this.append(templateHtml('.wisdmbanner'));
	this.append(templateHtml('.wisdmbanner_footer'));
	this.append(templateHtml('.wisdmbanner_status'));
	setTimeout(function() {
		_onMenuLoaded($that);
		if (callback) callback();
	},500);
	
	
	//$that
		//.load(options.bannerhtml, function(){_onMenuLoaded($that); if (callback) callback();}); //jfm
	//return this;
};
})(jQuery);

