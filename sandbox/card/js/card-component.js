(function($) {

  $.fn.cardComponent = function() {
    $('.card-component').each(function() {
      var button = $('button');

      button.click(function() {
        $(this).find('section').slideToggle(400);
        $(this).find('.toggle-details').toggleClass('show');

        // swap out text

      });
    });
  }

}(jQuery));

$('.card-component').cardComponent();
