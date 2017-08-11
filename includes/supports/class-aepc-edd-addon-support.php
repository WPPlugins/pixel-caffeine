<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * @class AEPC_Edd_Addon_Support
 */
class AEPC_Edd_Addon_Support extends AEPC_Addon_Factory {

	/**
	 * The slug of addon, useful to identify some common resources
	 *
	 * @var string
	 */
	protected $addon_slug = 'edd';

	/**
	 * Store the name of addon. It doesn't need a translate.
	 *
	 * @var string
	 */
	protected $addon_name = 'Easy Digital Downloads';

	/**
	 * Store the main file of rthe plugin
	 *
	 * @var string
	 */
	protected $main_file = 'easy-digital-downloads/easy-digital-downloads.php';

	/**
	 * Store the URL of plugin website
	 *
	 * @var string
	 */
	protected $website_url = 'https://wordpress.org/plugins/easy-digital-downloads/';

	/**
	 * List of standard events supported for pixel firing by PHP (it's not included the events managed by JS)
	 *
	 * @var array
	 */
	protected $events_support = array( 'ViewContent', 'AddToCart', 'Purchase', 'AddPaymentInfo', 'InitiateCheckout' );

	/**
	 * AEPC_Edd_Addon_Support constructor.
	 */
	public function __construct() {

		// Hooks when pixel is enabled
		add_action( 'edd_post_add_to_cart', array( $this, 'save_to_fire_after_add_to_cart' ), 10, 3 );
		add_filter( 'edd_purchase_download_form', array( $this, 'add_category_and_sku_attributes' ), 10, 2 );
	}

	/**
	 * Check if the plugin is active by checking the main function is existing
	 *
	 * @return bool
	 */
	public function is_active() {
		return function_exists( 'EDD' );
	}

	/**
	 * Check if we are in a place to fire the ViewContent event
	 *
	 * @return bool
	 */
	protected function can_fire_view_content() {
		return is_singular( 'download' ) && is_main_query();
	}

	/**
	 * Check if we are in a place to fire the AddToCart event
	 *
	 * @return bool
	 */
	protected function can_fire_add_to_cart() {
		return false !== EDD()->session->get( 'add_to_cart_data' );
	}

	/**
	 * Check if we are in a place to fire the InitiateCheckout event
	 *
	 * @return bool
	 */
	protected function can_fire_initiate_checkout() {
		return edd_is_checkout();
	}

	/**
	 * Check if we are in a place to fire the Purchase event
	 *
	 * @return bool
	 */
	protected function can_fire_purchase() {
		return edd_is_success_page() && ! empty( $GLOBALS['edd_receipt_args']['id'] );
	}

	/**
	 * Get product info from single page for ViewContent event
	 *
	 * @return array
	 */
	protected function get_view_content_params() {
		$product_id = get_the_ID();

		if ( ! edd_has_variable_prices( $product_id ) ) {
			$price = edd_get_download_price( $product_id );
		} else {
			$price = edd_get_lowest_price_option( $product_id );
		}

		$params['content_name'] = $this->get_product_name( $product_id );
		$params['content_type'] = 'product';
		$params['content_ids'] = array( $this->maybe_sku( $product_id ) );
		$params['content_category']  = AEPC_Pixel_Scripts::content_category_list( $product_id, 'download_category' );
		$params['value'] = floatval( $price );
		$params['currency'] = edd_get_currency();

		return $params;
	}

	/**
	 * Save the data in session for the AddToCart pixel to fire.
	 *
	 * Because EDD after add to cart make a redirect, I cannot fire the pixel in the page are loading. So, the only way
	 * to fire the pixel is save the data to fire in the session and then after redirect read the session and fire the
	 * pixel if it founds the data saved in session.
	 *
	 * @param int $download_id
	 * @param array $options
	 * @param array $items
	 */
	public function save_to_fire_after_add_to_cart( $download_id, $options, $items ) {
		if ( defined( 'DOING_AJAX' ) && DOING_AJAX || ! PixelCaffeine()->is_pixel_enabled() || ! AEPC_Track::is_addtocart_active() ) {
			return;
		}

		$price = 0;

		// Calculate the total price.
		foreach ( $items as $item ) {
			$price += $this->get_price( $download_id, $item['options'] ) * $item['quantity'];
		}

		$data = array(
			'content_type' => 'product',
			'content_ids'  => array_map( array( $this, 'maybe_sku' ), wp_list_pluck( $items, 'id' ) ),
			'content_category'  => AEPC_Pixel_Scripts::content_category_list( $download_id, 'download_category' ),
			'value' => floatval( $price ),
			'currency' => edd_get_currency()
		);

		EDD()->session->set( 'add_to_cart_data', $data );
	}

