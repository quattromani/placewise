// Open all external links in a new window
$('a[href^="http://"], a[href^="https://"]').attr('target','_blank');
;// Add classes to first and last li's for every instance
$(function() {
  // Add classes to first and last of each list
  $('li:first-child').addClass('js-first');
  $('li:last-child').addClass('js-last');
});
;// Get font-family property and return
$('.fonts').each(function(){
    var fonts = $(this).css('font-family');
    $(this).prepend(fonts);
});
;// Detect for touch
var isTouch = 'ontouchstart' in document.documentElement;
;// Set year
(function($) {

  $.fn.getYear = function() {
    var d = new Date();
    var x = document.getElementById("year");
    x.innerHTML=d.getFullYear();
  }

}(jQuery));

$('#year').getYear();
