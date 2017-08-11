<?php
/**
 * HTML for the facebook connect box when user is logged out
 *
 * @var AEPC_Admin_View $page
 * @var AEPC_Facebook_Adapter $fb
 *
 * @package Pixel Caffeine
 */

if ( ! defined( 'ABSPATH' ) ) {
  exit; // Exit if accessed directly.
}

?>

<article class="sub-panel sub-panel-fb-connect">
	<div class="control-label">
		<h3 class="tit">
			<?php _e( 'Facebook Connect', 'pixel-caffeine' ) ?>
			<a href="#_" class="btn btn-fab btn-help btn-fab-mini" data-toggle="tooltip" data-placement="top" title="[ Tooltip on top ]"></a>
		</h3>
	</div>
	<p class="text"><?php _e( 'The easiest whay to get up and running with all the advanced features. Connect your Facebook account and you\'re good to go!', 'pixel-caffeine' ) ?></p>

	<?php if ( ! empty( $fb ) ) : ?>
		<a href="<?php echo esc_url( $fb->get_login_url() ) ?>" class="btn btn-primary btn-raised btn-fb-connect btn-block">
			<?php _e( 'Facebook Connect', 'pixel-caffeine' ) ?>
		</a>

	<?php else :
		$page->print_notice( 'error', sprintf( __( 'You need to update the PHP version of your server from %s to %s to connect facebook.', 'pixel-caffeine' ), phpversion(), AEPC_PHP_REQUIREMENT ) );
	endif; ?>
</article><!-- ./sub-panel -->
