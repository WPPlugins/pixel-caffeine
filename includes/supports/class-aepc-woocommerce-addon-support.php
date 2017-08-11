<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * @class AEPC_Woocommerce_Addon_Support
 */
class AEPC_Woocommerce_Addon_Support extends AEPC_Addon_Factory {

	/**
	 * The slug of addon, useful to identify some common resources
	 *
	 * @var string
	 */
	protected $addon_slug = 'woocommerce';

	/**
	 * Store the name of addon. It doesn't need a translate.
	 *
	 * @var string
	 */
	protected $addon_name = 'WooCommerce';

	/**
	 * Store the main file of rthe plugin
	 *
	 * @var string
	 */
	protected $main_file = 'woocommerce/woocommerce.php';

	/**
	 * Store the URL of plugin website
	 *
	 * @var string
	 */
	protected $website_url = 'https://wordpress.org/plugins/woocommerce/';

	/**
	 * List of standard events supported for pixel firing by PHP (it's not included the events managed by JS)
	 *
	 * @var array
	 */
	protected $events_support = array( 'ViewContent', 'AddToCart', 'Purchase', 'InitiateCheckout', 'AddPaymentInfo', 'CompleteRegistration' );

	/**
	 * AEPC_Edd_Addon_Support constructor.
	 */
	public function __construct() {

	    // Hooks when pixel is enabled.
        add_filter( 'woocommerce_params', array( $this, 'add_currency_param' ) );
        add_action( 'woocommerce_after_shop_loop_item', array( $this, 'add_content_category_meta' ), 99 );
        add_action( 'woocommerce_registration_redirect', array( $this, 'save_registration_data' ), 5 );
	}

	/**
	 * Check if the plugin is active by checking the main function is existing
	 *
	 * @return bool
	 */
	public function is_active() {
		return function_exists( 'WC' );
	}

	/**
	 * Check if we are in a place to fire the ViewContent event
	 *
	 * @return bool
	 */
	protected function can_fire_view_content() {
		return is_product();
	}

	/**
	 * Check if we are in a place to fire the AddToCart event
	 *
	 * @return bool
	 */
	protected function can_fire_add_to_cart() {
		return ! empty( $_REQUEST['add-to-cart'] );
	}

	/**
	 * Check if we are in a place to fire the InitiateCheckout event
	 *
	 * @return bool
	 */
	protected function can_fire_initiate_checkout() {
		return is_checkout() && ! is_order_received_page();
	}

	/**
	 * Check if we are in a place to fire the Purchase event
	 *
	 * @return bool
	 */
	protected function can_fire_purchase() {
		return is_order_received_page();
	}

	/**
	 * Check if we are in a place to fire the CompleteRegistration event
	 *
	 * @return bool
	 */
	protected function can_fire_complete_registration() {
		return get_option( 'woocommerce_enable_myaccount_registration' ) === 'yes' && false !== WC()->session->get( 'aepc_complete_registration_data', false );
	}

	/**
	 * Get product info from single page for ViewContent event
	 *
	 * @return array
	 */
	protected function get_view_content_params() {
		$product = wc_get_product();
		$product_id = method_exists( $product, 'get_id' ) ? $product->get_id() : $product->id;

		if ( $product->is_type( 'variable' ) && AEPC_Track::can_use_product_group() ) {
			$children_id = method_exists( $product, 'get_visible_children' ) ? $product->get_visible_children() : $product->get_children('visible');

			foreach ( $children_id as &$child_id ) {
				$child_id = $this->maybe_sku( $child_id );
			}

			$params = array(
				'content_type' => 'product_group',
				'content_ids'  => $children_id,
			);

		} else {
			$params = array(
				'content_type' => 'product',
				'content_ids'  => array( $this->maybe_sku( $product_id ) ),
			);
		}

		$params['content_name'] = $this->get_product_name( $product );
		$params['content_category']  = AEPC_Pixel_Scripts::content_category_list( $product_id );
		$params['value'] = floatval( $product->get_price() );
		$params['currency'] = get_woocommerce_currency();

		return $params;
	}

	/**
	 * Get info from product when added to cart for AddToCart event
	 *
	 * @return array
	 */
	protected function get_add_to_cart_params() {
		$product = wc_get_product( intval( $_REQUEST['add-to-cart'] ) );
		$product_id = method_exists( $product, 'get_id' ) ? $product->get_id() : $product->id;

		return array(
			'content_type' => 'product',
			'content_ids'  => array( $this->maybe_sku( $product_id ) ),
			'content_category'  => AEPC_Pixel_Scripts::content_category_list( $product_id ),
			'value' => floatval( $product->get_price() ),
			'currency' => get_woocommerce_currency()
		);
	}

