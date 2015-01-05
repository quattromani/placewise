(function($) {

  $.fn.cardComponent = function() {
    $('.reveal-details').each(function() {

      var cardComponent = jQuery(this);
			
      cardComponent.click(function() {
        $(".card-component section").slideToggle( "normal", function() {
				// animation complete
  			});
  			
  			// toggle button text
  			cardComponent.toggleClass('show');
		    if (cardComponent.hasClass('show')) {
		        cardComponent.text('Hide Details');
		    } else {
		        cardComponent.text('Show Details');
		    }
      });

    });
  }

}(jQuery));

$('.card-component').cardComponent();