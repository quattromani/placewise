// Get font-family property and return
$('.fonts').each(function(){
    var fonts = $(this).css('font-family');
    $(this).prepend(fonts);
});
