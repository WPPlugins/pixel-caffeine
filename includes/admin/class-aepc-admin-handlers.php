<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * @class AEPC_Admin_Handlers
 */
class AEPC_Admin_Handlers {

	/**
	 * AEPC_Admin_Handlers Constructor.
	 */
	public static function init() {
		add_action( 'admin_init', array( __CLASS__, 'admin_hooks' ) );
	}

	/**
	 * Hook actions on admin_init
	 */
	public static function admin_hooks() {
		// Fb connect/disconnect - Must be run before connect of Facebook adapter
		add_action( 'load-' . AEPC_Admin_Menu::$hook_page, array( __CLASS__, 'pixel_disconnect' ), 4 );
		add_action( 'load-' . AEPC_Admin_Menu::$hook_page, array( __CLASS__, 'save_facebook_options' ), 4 );

		// Conversions/events
		add_action( 'load-' . AEPC_Admin_Menu::$hook_page, array( __CLASS__, 'save_settings' ), 5 );
		add_action( 'load-' . AEPC_Admin_Menu::$hook_page, array( __CLASS__, 'save_events' ), 5 );
		add_action( 'load-' . AEPC_Admin_Menu::$hook_page, array( __CLASS__, 'edit_event' ), 5 );
		add_action( 'load-' . AEPC_Admin_Menu::$hook_page, array( __CLASS__, 'delete_event' ), 5 );

		// CA management
		add_action( 'load-' . AEPC_Admin_Menu::$hook_page, array( __CLASS__, 'save_audience' ), 5 );
		add_action( 'load-' . AEPC_Admin_Menu::$hook_page, array( __CLASS__, 'edit_audience' ), 5 );
		add_action( 'load-' . AEPC_Admin_Menu::$hook_page, array( __CLASS__, 'duplicate_audience' ), 5 );
		add_action( 'load-' . AEPC_Admin_Menu::$hook_page, array( __CLASS__, 'delete_audience' ), 5 );

		// Tools
		add_action( 'load-' . AEPC_Admin_Menu::$hook_page, array( __CLASS__, 'clear_transients' ), 5 );
	}

	/**
	 * Simply delete the option saved with pixel ID
	 */
	public static function pixel_disconnect() {
		$screen = get_current_screen();

		if (
			empty( $screen->id )
			|| AEPC_Admin_Menu::$hook_page != $screen->id
			|| empty( $_GET['action'] )
			|| 'pixel-disconnect' != $_GET['action']
			|| empty( $_GET['_wpnonce'] )
			|| ! current_user_can( 'manage_ads' )
			|| ! wp_verify_nonce( $_GET['_wpnonce'], 'pixel_disconnect' )
		) {
			return;
		}

		// Delete the option
		delete_option( 'aepc_pixel_id' );

		// Send success notice
		AEPC_Admin_Notices::add_notice( 'success', 'main', __( 'Pixel ID disconnected.', 'pixel-caffeine' ) );

		// If all good, redirect in the same page
		self::redirect_to( remove_query_arg( array( 'action', '_wpnonce' ) ) );
	}

	/**
	 * Save the account id and pixel id
	 *
	 * @return bool
	 */
	public static function save_facebook_options() {
		if (
			empty( $_POST['action'] )
			|| 'aepc_save_facebook_options' != $_POST['action']
			|| ! current_user_can( 'manage_ads' )
			|| empty( $_POST['_wpnonce'] )
			|| ! wp_verify_nonce( $_POST['_wpnonce'], 'save_facebook_options' )
		) {
			return false;
		}

		try {

			if ( empty( $_POST['aepc_account_id'] ) ) {
				AEPC_Admin_Notices::add_notice( 'error', 'account_id', __( 'Set the account ID', 'pixel-caffeine' ) );
			}

			if ( empty( $_POST['aepc_pixel_id'] ) ) {
				AEPC_Admin_Notices::add_notice( 'error', 'pixel_id', __( 'Set the pixel ID', 'pixel-caffeine' ) );
			}

			if ( AEPC_Admin_Notices::has_notice( 'error' ) ) {
				throw new Exception();
			}

			AEPC_Admin::save_facebook_options( stripslashes_deep( $_POST ) );

			// Send success notice
			AEPC_Admin_Notices::add_notice( 'success', 'main', __( 'Facebook Ad Account connected successfully.', 'pixel-caffeine' ) );

			// If all good, redirect in the same page
			if ( ! defined( 'DOING_AJAX' ) || ! DOING_AJAX ) {
				self::redirect_to( remove_query_arg( 'ref' ) );
			}

			return true;
		}

		catch( Exception $e ) {
			AEPC_Admin_Notices::add_notice( 'error', 'main', __( 'Please, check again all fields value.', 'pixel-caffeine' ) );
		}

		return false;
	}

