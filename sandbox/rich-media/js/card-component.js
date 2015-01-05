(function($) {

  $.fn.richMedia = function() {
    $('.rich-media').each(function() {
      $('.media-close').click(function(e) {
        $(this).siblings('section').slideToggle();
        $(this).toggleClass('open');
        e.preventDefault();
      });
    });
  }

}(jQuery));

$('.rich-media').richMedia();
