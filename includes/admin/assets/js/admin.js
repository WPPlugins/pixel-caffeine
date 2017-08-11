/**
 * UI scripts for admin settings page
 */

jQuery(document).ready(function($){
    'use strict';

    var unsaved = false,
		dropdown_data = [],

		fragments = {
    		'fb_pixel_box': '.panel.panel-settings-set-fb-px',
    		'ca_list': '.panel.panel-ca-list',
    		'conversions_list': '.panel.panel-ce-tracking',
    		'sidebar': '.plugin-sidebar'
		},

		init_configs = function() {
			if ( $.fn.select2 ) {
				$.extend( $.fn.select2.defaults, {
					dropdownCssClass: 'adespresso-select2',
					containerCssClass: 'adespresso-select2',
					formatNoMatches: false
				} );
			}
		},

		addLoader = function( el ) {
			if ( typeof el.data('select2') !== 'undefined' ) {
				var select2 = el.data('select2'),
					select2container = select2.container;

				select2container.addClass( 'loading-data' );
			}

			else if ( el.is( 'div, form' ) ) {
				el.addClass( 'loading-data loading-box' );
			}

			else if ( el.is( 'a' ) ) {
				el.addClass( 'loading-data' );
			}
		},

		removeLoader = function( el ) {
			if ( typeof el.data('select2') !== 'undefined' ) {
				var select2 = el.data('select2'),
					select2container = select2.container;

				select2container.removeClass( 'loading-data' );
			}

			else if ( el.is( 'div, form' ) ) {
				el.removeClass( 'loading-data loading-box' );
			}

			else if ( el.is( 'a' ) ) {
				el.removeClass( 'loading-data' );
			}
		},

		removeMessage = function( el, type ) {
			if ( 'error' === type ) {
				type = 'danger';
			}

			if ( el.find( '.alert-' + type ).length ) {
				el.find( '.alert-' + type ).remove();
			}
		},

		addMessage = function( el, type, msg ) {
    		if ( 'error' === type ) {
    			type = 'danger';
			}

			removeMessage( el, type );

    		var msgWrap = $( '<div />', {
					class: 'alert alert-' + type + ' alert-dismissable',
					role: 'alert',
					html: msg
				}).prepend( $( '<button />', { type: 'button', class: 'close', "data-dismiss": 'alert', text: '×' } ) );

			el.prepend( msgWrap );
		},

		showCopyTooltip = function(elem, msg) {
			$( elem ).data({
				title: msg,
				placement: 'bottom'
			}).tooltip('show');
		},

		set_unsaved = function () {
			unsaved = true;
		},

		set_saved = function () {
			unsaved = false;
		},

		alert_unsaved = function() {
			$( '.wrap form' )

				.on('change', ':input:not(#date-range)', function(){
					set_unsaved();
				})

				// Prevent alert if user submitted form
				.on( 'submit', function() {
					set_saved();
				});

			window.onbeforeunload = function(){
				if ( unsaved ) {
					return aepc_admin.unsaved;
				}
			};
		},

        apply_autocomplete = function( el, data ) {
			el.select2({
				tags: data
			});
        },

		// Load the dropdown autocomplete suggestions from AJAX on page loading and then apply autocomplete into the dropdown
		load_dropdown_data = function( e ) {
			var context = $( typeof e !== 'undefined' ? e.currentTarget : document.body ),
			    loaders = [
					{ action: 'get_user_roles', dropdown: 'input.user-roles' },
					{ action: 'get_custom_fields', dropdown: 'input.custom-fields' },
					{ action: 'get_languages', dropdown: '#conditions_language' },
					{ action: 'get_device_types', dropdown: '#conditions_device_types' },
					{ action: 'get_categories', dropdown: '' },
					{ action: 'get_tags', dropdown: '' },
					{ action: 'get_posts', dropdown: '' },
					{ action: 'get_dpa_params', dropdown: '' },
					{ action: 'get_currencies', dropdown: '' }
				];

			$.each( loaders, function( index, loader ){
				if ( ! aepc_admin.actions.hasOwnProperty( loader.action ) ) {
					return;
				}

				// If already loaded data, simply apply autocomplete without make ajax request after
				if ( dropdown_data.hasOwnProperty( loader.action ) ) {
					if ( loader.dropdown !== '' ) {
						apply_autocomplete( context.find( loader.dropdown ), dropdown_data[ loader.action ] );
					}

					return;
				}

				// Create index, so if the function is triggered again before the ajax is complete, it doesn't call a new ajax call
				dropdown_data[ loader.action ] = [];

				$.ajax({
					url: aepc_admin.ajax_url,
					data: {
						action: aepc_admin.actions[ loader.action ].name,
						_wpnonce: aepc_admin.actions[ loader.action ].nonce
					},
					success: function( data ) {
						// Save data to avoid request again
						dropdown_data[ loader.action ] = data;
						if ( loader.dropdown !== '' ) {
							apply_autocomplete( context.find( loader.dropdown ), data );
						}
					},
					dataType: 'json'
				});
			});

			// Specific cases
			context.find('#taxonomy_key').on( 'change.data', function(){
				var tax = $(this).val().replace( 'tax_', '' );

				if ( dropdown_data.hasOwnProperty( 'get_categories' ) && dropdown_data.get_categories.hasOwnProperty( tax ) ) {
					apply_autocomplete( context.find( '#taxonomy_terms' ), dropdown_data.get_categories[ tax ] );
				}
			});

			// Specific cases
			context.find('#tag_key').on( 'change.data', function(){
				var tax = $(this).val().replace( 'tax_', '' );

				if ( dropdown_data.hasOwnProperty( 'get_tags' ) && dropdown_data.get_tags.hasOwnProperty( tax ) ) {
					apply_autocomplete( context.find( '#tag_terms' ), dropdown_data.get_tags[ tax ] );
				}
			});

			// Specific cases
			context.find('#pt_key').on( 'change.data', function(){
				var post_type = $(this).val();

				if ( dropdown_data.hasOwnProperty( 'get_posts' ) && dropdown_data.get_posts.hasOwnProperty( post_type ) ) {
					apply_autocomplete( context.find( '#pt_posts' ), dropdown_data.get_posts[ post_type ] );
				}
			});

			// Trigger specific cases on fields shown, when is surely loaded ajax requests
			context.find('#event_categories').on( 'change.data', function(){
				context.find('#taxonomy_key').trigger('change.data');
			});

			// Trigger specific cases on fields shown, when is surely loaded ajax requests
			context.find('#event_tax_post_tag').on( 'change.data', function(){
				context.find('#tag_key').trigger('change.data');
			});

			// Trigger specific cases on fields shown, when is surely loaded ajax requests
			context.find('#event_posts').on( 'change.data', function(){
				context.find('#pt_key').trigger('change.data');
			});

			// Trigger specific cases on fields shown, when is surely loaded ajax requests
			context.find('#event_pages').on( 'change.data', function(){
				if ( dropdown_data.hasOwnProperty( 'get_posts' ) && dropdown_data.get_posts.hasOwnProperty( 'page' ) ) {
					apply_autocomplete( context.find( '#pages' ), dropdown_data.get_posts.page );
				}
			});

			// Trigger specific cases on fields shown, when is surely loaded ajax requests
			context.find('#event_custom_fields').on( 'change.data', function(e){
				var keys = [{ id: '[[any]]', text: aepc_admin.filter_any }];

				// Add the custom fields already loaded via ajax
				keys = $.merge( keys, dropdown_data.get_custom_fields );

				context.find('#custom_field_keys option').remove();
				context.find('#custom_field_keys').append( $.map(keys, function(v, i){
					if ( '[[any]]' === v.id ) {
						v.text = '--- ' + v.text + ' ---';
					}
					return $('<option>', { val: v.id, text: v.text });
				}) );
			});

			// Add ability to write an option not present on list of select
			context.find('.js-ecommerce input').on( 'change.data', function(){
				context.find('#dpa_key')
					.select2({
						placeholder: aepc_admin.filter_custom_field_placeholder,
						searchInputPlaceholder: aepc_admin.filter_custom_field_placeholder,
						data: { results: dropdown_data.get_dpa_params },
						query: function (query) {
							var data = {
								results: dropdown_data.get_dpa_params
							};

							if ( '' !== query.term ) {
								data.results = $.merge( [{id: query.term, text: query.term}], data.results );
							}

							// Filter matched
							data.results = data.results.filter( function( term ){
								return query.matcher( query.term, term.text );
							});

							query.callback(data);
						}
					})

					// Select the val
					.select2( 'data', { id: context.find('#dpa_key').val(), text: context.find('#dpa_key').val() } )

					// Remove value if the key change
					.on( 'change', function() {
						context.find('#dpa_value').val('');
					} )

					// Avoid to add more times the same event when the user changes only event radio
					.off( 'change.dpa' )

					.on( 'change.dpa', function(){
						var key = $(this).val(),
							tags = [];

						if ( 'content_ids' === key ) {
							if ( dropdown_data.hasOwnProperty( 'get_posts' ) ) {

								// WooCommerce product ids
								if ( dropdown_data.get_posts.hasOwnProperty( 'product' ) ) {
									tags = dropdown_data.get_posts.product.concat( tags );
								}

								// EDD product ids
								if ( dropdown_data.get_posts.hasOwnProperty( 'download' ) ) {
									tags = dropdown_data.get_posts.download.concat( tags );
								}
							}
						}

						else if ( 'content_category' === key ) {
							if ( dropdown_data.hasOwnProperty( 'get_categories' ) ) {

								// WooCommerce product categories
								if ( dropdown_data.get_categories.hasOwnProperty( 'product_cat' ) ) {
									tags = dropdown_data.get_categories.product_cat.concat( tags );
								}

								// EDD product categories
								if ( dropdown_data.get_categories.hasOwnProperty( 'download_category' ) ) {
									tags = dropdown_data.get_categories.download_category.concat( tags );
								}
							}
						}

						else if ( 'content_type' === key ) {
							tags = [ 'product', 'product_group' ];
						}

						else if ( 'currency' === key ) {
							if ( dropdown_data.hasOwnProperty( 'get_currencies' ) ) {
								tags = dropdown_data.get_currencies.map( function( tag ) {
									var txt = document.createElement("textarea");
									txt.innerHTML = tag.text;
									tag.text = txt.value;
									return tag;
								} );
							}
						}

						// Remove "anything" item repeated
						tags = tags.filter( function( item, index ){
							return ! ( index !== 0 && item.id === '[[any]]' );
						});

						context.find('#dpa_value').select2({
							tags: tags
						});
					})

					.triggerHandler( 'change.dpa' );
			});
		},

		custom_dropdown = function() {
			$('select').select2({
				minimumResultsForSearch: 5
			});

			$('input.multi-tags').select2({
				tags:[]
			});

      $('select.dropdown-width-max').select2({
        minimumResultsForSearch: 5,
        dropdownCssClass: 'dropdown-width-max'
      });
		},

		bootstrap_components = function( e ) {
			var context = $( typeof e !== 'undefined' ? e.currentTarget : document );

			context.find('.collapse').collapse({toggle: false});

			context.find('[data-toggle="tooltip"]').tooltip();

			context.find('[data-toggle="popover"]').popover({
				container: '#wpbody .pixel-caffeine-wrapper' // If it is relative to page body the css doesn't work.
			});

			$.material.init();
		},

		bootstrap_init = function( e ) {
			var context = $( typeof e !== 'undefined' ? e.currentTarget : document );

			// Collapse for select
			context.find('select.js-collapse').on( 'change.bs', function(){
				var select = $(this),
					selected = select.find('option:selected');

				if ( ! context.find( selected.data('target') ).hasClass('in') ) {
					context.find( select.data('parent') ).find('.collapse').collapse('hide');
					context.find( selected.data('target') ).collapse('show');
				}
			}).trigger('change.bs');

			// Collapse for checkboxes
			context.find('input.js-collapse').on( 'change.bs', function(){
				var check = $(this),
					checked = check.filter(':checked');

				if ( ! context.find( checked.data('target') ).hasClass('in') ) {
					context.find( check.data('parent') ).find('.collapse').collapse('hide');
					context.find( checked.data('target') ).collapse('show');
				}
			}).trigger('change.bs');

			// Collapse out CA fields if event type select is changed
			context.find('#ca_event_type').on( 'change.bs', function(){
				context.find('.collapse-parameters').find('.collapse').collapse('hide');
				context.find('.js-collapse-events').find('input:checked').prop( 'checked', false );
			});

			bootstrap_components( e );
		},

		fields_components = function( e ) {
			var context = $( typeof e !== 'undefined' ? e.currentTarget : document.body );

			// Option dependencies
			context.find('select.js-dep').on( 'change', function(){
				var select = $(this),
					form = select.closest('form'),
					selected = select.val(),
					toggleDiv = select.attr('id'),
					ps = form.find('div[class*="' + toggleDiv + '"]'),
					p = form.find( '.' + toggleDiv + '-' + selected );

				ps.hide();

				if ( p.length ) {
					p.show();
				}
			}).trigger('change');

			// When input is inside of checkbox label, check automatically
			context.find('.control-wrap .checkbox .inline-text').on( 'focus', function(){
				$(this).siblings('input[type="checkbox"]').prop( 'checked', true ).trigger('change');
			});

			// For all checkbox options, put a class on own container to know if checked or unchecked, useful for the other siblings elements
			context.find('.control-wrap .checkbox input[type="checkbox"]').on( 'change', function(){
				var checkbox = $(this),
					checked = checkbox.is(':checked');

				checkbox
					.closest('div.checkbox')
					.removeClass('checked unchecked')
					.addClass( checked ? 'checked' : 'unchecked' )
					.find('input.inline-text')
					.prop( 'disabled', ! checked );
			}).trigger('change');

			// Toggle advanced data box
			context.find('.js-show-advanced-data').on( 'change.components', function(){
				var checkbox = $(this),
					form = checkbox.closest('form');

				// Show box
				form.find('div.advanced-data').collapse( checkbox.is(':checked') ? 'show' : 'hide' );
			}).trigger('change.components');

			// Toggle event parameters, depending by event select
			context.find('select#event_standard_events').on( 'change.components', function(){
				var select = $(this),
					form = select.closest('form'),
					fields = select.find('option:selected').data('fields');

				form.find('div.event-field').hide();

				$.each( fields.split(',').map( function(str) { return str.trim(); } ), function( index, field ) {
					form.find( 'div.event-field.' + field + '-field' ).show();
				});
			}).trigger('change.components');

			// Label below switches need to be saved
			context.find('input.js-switch-labeled-tosave').on( 'change.components', function(){
				var checkbox = $(this),
					status = checkbox.closest('.form-group').find('.text-status'),
					value = checkbox.is(':checked') ? 'yes' : 'no',
					togglebutton = checkbox.closest('.togglebutton'),
					original_value = checkbox.data('original-value');

				// Save the original status message in data to use if the change will be reverted
				if ( typeof status.data( 'original-status' ) === 'undefined' ) {
					status.data( 'original-status', status.clone() );
				}

				// Init
				if ( original_value !== value ) {
					if ( ! status.hasClass('text-status-pending') ) {
						togglebutton.addClass('pending');
					}
					status.addClass( 'text-status-pending' ).text( aepc_admin.switch_unsaved );
				} else {
					if ( ! $( status.data( 'original-status' ) ).hasClass('text-status-pending') ) {
						togglebutton.removeClass('pending');
					}
					status.replaceWith( status.data( 'original-status' ) );
				}
			}).trigger('change.components');

			// Label below switches
			context.find('input.js-switch-labeled').on( 'change.components', function(){
				var checkbox = $(this),
					switchStatus = checkbox.closest('.form-group').find('.text-status');

				// Change switch label
				switchStatus.removeClass('hide');
				if ( checkbox.is(':checked') ) {
					switchStatus.filter('.text-status-off').addClass('hide');
				} else {
					switchStatus.filter('.text-status-on').addClass('hide');
				}
			});

			var reindex_params = function() {
				context.find('div.js-custom-params').children('div').each(function(index){
					var div = $(this);

					div.find('input[type="text"]').each(function(){
						var input = $(this);

						input.attr('name', input.attr('name').replace( /\[[0-9]+\]/, '[' + index + ']' ) );
						input.attr('id', input.attr('id').replace( /_[0-9]+$/, '_' + index ) );
					});
				});
			};

			// Custom parameters option
			context.find('.js-add-custom-param').on( 'click', function(e){
				if ( typeof wp === 'undefined' ) {
					return e;
				}

				e.preventDefault();

				var paramsTmpl = wp.template( 'custom-params' ),
					divParameters = $(this).closest('div.js-custom-params'),
					index = parseInt( divParameters.children('div').length );

				if ( divParameters.find('.js-custom-param:last').length ) {
					divParameters.find('.js-custom-param:last').after( paramsTmpl( { index: index-1 } ) );
				} else {
					divParameters.prepend( paramsTmpl( { index: index-1 } ) );
				}
			});

			// Custom parameters delete action
			context.find('.js-custom-params').on( 'click', '.js-delete-custom-param', function(e){
				e.preventDefault();

				var button = $(this),
					modal = $('#modal-confirm-delete'),
					params = button.closest('.js-custom-param'),

					remove = function() {
						modal.modal('hide');
						params.remove();
						reindex_params();
					};

				// If any value is defined, remove without confirm
				if ( params.find('input[id^="event_custom_params_key"]').val() === '' && params.find('input[id^="event_custom_params_value"]').val() === '' ) {
					remove();

				// If some value is written inside inputs, confirm before to delete
				} else {

					modal

						// Show modal
						.modal('show')

						// confirm action
						.one('click', '.btn-ok', remove);
				}
			});

			// Set selected in the dropdown, if data-selected is defined
			context.find('select[data-selected]').each( function() {
				var select = $(this),
					selected = select.data('selected');

				select.data('selected', '').val( selected ).trigger('change');
			});

			// Set selected in the dropdown, if data-selected is defined
			context.find('select[data-selected]').each( function() {
				var select = $(this),
					selected = select.data('selected');

				select.val( selected ).trigger('change');
			});
		},

		ca_filter_adjust = function( form ) {
			var includeList = form.find('.js-include-filters'),
				excludeList = form.find('.js-exclude-filters'),
				filters = form.find('.js-ca-filters');

			// Hide the list if become empty
			if ( 0 === includeList.find('ul.list-filter').find('li').length ) {
				includeList.addClass('hide');
			} else {
				includeList.removeClass('hide');
			}
			if ( 0 === excludeList.find('ul.list-filter').find('li').length ) {
				excludeList.addClass('hide');
			} else {
				excludeList.removeClass('hide');
			}

			// Hide message feedback and show the list
			if ( includeList.hasClass('hide') && excludeList.hasClass('hide') ) {
				filters.find('div.no-filters-feedback').removeClass('hide');
			} else {
				filters.find('div.no-filters-feedback').addClass('hide');

				// Remove the AND operator from the first item of each list
				includeList.find('ul.list-filter').find('li:first').find('.filter-and').remove();
				excludeList.find('ul.list-filter').find('li:first').find('.filter-and').remove();
			}
		},

		ca_filter_form = function( e ){
			var modal = $(this),
				target = $( e.relatedTarget ),
				parentForm = target.closest('form');

			// Valid both add and edit
			modal.find( '#ca-filter-form' ).on( 'submit', function(e){
				e.preventDefault();

				var form = $(this),
					scope = form.data('scope'),
					filters = parentForm.find('.js-ca-filters'),
					filter_item = wp.template( 'ca-filter-item' ),
					main_condition = form.find('[name^="ca_rule[][main_condition]"]:checked' ),
					submitButton = form.find('button[type="submit"]'),
					submitButtonText = submitButton.text(),
					filter_list = filters.find( '.js-' + main_condition.val() + '-filters' ),
					fields =  main_condition
						.add( form.find('[name^="ca_rule[][event_type]"]') )
						.add( form.find('[name^="ca_rule[][event]"]:checked') )
						.add( form.find('.collapse-parameters .collapse.in').find('[name^="ca_rule[][conditions]"]') ),

					// Make an AJAX request to retrieve the statement to show
					add_filter = function( statement ){
						var hidden_fields = $('<div />'),
							index = 'add' === scope ? filters.find('li').length : target.closest('li').data('filter-id');

						// Remove feedback loader
						removeLoader( form );

						// Block and show error message if any event type is selected
						if ( !statement || 0 === statement.length ) {
							addMessage( form.find('.modal-body'), 'error', aepc_admin.filter_no_condition_error );
							submitButton.text( submitButtonText );
							return;
						}
						// Create all hidden fields with proper name
						fields.each( function(){
							var field = $(this),
								name = field.attr('name'),
								value = field.val();

							hidden_fields.append( $('<input />', {
								type: 'hidden',
								name: name.replace( '[]', '[' + index + ']' ),
								value: value
							}) );
						});

						// Apply template
						var itemTpl = filter_item({
							nfilters: filter_list.find('li').length - ( 'edit' === scope && $.contains( filter_list.get()[0], target.get()[0] ) ? 1 : 0 ),
							statement: statement,
							hidden_inputs: hidden_fields.html(),
							index: index
						});

						// Edit only if we are in edit mode and the element to edit is contained in the list of main_condition
						if ( 'edit' === scope && $.contains( filter_list.get()[0], target.get()[0] ) ) {
							target.closest('li').html( $( itemTpl ).html() );
						} else {
							filter_list.find('ul').append( itemTpl );

							// Remove the element target if we have to change list
							if ( 'edit' === scope && ! $.contains( filter_list.get()[0], target.get()[0] ) ) {
								target.closest('li').remove();
							}
						}

						// Show/hide lists when changed
						ca_filter_adjust( parentForm );

						// close modal
						form.closest('.modal').modal('hide');

						form.off( 'submit' );

					};

				// Remove some eventual error
				removeMessage( form.find('.modal-body'), 'error' );

				// Block and show error message if any event type is selected
				if ( form.find('.js-collapse-events input:checked').length === 0 ) {
					addMessage( form.find('.modal-body'), 'error', aepc_admin.filter_no_data_error );
					return;
				}

				// Add feedback loader
				addLoader( form );

				// Give feedback to user while ajax request run
				submitButton.text( aepc_admin.filter_saving );

				$.ajax({
					url: aepc_admin.ajax_url,
					method: 'GET',
					data: {
						filter: fields.serializeArray(),
						action: aepc_admin.actions.get_filter_statement.name,
						_wpnonce: aepc_admin.actions.get_filter_statement.nonce
					},
					success: add_filter,
					dataType: 'html'
				});
			});

		},

		ca_filter_actions = function( e ) {
			var context = $( typeof e !== 'undefined' ? e.currentTarget : document.body );

			context.find('.list-filter')

				// Delete filter
				.on( 'click', '.btn-delete', function(e) {
					e.preventDefault();

					var form = $(this).closest('form'),
						modal = $('#modal-confirm-delete'),
						itemToRemove = $(this).closest('li');

					modal

					// Show modal
						.modal('show', $(this))

						// confirm action
						.one( 'click', '.btn-ok', function() {
							modal.modal('hide');

							// Remove the item
							itemToRemove.remove();

							// Show/hide lists when changed
							ca_filter_adjust( form );
						});
				})

				// Edit filter
				.on( 'click', '.btn-edit', function(e) {
					e.preventDefault();

					var form = $(this).closest('form'),
						modal = $('#modal-ca-edit-filter'),
						itemToEdit = $(this).closest('li'),
						fields = itemToEdit.find('.hidden-fields input');

					modal

						// Compile form with data
						.on( 'modal-template-loaded', function( event ){
							var form = $(this).find('form');

							// Set main condition
							var main_condition = fields.filter('[name*="[main_condition]"]').val();
							form.find('input[name*="main_condition"][value="' + main_condition + '"]')
								.prop( 'checked', true )
								.closest('label')
								.addClass('active')
								.siblings()
								.removeClass('active');

							// Set event type
							var event_type = fields.filter('[name*="[event_type]"]').val(),
								event_type_field = form.find('select[name*="event_type"]').val( event_type );

							// Set event
							var event_name = fields.filter('[name*="[event]"]').val(),
								event_field = form.find('input[name*="event"][value="' + event_name + '"]').prop( 'checked', true );

							// Set conditions
							var conditions_wrap = form.find( event_field.data('target') ),
								condition_key = fields.filter('[name*="[conditions][0][key]"]').val(),
								condition_operator = fields.filter('[name*="[conditions][0][operator]"]').val(),
								condition_value = fields.filter('[name*="[conditions][0][value]"]').val();

							// Exception for custom fields select, because it will generate the options manually on load_dropdown_data function
							if ( conditions_wrap.find('[name*="[conditions][0][key]"]').is('#custom_field_keys') ) {
								conditions_wrap.find('#custom_field_keys').append( $('<option />', { val: condition_key, text: condition_key }) );
							}

							conditions_wrap.find('[name*="[conditions][0][key]"]').val( condition_key );
							conditions_wrap.find('[name*="[conditions][0][operator]"]').val( condition_operator );
							conditions_wrap.find('[name*="[conditions][0][value]"]').val( condition_value );
						})

						.one( 'show.bs.modal', function(){
							var form = $(this).find('form');

							form.find('[name*="event_type"]:checked').trigger('change.data');
							form.find('[name*="event"]:checked').trigger('change.data');
							form.find('.collapse.in [name*="[conditions][0][key]"]').trigger('change.data');
							form.find('.collapse.in [name*="[conditions][0][operator]"]').trigger('change.data');
							form.find('.collapse.in [name*="[conditions][0][value]"]').trigger('change.data');
						})

						.modal('show', $(this) );
				});
		},

		calc_distance_top = function( el ) {
			var scrollTop	  = $( window ).scrollTop(),
				elementOffset = $( el ).offset().top;

			return elementOffset - scrollTop;
		},

		analyzed_distance = function () {
			var distance = calc_distance_top( '.plugin-content' ),
				heightWP = parseFloat( $('.wp-toolbar').css('padding-top') ),
				alertWrap = $( '.alert-wrap' ),
				alertHeight = alertWrap.height(),
				alertGhost = $( '.alert-wrap-ghost' );

			if ( distance <= heightWP ) {
				if ( alertGhost.length === 0 ) {
					alertWrap
						.after('<div class="alert-wrap-ghost"></div>')
						.next('.alert-wrap-ghost').height(alertHeight);
				}
				alertWrap
					.addClass('alert-fixed')
					.css({ 'top': heightWP })
					.width( $('.plugin-content').width() );
			} else {
				alertWrap
					.removeClass('alert-fixed')
					.width('100%');
				alertGhost.remove();
			}
		},

		init_activity_chart = function() {
			var chartBox = $('#activity-chart');
			if ( chartBox.length ) {
				$.getJSON( aepc_admin.ajax_url + '?action=' + aepc_admin.actions.get_pixel_stats.name + '&_wpnonce=' + aepc_admin.actions.get_pixel_stats.nonce, function (stats) {
					if ( typeof stats.success !== 'undefined' && false === stats.success ) {
						addMessage( chartBox, 'info', stats.data[0].message );
						return;
					}

					var getTextWidth = function(text) {
						// re-use canvas object for better performance
						var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
						var context = canvas.getContext("2d");
						context.font = 'normal 12px sans-serif';
						var metrics = context.measureText(text);
						return metrics.width;
					};

					// Set default min range as soon as the chart is initialized
					var	defaultMinRangeDate = new Date();
					defaultMinRangeDate.setUTCDate( defaultMinRangeDate.getUTCDate() - 7 );
					defaultMinRangeDate.setUTCHours( 0, 0, 0, 0 );

					chartBox.highcharts( 'StockChart', {
						chart: {
							type: 'line'
						},

						title: {
							text: null
						},

						navigator: {
							enabled: true
						},

						rangeSelector : {
							enabled: false
						},

						plotOptions: {
							spline: {
								marker: {
									enabled: true
								}
							}
						},

						xAxis: {
							min: defaultMinRangeDate.getTime()
						},

						yAxis: {
							gridLineColor: "#F4F4F4"
						},

						series: [{
							name: 'Pixel fires',
							data: stats,
							dataGrouping: {
								approximation: 'sum',
								forced: true,
								units: [['day', [1]]]
							},
							pointInterval: 3600 * 1000 // one hour
						}]
					});

					chartBox.closest('.panel').find('select#date-range').select2({
						minimumResultsForSearch: 5,
						width: 'element'
					});

					// Set date range
					chartBox.closest('.panel').on( 'change.chart.range', 'select#date-range', function() {
						var chart = chartBox.highcharts(),
							range = $(this).val(),
							today = new Date(),
							yesterday = new Date();

						yesterday.setDate( today.getUTCDate() - 1 );

						if ( 'today' === range ) {
							chart.xAxis[0].setExtremes( today.setUTCHours( 0, 0, 0, 0 ), today.setUTCHours( 23, 59, 59, 999 ) );
							chart.xAxis[0].setDataGrouping({
								approximation: 'sum',
								forced: true,
								units: [['hour', [1]]]
							});
						}

						else if ( 'yesterday' === range ) {
							chart.xAxis[0].setExtremes( yesterday.setUTCHours( 0, 0, 0, 0 ), yesterday.setUTCHours( 23, 59, 59, 999 ) );
							chart.xAxis[0].setDataGrouping({
								approximation: 'sum',
								forced: true,
								units: [['hour', [1]]]
							});
						}

						else if ( 'last-7-days' === range ) {
							var last_7_days = yesterday;
							last_7_days.setDate( today.getUTCDate() - 7 );
							chart.xAxis[0].setExtremes( last_7_days.setUTCHours( 0, 0, 0, 0 ), today.setUTCHours( 23, 59, 59, 999 ) );
							chart.xAxis[0].setDataGrouping({
								approximation: 'sum',
								forced: true,
								units: [['day', [1]]]
							});
						}

						else if ( 'last-14-days' === range ) {
							var last_14_days = yesterday;
							last_14_days.setDate( today.getUTCDate() - 14 );
							chart.xAxis[0].setExtremes( last_14_days.setUTCHours( 0, 0, 0, 0 ), today.setUTCHours( 23, 59, 59, 999 ) );
							chart.xAxis[0].setDataGrouping({
								approximation: 'sum',
								forced: true,
								units: [['day', [1]]]
							});
						}
					});

				});
			}
		},

		load_facebook_options_box = function( e ){
			var context = typeof e !== 'undefined' ? $(this) : $( document.body ),  // it could be a modal
				account_ids = context.find('select#aepc_account_id'),
				pixel_ids = context.find('select#aepc_pixel_id'),
				saved_account_id = $('form#mainform').find('#aepc_account_id').val(),
				saved_pixel_id = $('form#mainform').find('#aepc_pixel_id').val(),

				populate_pixel_ids = function() {
					var account_id = account_ids.val() ? JSON.parse( account_ids.val() ).id : '';

					if ( ! dropdown_data.hasOwnProperty( 'get_pixel_ids' ) || ! dropdown_data.get_pixel_ids.hasOwnProperty( account_id ) ) {
						return;
					}

					var keys = $.merge( [{ id: '', text: '' }], dropdown_data.get_pixel_ids[ account_id ] );

					// Add placeholder if any value is present on dropdown
					if ( 1 === keys.length ) {
						keys[0].text = aepc_admin.fb_option_no_pixel;
						pixel_ids.prop( 'disabled', true );
					} else {
						pixel_ids.prop( 'disabled', false );
					}

					pixel_ids.find('option').remove();
					pixel_ids.append( $.map(keys, function(v, i){
						return $('<option>', { val: v.id, text: v.text, selected: v.id === saved_pixel_id });
					}) );

					// Select if there is only one option
					if ( pixel_ids.find('option').length === 2 ) {
						pixel_ids.find('option:eq(1)').prop('selected', true);
					}

					pixel_ids.val( pixel_ids.find('option:selected').val() ).trigger('change');
				},

				load_pixel_ids = function() {
					var account_id = account_ids.val() ? JSON.parse( account_ids.val() ).id : '';

					// Add loader feedback on select
					addLoader( pixel_ids );

					$.ajax({
						url: aepc_admin.ajax_url,
						data: {
							action: aepc_admin.actions.get_pixel_ids.name,
							_wpnonce: aepc_admin.actions.get_pixel_ids.nonce,
							account_id: account_id
						},
						success: function( data ) {
							// Save data to avoid request again
							if ( ! dropdown_data.hasOwnProperty( 'get_pixel_ids' ) ) {
								dropdown_data.get_pixel_ids = {};
							}
							dropdown_data.get_pixel_ids[ account_id ] = data;
							populate_pixel_ids();

							// Remove loader from select
							removeLoader( pixel_ids );
						},
						dataType: 'json'
					});
				},

				init_pixel_dropdown = function( e ) {
					if ( typeof e !== 'undefined' && e.hasOwnProperty( 'type' ) && 'change' === e.type ) {
						pixel_ids.val('').trigger('change');
						pixel_ids.find('option').remove();
					}

					if ( account_ids.val() ) {
						var account_id = account_ids.val() ? JSON.parse( account_ids.val() ).id : '';

						if ( ! dropdown_data.hasOwnProperty( 'get_pixel_ids' ) || ! dropdown_data.get_pixel_ids.hasOwnProperty( account_id ) ) {
							load_pixel_ids();
						} else {
							populate_pixel_ids();
						}
					}
				},

				populate_account_ids = function() {
					if ( ! dropdown_data.hasOwnProperty( 'get_account_ids' ) ) {
						return;
					}

					var keys = $.merge( [{ id: '', text: '' }], dropdown_data.get_account_ids );

					account_ids.find('option').remove();
					account_ids.append( $.map(keys, function(v, i){
						return $('<option>', { val: v.id, text: v.text, selected: v.id === saved_account_id });
					}) );

					account_ids.on( 'change', init_pixel_dropdown ).trigger('change');
				},

				load_account_ids = function() {

					// Add loader feedback on select
					addLoader( account_ids );

					$.ajax({
						url: aepc_admin.ajax_url,
						data: {
							action: aepc_admin.actions.get_account_ids.name,
							_wpnonce: aepc_admin.actions.get_account_ids.nonce
						},
						success: function( data ) {
							if ( false === data.success ) {
								addMessage( $('.js-options-group'), 'error', data.data );
								set_saved();
							}

							else {
								// Save data to avoid request again
								dropdown_data.get_account_ids = data;
								populate_account_ids();
							}

							// Remove loader from select
							removeLoader( account_ids );
						},
						dataType: 'json'
					});
				},

				init_account_dropdown = function() {
					if ( account_ids.length <= 0 ) {
						return;
					}

					if ( ! dropdown_data.hasOwnProperty( 'get_account_ids' ) ) {
						load_account_ids();
					} else {
						populate_account_ids();
					}
				};

			if ( saved_account_id && saved_pixel_id ) {
				var saved_account = JSON.parse( saved_account_id ),
					saved_pixel = JSON.parse( saved_pixel_id );

				account_ids.append( $('<option>', { val: saved_account_id, text: saved_account.name + ' (#' + saved_account.id + ')', selected: true }) ).trigger('change');
				pixel_ids.append( $('<option>', { val: saved_pixel_id, text: saved_pixel.name + ' (#' + saved_pixel.id + ')', selected: true }) ).trigger('change');
			}

			// Init dropdown, making ajax requests and loading options into selects
			init_account_dropdown();
			init_pixel_dropdown();

		},

		reloadFragment = function( fragment, args ) {
			if ( ! fragments.hasOwnProperty( fragment ) || ! aepc_admin.actions.hasOwnProperty( 'load_' + fragment ) ) {
				return;
			}

			var el = $( fragments[ fragment ] ),
				data = {
					action: aepc_admin.actions[ 'load_' + fragment ].name,
					_wpnonce: aepc_admin.actions[ 'load_' + fragment ].nonce
				};

			// Remove success messages
			if ( $.inArray( fragment, [ 'sidebar' ] ) < 0 ) {
				removeMessage( $('.plugin-content'), 'success' );
			}

			// add feedback loader
			addLoader( el );

			// Add query string from current url to data
			window.location.href.slice( window.location.href.indexOf('?') + 1 ).split('&').forEach( function( val ) {
				var qs = val.split('=');

				if ( $.inArray( qs[0], [ 'page', 'tab' ] ) ) {
					data[ qs[0] ] = qs[1];
				}
			});

			// Check if there is some custom arguments to add to the call data
			if ( typeof args !== 'undefined' ) {
				$.extend( data, args );
			}

			$.ajax({
				url: aepc_admin.ajax_url,
				data: data,
				success: function( response ) {

					if ( response.success ) {
						el.replaceWith( response.data.html );

						if ( response.data.hasOwnProperty( 'messages' ) && response.data.messages.hasOwnProperty( 'success' ) && response.data.messages.success.hasOwnProperty( 'main' ) ) {
							response.data.messages.success.main.forEach(function( message ) {
								addMessage( $('.plugin-content .alert-wrap'), 'success', message );
							});
						}

						// Reinit some components
						bootstrap_components();
						custom_dropdown();
						fields_components( { currentTarget: fragments[ fragment ] } );
						analyzed_distance();
					}

				},
				dataType: 'json'
			});
		};

	// Init configurations
	init_configs();

	// Activity box chart
	init_activity_chart();

	// Load the custom fields by AJAX
	load_dropdown_data();

	// Inizialization Bootstrap components
	bootstrap_init();

	// Apply custom dropdown
	custom_dropdown();

	// Load the account and pixel ids on facebook options dropdown, if the user is logged in but not configured
	load_facebook_options_box();

	// Inizialization Page components
	fields_components();

	// Initialize filter actions (edit and delete)
	ca_filter_actions();

	// Other delete modals
	$('.modal-confirm').on( 'show.bs.modal', function(e){
		var modal = $(this),
			deleteLink = e.hasOwnProperty('relatedTarget') ? $( e.relatedTarget ).attr('href') : '';

		if ( $.inArray( deleteLink, [ '', '#', '#_' ] ) < 0 ) {
			modal.one( 'click', '.btn-ok', function(e){
				e.preventDefault();

				var actions = {
						'fb-disconnect': 'fb_pixel_box',
						'ca-delete': 'ca_list',
						'conversion-delete': 'conversions_list'
					},
					action = deleteLink.match( new RegExp( 'action=(' + Object.keys( actions ).join('|') + ')(&|$)' ) );

				// Custom actions
				if ( action ) {

					addLoader( modal.find('.modal-content') );

					$.ajax({
						url: deleteLink + ( deleteLink.indexOf('?') ? '&' : '?' ) + 'ajax=1',
						method: 'GET',
						success: function( response ) {
							if ( response.success ) {

								$('.sec-overlay').removeClass('sec-overlay');
								$('.sub-panel-fb-connect.bumping').removeClass('bumping');

								reloadFragment( actions[ action[1] ] );

								// hide modal
								modal.modal('hide');

								// Remove feedback loader
								removeLoader( modal.find('.modal-content') );

								// Remove eventually fblogin if exists
								if ( window.history && window.history.pushState ) {
									var redirect_uri = window.location.href.replace( /(\?|\&)ref=fblogin/, '' );
									window.history.pushState( { path: redirect_uri }, '', redirect_uri) ;
								}
							}
						},
						dataType: 'json'
					});
				}

				else {
					modal.modal('hide');
					window.location = deleteLink;
				}
			});
		}
	});

	// Active status filter popup
	$('.js-new-filter-modal').on( 'click', '.js-main-condition > .js-condition', function(){
		var clicked = $(this),
			wrap = clicked.closest( '.js-main-condition' ),
			btns = wrap.find('.js-condition');

		btns.removeClass('active');
		clicked.addClass('active');
	});

	// Edit modals
	$('.js-form-modal')

		// Apply tdynamic template
		.on( 'show.bs.modal', function( event ){
			if ( typeof wp === 'undefined' ) {
				return event;
			}

			var modal = $(this),
				link = $( event.relatedTarget ),
				data = link.data('config'),
				formTmpl = wp.template( modal.attr('id') );

			modal.find('.modal-content').html( formTmpl( data ) );

			// Trigger event to hook somethings
			modal.trigger( 'modal-template-loaded' );
		})

		.on( 'show.bs.modal', bootstrap_init )
		.on( 'show.bs.modal', custom_dropdown )
		.on( 'show.bs.modal', load_dropdown_data )
		.on( 'show.bs.modal', fields_components )
		.on( 'show.bs.modal', ca_filter_form )
		.on( 'show.bs.modal', ca_filter_actions );

	// Submit form via AJAX
	$( document ).on( 'submit', 'form[data-toggle="ajax"]', function(e){
		e.preventDefault();

		var form = $(this),
			messageWrapper = form,
			submitButton = form.find('[type="submit"]'),
			submitText = submitButton.text(),
			formTopPosition = form.offset().top - 50;

		// Adjust message wrapper
		if ( form.find('.modal-body').length ) {
			messageWrapper = form.find('.modal-body').first();
		} else if ( form.find('.panel-body').length ) {
			messageWrapper = form.find('.panel-body').first();
		}

		// Remove all errors and change text of submit button
		removeMessage( messageWrapper, 'error' );
		form.find( '.has-error' ).removeClass('has-error');
		form.find( '.help-block-error' ).remove();

		// Add feedback loader
		addLoader( form );

		$.ajax({
			url: aepc_admin.ajax_url,
			method: 'POST',
			data: form.serialize(),
			success: function( response ) {
				if ( response.success ) {
					var modal_actions = {
							'fb-connect-options': 'fb_pixel_box',
							'ca-clone': 'ca_list',
							'ca-edit': 'ca_list',
							'conversion-edit': 'conversions_list'
						},
						modal_ids = Object.keys( modal_actions ).map( function( key ){ return '#modal-' + key; } ).join(','),

						form_actions = {};

					if ( form.closest( '.modal' ).length && form.closest('.modal').is( modal_ids ) ) {
						reloadFragment( modal_actions[ form.closest( '.modal' ).attr('id').replace('modal-', '') ] );

						// hide modal
						form.closest( '.modal' ).modal('hide');

						// Remove feedback loader
						removeLoader( form );

						// Remove eventually fblogin if exists
						if ( window.history && window.history.pushState ) {
							var redirect_uri = window.location.href.replace( /(\?|\&)ref=fblogin/, '' );
							window.history.pushState( { path: redirect_uri }, '', redirect_uri) ;
						}
					}

					else if ( Object.keys( form_actions ).indexOf( form.data('action') ) >= 0 )  {
						reloadFragment( form_actions[ form.data('action') ] );

						// Remove feedback loader
						removeLoader( form );
					}

					else {
						var action_uri = form.attr( 'action' );

						if ( action_uri ) {
							window.location.href = action_uri;
						} else {
							window.location.reload(false);
						}
					}
				}

				// Perform error
				else {

					// Add main notice
					if ( response.data.hasOwnProperty( 'refresh' ) && response.data.refresh ) {
						window.location.href = window.location.href.replace( /(\?|\&)ref=fblogin/, '' );
						return;
					}

					// Remove feedback loader
					removeLoader( form );

					// Scroll to form top
					$( 'html, body' ).animate( { scrollTop: formTopPosition }, 300 );

					// Reset text of submit button
					submitButton.text( submitText );

					// Add main notice
					if ( response.data.hasOwnProperty( 'main' ) ) {
						addMessage( messageWrapper, 'error', response.data.main.join( '<br/>' ) );
					}

					// Add error to each field
					form.find('input, select').each( function(){
						var field = $(this),
							field_id = field.attr('id'),
							formGroup = field.closest('.form-group'),
							fieldHelper = field.closest('.control-wrap').find('.field-helper');

						if ( response.data.hasOwnProperty( field_id ) ) {
							formGroup.addClass('has-error');
							fieldHelper.append( $('<span />', { class: 'help-block help-block-error', html: response.data[ field_id ].join( '<br/>' ) }) );
						}

						// Remove the error on change, because bootstrap material remove .has-error on keyup change events
						field.on( 'keyup change', function(){
							fieldHelper.find('.help-block-error').remove();
						});
					});
				}
			},
			dataType: 'json'
		});
	});

	// Alert position
	$( window )
		.on( 'load', analyzed_distance )
		.on( 'scroll', analyzed_distance )
		.on( 'resize', analyzed_distance );

	// Facebook options modal actions
	$( '#modal-fb-connect-options' )

		// Apply tdynamic template
		.on( 'show.bs.modal', function( event ){
			if ( typeof wp === 'undefined' ) {
				return event;
			}

			var modal = $(this),
				formTmpl = wp.template( 'modal-facebook-options' );

			modal.find('.modal-content').html( formTmpl( [] ) );

			// Trigger event to hook somethings
			modal.trigger( 'facebook-options-loaded' );
		})

		.on( 'show.bs.modal', bootstrap_init )
		.on( 'show.bs.modal', custom_dropdown )

		.on( 'show.bs.modal', load_facebook_options_box );

	// Facebook options save
	$( '.sub-panel-fb-connect' )

		.on( 'change', '#aepc_account_id', function() {
			var account_id = $(this).val(),
				pixel_id = $( '#aepc_pixel_id' ).val();

			if ( account_id && pixel_id ) {
				$('.js-save-facebook-options').removeClass('disabled');
			} else {
				$('.js-save-facebook-options').addClass('disabled');
			}
		})

		.on( 'change', '#aepc_pixel_id', function() {
			var account_id = $( '#aepc_account_id' ).val(),
				pixel_id = $(this).val();

			if ( account_id && pixel_id ) {
				$('.js-save-facebook-options').removeClass('disabled');
			} else {
				$('.js-save-facebook-options').addClass('disabled');
			}
		})

		.on( 'click', '.js-save-facebook-options:not(.disabled)', function(e) {
			var account_id = $( '#aepc_account_id' ).val(),
				pixel_id = $( '#aepc_pixel_id' ).val();

			$('.sec-overlay').removeClass('sec-overlay');
			$('.sub-panel-fb-connect.bumping').removeClass('bumping');

			addLoader( $( '.panel.panel-settings-set-fb-px' ) );

			$.ajax({
				url: aepc_admin.ajax_url,
				method: 'POST',
				data: {
					aepc_account_id: account_id,
					aepc_pixel_id: pixel_id,
					action: aepc_admin.actions.save_facebook_options.name,
					_wpnonce: aepc_admin.actions.save_facebook_options.nonce
				},
				success: function( response ) {

					if ( response.success ) {
						if ( window.history && window.history.pushState ) {
							var redirect_uri = window.location.href.replace( /(\?|\&)ref=fblogin/, '' );
							window.history.pushState( { path: redirect_uri }, '', redirect_uri) ;
						}

						reloadFragment( 'fb_pixel_box' );
						set_saved();
					}

				},
				dataType: 'json'
			});
		});

	// Custom audience sync action
	$('.wrap-custom-audiences').on('click', '.js-ca-size-sync', function(e){
		var button = $(this),
			ca_id = button.data('ca_id');

		// Remove eventually error messages
		removeMessage( $('.plugin-content .alert-wrap'), 'error' );

		addLoader( $('.panel.panel-ca-list') );
		button.addClass( 'loading-data' );

		$.ajax({
			url: aepc_admin.ajax_url,
			method: 'GET',
			data: {
				ca_id: ca_id,
				action: aepc_admin.actions.refresh_ca_size.name,
				_wpnonce: aepc_admin.actions.refresh_ca_size.nonce
			},
			success: function( response ) {
				if ( response.success ) {
					reloadFragment( 'ca_list' );
				} else {
					addMessage( $('.plugin-content .alert-wrap'), 'error', response.data.message );
				}
			},
			dataType: 'json'
		});
	});

	// Perform pagination in ajax
	$('.wrap').on( 'click', '.pagination li a', function(e){
		e.preventDefault();

		var link = $(this),
			uri = link.attr('href'),
			paged = uri.match( /paged=([0-9]+)/ );

		if ( $(this).closest( '.panel-ca-list' ).length ) {
			reloadFragment( 'ca_list', { paged: paged[1] } );
		} else if ( $(this).closest( '.panel-ce-tracking' ).length ) {
			reloadFragment( 'conversions_list', { paged: paged[1] } );
		}

		if ( window.history && window.history.pushState ) {
			window.history.pushState( { path: uri }, '', uri );
		}
	});

	// Load sidebar feed data
	if ( $('.plugin-sidebar.loading-sec').length ) {
		reloadFragment( 'sidebar' );
	}

	// HACK avoid scrolling problem when open a modal inside another one and then close the last modal
	var last_modal_opened = [];
	$('.modal')
		.on( 'show.bs.modal', function(e){
			last_modal_opened.push(e);
		})
		.on( 'hidden.bs.modal', function(e){
			if ( $( last_modal_opened[ last_modal_opened.length - 1 ].relatedTarget ).closest('.modal').length ) {
				$('body').addClass('modal-open');
				last_modal_opened.splice( last_modal_opened.length - 1, 1 );
			}
		});

	// Perform clear transient by ajax
	$('#aepc-clear-transients').on( 'click', function(e){
		e.preventDefault();

		var button = $(this);

		addLoader( button );

		$.ajax({
			url: aepc_admin.ajax_url,
			method: 'GET',
			data: {
				action: aepc_admin.actions.clear_transients.name,
				_wpnonce: aepc_admin.actions.clear_transients.nonce
			},
			success: function( response ) {
				removeLoader( button );

				if ( response.success ) {
					addMessage( $('.plugin-content .alert-wrap'), 'success', response.data.message );
				}
			},
			dataType: 'json'
		});
	});

	// Auto-check eCommerce tracking option when one of the events inside is checked
	$('.ecomm-conversions').find('input[type="checkbox"]').on('change', function(){
		var $enable_dpa_input = $('#aepc_enable_dpa');

		if ( ! $enable_dpa_input.is(':checked') ) {
			$enable_dpa_input.prop('checked', true).trigger('change');
		}
	});

	// Triggers change in all input fields including text type, must be run after all components init
	alert_unsaved();


});