	/**
	 * Get info from product when added to cart for AddToCart event
	 *
	 * @return array
	 */
	protected function get_add_to_cart_params() {
		$params = EDD()->session->get( 'add_to_cart_data' );

		// Remove the data to not fire again.
		EDD()->session->set( 'add_to_cart_data', false );

		return $params;
	}

	/**
	 * Get info from checkout page for InitiateCheckout event
	 *
	 * @return array
	 */
	protected function get_initiate_checkout_params() {
		$product_ids = array();
		$num_items = 0;
		$total = 0;

		foreach ( edd_get_cart_contents() as $cart_item ) {
			$product_id = $this->maybe_sku( intval( $cart_item['id'] ) );
			$num_items += $cart_item['quantity'];
			$product_ids[] = $product_id;
			$total += $this->get_price( $cart_item['id'], $cart_item['options'] ) * $cart_item['quantity'];
		}

		return array(
			'content_type' => 'product',
			'content_ids' => $product_ids,
			'num_items' => $num_items,
			'value' => floatval( $total ),
			'currency' => edd_get_currency()
		);
	}

	/**
	 * Get product info from purchase succeeded page for Purchase event
	 *
	 * @return array
	 */
	protected function get_purchase_params() {
		global $edd_receipt_args;

		$payment   = get_post( $edd_receipt_args['id'] );
		$payment_id = $payment->ID;
		$product_ids = array();

		if ( empty( $payment ) ) {
			return array();
		}

		$cart      = edd_get_payment_meta_cart_details( $payment_id, true );

		foreach ( (array) $cart as $key => $item ) {
			$product_ids[] = $this->maybe_sku( $item['id'] );
		}

		return array(
			'content_ids' => $product_ids,
			'content_type' => 'product',
			'value' => edd_get_payment_amount( $payment_id ),
			'currency' => edd_get_payment_currency_code( $payment_id ),
		);
	}

	/**
	 * Get the info about the customer
	 *
	 * @return array
	 */
	public function get_customer_info() {
		$user = wp_get_current_user();
		$address = $user->_edd_user_address;

		if ( empty( $address ) ) {
			return array();
		}

		return array(
			'ct' => $address['city'],
			'st' => $address['state'],
			'zp' => $address['zip'],
		);
	}

	/**
	 * Returns SKU if exists, otherwise the product ID
	 *
	 * @return string|int
	 */
	protected function maybe_sku( $product_id ) {
		if ( edd_use_skus() && ( $sku = get_post_meta( $product_id, 'edd_sku', true ) ) && ! empty( $sku ) ) {
			return $sku;
		}

		return $product_id;
	}

	/**
	 * Retrieve the price
	 *
	 * @param int   $download_id The download ID where get the price.
	 * @param array $options When the download have different price options, this array contains the price ID.
	 *
	 * @return float
	 */
	protected function get_price( $download_id, $options = array() ) {
		return isset( $options['price_id'] ) ? edd_get_price_option_amount( $download_id, $options['price_id'] ) : edd_get_download_price( $download_id );
	}

	/**
	 * Add the data attributes for SKU and categories, used for the events fired via javascript
	 *
	 * @param string $purchase_form HTML of the whole purchase form.
	 * @param array  $args Download arguments.
	 *
	 * @return string
	 */
	public function add_category_and_sku_attributes( $purchase_form, $args ) {
		if ( ! PixelCaffeine()->is_pixel_enabled() ) {
			return $purchase_form;
		}

		$product_id = $args['download_id'];
		$target = 'data-action="edd_add_to_cart" ';
		$atts = '';

		// SKU.
		if ( edd_use_skus() && $sku = get_post_meta( $product_id, 'edd_sku', true ) ) {
			$atts .= sprintf( 'data-download-sku="%s" ', esc_attr( $sku ) );
		}

		// Categories.
		$atts .= sprintf( 'data-download-categories="%s" ', esc_attr( wp_json_encode( AEPC_Pixel_Scripts::content_category_list( $product_id, 'download_category' ) ) ) );

		return str_replace( $target, $target . $atts, $purchase_form );
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
		return get_post_field( 'post_title', $product_id );
	}

	/**
	 * Says if the product is of addon type
	 *
	 * @param int $product_id The product ID.
	 *
	 * @return bool
	 */
	public function is_product_of_this_addon( $product_id ) {
		return 'download' === get_post_type( $product_id );
	}

}