	/**
	 * General method for all standard settings, defined on "settings" directory, triggered when a page form is submitted
	 */
	public static function save_settings() {
		$screen = get_current_screen();

		if (
			empty( $screen->id )
			|| AEPC_Admin_Menu::$hook_page != $screen->id
			|| ! current_user_can( 'manage_ads' )
			|| empty( $_POST )
			|| empty( $_POST['_wpnonce'] )
			|| ! wp_verify_nonce( $_POST['_wpnonce'], 'save_general_settings' )
		) {
			return;
		}

		try {

			// Save
			AEPC_Admin::save_settings( wp_unslash( $_POST ) );

			// Send success notice
			AEPC_Admin_Notices::add_notice( 'success', 'main', __( 'Settings saved properly.', 'pixel-caffeine' ) );

			// If all good, redirect in the same page
			self::redirect_to( remove_query_arg( 'ref' ) );
		}

		catch( Exception $e ) {
			AEPC_Admin_Notices::add_notice( 'error', 'main', __( 'Please, check again all fields value.', 'pixel-caffeine' ) );
		}
	}

	/**
	 * Save the conversions events added by user in admin page
	 *
	 * @return bool
	 */
	public static function save_events() {
		if (
			empty( $_POST )
			|| empty( $_POST['action'] )
			|| $_POST['action'] != 'aepc_save_tracking_conversion'
			|| ! current_user_can( 'manage_ads' )
			|| empty( $_POST['_wpnonce'] )
			|| ! wp_verify_nonce( $_POST['_wpnonce'], 'save_tracking_conversion' )
		) {
			return false;
		}

		try {

			// Save events
			AEPC_Admin::save_events( wp_unslash( $_POST ) );

			// Send success notice
			AEPC_Admin_Notices::add_notice( 'success', 'main', sprintf( __( '<strong>Conversion event added properly!</strong> Follow the instructions on %sthis link%s to verify if the pixel tracking event you added works properly.', 'pixel-caffeine' ), '<a href="https://developers.facebook.com/docs/facebook-pixel/using-the-pixel#verify">', '</a>' ) );

			return true;
		}

		catch ( Exception $e ) {
			AEPC_Admin_Notices::add_notice( 'error', 'main', $e->getMessage() );
			return false;
		}
	}

	/**
	 * Edit a conversion event
	 *
	 * @return bool
	 */
	public static function edit_event() {
		if (
			empty( $_POST )
			|| empty( $_POST['action'] )
			|| $_POST['action'] != 'aepc_edit_tracking_conversion'
			|| ! isset( $_POST['event_id'] )
			|| ! current_user_can( 'manage_ads' )
			|| empty( $_POST['_wpnonce'] )
			|| ! wp_verify_nonce( $_POST['_wpnonce'], 'edit_tracking_conversion' )
		) {
			return false;
		}

		try {

			// Edit event
			AEPC_Admin::edit_event( wp_unslash( $_POST ) );

			// Send success notice
			AEPC_Admin_Notices::add_notice( 'success', 'main', __( 'Conversion changed successfully.', 'pixel-caffeine' ) );

			return true;
		}

		catch ( Exception $e ) {
			AEPC_Admin_Notices::add_notice( 'error', 'main', $e->getMessage() );
			return false;
		}
	}

	/**
	 * Delete conversion event
	 */
	public static function delete_event() {
		$screen = get_current_screen();

		if (
			empty( $screen->id )
			|| AEPC_Admin_Menu::$hook_page != $screen->id
			|| ! current_user_can( 'manage_ads' )
			|| empty( $_GET['_wpnonce'] )
			|| ! wp_verify_nonce( $_GET['_wpnonce'], 'delete_tracking_conversion' )
		) {
			return;
		}

		// Delete event
		AEPC_Admin::delete_event( intval( $_GET['id'] ) );

		// Send success notice
		AEPC_Admin_Notices::add_notice( 'success', 'main', __( 'Configuration removed properly!!', 'pixel-caffeine' ) );

		// Redirect to the same page
		self::redirect_to( remove_query_arg( array( 'id', '_wpnonce' ) ) );
	}

	/**
	 * CA MAnagement
	 */

	/**
	 * Add new custom audience
	 *
	 * @return bool
	 */
	public static function save_audience() {
		if (
			empty( $_POST['action'] )
			|| $_POST['action'] != 'aepc_add_custom_audience'
			|| ! current_user_can( 'manage_ads' )
			|| empty( $_POST['_wpnonce'] )
			|| ! wp_verify_nonce( $_POST['_wpnonce'], 'add_custom_audience' )
		) {
			return false;
		}

		try {

			// Save custom audience
			AEPC_Admin_CA_Manager::save( wp_unslash( $_POST ) );

			// Send success notice
			AEPC_Admin_Notices::add_notice( 'success', 'main', sprintf( __( '<strong>New custom audience added!</strong> You will find this new custom audience also in %syour facebook ad account%s.', 'pixel-caffeine' ), '<a href="https://www.facebook.com/ads/manager/audiences/manage/?act=' . AEPC_Admin::$api->get_account_id() . '" target="_blank">', '</a>' ) );

			// If all good, redirect in the same page
			if ( ! defined( 'DOING_AJAX' ) || ! DOING_AJAX ) {
				self::redirect_to( remove_query_arg( 'paged' ) );
			}

			return true;
		}

		catch ( Exception $e ) {
			AEPC_Admin_Notices::add_notice( 'error', 'main', $e->getMessage() );
		}

		return false;
	}

