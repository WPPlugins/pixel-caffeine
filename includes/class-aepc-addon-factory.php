<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * @class AEPC_Addon_Factory
 */
class AEPC_Addon_Factory {

	/**
	 * The slug of addon, useful to identify some common resources
	 *
	 * @var string
	 */
	protected $addon_slug = '';

	/**
	 * Store the name of addon. It doesn't need a translate.
	 *
	 * @var string
	 */
	protected $addon_name = '';

	/**
	 * Store the main file of the plugin
	 *
	 * @var string
	 */
	protected $main_file = '';

	/**
	 * Store the URL of plugin website
	 *
	 * @var string
	 */
	protected $website_url = '';

	/**
	 * List of standard events supported
	 *
	 * @var array
	 */
	protected $events_support = array();

	/**
	 * The path for the logo images
	 */
	const LOGO_IMG_PATH = 'includes/admin/assets/img/store-logo/';

	/**
	 * Returns the human name of addon to show somewhere
	 *
	 * @return string
	 */
	public function get_name() {
		return $this->addon_name;
	}

	/**
	 * Get the main file of addon
	 *
	 * @return string
	 */
	public function get_main_file() {
		return $this->main_file;
	}

	/**
	 * Returns the website URL, useful on frontend to link the user to the plugin website
	 *
	 * @return string
	 */
	public function get_website_url() {
		return $this->website_url;
	}

	/**
	 * Returns the URI of logo image to show on admin UI
	 *
	 * @return string
	 */
	public function get_logo_img() {
		return PixelCaffeine()->plugin_url() . '/' . self::LOGO_IMG_PATH . $this->addon_slug . '.png';
	}

	/**
	 * Dynamic Ads methods
	 */

	/**
	 * Check if the add on supports the event name passed in parameter, useful when the code should know what events
	 * must fire
	 *
	 * @param string $event_name The event name.
	 *
	 * @return bool
	 */
	public function supports_event( $event_name ) {
		return in_array( $event_name, $this->events_support, true );
	}

	/**
	 * Get the events supported by this addon
	 *
	 * @return array
	 */
	public function get_event_supported() {
		return $this->events_support;
	}

	/**
	 * Get the parameters to send with one of standard event
	 *
	 * @param string $event One of standard events by facebook, such 'ViewContent', 'AddToCart', so on.
	 *
	 * @return array
	 */
	public function get_parameters_for( $event ) {
		$event = strtolower( preg_replace( '/(?<!^)[A-Z]/', '_$0', $event ) );
		return call_user_func( array( $this, 'get_' . $event . '_params' ) );
	}

	/**
	 * Check if we are in a place to fire the event passed in parameter
	 *
	 * @param string $event One of standard events by facebook, such 'ViewContent', 'AddToCart', so on.
	 *
	 * @return bool
	 */
	public function can_fire( $event ) {
		$event = strtolower( preg_replace( '/(?<!^)[A-Z]/', '_$0', $event ) );
		return call_user_func( array( $this, 'can_fire_' . $event ) );
	}

	/**
	 * Check if we are in a place to fire the ViewContent event
	 *
	 * @return bool
	 */
	protected function can_fire_view_content() {
		return false;
	}

	/**
	 * Check if we are in a place to fire the AddToCart event
	 *
	 * @return bool
	 */
	protected function can_fire_add_to_cart() {
		return false;
	}

	/**
	 * Check if we are in a place to fire the InitiateCheckout event
	 *
	 * @return bool
	 */
	protected function can_fire_initiate_checkout() {
		return false;
	}

	/**
	 * Check if we are in a place to fire the AddPaymentInfo event
	 *
	 * @return bool
	 */
	protected function can_fire_add_payment_info() {
		return false;
	}

	/**
	 * Check if we are in a place to fire the Purchase event
	 *
	 * @return bool
	 */
	protected function can_fire_purchase() {
		return false;
	}

	/**
	 * Check if we are in a place to fire the AddToWishlist event
	 *
	 * @return bool
	 */
	protected function can_fire_add_to_wishlist() {
		return false;
	}

	/**
	 * Check if we are in a place to fire the Lead event
	 *
	 * @return bool
	 */
	protected function can_fire_lead() {
		return false;
	}

	/**
	 * Check if we are in a place to fire the CompleteRegistration event
	 *
	 * @return bool
	 */
	protected function can_fire_complete_registration() {
		return false;
	}

	/**
	 * Check if we are in a place to fire the Search event
	 *
	 * @return bool
	 */
	protected function can_fire_search() {
		return false;
	}

	/**
	 * Get product info from single page for ViewContent event
	 *
	 * @return array
	 */
	protected function get_view_content_params() {
		return array();
	}

	/**
	 * Get info from product when added to cart for AddToCart event
	 *
	 * @return array
	 */
	protected function get_add_to_cart_params() {
		return array();
	}

	/**
	 * Get info from checkout page for InitiateCheckout event
	 *
	 * @return array
	 */
	protected function get_initiate_checkout_params() {
		return array();
	}

	/**
	 * Get info from checkout page for AddPaymentInfo event
	 *
	 * @return array
	 */
	protected function get_add_payment_info_params() {
		return array();
	}

	/**
	 * Get product info from purchase succeeded page for Purchase event
	 *
	 * @return array
	 */
	protected function get_purchase_params() {
		return array();
	}

	/**
	 * Get info from product added to wishlist for AddToWishlist event
	 *
	 * @return array
	 */
	protected function get_add_to_wishlist_params() {
		return array();
	}

	/**
	 * Get info from lead of a sign up action for Lead event
	 *
	 * @return array
	 */
	protected function get_lead_params() {
		return array();
	}

	/**
	 * Get info from when a registration form is completed, such as signup for a service, for CompleteRegistration event
	 *
	 * @return array
	 */
	protected function get_complete_registration_params() {
		return array();
	}

	/**
	 * Get info a search of products is performed for Search event
	 *
	 * @return array
	 */
	protected function get_search_params() {
		return array();
	}

	/**
	 * Get the info about the customer
	 *
	 * @return array
	 */
	public function get_customer_info() {
		return array();
	}

	/**
	 * HELPERS
	 */

	/**
	 * Retrieve the product name
	 *
	 * @param int $product_id The ID of product where get its name.
	 *
	 * @return string
	 */
	public function get_product_name( $product_id ) {
		return $product_id;
	}

	/**
	 * Says if the product is of addon type
	 *
	 * @param int $product_id The product ID.
	 *
	 * @return bool
	 */
	public function is_product_of_this_addon( $product_id ) {
		return false;
	}
}
