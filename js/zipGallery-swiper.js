/**
 * swiper controller jQuery library for ZIP Image Gallery
 *
 * Copyright 2017, 2020 - TDSystem Thomas Dausner
 */
(function ($) {
    $(document).ready(function () {
        /*
         * test for mobile browser
         */
        let isMobile = function() {
            try
            {
                document.createEvent("TouchEvent");
                return true;
            } catch (e)
            {
                return false;
            }
        };
        /*
         * browser independent full screen toggle
         */
        let setFullScreen = function (on) {
            if (isMobile())
            {
                let doc = window.document;
                let docEl = doc.documentElement;

                let requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
                let cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

                if (on)
                {
                    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement)
                    {
                        requestFullScreen.call(docEl).then();
                    }
                }
                else
                {
                    cancelFullScreen.call(doc).then();
                }
            }
        };
        let thumbNails = {
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
        let dfltCaption = '{%localised%&ensp;}{<b class="dim">&copy;%copyright%} - %index% - %filename%</b>';
        let dfltThumbSize = [thumbNails.width, thumbNails.height];
        /*
         * make caption from template and iptc tags
         */
        let get_title = function (iptc, captionTpl) {
            let caption = '';
            let groups = captionTpl.split(/[{}]/);
            for (let grp = 0; grp < groups.length; grp++)
            {
                let capGrp = groups[grp];
                if (capGrp !== '')
                {
                    let keys = capGrp.match(/%\w+%/g);
                    let keyFound = false;
                    for (let j = 0; j < keys.length; j++)
                    {
                        let tag = keys[j].replace(/%/g, '');
                        let re = new RegExp(keys[j]);
                        if (iptc[tag] !== undefined)
                        {
                            capGrp = capGrp.replace(re, iptc[tag]);
                            keyFound = true;
                        }
                        else
                        {
                            capGrp = capGrp.replace(re, '');
                        }
                    }
                    if (keyFound)
                    {
                        caption += capGrp;
                    }
                }
            }
            return caption;
        };
        /*
         * align image and text geometry
         */
        let thumbsBorders = 2;
        let thumbsHeight = thumbNails.height + thumbsBorders;
        let vp = {};
        let alignGeometry = function (thumbsOff) {
            if (thumbsOff === true)
            {
                thumbsHeight = 0;
                $('a.download').addClass('no-thumbs');
            }
            else if (thumbsOff === false)
            {
                thumbsHeight = thumbNails.height + thumbsBorders;
                $('a.download').removeClass('no-thumbs');
            }
            vp = {
                fullHeight: document.documentElement.clientHeight,
                width: document.documentElement.clientWidth
            };
            vp.height = vp.fullHeight - thumbsHeight;
            $('div.gallery-top div.swiper-slide').each(function () {
                let $sl = $(this);
                let img = {
                    orgHeight: $sl.data('height'),
                    orgWidth: $sl.data('width'),
                    height: 0,
                    width: 0
                };
                let ratio = img.orgWidth / img.orgHeight;
                let left, top;
                if (vp.height * ratio < vp.width)
                {
                    img.width = vp.height * ratio;
                    img.height = vp.height;
                    left = (vp.width - img.width) / 2;
                    top = 0;
                }
                else
                {
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
        };
        /*
         * set download link
         */
        let setDownloadLink = function (slider) {
            if (isMobile())
            {
                let $img = $('img', slider.slides[slider.realIndex]);
                let url = $img.data('src') === undefined ? $img.attr('src') : $img.data('src');
                let file = url.replace(/.*\//, '');
                $('a.download').attr('href', url).attr('download', file);
            }
        };
        /*
         * process all links identifying ZIP gallery files
         */
        $('a.gallery').each(function () {
            //
            // remove file extension '.zip'
            //
            let $a = $(this);
            let zipUrl = $a.attr('href');
            let galleryName = zipUrl.replace('.zip', '');
            $a.attr('href', galleryName);
            //
            // initilaisation of caption and thumbs
            //
            let captionTpl = $a.data('caption') === undefined ? dfltCaption : $a.data('caption');
            let tns = dfltThumbSize;
            if ($a.data('thumbsize') !== undefined)
            {
                tns = $a.data('thumbsize').split('x');
            }
            thumbNails.width = parseInt(tns[0]);
            thumbNails.height = parseInt(tns[1]);
            let download = isMobile() ? '<a class="download swiper-button-next swiper-button-white">&nbsp;</a>' : '';
            //
            // set click handler
            //
            $a.click(function (e) {
                e.preventDefault();
                setFullScreen(true);
                //
                // get info
                //
                $('body, a').css('cursor', 'progress');
                $.ajax({
                    type: 'GET',
                    url: 'galleries.php?zip=' + zipUrl + '&info=true',
                    dataType: 'json',
                    success: function (info) {
                        $('body, a').css('cursor', '');
                        if (info.length === 0)
                        {
                            alert('Gallery <' + galleryName + '> contains no valid images.');
                        }
                        else
                        {
                            //
                            // prepare swiper gallery
                            //
                            $('body').append('<div id="zipGallery">'
                                + '<div class="close"></div>'
                                + download
                                + '<div class="swiper-container gallery-top">'
                                + '<div class="swiper-wrapper">'
                                + '</div>'
                                + '<div class="swiper-button-next swiper-button-white"></div>'
                                + '<div class="swiper-button-prev swiper-button-white"></div>'
                                + '</div>'
                                + '<div class="swiper-container gallery-thumbs">'
                                + '<div class="swiper-wrapper">'
                                + '</div>'
                                + '</div>'
                                + '</div>'
                            );
                            let thumbs = '&thumb=true&tnw=' + thumbNails.width + '&tnh=' + thumbNails.height;
                            let thStyle = 'width: ' + thumbNails.width + 'px; height:' + thumbNails.height + 'px;';
                            let lang = $('html').attr('lang');
                            if (lang === undefined)
                            {
                                lang = window.navigator.language.substr(0, 2);
                            }
                            for (let idx = 0; idx < info.length; idx++)
                            {
                                let comp = info[idx].exif.COMPUTED;
                                info[idx].iptc['index'] = idx + 1;
                                let localised = info[idx].iptc['title'];
                                let caption = info[idx].iptc['caption'];
                                if (caption !== undefined)
                                {
                                    let loc = caption.toString().split(/[{}]/);
                                    if (loc.length > 0 && loc.length % 2 === 1)
                                    {
                                        for (let lidx = 0; lidx < loc.length; lidx += 2)
                                        {
                                            if (loc[lidx].trim() === lang)
                                            {
                                                localised = loc[lidx + 1].trim();
                                                break;
                                            }
                                        }
                                    }
                                }
                                info[idx].iptc['localised'] = localised;
                                $('.gallery-top .swiper-wrapper')
                                    .append('<div class="swiper-slide swiper-zoom-container" '
                                        + 'data-height="' + comp.Height + '" data-width="' + comp.Width + '">'
                                        + '<img alt="" data-src="/galleries.php?zip=' + zipUrl + '&file=' + info[idx].name + '" class="swiper-lazy">'
                                        + '<div class="swiper-lazy-preloader"></div>'
                                        + '<div class="text">'
                                        + '<p>' + get_title(info[idx].iptc, captionTpl) + '</p>'
                                        + '</div>'
                                        + '</div>'
                                    );
                                $('.gallery-thumbs .swiper-wrapper')
                                    .append('<div class="swiper-slide" style="' + thStyle
                                        + ' background-image:url(/galleries.php?zip=' + zipUrl + '&file=' + info[idx].name + thumbs + ')"></div>')
                            }
                            alignGeometry(false);
                            /*
                             * open image gallery
                             */
                            let swOpts = {
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
                                onTouchStart: function (swiper, event) {
                                    if (event.x === undefined)
                                    {
                                        event = event.changedTouches[0];
                                    }
                                    swOpts.touch.x = event.screenX;
                                    swOpts.touch.y = event.screenY;
                                },
                                onTouchEnd: function (swiper, event) {
                                    if (event.x === undefined)
                                    {
                                        event = event.changedTouches[0];
                                    }
                                    let dx = swOpts.touch.x - event.screenX;
                                    let dy = swOpts.touch.y - event.screenY;
                                    if (swOpts.touch.y > vp.height / 2 && Math.abs(dy) / vp.height >= 0.2)
                                    {
                                        // start gesture in lower half of viewport, min 20% offset
                                        let ratio = dy / Math.abs(dx);
                                        if (ratio < -2.)
                                        {
                                            // gesture down
                                            alignGeometry(true);
                                        }
                                        else if (ratio > 2.)
                                        {
                                            // gesture up
                                            alignGeometry(false);
                                        }
                                    }
                                },
                                touch: {x: 0, y: 0}
                            };
                            if (!isMobile())
                            {
                                swOpts.lazyLoadingInPrevNextAmount = 10;
                                swOpts.slidesPerView = 'auto';
                            }
                            let galleryTop = new Swiper('.gallery-top', swOpts);
                            let galleryThumbs = new Swiper('.gallery-thumbs', {
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
                            $('#zipGallery div.close').click(function () {
                                $('#zipGallery').remove();
                                setFullScreen(false);
                            });
                            $(document).keydown(function (evt) {
                                evt = evt || window.event;
                                let isEscape;
                                if ("key" in evt)
                                {
                                    isEscape = (evt.key === "Escape" || evt.key === "Esc");
                                }
                                else
                                {
                                    isEscape = (evt.keyCode === 27);
                                }
                                if (isEscape)
                                {
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
                    error: function (xhr, statusText) {
                        $('body, a').css('cursor', '');
                        alert('Error loading info from file <' + zipUrl + ">\n" + statusText);
                    }
                });
            });
        });
    });
})(window.jQuery);