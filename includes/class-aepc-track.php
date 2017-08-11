<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * This class should be called by each units when necessary, to register the event to track
 *
 * @class AEPC_Track
 * @static
 */
class AEPC_Track {

	static $standard_events = array(

		'ViewContent'          => 'value, currency, content_category, content_name, content_type, content_ids',
		'Search'               => 'value, currency, content_category, content_ids, search_string',
		'AddToCart'            => 'value, currency, content_name, content_type, content_ids',
		'AddToWishlist'        => 'value, currency, content_name, content_category, content_ids',
		'InitiateCheckout'     => 'value, currency, content_name, content_category, content_type, content_ids, num_items',
		'AddPaymentInfo'       => 'value, currency, content_category, content_ids',
		'Purchase'             => 'value, currency, content_name, content_type, content_ids, num_items',
		'Lead'                 => 'value, currency, content_name, content_category',
		'CompleteRegistration' => 'value, currency, content_name, status',
		'CustomEvent'          => 'value, currency, content_name, content_category, content_type, content_ids'

	);

	/**
	 * The list of all events to track, structured as fbq() function requests in javascript code
	 *
	 * @var array
	 */
	static $tracked = array(
		'track' => array(),
		'trackCustom' => array()
	);

	/**
	 * Save the tracking event request, used after to include the code
	 *
	 * @param string $event The event name. If it's not standard one, it automatically will be register among trackCustom
	 * @param array $args Standard parameters, one of registered for each standard events. If event is a custom one, automatically they will be custom parameters
	 * @param array $custom_params Custom additional parameters defined by user, if event is a standard one
	 * @param int|bool $delay Possible delay to postpone pixel firing on frontend
	 *
	 * @return string The track code if necessary
	 */
	public static function track( $event, $args = array(), $custom_params = array(), $delay = false ) {
		$event_params = array();

		// Standard event
		if ( self::is( 'standard', $event ) ) {
			foreach ( self::get_standard_event_fields( $event ) as $field ) {
				if ( ! empty( $args[ $field ] ) ) {
					$event_params[ $field ] = self::sanitize_field( $field, $args );
				}
			}
		}

		// Custom event
		else {
			if ( empty( $custom_params ) && ! empty( $args ) ) {
				$custom_params = array_filter( $args );
			} else {
				$event_params = array_filter( $args );
			}
		}

		// Manage custom parameters
		if ( ! empty( $custom_params ) ) {
			foreach ( $custom_params as $param_key => $param_value ) {
				if ( ! empty( $param_key ) && ! empty( $param_value ) ) {
					$event_params[ $param_key ] = $param_value;
				}
			}
		}

		// Set or detect delay from event name.
		if ( false === $delay ) {
			$delay = self::detect_delay_firing( $event );
		}

		/**
		 * Define placeholders to set dynamic values
		 *
		 * Save {{placeholder}} in the field text of the conversions/events form. The "placeholder" key you will use
		 * must be defined in a key of this array and then it will be translated in the value you set for that key.
		 */
		$placeholder_format = apply_filters( 'aepc_event_placeholder_format', '{{%s}}' );
		$placeholders = apply_filters( 'aepc_event_placeholders', array(), $event, $event_params );

		// Apply the placeholder format to the keys.
		foreach ( $placeholders as $key => $value ) {
			$placeholders[ sprintf( $placeholder_format, $key ) ] = $value;
			unset( $placeholders[ $key ] );
		}

		// Translate all placeholders in the params array.
		$event_params = json_decode( str_replace( array_keys( $placeholders ), array_values( $placeholders ), wp_json_encode( $event_params ) ), true );

		$track_type = self::get_track_type( $event );
		$track_data = array( 'params' => $event_params, 'delay' => $delay );

		// Register event track
		if ( ! isset( self::$tracked[ $track_type ][ $event ] ) ) {
			self::$tracked[ $track_type ][ $event ] = array( $track_data );
		} else {
			self::$tracked[ $track_type ][ $event ][] = $track_data;
		}

		return self::get_track_code( $event, count( self::$tracked[ $track_type ][ $event ] )-1 );

	}

	/**
	 * Remove a registered event
	 *
	 * @param $event
	 * @param int $index
	 */
	public static function remove_event( $event, $index = null ) {
		if ( is_null( $index ) ) {
			unset( self::$tracked[ self::get_track_type( $event ) ][ $event ] );
		}

		else {
			if ( 'last' === $index ) {
				$index = count( self::$tracked[ self::get_track_type( $event ) ][ $event ] )-1;
			}

			unset( self::$tracked[ self::get_track_type( $event ) ][ $event ][ $index ] );
		}

		// Completely remove event if it remains empty
		if ( empty( self::$tracked[ self::get_track_type( $event ) ][ $event ] ) ) {
			unset( self::$tracked[ self::get_track_type( $event ) ][ $event ] );
		} else {
			self::$tracked[ self::get_track_type( $event ) ][ $event ] = array_values( self::$tracked[ self::get_track_type( $event ) ][ $event ] );
		}
	}

