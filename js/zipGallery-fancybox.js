/**
 * fancybox controller jQuery JavaScript Library for zipgallery
 *
 * Copyright 2016, 2017 - TDSystem Beratung & Training, Thomas Dausner
 */
(function($) {
	$(document).ready(function() {
		/*
		 * detect mobile browser
		 */
		function isMobile() {
			try{ document.createEvent("TouchEvent"); return true; }
			catch(e){ return false; }
		}
		/*
		 * fancybox options
		 */
		var fcbOptions = {
			locale: 'de',
			index: 0,
			padding: [2, 2, 2, 2],
			prevEffect: 'fade',
			nextEffect: 'fade',
			caption : {
				type: 'over' // 'float', 'inside', 'outside' or 'over'
			},
			helpers: {
				thumbs: {
					width : 50, // set to -1 for flexible width
					height: 50,
					source: function(item) {
						return item.href + '?thumb=true&tnw=' + fcbOptions.helpers.thumbs.width 
													+ '&tnh=' + fcbOptions.helpers.thumbs.height;
					}
				}
			},
			tpl: {
				dfltError: '<p class="fancybox-error">Fehler beim Laden der Datei &lt;%&gt;</p>'
			},
			afterShow: function(args) {
				if (isMobile()) {
					$('.fancybox-wrap')
						.append('<a title="download" class="fancybox-download" download href="' + this.href + '"> </a>');
				}
			}
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
		var dfltCaption = '{%localised%&ensp;}{<b class="dim">&copy;%copyright%} - %filename%</b>';
		var dfltThumbSize = [ fcbOptions.helpers.thumbs.width, fcbOptions.helpers.thumbs.height];
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
			// set clickhandler
			//
			$a.click(function(e) {
				e.preventDefault();
				fcbOptions.tpl.error = fcbOptions.tpl.dfltError.replace(/%/, zipUrl);
				var captionTpl = $a.data('caption') === undefined ? dfltCaption : $a.data('caption');
				var tns = dfltThumbSize;
				if ($a.data('thumbsize') !== undefined) {
					tns = $a.data('thumbsize').split('x');
				}
				fcbOptions.helpers.thumbs.width  = tns[0];
				fcbOptions.helpers.thumbs.height = tns[1];
				//
				// make caption from template and iptc tags
				//
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
				};
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
							// prepare urls
							//
							var gallery = [];
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
								gallery[idx] = new Object({
									href: zipUrl + '/' + info[idx].name,
									title: get_title(info[idx].iptc, captionTpl) 
								});
							}
							//
							// open image gallery
							//
							$.fancybox(gallery, fcbOptions);
						} 
					},
					error: function( xhr, statusText, err ) {
						$('body, a').css('cursor', '');
						alert('Fehler beim Laden der Info aus Datei <' + zipUrl + ">\n" + statusText);
					}
				} );
			} );

		} );
	});
}) (window.jQuery);