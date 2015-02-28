$.simpleWeather({
  location: 'Vero Beach, FL',
  woeid: '',
  unit: 'f',
  success: function(weather) {
    html = '<span><i class="icon-'+weather.code+'"></i> '+weather.temp+'&deg;'+weather.units.temp+'</span>';

    $(".weather").html(html);
  },
  error: function(error) {
    $(".weather").html('<p>'+error+'</p>');
  }
});