	/**
	 * Return the tracked standard events
	 *
	 * @return array
	 */
	public static function get_standard_events() {
		return array_filter( self::$tracked['track'] );
	}

	/**
	 * Return the tracked standard events
	 *
	 * @return array
	 */
	public static function get_custom_events() {
		return array_filter( self::$tracked['trackCustom'] );
	}

	/**
	 * Clear all event tracked
	 */
	public static function reset_events() {
		self::$tracked = array(
			'track' => array(),
			'trackCustom' => array()
		);
	}

	/**
	 * Return 'track' or 'trackCustom', in base of event passed by parameter
	 *
	 * @param $track_name
	 *
	 * @return string
	 */
	public static function get_track_type( $track_name ) {
		return self::is( 'standard', $track_name ) ? 'track' : 'trackCustom';
	}

	/**
	 * Get track code formatted
	 *
	 * @param string $track_name The event name to track
	 * @param int $index The eventual index if there are many events to track for the same name
	 *
	 * @return string
	 */
	public static function get_track_code( $track_name = '', $index = 0 ) {
		$track_type = self::get_track_type( $track_name );
		$args = "aepc_extend_args(" . wp_json_encode( (object) self::$tracked[ $track_type ][ $track_name ][ $index ]['params'], JSON_PRETTY_PRINT ) . ")";

		return 'fbq(' . implode( ', ', array_filter( array(
			"'{$track_type}'",
			"'{$track_name}'",
			$args
		) ) ) . ');';
	}

	/**
	 * Get track URL
	 *
	 * @param string $track_name The event name to track
	 * @param int $index The eventual index if there are many events to track for the same name
	 *
	 * @return string
	 */
	public static function get_track_url( $track_name = '', $index = 0 ) {
		$track_type = self::get_track_type( $track_name );
		$args = self::$tracked[ $track_type ][ $track_name ][ $index ];
		$cd = '';

		// Structure the arguments list
		if ( ! empty( $args ) ) {
			foreach ( $args as $key => &$value ) {
				if ( is_array( $value ) ) {
					$value = json_encode( $value );
				}

				$value = "cd[{$key}]={$value}";
			}

			$cd = '&' . implode( '&', $args );
		}

		return sprintf( 'https://www.facebook.com/tr?id=%1$s&ev=%2$s%3$s&noscript=1', PixelCaffeine()->get_pixel_id(), $track_name, $cd );
	}

	/**
	 * Detect if the event in parameter is standard or custom one
	 *
	 * @param string $what One of 'standard' or 'custom'
	 * @param string $event Name of event
	 *
	 * @return bool
	 */
	public static function is( $what, $event ) {
		$match = $event != 'CustomEvent' && in_array( $event, array_keys( self::$standard_events ) );
		return 'standard' == $what ? $match : !$match;
	}

	/**
	 * Return a sanitized array with all fields allowed for the standard event
	 *
	 * @param string $track_name The event name
	 *
	 * @return array
	 */
	public static function get_standard_event_fields( $track_name ) {
		return isset( self::$standard_events[ $track_name ] ) ? array_map( 'trim', explode( ',', self::$standard_events[ $track_name ] ) ) : array();
	}

	/**
	 * Sanitize some values, for example force array for content_ids and also add cents to value if a currency is set
	 *
	 * @param string $field The field name to check
	 * @param array $args The list of all fields
	 *
	 * @return mixed
	 */
	public static function sanitize_field( $field, $args ) {
		// Currency
		if ( 'value' == $field && ! empty( $args['currency'] ) ) {
			$args[ $field ] = AEPC_Currency::get_amount( $args[ $field ], $args['currency'] );
		}

		// Content ids
		if ( 'content_ids' == $field && ! empty( $args[ $field ] ) && ! is_array( $args[ $field ] ) ) {
			$args[ $field ] = (array) array_map( 'trim', explode( ',', $args[ $field ] ) );
		}

		return $args[ $field ];
	}

	/**
	 * Sanitize all fields of an array with all parameters to use
	 *
	 * @param $params
	 *
	 * @return mixed
	 */
	public static function sanitize_fields( $params ) {
		foreach ( $params as $param_key => &$param_value ) {
			$param_value = self::sanitize_field( $param_key, $params );
		}

		return $params;
	}

	/**
	 * Get all conversion events saved on DB
	 */
	public static function get_conversions_events() {
		return get_option( 'aepc_conversions_events', array() );
	}

