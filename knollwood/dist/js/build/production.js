$("#email-signup").click(function(){
    $(this).attr('value', 'Got it!');
    $(this).attr('disabled','disabled');
 });
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
