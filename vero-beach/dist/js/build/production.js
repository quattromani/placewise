equalheight = function(container){

var currentTallest = 0,
     currentRowStart = 0,
     rowDivs = new Array(),
     $el,
     topPosition = 0;
 $(container).each(function() {

   $el = $(this);
   $($el).height('auto')
   topPostion = $el.position().top;

   if (currentRowStart != topPostion) {
     for (currentDiv = 0 ; currentDiv < rowDivs.length ; currentDiv++) {
       rowDivs[currentDiv].height(currentTallest);
     }
     rowDivs.length = 0; // empty the array
     currentRowStart = topPostion;
     currentTallest = $el.height();
     rowDivs.push($el);
   } else {
     rowDivs.push($el);
     currentTallest = (currentTallest < $el.height()) ? ($el.height()) : (currentTallest);
  }
   for (currentDiv = 0 ; currentDiv < rowDivs.length ; currentDiv++) {
     rowDivs[currentDiv].height(currentTallest);
   }
 });
}

$(window).load(function() {
  equalheight('article, aside');
});


$(window).resize(function(){
  equalheight('article, aside');
});
;// Open all external links in a new window
$('a[href^="http://"], a[href^="https://"], a[href$=".pdf"]').attr('target','_blank');
;/*! simpleWeather v3.0.2 - http://simpleweatherjs.com */
!function(e){"use strict";function t(e,t){return Math.round("f"===e?5/9*(t-32):1.8*t+32)}e.extend({simpleWeather:function(i){i=e.extend({location:"",woeid:"",unit:"f",success:function(){},error:function(){}},i);var o=new Date,n="https://query.yahooapis.com/v1/public/yql?format=json&rnd="+o.getFullYear()+o.getMonth()+o.getDay()+o.getHours()+"&diagnostics=true&callback=?&q=";if(""!==i.location)n+='select * from weather.forecast where woeid in (select woeid from geo.placefinder where text="'+i.location+'" and gflags="R" limit 1) and u="'+i.unit+'"';else{if(""===i.woeid)return i.error({message:"Could not retrieve weather due to an invalid location."}),!1;n+="select * from weather.forecast where woeid="+i.woeid+' and u="'+i.unit+'"'}return e.getJSON(encodeURI(n),function(e){if(null!==e&&null!==e.query&&null!==e.query.results&&"Yahoo! Weather Error"!==e.query.results.channel.description){var o,n=e.query.results.channel,r={},s=["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW","N"],a="https://s.yimg.com/os/mit/media/m/weather/images/icons/l/44d-100567.png";r.title=n.item.title,r.temp=n.item.condition.temp,r.code=n.item.condition.code,r.todayCode=n.item.forecast[0].code,r.currently=n.item.condition.text,r.high=n.item.forecast[0].high,r.low=n.item.forecast[0].low,r.text=n.item.forecast[0].text,r.humidity=n.atmosphere.humidity,r.pressure=n.atmosphere.pressure,r.rising=n.atmosphere.rising,r.visibility=n.atmosphere.visibility,r.sunrise=n.astronomy.sunrise,r.sunset=n.astronomy.sunset,r.description=n.item.description,r.city=n.location.city,r.country=n.location.country,r.region=n.location.region,r.updated=n.item.pubDate,r.link=n.item.link,r.units={temp:n.units.temperature,distance:n.units.distance,pressure:n.units.pressure,speed:n.units.speed},r.wind={chill:n.wind.chill,direction:s[Math.round(n.wind.direction/22.5)],speed:n.wind.speed},r.heatindex=n.item.condition.temp<80&&n.atmosphere.humidity<40?-42.379+2.04901523*n.item.condition.temp+10.14333127*n.atmosphere.humidity-.22475541*n.item.condition.temp*n.atmosphere.humidity-6.83783*Math.pow(10,-3)*Math.pow(n.item.condition.temp,2)-5.481717*Math.pow(10,-2)*Math.pow(n.atmosphere.humidity,2)+1.22874*Math.pow(10,-3)*Math.pow(n.item.condition.temp,2)*n.atmosphere.humidity+8.5282*Math.pow(10,-4)*n.item.condition.temp*Math.pow(n.atmosphere.humidity,2)-1.99*Math.pow(10,-6)*Math.pow(n.item.condition.temp,2)*Math.pow(n.atmosphere.humidity,2):n.item.condition.temp,"3200"==n.item.condition.code?(r.thumbnail=a,r.image=a):(r.thumbnail="https://s.yimg.com/zz/combo?a/i/us/nws/weather/gr/"+n.item.condition.code+"ds.png",r.image="https://s.yimg.com/zz/combo?a/i/us/nws/weather/gr/"+n.item.condition.code+"d.png"),r.alt={temp:t(i.unit,n.item.condition.temp),high:t(i.unit,n.item.forecast[0].high),low:t(i.unit,n.item.forecast[0].low)},r.alt.unit="f"===i.unit?"c":"f",r.forecast=[];for(var m=0;m<n.item.forecast.length;m++)o=n.item.forecast[m],o.alt={high:t(i.unit,n.item.forecast[m].high),low:t(i.unit,n.item.forecast[m].low)},"3200"==n.item.forecast[m].code?(o.thumbnail=a,o.image=a):(o.thumbnail="https://s.yimg.com/zz/combo?a/i/us/nws/weather/gr/"+n.item.forecast[m].code+"ds.png",o.image="https://s.yimg.com/zz/combo?a/i/us/nws/weather/gr/"+n.item.forecast[m].code+"d.png"),r.forecast.push(o);i.success(r)}else i.error({message:"There was an error retrieving the latest weather information. Please try again.",error:e.query.results.channel.item.title})}),this}})}(jQuery);;// Add classes to first and last li's for every instance
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
;/** @preserve
 *
 * slippry v1.2.7 - Responsive content slider for jQuery
 * http://slippry.com
 *
 * Authors: Lukas Jakob Hafner - @saftsaak
 *          Thomas Hurd - @SeenNotHurd
 *
 * Copyright 2014, booncon oy - http://booncon.com
 *
 *
 * Released under the MIT license - http://opensource.org/licenses/MIT
 */