	/**
	 * Return if DAP events are active
	 *
	 * @return mixed|void
	 */
	public static function is_dpa_active() {
		return 'yes' === get_option( 'aepc_enable_dpa', 'no' );
	}

	/**
	 * Return if ViewContent events is active
	 *
	 * @return mixed|void
	 */
	public static function is_viewcontent_active() {
		return self::is_dpa_active() && 'yes' === get_option( 'aepc_enable_viewcontent', 'no' );
	}

	/**
	 * Return if Search events is active
	 *
	 * @return mixed|void
	 */
	public static function is_search_active() {
		return self::is_dpa_active() && 'yes' === get_option( 'aepc_enable_search', 'no' );
	}

	/**
	 * Return if AddToCart events is active
	 *
	 * @return mixed|void
	 */
	public static function is_addtocart_active() {
		return self::is_dpa_active() && 'yes' === get_option( 'aepc_enable_addtocart', 'no' );
	}

	/**
	 * Return if AddToWishlist events is active
	 *
	 * @return mixed|void
	 */
	public static function is_addtowishlist_active() {
		return self::is_dpa_active() && 'yes' === get_option( 'aepc_enable_addtowishlist', 'no' );
	}

	/**
	 * Return if InitiateCheckout events is active
	 *
	 * @return mixed|void
	 */
	public static function is_initiatecheckout_active() {
		return self::is_dpa_active() && 'yes' === get_option( 'aepc_enable_initiatecheckout', 'no' );
	}

	/**
	 * Return if AddPaymentInfo events is active
	 *
	 * @return mixed|void
	 */
	public static function is_addpaymentinfo_active() {
		return self::is_dpa_active() && 'yes' === get_option( 'aepc_enable_addpaymentinfo' , 'no');
	}

	/**
	 * Return if Purchase events is active
	 *
	 * @return mixed|void
	 */
	public static function is_purchase_active() {
		return self::is_dpa_active() && 'yes' === get_option( 'aepc_enable_purchase', 'no' );
	}

	/**
	 * Return if Purchase events is active
	 *
	 * @return mixed|void
	 */
	public static function is_completeregistration_active() {
		return self::is_dpa_active() && 'yes' === get_option( 'aepc_enable_completeregistration', 'no' );
	}

	/**
	 * Return if the Custom Audiences events are active
	 *
	 * @return mixed|void
	 */
	public static function is_ca_events_active() {
		return 'yes' === get_option( 'aepc_enable_ca_events', 'yes' );
	}

	/**
	 * Return if the Advanced events are active
	 *
	 * @return mixed|void
	 */
	public static function is_advanced_events_active() {
		return self::is_ca_events_active() && 'yes' === get_option( 'aepc_enable_advanced_events', 'yes' );
	}

	/**
	 * Return if the Taxonomy events are active
	 *
	 * @return mixed|void
	 */
	public static function is_taxonomy_events_active() {
		return self::is_ca_events_active() && 'yes' === get_option( 'aepc_enable_taxonomy_events', 'yes' );
	}

	/**
	 * Get the custom fields to track on advanced events
	 *
	 * @return array|mixed|void
	 */
	public static function get_custom_fields_to_track() {
		return self::is_ca_events_active() ? get_option( 'aepc_custom_fields_event', array() ) : array();
	}

	/**
	 * Check if pixel ID is in the right format
	 *
	 * @return bool
	 */
	public static function validate_pixel_id( $pixel_id ) {
		return (bool) ( empty( $pixel_id ) || preg_match( '/[0-9]{15}/', $pixel_id ) );
	}

	/**
	 * Return the delay to apply to pixel firing
	 *
	 * @param $event
	 *
	 * @return int
	 */
	public static function detect_delay_firing( $event ) {
		if ( 'yes' == get_option( 'aepc_enable_pixel_delay' ) && in_array( $event, array( 'PageView', 'ViewContent' ) ) ) {
			$delay = get_option( 'aepc_general_delay_firing', 0 );

		} elseif ( 'yes' == get_option( 'aepc_enable_advanced_pixel_delay' ) && in_array( $event, array( 'AdvancedEvents', 'CustomFields' ) ) ) {
			$delay = get_option( 'aepc_advanced_pixel_delay_firing', 0 );

		} else {
			$delay = 0;
		}

		return $delay;
	}

	/**
	 * Get if the user wants to track the shipping
	 */
	public static function can_track_shipping_costs() {
		return 'yes' === get_option( 'aepc_track_shipping_costs' );
	}

	/**
	 * Say if we can use 'product_group' as content_type for the variable product
	 */
	public static function can_use_product_group() {
		return 'no' === get_option( 'aepc_conversions_no_product_group', 'no' );
	}

}