	/**
	 * Edit a conversion event
	 *
	 * @return bool
	 */
	public static function edit_audience() {
		if (
			! isset( $_POST['ca_id'] )
			|| empty( $_POST['action'] )
			|| $_POST['action'] != 'aepc_edit_custom_audience'
			|| ! current_user_can( 'manage_ads' )
			|| empty( $_POST['_wpnonce'] )
			|| ! wp_verify_nonce( $_POST['_wpnonce'], 'edit_custom_audience' )
		) {
			return false;
		}

		try {

			// Edit event
			AEPC_Admin_CA_Manager::edit( wp_unslash( $_POST ) );

			// Send success notice
			AEPC_Admin_Notices::add_notice( 'success', 'main', __( 'Custom audience changed successfully.', 'pixel-caffeine' ) );

			// Redirect to the same page
			if ( ! defined( 'DOING_AJAX' ) || ! DOING_AJAX ) {
				self::redirect_to( add_query_arg( null, null ) );
			}

			return true;
		}

		catch ( Exception $e ) {
			AEPC_Admin_Notices::add_notice( 'error', 'main', $e->getMessage() );
		}

		return false;
	}

	/**
	 * Duplicate custom audience event
	 *
	 * @return bool
	 */
	public static function duplicate_audience() {
		if (
			empty( $_POST['action'] )
			|| 'aepc_duplicate_custom_audience' != $_POST['action']
			|| ! current_user_can( 'manage_ads' )
			|| empty( $_POST['_wpnonce'] )
			|| ! wp_verify_nonce( $_POST['_wpnonce'], 'duplicate_custom_audience' )
		) {
			return false;
		}

		try {

			// Delete event
			AEPC_Admin_CA_Manager::duplicate( wp_unslash( $_POST ) );

			// Send success notice
			AEPC_Admin_Notices::add_notice( 'success', 'main', __( '<strong>Custom audience duplicated</strong> It is duplicated also on your facebook Ad account.', 'pixel-caffeine' ) );

			// Redirect to the same page
			if ( ! defined( 'DOING_AJAX' ) || ! DOING_AJAX ) {
				self::redirect_to( add_query_arg( null, null ) );
			}

			return true;
		}

		catch ( Exception $e ) {
			AEPC_Admin_Notices::add_notice( 'error', 'main', $e->getMessage() );

			return false;
		}
	}

	/**
	 * Delete custom audience event
	 */
	public static function delete_audience() {
		$screen = get_current_screen();

		if (
			empty( $screen->id )
			|| AEPC_Admin_Menu::$hook_page != $screen->id
			|| ! current_user_can( 'manage_ads' )
			|| empty( $_GET['_wpnonce'] )
			|| ! wp_verify_nonce( $_GET['_wpnonce'], 'delete_custom_audience' )
			|| empty( $_GET['id'] )
		) {
			return;
		}

		try {
			// Delete event
			AEPC_Admin_CA_Manager::delete( intval( $_GET['id'] ) );

			// Send success notice
			AEPC_Admin_Notices::add_notice( 'success', 'main', __( '<strong>Custom audience removed</strong> It was removed also on your facebook Ad account.', 'pixel-caffeine' ) );
		}

		catch ( Exception $e ) {
			AEPC_Admin_Notices::add_notice( 'error', 'main', '<strong>' . __( 'Unable to delete', 'pixel-caffeine' ) . '</strong> ' . $e->getMessage() );
		}

		// Redirect to the same page
		self::redirect_to( remove_query_arg( array( 'id', '_wpnonce' ) ) );
	}

	/**
	 * Clear transients used for facebook api requests
	 */
	public static function clear_transients() {
		if (
			empty( $_GET['action'] )
			|| 'aepc_clear_transients' != $_GET['action']
			|| ! current_user_can( 'manage_ads' )
			|| empty( $_GET['_wpnonce'] )
			|| ! wp_verify_nonce( $_GET['_wpnonce'], 'clear_transients' )
		) {
			return;
		}

		// Clear the transients
		AEPC_Admin::clear_transients();

		// Redirect to the same page
		self::redirect_to( remove_query_arg( array( 'action', '_wpnonce' ) ) );
	}

	/**
	 * Used on requests, to redirect to a page after endi request
	 *
	 * @param $to
	 */
	protected static function redirect_to( $to ) {
		if ( defined( 'DOING_AJAX' ) && DOING_AJAX || isset( $_GET['ajax'] ) && 1 == $_GET['ajax'] ) {
			wp_send_json_success();
		}

		wp_redirect( $to );
		exit();
	}

}

AEPC_Admin_Handlers::init();