!function(a){"use strict";var b;b={slippryWrapper:'<div class="sy-box" />',slideWrapper:'<div class="sy-slides-wrap" />',slideCrop:'<div class="sy-slides-crop" />',boxClass:"sy-list",elements:"li",activeClass:"sy-active",fillerClass:"sy-filler",loadingClass:"sy-loading",adaptiveHeight:!0,start:1,loop:!0,captionsSrc:"img",captions:"overlay",captionsEl:".sy-caption",initSingle:!0,responsive:!0,preload:"visible",pager:!0,pagerClass:"sy-pager",controls:!0,controlClass:"sy-controls",prevClass:"sy-prev",prevText:"Previous",nextClass:"sy-next",nextText:"Next",hideOnEnd:!0,transition:"fade",kenZoom:120,slideMargin:0,transClass:"transition",speed:800,easing:"swing",continuous:!0,useCSS:!0,auto:!0,autoDirection:"next",autoHover:!0,autoHoverDelay:100,autoDelay:500,pause:4e3,onSliderLoad:function(){return this},onSlideBefore:function(){return this},onSlideAfter:function(){return this}},a.fn.slippry=function(c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A;return e=this,0===e.length?this:e.length>1?(e.each(function(){a(this).slippry(c)}),this):(d={},d.vars={},n=function(){var a,b,c;b=document.createElement("div"),c={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",MSTransition:"msTransitionEnd",OTransition:"oTransitionEnd",transition:"transitionEnd transitionend"};for(a in c)if(void 0!==b.style[a])return c[a]},w=function(){var a=document.createElement("div"),b=["Khtml","Ms","O","Moz","Webkit"],c=b.length;return function(d){if(d in a.style)return!0;for(d=d.replace(/^[a-z]/,function(a){return a.toUpperCase()});c--;)if(b[c]+d in a.style)return!0;return!1}}(),z=function(b,c){var d,e,f,g;return d=c.split("."),e=a(b),f="",g="",a.each(d,function(a,b){b.indexOf("#")>=0?f+=b.replace(/^#/,""):g+=b+" "}),f.length&&e.attr("id",f),g.length&&e.attr("class",a.trim(g)),e},A=function(){var a,b,c,e;c={},e={},a=100-d.settings.kenZoom,e.width=d.settings.kenZoom+"%",d.vars.active.index()%2===0?(e.left=a+"%",e.top=a+"%",c.left="0%",c.top="0%"):(e.left="0%",e.top="0%",c.left=a+"%",c.top=a+"%"),b=d.settings.pause+2*d.settings.speed,d.vars.active.css(e),d.vars.active.animate(c,{duration:b,easing:d.settings.easing,queue:!1})},l=function(){d.vars.fresh?(d.vars.slippryWrapper.removeClass(d.settings.loadingClass),d.vars.fresh=!1,d.settings.auto&&e.startAuto(),d.settings.useCSS||"kenburns"!==d.settings.transition||A(),d.settings.onSliderLoad.call(void 0,d.vars.active.index())):a("."+d.settings.fillerClass,d.vars.slideWrapper).addClass("ready")},q=function(b,c){var e,f,g;e=b/c,f=1/e*100+"%",g=a("."+d.settings.fillerClass,d.vars.slideWrapper),g.css({paddingTop:f}),l()},g=function(b){var c,d;void 0!==a("img",b).attr("src")?a("<img />").load(function(){c=b.width(),d=b.height(),q(c,d)}).attr("src",a("img",b).attr("src")):(c=b.width(),d=b.height(),q(c,d))},f=function(){if(0===a("."+d.settings.fillerClass,d.vars.slideWrapper).length&&d.vars.slideWrapper.append(a('<div class="'+d.settings.fillerClass+'" />')),d.settings.adaptiveHeight===!0)g(a("."+d.settings.activeClass,e));else{var b,c,f;c=0,f=0,a(d.vars.slides).each(function(){a(this).height()>c&&(b=a(this),c=b.height()),f+=1,f===d.vars.count&&(void 0===b&&(b=a(a(d.vars.slides)[0])),g(b))})}},p=function(){d.settings.pager&&(a("."+d.settings.pagerClass+" li",d.vars.slippryWrapper).removeClass(d.settings.activeClass),a(a("."+d.settings.pagerClass+" li",d.vars.slippryWrapper)[d.vars.active.index()]).addClass(d.settings.activeClass))},u=function(){!d.settings.loop&&d.settings.hideOnEnd&&(a("."+d.settings.prevClass,d.vars.slippryWrapper)[d.vars.first?"hide":"show"](),a("."+d.settings.nextClass,d.vars.slippryWrapper)[d.vars.last?"hide":"show"]())},i=function(){var b,c;d.settings.captions!==!1&&(b="img"!==d.settings.captionsSrc?d.vars.active.attr("title"):a("img",d.vars.active).attr(void 0!==a("img",d.vars.active).attr("title")?"title":"alt"),c="custom"!==d.settings.captions?a(d.settings.captionsEl,d.vars.slippryWrapper):a(d.settings.captionsEl),void 0!==b&&""!==b?c.html(b).show():c.hide())},e.startAuto=function(){void 0===d.vars.timer&&void 0===d.vars.delay&&(d.vars.delay=window.setTimeout(function(){d.vars.autodelay=!1,d.vars.timer=window.setInterval(function(){d.vars.trigger="auto",t(d.settings.autoDirection)},d.settings.pause)},d.vars.autodelay?d.settings.autoHoverDelay:d.settings.autoDelay),d.settings.autoHover&&d.vars.slideWrapper.unbind("mouseenter").unbind("mouseleave").bind("mouseenter",function(){void 0!==d.vars.timer?(d.vars.hoverStop=!0,e.stopAuto()):d.vars.hoverStop=!1}).bind("mouseleave",function(){d.vars.hoverStop&&(d.vars.autodelay=!0,e.startAuto())}))},e.stopAuto=function(){window.clearInterval(d.vars.timer),d.vars.timer=void 0,window.clearTimeout(d.vars.delay),d.vars.delay=void 0},e.refresh=function(){d.vars.slides.removeClass(d.settings.activeClass),d.vars.active.addClass(d.settings.activeClass),d.settings.responsive?f():l(),u(),p(),i()},s=function(){e.refresh()},m=function(){d.vars.moving=!1,d.vars.active.removeClass(d.settings.transClass),d.vars.fresh||d.vars.old.removeClass("sy-ken"),d.vars.old.removeClass(d.settings.transClass),d.settings.onSlideAfter.call(void 0,d.vars.active,d.vars.old.index(),d.vars.active.index()),d.settings.auto&&(d.vars.hoverStop&&void 0!==d.vars.hoverStop||e.startAuto())},r=function(){var b,c,f,g,h,i,j;d.settings.onSlideBefore.call(void 0,d.vars.active,d.vars.old.index(),d.vars.active.index()),d.settings.transition!==!1?(d.vars.moving=!0,"fade"===d.settings.transition||"kenburns"===d.settings.transition?(d.vars.fresh?(d.vars.slides.css(d.settings.useCSS?{transitionDuration:d.settings.speed+"ms",opacity:0}:{opacity:0}),d.vars.active.css("opacity",1),"kenburns"===d.settings.transition&&d.settings.useCSS&&(h=d.settings.pause+2*d.settings.speed,d.vars.slides.css({animationDuration:h+"ms"}),d.vars.active.addClass("sy-ken")),m()):d.settings.useCSS?(d.vars.old.addClass(d.settings.transClass).css("opacity",0),d.vars.active.addClass(d.settings.transClass).css("opacity",1),"kenburns"===d.settings.transition&&d.vars.active.addClass("sy-ken"),a(window).off("focus").on("focus",function(){d.vars.moving&&d.vars.old.trigger(d.vars.transition)}),d.vars.old.one(d.vars.transition,function(){return m(),this})):("kenburns"===d.settings.transition&&A(),d.vars.old.addClass(d.settings.transClass).animate({opacity:0},d.settings.speed,d.settings.easing,function(){m()}),d.vars.active.addClass(d.settings.transClass).css("opacity",0).animate({opacity:1},d.settings.speed,d.settings.easing)),s()):("horizontal"===d.settings.transition||"vertical"===d.settings.transition)&&(i="horizontal"===d.settings.transition?"left":"top",b="-"+d.vars.active.index()*(100+d.settings.slideMargin)+"%",d.vars.fresh?(e.css(i,b),m()):(j={},d.settings.continuous&&(!d.vars.jump||"controls"!==d.vars.trigger&&"auto"!==d.vars.trigger||(c=!0,g=b,d.vars.first?(f=0,d.vars.active.css(i,d.vars.count*(100+d.settings.slideMargin)+"%"),b="-"+d.vars.count*(100+d.settings.slideMargin)+"%"):(f=(d.vars.count-1)*(100+d.settings.slideMargin)+"%",d.vars.active.css(i,-(100+d.settings.slideMargin)+"%"),b=100+d.settings.slideMargin+"%"))),d.vars.active.addClass(d.settings.transClass),d.settings.useCSS?(j[i]=b,j.transitionDuration=d.settings.speed+"ms",e.addClass(d.settings.transition),e.css(j),a(window).off("focus").on("focus",function(){d.vars.moving&&e.trigger(d.vars.transition)}),e.one(d.vars.transition,function(){return e.removeClass(d.settings.transition),c&&(d.vars.active.css(i,f),j[i]=g,j.transitionDuration="0ms",e.css(j)),m(),this})):(j[i]=b,e.stop().animate(j,d.settings.speed,d.settings.easing,function(){return c&&(d.vars.active.css(i,f),e.css(i,g)),m(),this}))),s())):(s(),m())},v=function(a){d.vars.first=d.vars.last=!1,"prev"===a||0===a?d.vars.first=!0:("next"===a||a===d.vars.count-1)&&(d.vars.last=!0)},t=function(b){var c;d.vars.moving||("auto"!==d.vars.trigger&&e.stopAuto(),c=d.vars.active.index(),"prev"===b?c>0?b=c-1:d.settings.loop&&(b=d.vars.count-1):"next"===b?c<d.vars.count-1?b=c+1:d.settings.loop&&(b=0):b-=1,d.vars.jump=!1,"prev"===b||"next"===b||b===c&&!d.vars.fresh||(v(b),d.vars.old=d.vars.active,d.vars.active=a(d.vars.slides[b]),(0===c&&b===d.vars.count-1||c===d.vars.count-1&&0===b)&&(d.vars.jump=!0),r()))},e.goToSlide=function(a){d.vars.trigger="external",t(a)},e.goToNextSlide=function(){d.vars.trigger="external",t("next")},e.goToPrevSlide=function(){d.vars.trigger="external",t("prev")},j=function(){if(d.settings.pager&&d.vars.count>1){var b,c,e;for(b=d.vars.slides.length,e=a('<ul class="'+d.settings.pagerClass+'" />'),c=1;b+1>c;c+=1)e.append(a("<li />").append(a('<a href="#'+c+'">'+c+"</a>")));d.vars.slippryWrapper.append(e),a("."+d.settings.pagerClass+" a",d.vars.slippryWrapper).click(function(){return d.vars.trigger="pager",t(parseInt(this.hash.split("#")[1],10)),!1}),p()}},k=function(){d.settings.controls&&d.vars.count>1&&(d.vars.slideWrapper.append(a('<ul class="'+d.settings.controlClass+'" />').append('<li class="'+d.settings.prevClass+'"><a href="#prev">'+d.settings.prevText+"</a></li>").append('<li class="'+d.settings.nextClass+'"><a href="#next">'+d.settings.nextText+"</a></li>")),a("."+d.settings.controlClass+" a",d.vars.slippryWrapper).click(function(){return d.vars.trigger="controls",t(this.hash.split("#")[1]),!1}),u())},o=function(){d.settings.captions!==!1&&("overlay"===d.settings.captions?d.vars.slideWrapper.append(a('<div class="sy-caption-wrap" />').html(z("<div />",d.settings.captionsEl))):"below"===d.settings.captions&&d.vars.slippryWrapper.append(a('<div class="sy-caption-wrap" />').html(z("<div />",d.settings.captionsEl))))},y=function(){t(d.vars.active.index()+1)},x=function(b){var c,e,f,g;return g="all"===d.settings.preload?b:d.vars.active,f=a("img, iframe",g),c=f.length,0===c?void y():(e=0,void f.each(function(){a(this).one("load error",function(){++e===c&&y()}).each(function(){this.complete&&a(this).load()})}))},e.getCurrentSlide=function(){return d.vars.active},e.getSlideCount=function(){return d.vars.count},e.destroySlider=function(){d.vars.fresh===!1&&(e.stopAuto(),d.vars.moving=!1,d.vars.slides.each(function(){void 0!==a(this).data("sy-cssBckup")?a(this).attr("style",a(this).data("sy-cssBckup")):a(this).removeAttr("style"),void 0!==a(this).data("sy-classBckup")?a(this).attr("class",a(this).data("sy-classBckup")):a(this).removeAttr("class")}),void 0!==e.data("sy-cssBckup")?e.attr("style",e.data("sy-cssBckup")):e.removeAttr("style"),void 0!==e.data("sy-classBckup")?e.attr("class",e.data("sy-classBckup")):e.removeAttr("class"),d.vars.slippryWrapper.before(e),d.vars.slippryWrapper.remove(),d.vars.fresh=void 0)},e.reloadSlider=function(){e.destroySlider(),h()},h=function(){var f;return d.settings=a.extend({},b,c),d.vars.slides=a(d.settings.elements,e),d.vars.count=d.vars.slides.length,d.settings.useCSS&&(w("transition")||(d.settings.useCSS=!1),d.vars.transition=n()),e.data("sy-cssBckup",e.attr("style")),e.data("sy-classBackup",e.attr("class")),e.addClass(d.settings.boxClass).wrap(d.settings.slippryWrapper).wrap(d.settings.slideWrapper).wrap(d.settings.slideCrop),d.vars.slideWrapper=e.parent().parent(),d.vars.slippryWrapper=d.vars.slideWrapper.parent().addClass(d.settings.loadingClass),d.vars.fresh=!0,d.vars.slides.each(function(){a(this).addClass("sy-slide "+d.settings.transition),d.settings.useCSS&&a(this).addClass("useCSS"),"horizontal"===d.settings.transition?a(this).css("left",a(this).index()*(100+d.settings.slideMargin)+"%"):"vertical"===d.settings.transition&&a(this).css("top",a(this).index()*(100+d.settings.slideMargin)+"%")}),d.vars.count>1||d.settings.initSingle?(-1===a("."+d.settings.activeClass,e).index()?(f="random"===d.settings.start?Math.round(Math.random()*(d.vars.count-1)):d.settings.start>0&&d.settings.start<=d.vars.count?d.settings.start-1:0,d.vars.active=a(d.vars.slides[f]).addClass(d.settings.activeClass)):d.vars.active=a("."+d.settings.activeClass,e),k(),j(),o(),x(d.vars.slides),void 0):this},h(),this)}}(jQuery);;jQuery(document).ready(function(){
  jQuery('.home-carousel').slippry({
    // pager
    pager: false,

    // controls
    controls: false,
  });
});
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
;$.simpleWeather({
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
;// Set year
// (function($) {

//   $.fn.getYear = function() {
//     var d = new Date();
//     var x = document.getElementById("year");
//     x.innerHTML=d.getFullYear();
//   }

// }(jQuery));

// $('#year').getYear();
