if(typeof $ == 'function') {
						$(function(){
							$('.email_signup_widget_v1 button').each(function(){$(this).html($(this).attr('data-up-text'))});
							$('.email_signup_widget_v1').show(500);
							$('.email_signup_widget_v1 button.email_widget_submit').click(function(e){
								target = $(e.target);
								container = target.closest('.email_signup_widget_v1');
								if(container.hasClass('processing')) return;

								input = container.find('input');
								email = input.val();
								messages_element = container.find('.email_signup_messages');
								console.log(email);
								var email_signup_error_message = 'Please enter a valid email address.';
								if(email.length > 6) {
									if(email.indexOf('@') == -1) {
										messages_element.html(email_signup_error_message).addClass('error').removeClass('success').show(500);
										return;
									}

									// begin ajax transaction
									container.addClass('processing');
									target.attr('disabled', 'disabled');
									target.html(target.attr('data-down-text'));

									$.ajax({
										type: "GET",
										url: 'http://api.mallfinder.com/svc/emailsvc.cfc',
										data: {method: 'subscribeSEW', mallID: 2204, email: email, source: 'email_widget_2014_v1'},
										success: function(response){
											container.removeClass('processing');
											target.removeAttr('disabled');
											target.html(target.attr('data-up-text'));

											// Remove inputs?
											input.attr('disabled', 'disabled');
											input.remove();
											target.attr('disabled', 'disabled');
											target.remove();
											//

											if(typeof response == 'number') {
												messages_element.addClass('success').removeClass('error').html('Success! You will receive newsletters from The Shoppes at Knollwood').show(500);
												var t = setTimeout('messages_element.html("").hide(500);', 30000);
												input.val('');
											} else {
												messages_element.removeClass('success').addClass('error').html(email_signup_error_message).show(500);
											}
										},
										error:function(args){
											messages_element.removeClass('success').addClass('error').html('Sorry, something has gone wrong. Please try again later.').show(500);
											input.attr('disabled', 'disabled');
											input.remove();
											container.addClass('processing');
											target.attr('disabled', 'disabled');
											target.html('Out of Order');
											target.remove();
										},
										timeout: 8000,
										dataType: 'jsonp'
									});
								}
							});
						});
					}
;// Open all external links in a new window
$('a[href^="http://"], a[href^="https://"], a[href$=".pdf"]').attr('target','_blank');
;// Add classes to first and last li's for every instance
$(function() {
  // Add classes to first and last of each list
  $('li:first-child').addClass('js-first');
  $('li:last-child').addClass('js-last');
});
;// Toggle Navigation
(function($) {

  $.fn.toggleNav = function() {
    $('.open-panel').click(function() {
      if($('html').hasClass('open-nav')) {
        $('html').removeClass('open-nav');
      } else {
        $('html').addClass('open-nav');
      }

      $(this).toggleClass('active');
    });

    $('.close-panel').click(function() {
      if($('html').hasClass('open-nav')) {
        $('html').removeClass('open-nav');
      }
    });
  }

}(jQuery));

$('nav').toggleNav();
;// Create Hex color code from color return
function hexc(colorval) {
    var parts = colorval.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    delete(parts[0]);
    for (var i = 1; i <= 3; ++i) {
        parts[i] = parseInt(parts[i]).toString(16);
        if (parts[i].length == 1) parts[i] = '0' + parts[i];
    }
    color = '#' + parts.join('');
}

// Get color value of swatch and print to div
var color = '';
$('.swatch').each(function() {
    var classList = $(this).children('.swatch-color').attr('class').split(' ');
    for(i=0; i <= classList.length-1; i++){
     if(classList[i].match(/color-/g)){
         // $(this).children('.swatch-info').prepend('<p>$' + classList[i] + '</p>');
         // break;
     }
 }
 var x = $(this).children('.swatch-color').css('backgroundColor');
 hexc(x);
 $(this).children('.swatch-info').append('<p>' + color + '</p>');
 // $(this).children('.swatch-info').append('<p>' + x + '</p>');
});

// Get font-family property and return
$('.fonts').each(function(){
    var fonts = $(this).css('font-family');
    $(this).prepend(fonts);
});
;// Detect for touch
var isTouch = 'ontouchstart' in document.documentElement;
;// Set year
// (function($) {

//   $.fn.getYear = function() {
//     var d = new Date();
//     var x = document.getElementById("year");
//     x.innerHTML=d.getFullYear();
//   }

// }(jQuery));

// $('#year').getYear();
