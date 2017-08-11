=== Pixel Caffeine ===
Contributors: adespresso, antoscarface, divbyzero, giangian, chiara_09, chusmy
Donate link: https://adespresso.com/
Tags: facebook, facebook pixel, facebook ad, facebook insertions, custom audiences, dynamic events, woocommerce
Requires at least: 4.4
Tested up to: 4.8
Stable tag: 1.2.2
License: GPLv3
License URI: https://www.gnu.org/licenses/gpl-3.0.html

The simplest and easiest way to manage your Facebook Pixel needs and create laser focused custom audiences on WordPress.

== Description ==

Don’t spend money on “pro” plugins while ours is free. Includes full WooCommerce and Easy Digital Downloads support!

Created by AdEspresso, a certified Facebook Marketing Partner and #1 Facebook Ads Partner, Pixel Caffeine is the highest
quality Facebook Pixel plug-in available on the WordPress market.

Watch our video to see the full range of possibilities:

[youtube http://www.youtube.com/watch?v=zFAszDll_1w]

In just a few simple clicks, you can begin creating custom audiences for almost any parameter you want - whether its web
pages visited, products & content viewed, or custom & dynamic events.

Unlike all the other professional plugins available, we have no limitations and no hidden costs or fees.

Welcome to a whole new world of custom audiences.

### Features:

* Instant Installation - get the Facebook pixel site-wide without typing a line of code - just a simple click.

* Advanced Custom Audiences - create audiences based on standard/custom events, referring sources (i.e. Twitter, Facebook,
Google, etc.), categories/tags of content, specific URL parameters...literally almost anything you’d like!

* Facebook Dynamic Ads with WooCommerce - automatically track visitors based on what they viewed (product name, product
category and product tags) and then dynamically re-target them with advertisements on Facebook or Instagram

### Examples of what you can do with Pixel Caffeine:

* Create “category” audiences for your blog or website and then re-target these visitors with lead generation or direct
sale campaigns

* Create audiences of people that viewed specific products and dynamically target them with specific incentives or coupons
for exactly the products they viewed

* Create audiences of those that submit particular forms, click on certain buttons, or take certain actions while navigating
or searching your website.

### Videotutorial

[youtube https://www.youtube.com/watch?v=DUn1a291-bA]


== Installation ==

= Minimum Requirements =

* PHP version 5.2.4 or greater (PHP 5.4 or greater is mandatory for custom audiences manager)
* MySQL version 5.6 or greater or MariaDB version 10.0 or greater

= Automatic installation =

* From your WordPress admin panel, click “Plug-Ins” and then “Add New”
* In the search box, type “Pixel Caffeine”
* Select “Pixel Caffeine” and click “Install”!
* Activate It

= Manual installation =

* Download the plugin from this page (it will download as a zip file)
* Open the WordPress admin panel, go to the "Plugins" and select “Add new”
* Select “Upload” and then  choose the .zip file downloaded from this page
* Select “Install” after the upload is complete
* Activate It

= Video =

Here a brief videotutorial to understand main feature and how their work:

[https://www.youtube.com/watch?v=DUn1a291-bA]

== Frequently Asked Questions ==

= Where do I get my Facebook Pixel ID? =

You can get your Facebook Pixel ID from the [Pixel page of Facebook Ads Manager](https://www.facebook.com/ads/manager/pixel/facebook_pixel). If you don't have a Pixel, you can create a new one by following [these instructions](https://www.facebook.com/business/help/952192354843755?helpref=faq_content#createpixel). Remember: there is only ONE Pixel assigned per ad account.

= Do I need a new Facebook Pixel? =

No, use the pixel from the ad account you want to link to your WordPress website.

= I don't want to login to my Facebook account. Can I put the pixel ID manually without connecting my account? =

No problem! You can manually add the Pixel ID in the settings page instead of connecting your Facebook Account. However, without the Facebook connect, you won't be able to use some of the most advanced features of Pixel Caffeine like our Custom Audience creation.

= Are the custom audiences saved also on my Facebook Ad Account? =

Yes, everything you create in Pixel Caffeine is immediately synced with Facebook and all the audiences will be immediately available to use in Facebook Ads Manager/Power Editor ...or [AdEspresso](https://adespresso.com) if you're using it of course :)

= Is it compatible with WooCommerce? =

YES! We fully support WooCommerce. In the settings page just enable the integration and we'll automatically add all the event tracking! This is also compatible with Dynamic Product Ads and we'll pass Facebook all the advanced settings like product Id, cost, etc.!

= Is it compatible with Easy Digital Downloads =

Absolutely YES! The same of above.

= Can I import my custom audiences I already have in my Ad account into Pixel Caffeine? =

Unfortunately there isn’t any way at the moment to import custom audiences _from_ FB, but it is a feature in our long-term roadmap. With the plugin we want to give extended tools for advanced custom audiences - using WordPress data. This plug-in is NOT a replacement for Business Manager, but it does make it all easier!

== Screenshots ==

1. General Settings
2. Custom audiences manager
3. Special filter for custom audience
4. Conversions events page
5. Dashboard

== Changelog ==

= 1.2.2 - 2017-06-21 =
* Support - tested with new 4.8 WordPress version with success
* Add - Option to disable pixel firing when user is logged in as specific roles
* Add - Option to disable use product instead of product_group for content_type parameter
* Enhancement - Enable automatically the main conversions option when one of the ecommerce event option is checked
* Fix - Facebook Pixel isn't fired because of a dynamic language in the Facebook scripts
* Fix - Taxonomy labels in CA filter
* Fix - Admin style conflicts with other plugins that damage admin style of Pixel Caffeine

= 1.2.1 - 2017-04-27 =
* Fix - Box not aligned in general settings in safari browser
* Fix - Fatal error when plugin is disabled and woocommerce plugin is active
* Fix - Permissions error message after plugin activation

= 1.2.0 - 2017-04-03 =
* Feature - *Full support to Easy Digital Downloads* for the dynamic ads events
* Feature - Introduced new hook to add dynamic placeholders in the value arguments of custom conversions
* Tweak - Tested with WooCommerce 3.0.0 RC2, so almost fully compatible with the new version will be released soon
* Tweak - Track "CompleteRegistration" event when a user is registered from woocommerce page
* Fix - Track custom conversions events created by admin even if you set a full URL for page_visit and link_click
* Fix - Shipping cost included in the "value" property of checkout events. Anyway, added also an option to activate it again

= 1.1.0 - 2017-03-16 =
* Feature - Introduced new *delay* options in general settings and in Conversions/Events tab in order to set a delay for the pixel firing
* Feature - Introduced condition dropdown for the URL fields of CA creation/edit form
* Feature - Introduced new advanced settings box in general settings box with delay options and other dev tools
* Fix - Fatal error ‘__DIR__/composer/autoload_real.php’
* Fix - Conversions table layout broken when URL is long in the trigger column
* Fix - HTML tags shown on CA fields error message
* Dev - Introduced new debug mode option, to have a dump of pixel fired in the pages before to fire really
* Dev - Introduced new button to clear the transients used to cache the facebook APi requests, rarely they may cause data not fetched from facebook

= 1.0.2 - 2017-03-09 =
* Fix - Fatal error on AMP pages, using AMP plugin
* Tweak - Increase limit of objects fetched by facebook API request
* Tweak - Increase limit for the posts in CA filters

= 1.0.1 - 2017-02-23 =
* Fix - Remove zero cent from the value amount of ecommerce events
* Fix - change 'and' with 'or' when you set more values for a filter of CA
* Fix - JS error on AddPaymentInfo event
* Fix - Undefined property shown on JS console
* Fix - Fatal error when facebook connection API error occurred and log them
* Tweak - Remove manual hash for advanced matching with the pixel

= 1.0.0 - 2017-02-20 =
* First release