	/**
	 * Get info from checkout page for InitiateCheckout event
	 *
	 * @return array
	 */
	protected function get_initiate_checkout_params() {
		$product_ids = array();
		$num_items = 0;

		foreach ( WC()->cart->get_cart() as $cart_item_key => $values ) {
			$_product = $values['data'];
			$product_ids[] = $this->maybe_sku( method_exists( $_product, 'get_id' ) ? $_product->get_id() : $_product->id );
			$num_items += $values['quantity'];
		}

		// Order value
		$cart_total = WC()->cart->total;

		// Remove shipping costs
		if ( ! AEPC_Track::can_track_shipping_costs() ) {
			$cart_total -= WC()->cart->shipping_total;
		}

		return array(
			'content_type' => 'product',
			'content_ids' => $product_ids,
			'num_items' => $num_items,
			'value' => $cart_total,
			'currency' => get_woocommerce_currency()
		);
	}

	/**
	 * Get product info from purchase succeeded page for Purchase event
	 *
	 * @return array
	 */
	protected function get_purchase_params() {
		global $wp;

		$product_ids = array();
		$order = wc_get_order( $wp->query_vars['order-received'] );

		foreach ( $order->get_items() as $item_key => $item ) {
			$_product = is_object( $item ) ? $item->get_product() : $order->get_product_from_item( $item );
			$_product_id = method_exists( $_product, 'get_id' ) ? $_product->get_id() : $_product->id;

			if ( ! empty( $_product ) ) {
				$product_ids[] = $this->maybe_sku( $_product_id );
			} else {
				$product_ids[] = $item['product_id'];
			}
		}

		// Order value
		$order_value = $order->get_total();

		// Remove shipping costs
		if ( ! AEPC_Track::can_track_shipping_costs() ) {
			$order_value -= method_exists( $order, 'get_shipping_total' ) ? $order->get_shipping_total() : $order->get_total_shipping();
		}

		return array(
			'content_ids' => $product_ids,
			'content_type' => 'product',
			'value' => $order_value,
			'currency' => method_exists( $order, 'get_currency' ) ? $order->get_currency() : $order->get_order_currency()
		);
	}

	/**
	 * Save CompleteRegistration data event in session, becase of redirect after woo registration
	 */
	public function save_registration_data( $redirect ) {
	    if ( ! AEPC_Track::is_completeregistration_active() ) {
	        return $redirect;
        }

		$session_class = apply_filters( 'woocommerce_session_handler', 'WC_Session_Handler' );
		WC()->session = new $session_class();
		WC()->session->set( 'aepc_complete_registration_data', apply_filters( 'aepc_complete_registration', array() ) );

		// I had to hook into the filter for decide what URL use for redirect after registration. I need to pass it.
		return $redirect;
	}

	/**
	 * Get info from when a registration form is completed, such as signup for a service, for CompleteRegistration event
	 *
	 * @return array
	 */
	protected function get_complete_registration_params() {
		$params = WC()->session->get( 'aepc_complete_registration_data', false );

		// Delete session key
		unset( WC()->session->aepc_complete_registration_data );

		return $params;
	}

	/**
	 * Add currency value on params list on woocommerce localize
	 *
	 * @param $data
	 *
	 * @return array
	 */
	public function add_currency_param( $data ) {
		if ( ! function_exists('get_woocommerce_currency') || ! PixelCaffeine()->is_pixel_enabled() ) {
			return $data;
		}

		return array_merge( $data, array(
			'currency' => get_woocommerce_currency()
		) );
	}

	/**
	 * Add a meta info inside each product of loop, to have content_category for each product
	 */
	public function add_content_category_meta() {
	    if ( ! PixelCaffeine()->is_pixel_enabled() ) {
	        return;
        }

		$product = wc_get_product();
		$product_id = method_exists( $product, 'get_id' ) ? $product->get_id() : $product->id;
		?><span data-content_category="<?php echo esc_attr( wp_json_encode( AEPC_Pixel_Scripts::content_category_list( $product_id ) ) ) ?>" style="display:none;"></span><?php
	}

	/**
	 * Get the info about the customer
	 *
	 * @return array
	 */
	public function get_customer_info() {
		$user = wp_get_current_user();

		return array(
			'ph' => $user->billing_phone,
			'ct' => $user->billing_city,
			'st' => $user->billing_state,
			'zp' => $user->billing_postcode
		);
	}

	/**
	 * Returns SKU if exists, otherwise the product ID
	 *
	 * @return string|int
	 */
	protected function maybe_sku( $product_id ) {
		if ( $sku = get_post_meta( $product_id, '_sku', true ) ) {
			return $sku;
		}

		return $product_id;
	}

	/**
	 * Retrieve the product name
	 *
	 * @param int|WC_Product $product The ID of product or the product woo object where get its name.
	 *
	 * @return string
	 */
	public function get_product_name( $product ) {
		if ( ! is_object( $product ) ) {
			$product = wc_get_product( $product );
		}

		return $product->get_title();
	}

	/**
	 * Says if the product is of addon type
	 *
	 * @param int $product_id The product ID.
	 *
	 * @return bool
	 */
	public function is_product_of_this_addon( $product_id ) {
		return 'product' === get_post_type( $product_id );
	}

}
