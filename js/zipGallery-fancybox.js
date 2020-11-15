/**
 * fancybox controller jQuery library for ZIP Image Gallery
 *
 * Copyright 2016, 2017, 2020 - TDSystem Thomas Dausner
 */
(function ($) {
    $(document).ready(function () {
        /*
         * detect mobile browser
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
         * fancybox options
         */
        let fcbOptions = {
            locale: 'de',
            index: 0,
            padding: [2, 2, 2, 2],
            prevEffect: 'fade',
            nextEffect: 'fade',
            caption: {
                type: 'over' // 'float', 'inside', 'outside' or 'over'
            },
            helpers: {
                thumbs: {
                    width: 50, // set to -1 for flexible width
                    height: 50,
                    source: function (item) {
                        return item.href + '&thumb=true&tnw=' + fcbOptions.helpers.thumbs.width
                            + '&tnh=' + fcbOptions.helpers.thumbs.height;
                    }
                }
            },
            tpl: {
                dfltError: '<p class="fancybox-error">Error loading file &lt;%&gt;</p>'
            },
            afterShow: function () {
                if (isMobile())
                {
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
        let dfltCaption = '{%localised%&ensp;}{<b class="dim">&copy;%copyright%} - %filename%</b>';
        let dfltThumbSize = [fcbOptions.helpers.thumbs.width, fcbOptions.helpers.thumbs.height];
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
            // set clickhandler
            //
            $a.click(function (e) {
                e.preventDefault();
                fcbOptions.tpl.error = fcbOptions.tpl.dfltError.replace(/%/, zipUrl);
                let captionTpl = $a.data('caption') === undefined ? dfltCaption : $a.data('caption');
                let tns = dfltThumbSize;
                if ($a.data('thumbsize') !== undefined)
                {
                    tns = $a.data('thumbsize').split('x');
                }
                fcbOptions.helpers.thumbs.width = tns[0];
                fcbOptions.helpers.thumbs.height = tns[1];
                //
                // make caption from template and iptc tags
                //
                let get_title = function (iptc, captionTpl) {

                    let caption = '';
                    let groups = captionTpl.split(/[{}]/);
                    for (let grp = 0; grp < groups.length; grp++)
                    {
                        let capGrp = groups[grp];
                        if (capGrp !== '')
                        {
                            const keys = capGrp.match(/%\w+%/g);
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
                            // prepare urls
                            //
                            let gallery = [];
                            let lang = $('html').attr('lang');
                            if (lang === undefined)
                            {
                                lang = window.navigator.language.substr(0, 2);
                            }
                            for (let idx = 0; idx < info.length; idx++)
                            {
                                info[idx].iptc = [];
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
                                gallery[idx] = new Object({
                                    href: 'galleries.php?zip=' + zipUrl + '&file=' + info[idx].name,
                                    title: get_title(info[idx].iptc, captionTpl)
                                });
                            }
                            //
                            // open image gallery
                            //
                            $.fancybox(gallery, fcbOptions);
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