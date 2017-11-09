function LocalContentsByChecksum() {
	//Only one instance of this per app, please!
	var that=this;
	
	this.addContents=function(contents_by_checksum) {return _addContents(contents_by_checksum);};
	this.getContent=function(checksum) {return _getContent(checksum);};
	
	var m_initialized=false;
	var m_contents_by_checksum={};
	var m_something_changed=false;
	
	function initialize_if_needed() {
		if (m_initialized) return true;
		try {
			var str=localStorage.wisdm_contents_by_checksum;
			if (!str) {
				m_contents_by_checksum={};
				return;
			}
			m_contents_by_checksum=JSON.parse(localStorage.wisdm_contents_by_checksum);
			m_initialized=true;
		}
		catch(err) {
			console.error('Problem initializing LocalContentsByChecksum err',err);
			m_contents_by_checksum={};
			m_initialized=true;
		}
	}
	function _setContent(content) {
		initialize_if_needed();
		try {
			var checksum=sha1(content).toString();
			if (checksum in m_contents_by_checksum) {
				return;
			}
			m_contents_by_checksum[checksum]={content:content,last_accessed:(new Date()).getTime()};
			m_something_changed=true;
		}
		catch(err) {
			console.error('Problem in setContent of LocalContentsByChecksum',err);
		}
	}
	function _addContents(contents_by_checksum) {
		for (var checksum in contents_by_checksum) {
			_setContent(contents_by_checksum[checksum]);
		}
	}
	function _getContent(checksum) {
		initialize_if_needed();
		try {
			if (!(checksum in m_contents_by_checksum)) {
				return '';
			}
			return m_contents_by_checksum[checksum].content;
		}
		catch(err) {
			console.error('Problem in getContent of LocalContentsByChecksum',err);
		}
	}
	var MAX_SIZE_OF_CONTENTS=2000000; //2 MB max!
	function periodic_check() {
		initialize_if_needed();
		if (m_something_changed) {
			try {	
				var str_to_save=JSON.stringify(m_contents_by_checksum);
				if (str_to_save.length<=MAX_SIZE_OF_CONTENTS) {
					localStorage.wisdm_contents_by_checksum=str_to_save;
					m_something_changed=false;
				}
				else {
					clean_up_oldest_items();
				}
			}
			catch(err) {
				console.error('Problem in periodic_check of LocalContentsByChecksum',err);
			}
		}
		setTimeout(periodic_check,3000);			
	}
	periodic_check();
	
	function clean_up_oldest_items() {
		console.log ('Cleaning up oldest items in local storage of contents by checksum.');
		var all_checksums=[];
		for (var checksum in m_contents_by_checksum) all_checksums.push(checksum);
		all_checksums.sort(function(a,b) {
			var tmpa=m_contents_by_checksum[a].last_accessed;
			var tmpb=m_contents_by_checksum[b].last_accessed;
			if (tmpa<tmpb) return -1;
			else if (tmpa>tmpb) return 1;
			else return 0;
		});
		for (var i=0; (i<10)&&(i<all_checksums.length); i++) {
			delete(m_contents_by_checksum[all_checksums[i]]);
		}
	}
}

