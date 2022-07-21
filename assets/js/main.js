/************* Main Js File ************************
    Template Name: Pizzle
    Author: Evrothemes
    Version: 1.0
    Copyright 2021
*************************************************************/


/*------------------------------------------------------------------------------------
    
JS INDEX
=============
01 - Pizza Slider JS
02 - Testimonial Slider JS
03 - Gallery Popup JS
04 - Radio Button Js
05 - Mobile Menu JS
06 - Input Number JS
07 - Tab Responsive JS
08 - Email Setup JS
08 - Back To Top

-------------------------------------------------------------------------------------*/
let set_gallery_conf = undefined;

(function($) {
    "use strict";

    jQuery(document).ready(function($) {

        /* 
        =================================================================
        01 - Pizza Slider JS
        =================================================================	
        */

        $(".pizza_slide").owlCarousel({
            autoplay: true,
            loop: true,
            margin: 30,
            touchDrag: true,
            mouseDrag: true,
            nav: false,
            dots: false,
            autoplayTimeout: 6000,
            autoplaySpeed: 1200,
            responsive: {
                0: {
                    items: 1
                },
                480: {
                    items: 1
                },
                600: {
                    items: 2
                },
                1000: {
                    items: 3
                },
                1200: {
                    items: 3
                }
            }
        });

        var selector = $('.pizza_slide');

        $('.next_slide').click(function() {
            selector.trigger('next.owl.carousel');
        });

        $('.prev_slide').click(function() {
            selector.trigger('prev.owl.carousel');
        });

        /* 
        =================================================================
        02 - Testimonial Slider JS
        =================================================================	
        */

        $(".testimonial-slider").owlCarousel({
            autoplay: true,
            loop: true,
            margin: 0,
            items: 1,
            touchDrag: true,
            mouseDrag: true,
            nav: false,
            dots: false,
            autoplayTimeout: 6000,
            autoplaySpeed: 1200,
            navText: ["<i class='fa fa-chevron-left'></i>", "<i class='fa fa-chevron-right'></i>"]
        });

        var testimonialSelector = $('.testimonial-slider');

        $('.next_slide').click(function() {
            testimonialSelector.trigger('next.owl.carousel');
        });

        $('.prev_slide').click(function() {
            testimonialSelector.trigger('prev.owl.carousel');
        });

        /* 
        =================================================================
        03 - Gallery Popup JS
        =================================================================	
        */


        set_gallery_conf = function() {
            $(".gallery-lightbox").magnificPopup({
                type: 'image',
                gallery: {
                    enabled: true
                },
                zoom: {
                    enabled: true,
                    duration: 300,
                    easing: 'ease-in-out',
                    opener: function(openerElement) {

                        return openerElement.is('img') ? openerElement : openerElement.find('img');
                    }
                }
            });
        }




        /* 
        =================================================================
        04 - Radio Button Js
        =================================================================	
        */

        $('#other-field').focus(function() {
            $('#other').prop("checked", true);
        });

        /* 
        =================================================================
        05 - Mobile Menu JS
        =================================================================	
        */
        $(".mainmenu ul li:has(ul)").addClass("has-submenu");
        $(".mainmenu ul li:has(ul.small-dropdown)").addClass("small-submenu");
        $(".mainmenu ul li ul").addClass("sub-menu");
        $(".mainmenu ul.dropdown li").hover(function() {
            $(this).addClass("hover")
        }, function() {
            $(this).removeClass("hover")
        });

        var $menu = $("#menu"),
            $menulink = $("#spinner-form"),
            $menuTriggercont = $(".spinner-master"),
            $menuTrigger = $(".has-submenu > a");
        $menulink.click(function(e) {
            $menulink.toggleClass("active");
            $menu.toggleClass("active");
            $menuTriggercont.toggleClass("active");
        });

        $menuTrigger.click(function(e) {
            e.preventDefault();
            var t = $(this);
            t.toggleClass("active").next("ul").toggleClass("active")
        });

        $(".mainmenu ul li:has(ul)");
        /* 
        =================================================================
        06 - Input Number JS
        =================================================================	
        */

        $(".num-in span").on("click", function() {
            var $input = $(this).parents('.num-block').find('input.in-num');
            if ($(this).hasClass('minus')) {
                var count = parseFloat($input.val()) - 1;
                count = count < 1 ? 1 : count;
                if (count < 2) {
                    $(this).addClass('dis');
                } else {
                    $(this).removeClass('dis');
                }
                $input.val(count);
            } else {
                var count = parseFloat($input.val()) + 1
                $input.val(count);
                if (count > 1) {
                    $(this).parents('.num-block').find(('.minus')).removeClass('dis');
                }
            }

            $input.change();
            event_input_quantity($input)

            return false;
        });

        /* 
        =================================================================
        07 - Tab Responsive JS
        =================================================================	
        */
        $.fn.tabConvert = function(options) {

            var settings = $.extend({
                activeClass: "active",
                screenSize: 575,
            }, options);

            return this.each(function(i) {
                var wrap = $(this).wrap('<div class="tab-to-dropdown"></div>'),
                    currentItem = $(this),
                    container = $(this).closest('.tab-to-dropdown'),
                    value = $(this).find('.' + settings.activeClass).text(),
                    toggler = '<div class="selected-tab">' + value + '</div>';
                currentItem.addClass('converted-tab');
                container.prepend(toggler);

                function tabConvert_toggle() {
                    currentItem.parent().find('.converted-tab').slideToggle();
                }

                container.find('.selected-tab').click(function() {
                    tabConvert_toggle();
                });

                currentItem.find('a').click(function(e) {
                    var windowWidth = window.innerWidth;
                    if (settings.screenSize >= windowWidth) {
                        tabConvert_toggle();
                        var selected_text = $(this).text();
                        $(this).closest('.tab-to-dropdown').find('.selected-tab').text(selected_text);
                    }
                });

                function resize_function() {
                    var windowWidth = window.innerWidth;
                    if (settings.screenSize >= windowWidth) {
                        currentItem.css('display', 'none');
                        currentItem.parent().find('.selected-tab').css('display', '');
                    } else {
                        currentItem.css('display', '');
                        currentItem.parent().find('.selected-tab').css('display', 'none');
                    }
                }
                resize_function();

                $(window).resize(function() {
                    resize_function();
                });

            });
        };

        $('.tabs').tabConvert({
            activeClass: "selected",
        });

        $('.menu_nav .nav-tabs').tabConvert({
            activeClass: "active",
            screenSize: 767,
        });

        /* 
		=================================================================
		08 - Email Setup JS
		=================================================================	
		*/

        $("#contact-form").on('submit', function(e) {
            e.preventDefault();

            //Get input field values from HTML form
            var user_name = $("input[name=name]").val();
            var user_email = $("input[name=email]").val();
            var user_subject = $("input[name=subject]").val();
            var user_message = $("textarea[name=message]").val();

            //Data to be sent to server
            var post_data;
            var output;
            post_data = {
                'user_name': user_name,
                'user_email': user_email,
                'user_subject': user_subject,
                'user_message': user_message
            };

            //Ajax post data to server
            $.post('assets/email/contact_form.php', post_data, function(response) {

                //Response server message
                if (response.type == 'error') {
                    output = '<div class="alert alert-danger"><i class="fa fa-exclamation" aria-hidden="true"></i><span class="notification-text">' + response.text + '</span></div>';
                } else {
                    output = '<div class="alert alert-info"><i class="fa fa-check" aria-hidden="true"></i><span class="notification-text">' + response.text + '</span></div>';

                    //If success clear inputs
                    $("input, textarea").val('');
                }

                $("#notification").html(output);

                $(".notification").delay(15000).queue(function(next) {
                    $(this).addClass("scale-out");
                    next();
                });
                $(".notification").on("click", function() {
                    $(this).addClass("scale-out");
                });

            }, 'json');
        });

        /* 
        =================================================================
        09 - Back To Top
        =================================================================	
        */
        if ($("body").length) {
            var btnUp = $('<div/>', {
                'class': 'btntoTop'
            });
            btnUp.appendTo('body');
            $(document).on('click', '.btntoTop', function() {
                $('html, body').animate({
                    scrollTop: 0
                }, 700);
            });
            $(window).on('scroll', function() {
                if ($(this).scrollTop() > 200) $('.btntoTop').addClass('active');
                else $('.btntoTop').removeClass('active');
            });
        }

    });

    /* 
=================================================================
09 - Scroll Magic Animation
=================================================================	
*/
    document.addEventListener('DOMContentLoaded', () => {
        let controller = new ScrollMagic.Controller();

        let timeline1 = new TimelineMax();
        timeline1
            .from(".scroll_pizza_1", 1, {
                x: "-200",
                y: "-50",
                ease: Linear.easeNone
            })
        let scene1 = new ScrollMagic.Scene({
                triggerElement: '.hero_area',
                duration: "300",
                offset: "200"
            })
            .setTween(timeline1)
            .addTo(controller);

        let timeline2 = new TimelineMax();
        timeline2
            .from(".scroll_pizza_2", 1, {
                x: "-230",
                y: "120",
                ease: Linear.easeNone
            })
        let scene2 = new ScrollMagic.Scene({
                triggerElement: '.hero_area',
                duration: "370",
                offset: "200"
            })
            .setTween(timeline2)
            .addTo(controller);

        let timeline3 = new TimelineMax();
        timeline3
            .from(".menu_pizza", 1, {
                y: "-500",
                ease: Linear.easeNone
            })
        let scene3 = new ScrollMagic.Scene({
                triggerElement: '.food_menu_area',
                duration: "100%",
                offset: "-500"
            })
            .setTween(timeline3)
            .addTo(controller);

        let timeline4 = new TimelineMax();
        timeline4
            .from(".double_fun_pizza", 1, {
                y: "500",
                ease: Linear.easeNone
            })
        let scene4 = new ScrollMagic.Scene({
                triggerElement: '.double_fun_area',
                duration: "100%",
                offset: "-300"
            })
            .setTween(timeline4)
            .addTo(controller);

        let timeline5 = new TimelineMax();
        timeline5
            .from(".delivery_left", 1, {
                x: "-300",
                ease: Linear.easeNone
            })
        let scene5 = new ScrollMagic.Scene({
                triggerElement: '.delivery_area',
                duration: "100%",
                offset: "-300"
            })
            .setTween(timeline5)
            .addTo(controller);


    })


}(jQuery));