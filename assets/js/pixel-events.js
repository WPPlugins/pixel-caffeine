/**
 * Handle all facebook events
 */

jQuery(document).ready(function($){
    'use strict';

    var body = $( document.body ),
		extendArgs = function( args ) {
			return aepc_extend_args( args );
		},
		delayTrack = function( cb, delay ) {
			if ( delay ) {
				setTimeout( cb, delay * 1000 );
			} else {
				cb();
			}
		};

    // Standard events
    if ( aepc_pixel_events.standard_events ) {
		$.each( aepc_pixel_events.standard_events, function (eventName, events) {
			$.each( events, function( index, data ){
				var track_cb = function() {
					if ( data.params ) {
						fbq('track', eventName, extendArgs( data.params ));
					} else {
						fbq('track', eventName);
					}
				};

				// Delay firing only except for below ones
				delayTrack( track_cb, data.delay );
			});
		});
    }

    // Custom events.
    if ( typeof aepc_pixel_events.custom_events !== 'undefined' ) {
        $.each(aepc_pixel_events.custom_events, function (eventName, events) {

			$.each( events, function( index, data ){
				var track_cb = function() {
					fbq('trackCustom', eventName, extendArgs( data.params ));
				};

				// Delay firing
				delayTrack( track_cb, data.delay );
			});

        });
    }

    // Conversions events for css selector
    if ( typeof aepc_pixel_events.css_events !== 'undefined' ) {
        $.each(aepc_pixel_events.css_events, function (selector, events) {

            $.each( events, function( index, event ){

                $( selector ).on( 'click', function() {
                    fbq( event.trackType, event.trackName, extendArgs( event.trackParams ));
                });

            });

        });
    }

    // Conversions events for link_click
    if ( typeof aepc_pixel_events.link_clicks !== 'undefined' ) {
        $.each(aepc_pixel_events.link_clicks, function (url, events) {
            url = url.replace( /\*/g, '[^/]+' );

            $( "a" ).filter(function() {
            	var href = $(this).attr('href');
                return typeof href !== 'undefined' && href.match( new RegExp( url ) );
            })

                .on( 'click', function(e) {
                    $.each( events, function( index, event ){
                        fbq( event.trackType, event.trackName, extendArgs( event.trackParams ));
                    });
                });

        });
    }

    // DYNAMIC ADS EVENTS

	// WooCommerce
	if ( body.hasClass('woocommerce-page') ) {

		// Add to cart from loop
		$('ul.products')
			.on('click', '.ajax_add_to_cart', function (e) {
				if ( 'no' === aepc_pixel.enable_addtocart ) {
					return e;
				}

				var anchor = $(this),
					product = anchor.closest('li.product'),
					product_id = anchor.data('product_sku') ? anchor.data('product_sku') : anchor.data('product_id');

				fbq('track', 'AddToCart', extendArgs({
					content_ids: [product_id],
					content_type: 'product',
					content_name: product.find('h3').text(),
					content_category: product.find('span[data-content_category]').data('content_category'),
					value: parseFloat(product.find('span.amount').clone().children().remove().end().text()), //OPTIONAL, but highly recommended
					currency: woocommerce_params.currency
				}));
			})

			// Add to wishlist.
			.on('click', '.add_to_wishlist, .wl-add-to', function(e) {
				if ( 'no' === aepc_pixel.enable_wishlist ) {
					return e;
				}

				var anchor = $(this),
					product = anchor.closest('li.product'),
					product_id = anchor.data('product_sku') ? anchor.data('product_sku') : anchor.data('product_id');

				fbq('track', 'AddToWishlist', extendArgs({
					content_ids: [product_id],
					content_type: 'product',
					content_name: product.find('h3').text(),
					content_category: product.find('span[data-content_category]').data('content_category'),
					value: parseFloat(product.find('span.amount').clone().children().remove().end().text()), //OPTIONAL, but highly recommended
					currency: woocommerce_params.currency
				}));
			});

		$('div.product')

		// Add to cart from single product page.
			.on( 'click', '.single_add_to_cart_button', function(e) {
				if ( aepc_pixel.enable_addtocart === 'yes' && wc_add_to_cart_params.cart_redirect_after_add === 'yes' ) {
					fbq('track', 'AddToCart', extendArgs( aepc_pixel_events.ViewContent ));
				}
			})

			// Add to wishlist from single product
			.on('click', '.add_to_wishlist, .wl-add-to', function(e){
				if ( 'no' === aepc_pixel.enable_wishlist ) {
					return e;
				}

				fbq('track', 'AddToWishlist', extendArgs( aepc_pixel_events.ViewContent ));
			});

		// AddPaymentInfo on checkout button click
		$('form.checkout').on('checkout_place_order', function(e){
			if ( 'no' === aepc_pixel.enable_addpaymentinfo ) {
				return e;
			}

			fbq('track', 'AddPaymentInfo', extendArgs({
				content_type: aepc_pixel_events.standard_events.InitiateCheckout[0].content_type,
				content_ids: aepc_pixel_events.standard_events.InitiateCheckout[0].content_ids,
				value: aepc_pixel_events.standard_events.InitiateCheckout[0].value,
				currency: aepc_pixel_events.standard_events.InitiateCheckout[0].currency
			}));

			return true;
		});

	}

	// Easy Digital Downloads
	if ( body.hasClass('edd-page') ) {

		// Add to cart from loop and single product page
		$('.edd_download_purchase_form').on( 'click', '.edd-add-to-cart', function(e){
			if ( 'no' === aepc_pixel.enable_addtocart ) {
				return e;
			}

			var button = $(this),
				product = button.closest('div.edd_download, article.type-download'),
				product_id = button.data('download-sku') ? button.data('download-sku') : button.data('download-id'),
				currency = product.find('meta[itemprop="priceCurrency"]').attr('content'),
				price = button.data('price'),
				is_variable = 'yes' === button.data('variable-price');

			// Retrieve price if variable
			if ( is_variable ) {
				var optionsWrapper = $('.edd_price_options'),
					checkedOption = optionsWrapper.find('input[type="radio"]:checked'),
					checkedOptionWrapper = checkedOption.closest('li');

				price = checkedOptionWrapper.find('meta[itemprop="price"]').attr('content');
				currency = checkedOptionWrapper.find('meta[itemprop="priceCurrency"]').attr('content');
			}

			fbq('track', 'AddToCart', extendArgs({
				content_ids: [product_id],
				content_type: 'product',
				content_name: product.find('[itemprop="name"]').first().text(),
				content_category: button.data('download-categories'),
				value: parseFloat( price ),
				currency: currency
			}));
		});

		// Checkout
		$('.edd-checkout').on( 'click', 'form#edd_purchase_form input[type="submit"]', function(e){
			if ( 'no' === aepc_pixel.enable_addpaymentinfo ) {
				return e;
			}

			fbq('track', 'AddPaymentInfo', extendArgs({
				content_type: aepc_pixel_events.standard_events.InitiateCheckout[0].content_type,
				content_ids: aepc_pixel_events.standard_events.InitiateCheckout[0].content_ids,
				value: aepc_pixel_events.standard_events.InitiateCheckout[0].value,
				currency: aepc_pixel_events.standard_events.InitiateCheckout[0].currency
			}));

			return true;
		});

	}

});
