(function($) {

  $.fn.cardComponent = function() {
    $('.card-component').each(function() {
      var button = $('button');

      button.click(function() {
        $(this).parents().siblings('section').slideDown(400).addClass('js-active');

        // swap out text

      });
    });
  }

}(jQuery));

$('.card-component').cardComponent();
