///////////////////////////////////////////////////////////////////////////////////////
// ************************ ENCODE Base64 ************************
// Converts an ArrayBuffer directly to base64, without any intermediate 'convert to string then
// use window.btoa' step. According to my tests, this appears to be a faster approach:
// http://jsperf.com/encoding-xhr-image-data/5
// indices added by jfm
window.typed_arrays_alert_has_been_shown=false;
function base64ArrayBuffer(arrayBuffer,min_index,max_index) {
	
	if (typeof(Uint8Array)=='undefined') {
		if (!window.typed_arrays_alert_has_been_shown) {
			alert('Your browser does not support typed arrays. Please view this page using Chrome, FireFox, or Safari');
			window.typed_arrays_alert_has_been_shown=true;
		}
	}
	
  var base64    = '';
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  var bytes         = new Uint8Array(arrayBuffer);
  if (min_index===undefined) min_index=0;
  if (max_index===undefined) max_index=bytes.byteLength-1;
  var byteLength    = max_index-min_index+1;
  var byteRemainder = byteLength % 3;
  var mainLength    = byteLength - byteRemainder;

  var a, b, c, d;
  var chunk;

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[min_index+i] << 16) | (bytes[min_index+i + 1] << 8) | bytes[min_index+i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63;               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[min_index+mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4; // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '==';
  } else if (byteRemainder == 2) {
    chunk = (bytes[min_index+mainLength] << 8) | bytes[min_index+mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4; // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2; // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '=';
  }
  
  return base64;
}


// ************************ DECODE Base64 ************************
/**
 * Uses the new array typed in javascript to binary base64 encode/decode
 * at the moment just decodes a binary base64 encoded
 * into either an ArrayBuffer (decodeArrayBuffer)
 * or into an Uint8Array (decode)
 * 
 * References:
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/Uint8Array
 */

var Base64Binary = {
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	

	/* will return a  Uint8Array type */
	decodeArrayBuffer: function(input) {

		if (typeof(Uint8Array)=='undefined') {
			if (!window.typed_arrays_alert_has_been_shown) {
				alert('Your browser does not support typed arrays. Please view this page using Chrome, FireFox, or Safari');
				window.typed_arrays_alert_has_been_shown=true;
			}
		}
		
		var bytes = Math.ceil( (3*input.length) / 4.0);
		var ab = new ArrayBuffer(bytes);
		this.decode(input, ab);

		return ab;
	},

	decode: function(input, arrayBuffer) {
		
		//the following added by jfm (10/4/13)
		var _keyStr_lookup={};
		for (var j=0; j<this._keyStr.length; j++) {
			_keyStr_lookup[this._keyStr[j]]=j;
		}
		
		if (typeof(Uint8Array)=='undefined') {
			if (!window.typed_arrays_alert_has_been_shown) {
				alert('Your browser does not support typed arrays. Please view this page using Chrome, FireFox, or Safari');
				window.typed_arrays_alert_has_been_shown=true;
			}
		}
		
		//get last chars to see if are valid
		var lkey1 = this._keyStr.indexOf(input.charAt(input.length-1));
		var lkey2 = this._keyStr.indexOf(input.charAt(input.length-2)); //there was a bug here! See the comments of: http://blog.danguer.com/2011/10/24/base64-binary-decoding-in-javascript/

		var bytes = Math.ceil( (3*input.length) / 4.0);
		if (lkey1 == 64) bytes--; //padding chars, so skip
		if (lkey2 == 64) bytes--; //padding chars, so skip
		
		var uarray;
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
		var j = 0;

		if (arrayBuffer)
			uarray = new Uint8Array(arrayBuffer);
		else
			uarray = new Uint8Array(bytes);

		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		for (i=0; i<bytes; i+=3) {	
			//get the 3 octects in 4 ascii chars
			
			//jfm replaced the following (10/4/13)
			//enc1 = this._keyStr.indexOf(input.charAt(j++));
			//enc2 = this._keyStr.indexOf(input.charAt(j++));
			//enc3 = this._keyStr.indexOf(input.charAt(j++));
			//enc4 = this._keyStr.indexOf(input.charAt(j++));
			enc1=_keyStr_lookup[input.charAt(j++)]||0;
			enc2=_keyStr_lookup[input.charAt(j++)]||0;
			enc3=_keyStr_lookup[input.charAt(j++)]||0;
			enc4=_keyStr_lookup[input.charAt(j++)]||0;
			
			if ((enc1<0)||(enc2<0)||(enc3<0)||(enc4<0)) {
				console.log ('################',input.slice(j-4,j),enc1,enc2,enc3,enc4);
			}

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			uarray[i] = chr1;			
			if (enc3 != 64) uarray[i+1] = chr2;
			if (enc4 != 64) uarray[i+2] = chr3;
		}

		return uarray;	
	}
};

