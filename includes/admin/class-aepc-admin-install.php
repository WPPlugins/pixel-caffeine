<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * @class AEPC_Admin_Install
 */
class AEPC_Admin_Install {

	const AEPC_DB_VERSION = 201610061600;

	/**
	 * AEPC_Admin_Install Constructor.
	 */
	public static function init() {
		if ( get_option( 'aepc_db_version' ) < self::AEPC_DB_VERSION ) {
			add_action( 'plugins_loaded', array( __CLASS__, 'install' ) );
		}
	}

	/**
	 * Add the capability manage_ads for administrators
	 */
	public static function add_role_capability() {
		$role = get_role( 'administrator' );
		$role->add_cap( 'manage_ads' );
	}

	/**
	 * Add the table for custom audiences
	 */
	public static function install() {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$wpdb->prefix}aepc_custom_audiences (
  ID mediumint(9) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  description longtext NULL,
  date datetime NOT NULL default '0000-00-00 00:00:00',
  date_gmt datetime NOT NULL default '0000-00-00 00:00:00',
  modified_date datetime NOT NULL default '0000-00-00 00:00:00',
  modified_date_gmt datetime NOT NULL default '0000-00-00 00:00:00',
  retention tinyint(1) UNSIGNED DEFAULT 14 NOT NULL,
  rule longtext NOT NULL,
  fb_id varchar(15) NOT NULL DEFAULT 0,
  approximate_count bigint(20) NOT NULL DEFAULT 0,
  UNIQUE KEY ID (ID)
) $charset_collate;";

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		dbDelta( $sql );

		// Add capability
		self::add_role_capability();

		// Save version on database
		update_option( 'aepc_db_version', self::AEPC_DB_VERSION );
	}

}

AEPC_Admin_Install::init();
