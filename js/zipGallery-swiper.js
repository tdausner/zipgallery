/**
 * swiper controller jQuery library for ZIP Image Gallery
 *
 * Copyright 2017 - TDSystem Beratung & Training, Thomas Dausner
 */
(function($) {
	$(document).ready(function() {
		/*
		 * test for mobile browser
		 */
		var isMobile = function() {
			var userAgent = navigator.userAgent || navigator.vendor || window.opera;
			return /android|ipad|iphone|ipod|windows phone/i.test(userAgent);
		}
		/*
		 * browser independent full screen toggle
		 */
		var setFullScreen = function(on) {
			if (isMobile()) {
				var doc = window.document;
				var docEl = doc.documentElement;
	
				var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
				var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
	
				if (on) {
					if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement)
						requestFullScreen.call(docEl);
				}
				else {
					cancelFullScreen.call(doc);
				}
			}
		}
		var thumbNails = {
			width: 50,
			height: 50
		};
		/*
		 * IPTC keys for image caption
		 * 
		 * Pseudo (non IPTC) keywords:
		 * 	filename             index                localised                
		 * 
		 * IPTC keywords:
		 *	authorByline         authorTitle          caption
		 *	captionWriter        category             cdate
		 *	city                 copyright            country
		 *	headline             OTR                  photoSource
		 *	source               specialInstructions  state
		 *	subcategories        subject              title
		 *	urgency
		 *
		 * Order and presence are defined in the 'dfltCaption' string. 
		 */
		var dfltCaption = '{%localised%&ensp;}{<b class="dim">&copy;%copyright%} - %index% - %filename%</b>';
		var dfltThumbSize = [ thumbNails.width, thumbNails.height ];
		/*
		 * make caption from template and iptc tags
		 */
		var get_title = function (iptc, captionTpl) {

			var caption = '';
			var groups = captionTpl.split(/[{}]/);
			for (var grp = 0; grp < groups.length; grp++) {
				var capGrp = groups[grp];
				if (capGrp !== '') {
					var keys = capGrp.match(/%\w+%/g);
					var keyFound = false;
					for (var j = 0; j < keys.length; j++) {
						var tag = keys[j].replace(/%/g, '');
						var re = new RegExp(keys[j]); 
						if (iptc[tag] !== undefined) {
							capGrp = capGrp.replace(re, iptc[tag]);
							keyFound = true;
						} else {
							capGrp = capGrp.replace(re, '');
						}
					}
					if (keyFound)
						caption += capGrp;
				}
			}
			return caption;
		}
		/*
		 * align image and text geometry
		 */
		var thumbsBorders = 2;
		var thumbsHeight = thumbNails.height + thumbsBorders;
    	var vp = {};
	    var alignGeometry = function(thumbsOff) {
	    	if (thumbsOff === true) {
	    		thumbsHeight = 0;
	    		$('a.download').addClass('no-thumbs');
	    	}
	    	else if (thumbsOff === false) {
	    		thumbsHeight = thumbNails.height + thumbsBorders;
	    		$('a.download').removeClass('no-thumbs');
	    	}
	    	vp = {
        		fullHeight: document.documentElement.clientHeight,
        		width:      document.documentElement.clientWidth
        	};
    		vp.height = vp.fullHeight - thumbsHeight;
    		$('div.gallery-top div.swiper-slide').each(function() {
	    		var $sl = $(this);
	    		var img = {
	    			orgHeight: $sl.data('height'),
	    			orgWidth:  $sl.data('width'),
	    			height: 0,
	    			width: 0
	    		};
		    	var ratio = img.orgWidth / img.orgHeight;
		    	var left, top;
		    	if (vp.height * ratio < vp.width) {
		    		img.width = vp.height * ratio;
		    		img.height = vp.height;
		    		left = (vp.width - img.width) / 2;
		    		top = 0;
		    	} else {
		    		img.width = vp.width;
		    		img.height = vp.width / ratio;
		    		left = 0;
		    		top = (vp.height - img.height) / 2;
		    	}
		    	$sl.css({
		    		top: top + 'px'
		    	});
		    	$('img', $sl).css({
		    		height: img.height + 'px',
		    		width: img.width + 'px'
		    	});
		    	$('div.text', $sl).css({
		    		left: left + 'px'
		    	});
		    	$('div.gallery-top').css({
		    		minHeight: vp.height
		    	});
	    	});
	    }
	    /*
	     * set download link
	     */
	    var setDownloadLink = function(slider) {
			if (isMobile()) {
				var $img = $('img', slider.slides[slider.realIndex]); 
				var url = $img.data('src') === undefined ? $img.attr('src') : $img.data('src');
				var file = url.replace(/.*\//, '');
				$('a.download').attr('href', url).attr('download', file);
			}
	    }
		/*
		 * process all links identifying ZIP gallery files
		 */
		$('a.gallery').each(function() {
			//
			// remove file extension '.zip'
			//
			var $a = $(this);
			var zipUrl = $a.attr('href');
			var galleryName = zipUrl.replace('.zip', ''); 
			$a.attr('href', galleryName);
			//
			// initilaisation of caption and thumbs
			//
			var captionTpl = $a.data('caption') === undefined ? dfltCaption : $a.data('caption');
			var tns = dfltThumbSize;
			if ($a.data('thumbsize') !== undefined) {
				tns = $a.data('thumbsize').split('x');
			}
			thumbNails.width  = parseInt(tns[0]);
			thumbNails.height = parseInt(tns[1]);
			var download = isMobile() ? '<a class="download swiper-button-next swiper-button-white">&nbsp;</a>' : '';
			//
			// set click handler
			//
			$a.click(function(e) {
				e.preventDefault();
				setFullScreen(true);
				//
				// get info
				//
				$('body, a').css('cursor', 'progress');
				$.ajax( {
					type: 'GET',
					url: zipUrl + '/ReWriteDummy?info=true',
					dataType: 'json',
					success: function(info) {
						$('body, a').css('cursor', '');
						if (info.length === 0) {
							alert('Die Gallerie <' + galleryName + '> enthält keine gültigen Bilder.');
						} else {
							//
							// prepare swiper gallery
							//
							$('body').append('<div id="zipGallery">'
											+	'<div class="close"></div>'
											+	download
						    				+	'<div class="swiper-container gallery-top">'
								    		+		'<div class="swiper-wrapper">'
								            + 		'</div>'
								            + 		'<div class="swiper-button-next swiper-button-white"></div>'
								            + 		'<div class="swiper-button-prev swiper-button-white"></div>'
								            +	'</div>'
								            +	'<div class="swiper-container gallery-thumbs">'
								    		+		'<div class="swiper-wrapper">'
								            + 		'</div>'
								            +	'</div>'
								            + '</div>'
							);
							var thumbs = '?thumb=true&tnw=' + thumbNails.width + '&tnh=' + thumbNails.height;
							var thStyle = 'width: ' + thumbNails.width + 'px; height:' + thumbNails.height + 'px;';
							var lang = $('html').attr('lang');
							if (lang === undefined) {
								lang = lang || window.navigator.language || window.navigator.browserLanguage || window.navigator.userLanguage;
								lang = lang.substr(0, 2);
							}
							for (var idx = 0; idx < info.length; idx++) {
								var comp = info[idx].exif.COMPUTED;
								info[idx].iptc['index'] = idx + 1;
								var localised = info[idx].iptc['title'];
								var caption = info[idx].iptc['caption'];
								if (caption !== undefined) {
									var loc = caption.toString().split(/[{}]/);
									if (loc.length > 0 && loc.length % 2 == 1) {
										for (var lidx = 0; lidx < loc.length; lidx += 2) {
											if (loc[lidx].trim() == lang) {
												localised = loc[lidx + 1].trim();
												break;
											}
										}
									}
								}
								info[idx].iptc['localised'] = localised;
								$('.gallery-top .swiper-wrapper')
									.append('<div class="swiper-slide swiper-zoom-container" '
											+			'data-height="' + comp.Height + '" data-width="' + comp.Width + '">'
											+	'<img data-src="' + zipUrl + '/' + info[idx].name + '" class="swiper-lazy">'
											+	'<div class="swiper-lazy-preloader"></div>'
											+	'<div class="text">'
											+		'<p>' + get_title(info[idx].iptc, captionTpl) + '</p>'
											+	'</div>'
											+ '</div>'
									);
								$('.gallery-thumbs .swiper-wrapper')
									.append('<div class="swiper-slide" style="' + thStyle 
												+ ' background-image:url(' + zipUrl + '/' + info[idx].name + thumbs + ')"></div>')
							}
							alignGeometry(false);
							/*
							 * open image gallery 
							 */
							var swOpts = {
								keyboardControl: true,
								mousewheelControl: true,
// not with thumbnails			loop: true,
								nextButton: '.swiper-button-next',
								prevButton: '.swiper-button-prev',
								zoom: true,
								zoomMax: 5,
								preloadImages: false,
								lazyLoading: true,
								lazyLoadingInPrevNext: true,
							    speed: 400,
							    spaceBetween: 10,
							    onInit: setDownloadLink,
							    onSlideChangeEnd: setDownloadLink,
							    onTouchStart: function(swiper, event) {
							    	if (event.x === undefined)
							    		event = event.changedTouches[0];
							    	swOpts.touch.x = event.screenX;
							    	swOpts.touch.y = event.screenY;
							    },
							    onTouchEnd: function(swiper, event) {
							    	if (event.x === undefined)
							    		event = event.changedTouches[0];
							    	var dx = swOpts.touch.x - event.screenX;
							    	var dy = swOpts.touch.y - event.screenY;
							    	if (swOpts.touch.y > vp.height / 2 && Math.abs(dy) / vp.height >= 0.2) {
							    		// start gesture in lower half of viewport, min 20% offset
								    	var ratio = dy / Math.abs(dx);
								    	if (ratio < -2.) {
								    		// gesture down
								    		alignGeometry(true);
								    	} else if (ratio > 2.) {
								    		// gesture up
								    		alignGeometry(false);
								    	}
							    	}
							    },
							    touch: { x: 0, y: 0 }
							};
							if (!isMobile()) {
								swOpts.lazyLoadingInPrevNextAmount = 10;
								swOpts.slidesPerView = 'auto';
							}
							var galleryTop = new Swiper('.gallery-top', swOpts);
						    var galleryThumbs = new Swiper('.gallery-thumbs', {
						        centeredSlides: true,
						        slidesPerView: 'auto',
						        touchRatio: 0.8,
						        slideToClickedSlide: true
						    });
						    galleryTop.params.control = galleryThumbs;
						    galleryThumbs.params.control = galleryTop;
							/*
							 * gallery close click/escape handler
							 */
							$('#zipGallery div.close').click(function() {
								$('#zipGallery').remove();
								setFullScreen(false);
							});
							$(document).keydown(function(evt) {
							    evt = evt || window.event;
							    var isEscape = false;
							    if ("key" in evt) {
							        isEscape = (evt.key == "Escape" || evt.key == "Esc");
							    } else {
							        isEscape = (evt.keyCode == 27);
							    }
							    if (isEscape) {
									$('#zipGallery').remove();
									setFullScreen(false);
							    }
							});
							/*
							 * window resize handler
							 */
							$(window).resize(alignGeometry);
						} 
					},
					error: function( xhr, statusText, err ) {
						$('body, a').css('cursor', '');
						alert('Fehler beim Laden der Info aus Datei <' + zipUrl + ">\n" + statusText);
					}
				});
			});
		});
	});
}) (window.jQuery);