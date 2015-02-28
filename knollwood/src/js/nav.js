// Toggle Navigation
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
