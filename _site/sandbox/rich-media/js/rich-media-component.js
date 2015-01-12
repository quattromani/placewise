(function($) {

  $.fn.richMedia = function() {
    $('.rich-media').each(function() {
      $('.media-close').click(function(e) {
        $(this).siblings('section').slideToggle();
        if ($(this).parent().hasClass('open')) {
          $(this).parent().removeClass('open').addClass('closed');
        } else {
          $(this).parent().removeClass('closed').addClass('open');
        }
        e.preventDefault();
      });
    });
  }

}(jQuery));

$('.rich-media').richMedia();
