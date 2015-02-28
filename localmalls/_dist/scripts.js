var app = {
  factories: {},
  helpers: {},
  directives: {}
};

/*jslint browser:true, node:true*/
/*global define, Event, Node*/


/**
 * Instantiate fast-clicking listeners on the specificed layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 */
function FastClick(layer) {
  'use strict';
  var oldOnClick, self = this;


  /**
   * Whether a click is currently being tracked.
   *
   * @type boolean
   */
  this.trackingClick = false;


  /**
   * Timestamp for when when click tracking started.
   *
   * @type number
   */
  this.trackingClickStart = 0;


  /**
   * The element being tracked for a click.
   *
   * @type EventTarget
   */
  this.targetElement = null;


  /**
   * X-coordinate of touch start event.
   *
   * @type number
   */
  this.touchStartX = 0;


  /**
   * Y-coordinate of touch start event.
   *
   * @type number
   */
  this.touchStartY = 0;


  /**
   * ID of the last touch, retrieved from Touch.identifier.
   *
   * @type number
   */
  this.lastTouchIdentifier = 0;


  /**
   * Touchmove boundary, beyond which a click will be cancelled.
   *
   * @type number
   */
  this.touchBoundary = 10;


  /**
   * The FastClick layer.
   *
   * @type Element
   */
  this.layer = layer;

  if (!layer || !layer.nodeType) {
    throw new TypeError('Layer must be a document node');
  }

  /** @type function() */
  this.onClick = function() { return FastClick.prototype.onClick.apply(self, arguments); };

  /** @type function() */
  this.onMouse = function() { return FastClick.prototype.onMouse.apply(self, arguments); };

  /** @type function() */
  this.onTouchStart = function() { return FastClick.prototype.onTouchStart.apply(self, arguments); };

  /** @type function() */
  this.onTouchMove = function() { return FastClick.prototype.onTouchMove.apply(self, arguments); };

  /** @type function() */
  this.onTouchEnd = function() { return FastClick.prototype.onTouchEnd.apply(self, arguments); };

  /** @type function() */
  this.onTouchCancel = function() { return FastClick.prototype.onTouchCancel.apply(self, arguments); };

  if (FastClick.notNeeded(layer)) {
    return;
  }

  // Set up event handlers as required
  if (this.deviceIsAndroid) {
    layer.addEventListener('mouseover', this.onMouse, true);
    layer.addEventListener('mousedown', this.onMouse, true);
    layer.addEventListener('mouseup', this.onMouse, true);
  }

  layer.addEventListener('click', this.onClick, true);
  layer.addEventListener('touchstart', this.onTouchStart, false);
  layer.addEventListener('touchmove', this.onTouchMove, false);
  layer.addEventListener('touchend', this.onTouchEnd, false);
  layer.addEventListener('touchcancel', this.onTouchCancel, false);

  // Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
  // which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
  // layer when they are cancelled.
  if (!Event.prototype.stopImmediatePropagation) {
    layer.removeEventListener = function(type, callback, capture) {
      var rmv = Node.prototype.removeEventListener;
      if (type === 'click') {
        rmv.call(layer, type, callback.hijacked || callback, capture);
      } else {
        rmv.call(layer, type, callback, capture);
      }
    };

    layer.addEventListener = function(type, callback, capture) {
      var adv = Node.prototype.addEventListener;
      if (type === 'click') {
        adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
          if (!event.propagationStopped) {
            callback(event);
          }
        }), capture);
      } else {
        adv.call(layer, type, callback, capture);
      }
    };
  }

  // If a handler is already declared in the element's onclick attribute, it will be fired before
  // FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
  // adding it as listener.
  if (typeof layer.onclick === 'function') {

    // Android browser on at least 3.2 requires a new reference to the function in layer.onclick
    // - the old one won't work if passed to addEventListener directly.
    oldOnClick = layer.onclick;
    layer.addEventListener('click', function(event) {
      oldOnClick(event);
    }, false);
    layer.onclick = null;
  }
}


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);


/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
  'use strict';
  switch (target.nodeName.toLowerCase()) {

  // Don't send a synthetic click to disabled inputs (issue #62)
  case 'button':
  case 'select':
  case 'textarea':
    if (target.disabled) {
      return true;
    }

    break;
  case 'input':

    // File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
    if ((this.deviceIsIOS && target.type === 'file') || target.disabled) {
      return true;
    }

    break;
  case 'label':
  case 'video':
    return true;
  }

  return (/\bneedsclick\b/).test(target.className);
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
  'use strict';
  switch (target.nodeName.toLowerCase()) {
  case 'textarea':
    return true;
  case 'select':
    return !this.deviceIsAndroid;
  case 'input':
    switch (target.type) {
    case 'button':
    case 'checkbox':
    case 'file':
    case 'image':
    case 'radio':
    case 'submit':
      return false;
    }

    // No point in attempting to focus disabled inputs
    return !target.disabled && !target.readOnly;
  default:
    return (/\bneedsfocus\b/).test(target.className);
  }
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
  'use strict';
  var clickEvent, touch;

  // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
  if (document.activeElement && document.activeElement !== targetElement) {
    document.activeElement.blur();
  }

  touch = event.changedTouches[0];

  // Synthesise a click event, with an extra attribute so it can be tracked
  clickEvent = document.createEvent('MouseEvents');
  clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
  clickEvent.forwardedTouchEvent = true;
  targetElement.dispatchEvent(clickEvent);
};

FastClick.prototype.determineEventType = function(targetElement) {
  'use strict';

  //Issue #159: Android Chrome Select Box does not open with a synthetic click event
  if (this.deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
    return 'mousedown';
  }

  return 'click';
};


/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function(targetElement) {
  'use strict';
  var length;

  // Issue #160: on iOS 7, some input elements (e.g. date datetime) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
  if (this.deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time') {
    length = targetElement.value.length;
    targetElement.setSelectionRange(length, length);
  } else {
    targetElement.focus();
  }
};


/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function(targetElement) {
  'use strict';
  var scrollParent, parentElement;

  scrollParent = targetElement.fastClickScrollParent;

  // Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
  // target element was moved to another parent.
  if (!scrollParent || !scrollParent.contains(targetElement)) {
    parentElement = targetElement;
    do {
      if (parentElement.scrollHeight > parentElement.offsetHeight) {
        scrollParent = parentElement;
        targetElement.fastClickScrollParent = parentElement;
        break;
      }

      parentElement = parentElement.parentElement;
    } while (parentElement);
  }

  // Always update the scroll top tracker if possible.
  if (scrollParent) {
    scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
  }
};


/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
  'use strict';

  // On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
  if (eventTarget.nodeType === Node.TEXT_NODE) {
    return eventTarget.parentNode;
  }

  return eventTarget;
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
  'use strict';
  var targetElement, touch, selection;

  // Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
  if (event.targetTouches.length > 1) {
    return true;
  }

  targetElement = this.getTargetElementFromEventTarget(event.target);
  touch = event.targetTouches[0];

  if (this.deviceIsIOS) {

    // Only trusted events will deselect text on iOS (issue #49)
    selection = window.getSelection();
    if (selection.rangeCount && !selection.isCollapsed) {
      return true;
    }

    if (!this.deviceIsIOS4) {

      // Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
      // when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
      // with the same identifier as the touch event that previously triggered the click that triggered the alert.
      // Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
      // immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
      if (touch.identifier === this.lastTouchIdentifier) {
        event.preventDefault();
        return false;
      }

      this.lastTouchIdentifier = touch.identifier;

      // If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
      // 1) the user does a fling scroll on the scrollable layer
      // 2) the user stops the fling scroll with another tap
      // then the event.target of the last 'touchend' event will be the element that was under the user's finger
      // when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
      // is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
      this.updateScrollParent(targetElement);
    }
  }

  this.trackingClick = true;
  this.trackingClickStart = event.timeStamp;
  this.targetElement = targetElement;

  this.touchStartX = touch.pageX;
  this.touchStartY = touch.pageY;

  // Prevent phantom clicks on fast double-tap (issue #36)
  if ((event.timeStamp - this.lastClickTime) < 200) {
    event.preventDefault();
  }

  return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
  'use strict';
  var touch = event.changedTouches[0], boundary = this.touchBoundary;

  if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
    return true;
  }

  return false;
};


/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchMove = function(event) {
  'use strict';
  if (!this.trackingClick) {
    return true;
  }

  // If the touch has moved, cancel the click tracking
  if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
    this.trackingClick = false;
    this.targetElement = null;
  }

  return true;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
  'use strict';

  // Fast path for newer browsers supporting the HTML5 control attribute
  if (labelElement.control !== undefined) {
    return labelElement.control;
  }

  // All browsers under test that support touch events also support the HTML5 htmlFor attribute
  if (labelElement.htmlFor) {
    return document.getElementById(labelElement.htmlFor);
  }

  // If no for attribute exists, attempt to retrieve the first labellable descendant element
  // the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
  return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
  'use strict';
  var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

  if (!this.trackingClick) {
    return true;
  }

  // Prevent phantom clicks on fast double-tap (issue #36)
  if ((event.timeStamp - this.lastClickTime) < 200) {
    this.cancelNextClick = true;
    return true;
  }

  // Reset to prevent wrong click cancel on input (issue #156).
  this.cancelNextClick = false;

  this.lastClickTime = event.timeStamp;

  trackingClickStart = this.trackingClickStart;
  this.trackingClick = false;
  this.trackingClickStart = 0;

  // On some iOS devices, the targetElement supplied with the event is invalid if the layer
  // is performing a transition or scroll, and has to be re-detected manually. Note that
  // for this to function correctly, it must be called *after* the event target is checked!
  // See issue #57; also filed as rdar://13048589 .
  if (this.deviceIsIOSWithBadTarget) {
    touch = event.changedTouches[0];

    // In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
    targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
    targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
  }

  targetTagName = targetElement.tagName.toLowerCase();
  if (targetTagName === 'label') {
    forElement = this.findControl(targetElement);
    if (forElement) {
      this.focus(targetElement);
      if (this.deviceIsAndroid) {
        return false;
      }

      targetElement = forElement;
    }
  } else if (this.needsFocus(targetElement)) {

    // Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
    // Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
    if ((event.timeStamp - trackingClickStart) > 100 || (this.deviceIsIOS && window.top !== window && targetTagName === 'input')) {
      this.targetElement = null;
      return false;
    }

    this.focus(targetElement);

    // Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
    if (!this.deviceIsIOS4 || targetTagName !== 'select') {
      this.targetElement = null;
      event.preventDefault();
    }

    return false;
  }

  if (this.deviceIsIOS && !this.deviceIsIOS4) {

    // Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
    // and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
    scrollParent = targetElement.fastClickScrollParent;
    if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
      return true;
    }
  }

  // Prevent the actual click from going though - unless the target node is marked as requiring
  // real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
  if (!this.needsClick(targetElement)) {
    event.preventDefault();
    this.sendClick(targetElement, event);
  }

  return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
  'use strict';
  this.trackingClick = false;
  this.targetElement = null;
};


/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function(event) {
  'use strict';

  // If a target element was never set (because a touch event was never fired) allow the event
  if (!this.targetElement) {
    return true;
  }

  if (event.forwardedTouchEvent) {
    return true;
  }

  // Programmatically generated events targeting a specific element should be permitted
  if (!event.cancelable) {
    return true;
  }

  // Derive and check the target element to see whether the mouse event needs to be permitted;
  // unless explicitly enabled, prevent non-touch click events from triggering actions,
  // to prevent ghost/doubleclicks.
  if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

    // Prevent any user-added listeners declared on FastClick element from being fired.
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    } else {

      // Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
      event.propagationStopped = true;
    }

    // Cancel the event
    event.stopPropagation();
    event.preventDefault();

    return false;
  }

  // If the mouse event is permitted, return true for the action to go through.
  return true;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
  'use strict';
  var permitted;

  // It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
  if (this.trackingClick) {
    this.targetElement = null;
    this.trackingClick = false;
    return true;
  }

  // Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
  if (event.target.type === 'submit' && event.detail === 0) {
    return true;
  }

  permitted = this.onMouse(event);

  // Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
  if (!permitted) {
    this.targetElement = null;
  }

  // If clicks are permitted, return true for the action to go through.
  return permitted;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
  'use strict';
  var layer = this.layer;

  if (this.deviceIsAndroid) {
    layer.removeEventListener('mouseover', this.onMouse, true);
    layer.removeEventListener('mousedown', this.onMouse, true);
    layer.removeEventListener('mouseup', this.onMouse, true);
  }

  layer.removeEventListener('click', this.onClick, true);
  layer.removeEventListener('touchstart', this.onTouchStart, false);
  layer.removeEventListener('touchmove', this.onTouchMove, false);
  layer.removeEventListener('touchend', this.onTouchEnd, false);
  layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
  'use strict';
  var metaViewport;
  var chromeVersion;

  // Devices that don't support touch don't need FastClick
  if (typeof window.ontouchstart === 'undefined') {
    return true;
  }

  // Chrome version - zero for other browsers
  chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

  if (chromeVersion) {

    if (FastClick.prototype.deviceIsAndroid) {
      metaViewport = document.querySelector('meta[name=viewport]');

      if (metaViewport) {
        // Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
        if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
          return true;
        }
        // Chrome 32 and above with width=device-width or less don't need FastClick
        if (chromeVersion > 31 && window.innerWidth <= window.screen.width) {
          return true;
        }
      }

    // Chrome desktop doesn't need FastClick (issue #15)
    } else {
      return true;
    }
  }

  // IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
  if (layer.style.msTouchAction === 'none') {
    return true;
  }

  return false;
};


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.attach = function(layer) {
  'use strict';
  return new FastClick(layer);
};


if (typeof define !== 'undefined' && define.amd) {

  // AMD. Register as an anonymous module.
  define(function() {
    'use strict';
    return FastClick;
  });
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = FastClick.attach;
  module.exports.FastClick = FastClick;
} else {
  window.FastClick = FastClick;
}

/*!
 * imagesLoaded PACKAGED v3.1.4
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

(function(){function e(){}function t(e,t){for(var n=e.length;n--;)if(e[n].listener===t)return n;return-1}function n(e){return function(){return this[e].apply(this,arguments)}}var i=e.prototype,r=this,o=r.EventEmitter;i.getListeners=function(e){var t,n,i=this._getEvents();if("object"==typeof e){t={};for(n in i)i.hasOwnProperty(n)&&e.test(n)&&(t[n]=i[n])}else t=i[e]||(i[e]=[]);return t},i.flattenListeners=function(e){var t,n=[];for(t=0;e.length>t;t+=1)n.push(e[t].listener);return n},i.getListenersAsObject=function(e){var t,n=this.getListeners(e);return n instanceof Array&&(t={},t[e]=n),t||n},i.addListener=function(e,n){var i,r=this.getListenersAsObject(e),o="object"==typeof n;for(i in r)r.hasOwnProperty(i)&&-1===t(r[i],n)&&r[i].push(o?n:{listener:n,once:!1});return this},i.on=n("addListener"),i.addOnceListener=function(e,t){return this.addListener(e,{listener:t,once:!0})},i.once=n("addOnceListener"),i.defineEvent=function(e){return this.getListeners(e),this},i.defineEvents=function(e){for(var t=0;e.length>t;t+=1)this.defineEvent(e[t]);return this},i.removeListener=function(e,n){var i,r,o=this.getListenersAsObject(e);for(r in o)o.hasOwnProperty(r)&&(i=t(o[r],n),-1!==i&&o[r].splice(i,1));return this},i.off=n("removeListener"),i.addListeners=function(e,t){return this.manipulateListeners(!1,e,t)},i.removeListeners=function(e,t){return this.manipulateListeners(!0,e,t)},i.manipulateListeners=function(e,t,n){var i,r,o=e?this.removeListener:this.addListener,s=e?this.removeListeners:this.addListeners;if("object"!=typeof t||t instanceof RegExp)for(i=n.length;i--;)o.call(this,t,n[i]);else for(i in t)t.hasOwnProperty(i)&&(r=t[i])&&("function"==typeof r?o.call(this,i,r):s.call(this,i,r));return this},i.removeEvent=function(e){var t,n=typeof e,i=this._getEvents();if("string"===n)delete i[e];else if("object"===n)for(t in i)i.hasOwnProperty(t)&&e.test(t)&&delete i[t];else delete this._events;return this},i.removeAllListeners=n("removeEvent"),i.emitEvent=function(e,t){var n,i,r,o,s=this.getListenersAsObject(e);for(r in s)if(s.hasOwnProperty(r))for(i=s[r].length;i--;)n=s[r][i],n.once===!0&&this.removeListener(e,n.listener),o=n.listener.apply(this,t||[]),o===this._getOnceReturnValue()&&this.removeListener(e,n.listener);return this},i.trigger=n("emitEvent"),i.emit=function(e){var t=Array.prototype.slice.call(arguments,1);return this.emitEvent(e,t)},i.setOnceReturnValue=function(e){return this._onceReturnValue=e,this},i._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},i._getEvents=function(){return this._events||(this._events={})},e.noConflict=function(){return r.EventEmitter=o,e},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return e}):"object"==typeof module&&module.exports?module.exports=e:this.EventEmitter=e}).call(this),function(e){function t(t){var n=e.event;return n.target=n.target||n.srcElement||t,n}var n=document.documentElement,i=function(){};n.addEventListener?i=function(e,t,n){e.addEventListener(t,n,!1)}:n.attachEvent&&(i=function(e,n,i){e[n+i]=i.handleEvent?function(){var n=t(e);i.handleEvent.call(i,n)}:function(){var n=t(e);i.call(e,n)},e.attachEvent("on"+n,e[n+i])});var r=function(){};n.removeEventListener?r=function(e,t,n){e.removeEventListener(t,n,!1)}:n.detachEvent&&(r=function(e,t,n){e.detachEvent("on"+t,e[t+n]);try{delete e[t+n]}catch(i){e[t+n]=void 0}});var o={bind:i,unbind:r};"function"==typeof define&&define.amd?define("eventie/eventie",o):e.eventie=o}(this),function(e,t){"function"==typeof define&&define.amd?define(["eventEmitter/EventEmitter","eventie/eventie"],function(n,i){return t(e,n,i)}):"object"==typeof exports?module.exports=t(e,require("eventEmitter"),require("eventie")):e.imagesLoaded=t(e,e.EventEmitter,e.eventie)}(this,function(e,t,n){function i(e,t){for(var n in t)e[n]=t[n];return e}function r(e){return"[object Array]"===d.call(e)}function o(e){var t=[];if(r(e))t=e;else if("number"==typeof e.length)for(var n=0,i=e.length;i>n;n++)t.push(e[n]);else t.push(e);return t}function s(e,t,n){if(!(this instanceof s))return new s(e,t);"string"==typeof e&&(e=document.querySelectorAll(e)),this.elements=o(e),this.options=i({},this.options),"function"==typeof t?n=t:i(this.options,t),n&&this.on("always",n),this.getImages(),a&&(this.jqDeferred=new a.Deferred);var r=this;setTimeout(function(){r.check()})}function c(e){this.img=e}function f(e){this.src=e,v[e]=this}var a=e.jQuery,u=e.console,h=u!==void 0,d=Object.prototype.toString;s.prototype=new t,s.prototype.options={},s.prototype.getImages=function(){this.images=[];for(var e=0,t=this.elements.length;t>e;e++){var n=this.elements[e];"IMG"===n.nodeName&&this.addImage(n);for(var i=n.querySelectorAll("img"),r=0,o=i.length;o>r;r++){var s=i[r];this.addImage(s)}}},s.prototype.addImage=function(e){var t=new c(e);this.images.push(t)},s.prototype.check=function(){function e(e,r){return t.options.debug&&h&&u.log("confirm",e,r),t.progress(e),n++,n===i&&t.complete(),!0}var t=this,n=0,i=this.images.length;if(this.hasAnyBroken=!1,!i)return this.complete(),void 0;for(var r=0;i>r;r++){var o=this.images[r];o.on("confirm",e),o.check()}},s.prototype.progress=function(e){this.hasAnyBroken=this.hasAnyBroken||!e.isLoaded;var t=this;setTimeout(function(){t.emit("progress",t,e),t.jqDeferred&&t.jqDeferred.notify&&t.jqDeferred.notify(t,e)})},s.prototype.complete=function(){var e=this.hasAnyBroken?"fail":"done";this.isComplete=!0;var t=this;setTimeout(function(){if(t.emit(e,t),t.emit("always",t),t.jqDeferred){var n=t.hasAnyBroken?"reject":"resolve";t.jqDeferred[n](t)}})},a&&(a.fn.imagesLoaded=function(e,t){var n=new s(this,e,t);return n.jqDeferred.promise(a(this))}),c.prototype=new t,c.prototype.check=function(){var e=v[this.img.src]||new f(this.img.src);if(e.isConfirmed)return this.confirm(e.isLoaded,"cached was confirmed"),void 0;if(this.img.complete&&void 0!==this.img.naturalWidth)return this.confirm(0!==this.img.naturalWidth,"naturalWidth"),void 0;var t=this;e.on("confirm",function(e,n){return t.confirm(e.isLoaded,n),!0}),e.check()},c.prototype.confirm=function(e,t){this.isLoaded=e,this.emit("confirm",this,t)};var v={};return f.prototype=new t,f.prototype.check=function(){if(!this.isChecked){var e=new Image;n.bind(e,"load",this),n.bind(e,"error",this),e.src=this.src,this.isChecked=!0}},f.prototype.handleEvent=function(e){var t="on"+e.type;this[t]&&this[t](e)},f.prototype.onload=function(e){this.confirm(!0,"onload"),this.unbindProxyEvents(e)},f.prototype.onerror=function(e){this.confirm(!1,"onerror"),this.unbindProxyEvents(e)},f.prototype.confirm=function(e,t){this.isConfirmed=!0,this.isLoaded=e,this.emit("confirm",this,t)},f.prototype.unbindProxyEvents=function(e){n.unbind(e.target,"load",this),n.unbind(e.target,"error",this)},s});

/*!
 * Isotope PACKAGED v2.0.0
 * Filter & sort magical layouts
 * http://isotope.metafizzy.co
 */

(function(t){function e(){}function i(t){function i(e){e.prototype.option||(e.prototype.option=function(e){t.isPlainObject(e)&&(this.options=t.extend(!0,this.options,e))})}function n(e,i){t.fn[e]=function(n){if("string"==typeof n){for(var s=o.call(arguments,1),a=0,u=this.length;u>a;a++){var p=this[a],h=t.data(p,e);if(h)if(t.isFunction(h[n])&&"_"!==n.charAt(0)){var f=h[n].apply(h,s);if(void 0!==f)return f}else r("no such method '"+n+"' for "+e+" instance");else r("cannot call methods on "+e+" prior to initialization; "+"attempted to call '"+n+"'")}return this}return this.each(function(){var o=t.data(this,e);o?(o.option(n),o._init()):(o=new i(this,n),t.data(this,e,o))})}}if(t){var r="undefined"==typeof console?e:function(t){console.error(t)};return t.bridget=function(t,e){i(e),n(t,e)},t.bridget}}var o=Array.prototype.slice;"function"==typeof define&&define.amd?define("jquery-bridget/jquery.bridget",["jquery"],i):i(t.jQuery)})(window),function(t){function e(e){var i=t.event;return i.target=i.target||i.srcElement||e,i}var i=document.documentElement,o=function(){};i.addEventListener?o=function(t,e,i){t.addEventListener(e,i,!1)}:i.attachEvent&&(o=function(t,i,o){t[i+o]=o.handleEvent?function(){var i=e(t);o.handleEvent.call(o,i)}:function(){var i=e(t);o.call(t,i)},t.attachEvent("on"+i,t[i+o])});var n=function(){};i.removeEventListener?n=function(t,e,i){t.removeEventListener(e,i,!1)}:i.detachEvent&&(n=function(t,e,i){t.detachEvent("on"+e,t[e+i]);try{delete t[e+i]}catch(o){t[e+i]=void 0}});var r={bind:o,unbind:n};"function"==typeof define&&define.amd?define("eventie/eventie",r):"object"==typeof exports?module.exports=r:t.eventie=r}(this),function(t){function e(t){"function"==typeof t&&(e.isReady?t():r.push(t))}function i(t){var i="readystatechange"===t.type&&"complete"!==n.readyState;if(!e.isReady&&!i){e.isReady=!0;for(var o=0,s=r.length;s>o;o++){var a=r[o];a()}}}function o(o){return o.bind(n,"DOMContentLoaded",i),o.bind(n,"readystatechange",i),o.bind(t,"load",i),e}var n=t.document,r=[];e.isReady=!1,"function"==typeof define&&define.amd?(e.isReady="function"==typeof requirejs,define("doc-ready/doc-ready",["eventie/eventie"],o)):t.docReady=o(t.eventie)}(this),function(){function t(){}function e(t,e){for(var i=t.length;i--;)if(t[i].listener===e)return i;return-1}function i(t){return function(){return this[t].apply(this,arguments)}}var o=t.prototype,n=this,r=n.EventEmitter;o.getListeners=function(t){var e,i,o=this._getEvents();if(t instanceof RegExp){e={};for(i in o)o.hasOwnProperty(i)&&t.test(i)&&(e[i]=o[i])}else e=o[t]||(o[t]=[]);return e},o.flattenListeners=function(t){var e,i=[];for(e=0;t.length>e;e+=1)i.push(t[e].listener);return i},o.getListenersAsObject=function(t){var e,i=this.getListeners(t);return i instanceof Array&&(e={},e[t]=i),e||i},o.addListener=function(t,i){var o,n=this.getListenersAsObject(t),r="object"==typeof i;for(o in n)n.hasOwnProperty(o)&&-1===e(n[o],i)&&n[o].push(r?i:{listener:i,once:!1});return this},o.on=i("addListener"),o.addOnceListener=function(t,e){return this.addListener(t,{listener:e,once:!0})},o.once=i("addOnceListener"),o.defineEvent=function(t){return this.getListeners(t),this},o.defineEvents=function(t){for(var e=0;t.length>e;e+=1)this.defineEvent(t[e]);return this},o.removeListener=function(t,i){var o,n,r=this.getListenersAsObject(t);for(n in r)r.hasOwnProperty(n)&&(o=e(r[n],i),-1!==o&&r[n].splice(o,1));return this},o.off=i("removeListener"),o.addListeners=function(t,e){return this.manipulateListeners(!1,t,e)},o.removeListeners=function(t,e){return this.manipulateListeners(!0,t,e)},o.manipulateListeners=function(t,e,i){var o,n,r=t?this.removeListener:this.addListener,s=t?this.removeListeners:this.addListeners;if("object"!=typeof e||e instanceof RegExp)for(o=i.length;o--;)r.call(this,e,i[o]);else for(o in e)e.hasOwnProperty(o)&&(n=e[o])&&("function"==typeof n?r.call(this,o,n):s.call(this,o,n));return this},o.removeEvent=function(t){var e,i=typeof t,o=this._getEvents();if("string"===i)delete o[t];else if(t instanceof RegExp)for(e in o)o.hasOwnProperty(e)&&t.test(e)&&delete o[e];else delete this._events;return this},o.removeAllListeners=i("removeEvent"),o.emitEvent=function(t,e){var i,o,n,r,s=this.getListenersAsObject(t);for(n in s)if(s.hasOwnProperty(n))for(o=s[n].length;o--;)i=s[n][o],i.once===!0&&this.removeListener(t,i.listener),r=i.listener.apply(this,e||[]),r===this._getOnceReturnValue()&&this.removeListener(t,i.listener);return this},o.trigger=i("emitEvent"),o.emit=function(t){var e=Array.prototype.slice.call(arguments,1);return this.emitEvent(t,e)},o.setOnceReturnValue=function(t){return this._onceReturnValue=t,this},o._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},o._getEvents=function(){return this._events||(this._events={})},t.noConflict=function(){return n.EventEmitter=r,t},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return t}):"object"==typeof module&&module.exports?module.exports=t:this.EventEmitter=t}.call(this),function(t){function e(t){if(t){if("string"==typeof o[t])return t;t=t.charAt(0).toUpperCase()+t.slice(1);for(var e,n=0,r=i.length;r>n;n++)if(e=i[n]+t,"string"==typeof o[e])return e}}var i="Webkit Moz ms Ms O".split(" "),o=document.documentElement.style;"function"==typeof define&&define.amd?define("get-style-property/get-style-property",[],function(){return e}):"object"==typeof exports?module.exports=e:t.getStyleProperty=e}(window),function(t){function e(t){var e=parseFloat(t),i=-1===t.indexOf("%")&&!isNaN(e);return i&&e}function i(){for(var t={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},e=0,i=s.length;i>e;e++){var o=s[e];t[o]=0}return t}function o(t){function o(t){if("string"==typeof t&&(t=document.querySelector(t)),t&&"object"==typeof t&&t.nodeType){var o=r(t);if("none"===o.display)return i();var n={};n.width=t.offsetWidth,n.height=t.offsetHeight;for(var h=n.isBorderBox=!(!p||!o[p]||"border-box"!==o[p]),f=0,c=s.length;c>f;f++){var d=s[f],l=o[d];l=a(t,l);var y=parseFloat(l);n[d]=isNaN(y)?0:y}var m=n.paddingLeft+n.paddingRight,g=n.paddingTop+n.paddingBottom,v=n.marginLeft+n.marginRight,_=n.marginTop+n.marginBottom,I=n.borderLeftWidth+n.borderRightWidth,L=n.borderTopWidth+n.borderBottomWidth,z=h&&u,S=e(o.width);S!==!1&&(n.width=S+(z?0:m+I));var b=e(o.height);return b!==!1&&(n.height=b+(z?0:g+L)),n.innerWidth=n.width-(m+I),n.innerHeight=n.height-(g+L),n.outerWidth=n.width+v,n.outerHeight=n.height+_,n}}function a(t,e){if(n||-1===e.indexOf("%"))return e;var i=t.style,o=i.left,r=t.runtimeStyle,s=r&&r.left;return s&&(r.left=t.currentStyle.left),i.left=e,e=i.pixelLeft,i.left=o,s&&(r.left=s),e}var u,p=t("boxSizing");return function(){if(p){var t=document.createElement("div");t.style.width="200px",t.style.padding="1px 2px 3px 4px",t.style.borderStyle="solid",t.style.borderWidth="1px 2px 3px 4px",t.style[p]="border-box";var i=document.body||document.documentElement;i.appendChild(t);var o=r(t);u=200===e(o.width),i.removeChild(t)}}(),o}var n=t.getComputedStyle,r=n?function(t){return n(t,null)}:function(t){return t.currentStyle},s=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"];"function"==typeof define&&define.amd?define("get-size/get-size",["get-style-property/get-style-property"],o):"object"==typeof exports?module.exports=o(require("get-style-property")):t.getSize=o(t.getStyleProperty)}(window),function(t,e){function i(t,e){return t[a](e)}function o(t){if(!t.parentNode){var e=document.createDocumentFragment();e.appendChild(t)}}function n(t,e){o(t);for(var i=t.parentNode.querySelectorAll(e),n=0,r=i.length;r>n;n++)if(i[n]===t)return!0;return!1}function r(t,e){return o(t),i(t,e)}var s,a=function(){if(e.matchesSelector)return"matchesSelector";for(var t=["webkit","moz","ms","o"],i=0,o=t.length;o>i;i++){var n=t[i],r=n+"MatchesSelector";if(e[r])return r}}();if(a){var u=document.createElement("div"),p=i(u,"div");s=p?i:r}else s=n;"function"==typeof define&&define.amd?define("matches-selector/matches-selector",[],function(){return s}):window.matchesSelector=s}(this,Element.prototype),function(t){function e(t,e){for(var i in e)t[i]=e[i];return t}function i(t){for(var e in t)return!1;return e=null,!0}function o(t){return t.replace(/([A-Z])/g,function(t){return"-"+t.toLowerCase()})}function n(t,n,r){function a(t,e){t&&(this.element=t,this.layout=e,this.position={x:0,y:0},this._create())}var u=r("transition"),p=r("transform"),h=u&&p,f=!!r("perspective"),c={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"otransitionend",transition:"transitionend"}[u],d=["transform","transition","transitionDuration","transitionProperty"],l=function(){for(var t={},e=0,i=d.length;i>e;e++){var o=d[e],n=r(o);n&&n!==o&&(t[o]=n)}return t}();e(a.prototype,t.prototype),a.prototype._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}},this.css({position:"absolute"})},a.prototype.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},a.prototype.getSize=function(){this.size=n(this.element)},a.prototype.css=function(t){var e=this.element.style;for(var i in t){var o=l[i]||i;e[o]=t[i]}},a.prototype.getPosition=function(){var t=s(this.element),e=this.layout.options,i=e.isOriginLeft,o=e.isOriginTop,n=parseInt(t[i?"left":"right"],10),r=parseInt(t[o?"top":"bottom"],10);n=isNaN(n)?0:n,r=isNaN(r)?0:r;var a=this.layout.size;n-=i?a.paddingLeft:a.paddingRight,r-=o?a.paddingTop:a.paddingBottom,this.position.x=n,this.position.y=r},a.prototype.layoutPosition=function(){var t=this.layout.size,e=this.layout.options,i={};e.isOriginLeft?(i.left=this.position.x+t.paddingLeft+"px",i.right=""):(i.right=this.position.x+t.paddingRight+"px",i.left=""),e.isOriginTop?(i.top=this.position.y+t.paddingTop+"px",i.bottom=""):(i.bottom=this.position.y+t.paddingBottom+"px",i.top=""),this.css(i),this.emitEvent("layout",[this])};var y=f?function(t,e){return"translate3d("+t+"px, "+e+"px, 0)"}:function(t,e){return"translate("+t+"px, "+e+"px)"};a.prototype._transitionTo=function(t,e){this.getPosition();var i=this.position.x,o=this.position.y,n=parseInt(t,10),r=parseInt(e,10),s=n===this.position.x&&r===this.position.y;if(this.setPosition(t,e),s&&!this.isTransitioning)return this.layoutPosition(),void 0;var a=t-i,u=e-o,p={},h=this.layout.options;a=h.isOriginLeft?a:-a,u=h.isOriginTop?u:-u,p.transform=y(a,u),this.transition({to:p,onTransitionEnd:{transform:this.layoutPosition},isCleaning:!0})},a.prototype.goTo=function(t,e){this.setPosition(t,e),this.layoutPosition()},a.prototype.moveTo=h?a.prototype._transitionTo:a.prototype.goTo,a.prototype.setPosition=function(t,e){this.position.x=parseInt(t,10),this.position.y=parseInt(e,10)},a.prototype._nonTransition=function(t){this.css(t.to),t.isCleaning&&this._removeStyles(t.to);for(var e in t.onTransitionEnd)t.onTransitionEnd[e].call(this)},a.prototype._transition=function(t){if(!parseFloat(this.layout.options.transitionDuration))return this._nonTransition(t),void 0;var e=this._transn;for(var i in t.onTransitionEnd)e.onEnd[i]=t.onTransitionEnd[i];for(i in t.to)e.ingProperties[i]=!0,t.isCleaning&&(e.clean[i]=!0);if(t.from){this.css(t.from);var o=this.element.offsetHeight;o=null}this.enableTransition(t.to),this.css(t.to),this.isTransitioning=!0};var m=p&&o(p)+",opacity";a.prototype.enableTransition=function(){this.isTransitioning||(this.css({transitionProperty:m,transitionDuration:this.layout.options.transitionDuration}),this.element.addEventListener(c,this,!1))},a.prototype.transition=a.prototype[u?"_transition":"_nonTransition"],a.prototype.onwebkitTransitionEnd=function(t){this.ontransitionend(t)},a.prototype.onotransitionend=function(t){this.ontransitionend(t)};var g={"-webkit-transform":"transform","-moz-transform":"transform","-o-transform":"transform"};a.prototype.ontransitionend=function(t){if(t.target===this.element){var e=this._transn,o=g[t.propertyName]||t.propertyName;if(delete e.ingProperties[o],i(e.ingProperties)&&this.disableTransition(),o in e.clean&&(this.element.style[t.propertyName]="",delete e.clean[o]),o in e.onEnd){var n=e.onEnd[o];n.call(this),delete e.onEnd[o]}this.emitEvent("transitionEnd",[this])}},a.prototype.disableTransition=function(){this.removeTransitionStyles(),this.element.removeEventListener(c,this,!1),this.isTransitioning=!1},a.prototype._removeStyles=function(t){var e={};for(var i in t)e[i]="";this.css(e)};var v={transitionProperty:"",transitionDuration:""};return a.prototype.removeTransitionStyles=function(){this.css(v)},a.prototype.removeElem=function(){this.element.parentNode.removeChild(this.element),this.emitEvent("remove",[this])},a.prototype.remove=function(){if(!u||!parseFloat(this.layout.options.transitionDuration))return this.removeElem(),void 0;var t=this;this.on("transitionEnd",function(){return t.removeElem(),!0}),this.hide()},a.prototype.reveal=function(){delete this.isHidden,this.css({display:""});var t=this.layout.options;this.transition({from:t.hiddenStyle,to:t.visibleStyle,isCleaning:!0})},a.prototype.hide=function(){this.isHidden=!0,this.css({display:""});var t=this.layout.options;this.transition({from:t.visibleStyle,to:t.hiddenStyle,isCleaning:!0,onTransitionEnd:{opacity:function(){this.isHidden&&this.css({display:"none"})}}})},a.prototype.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})},a}var r=t.getComputedStyle,s=r?function(t){return r(t,null)}:function(t){return t.currentStyle};"function"==typeof define&&define.amd?define("outlayer/item",["eventEmitter/EventEmitter","get-size/get-size","get-style-property/get-style-property"],n):(t.Outlayer={},t.Outlayer.Item=n(t.EventEmitter,t.getSize,t.getStyleProperty))}(window),function(t){function e(t,e){for(var i in e)t[i]=e[i];return t}function i(t){return"[object Array]"===f.call(t)}function o(t){var e=[];if(i(t))e=t;else if(t&&"number"==typeof t.length)for(var o=0,n=t.length;n>o;o++)e.push(t[o]);else e.push(t);return e}function n(t,e){var i=d(e,t);-1!==i&&e.splice(i,1)}function r(t){return t.replace(/(.)([A-Z])/g,function(t,e,i){return e+"-"+i}).toLowerCase()}function s(i,s,f,d,l,y){function m(t,i){if("string"==typeof t&&(t=a.querySelector(t)),!t||!c(t))return u&&u.error("Bad "+this.constructor.namespace+" element: "+t),void 0;this.element=t,this.options=e({},this.constructor.defaults),this.option(i);var o=++g;this.element.outlayerGUID=o,v[o]=this,this._create(),this.options.isInitLayout&&this.layout()}var g=0,v={};return m.namespace="outlayer",m.Item=y,m.defaults={containerStyle:{position:"relative"},isInitLayout:!0,isOriginLeft:!0,isOriginTop:!0,isResizeBound:!0,isResizingContainer:!0,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}},e(m.prototype,f.prototype),m.prototype.option=function(t){e(this.options,t)},m.prototype._create=function(){this.reloadItems(),this.stamps=[],this.stamp(this.options.stamp),e(this.element.style,this.options.containerStyle),this.options.isResizeBound&&this.bindResize()},m.prototype.reloadItems=function(){this.items=this._itemize(this.element.children)},m.prototype._itemize=function(t){for(var e=this._filterFindItemElements(t),i=this.constructor.Item,o=[],n=0,r=e.length;r>n;n++){var s=e[n],a=new i(s,this);o.push(a)}return o},m.prototype._filterFindItemElements=function(t){t=o(t);for(var e=this.options.itemSelector,i=[],n=0,r=t.length;r>n;n++){var s=t[n];if(c(s))if(e){l(s,e)&&i.push(s);for(var a=s.querySelectorAll(e),u=0,p=a.length;p>u;u++)i.push(a[u])}else i.push(s)}return i},m.prototype.getItemElements=function(){for(var t=[],e=0,i=this.items.length;i>e;e++)t.push(this.items[e].element);return t},m.prototype.layout=function(){this._resetLayout(),this._manageStamps();var t=void 0!==this.options.isLayoutInstant?this.options.isLayoutInstant:!this._isLayoutInited;this.layoutItems(this.items,t),this._isLayoutInited=!0},m.prototype._init=m.prototype.layout,m.prototype._resetLayout=function(){this.getSize()},m.prototype.getSize=function(){this.size=d(this.element)},m.prototype._getMeasurement=function(t,e){var i,o=this.options[t];o?("string"==typeof o?i=this.element.querySelector(o):c(o)&&(i=o),this[t]=i?d(i)[e]:o):this[t]=0},m.prototype.layoutItems=function(t,e){t=this._getItemsForLayout(t),this._layoutItems(t,e),this._postLayout()},m.prototype._getItemsForLayout=function(t){for(var e=[],i=0,o=t.length;o>i;i++){var n=t[i];n.isIgnored||e.push(n)}return e},m.prototype._layoutItems=function(t,e){function i(){o.emitEvent("layoutComplete",[o,t])}var o=this;if(!t||!t.length)return i(),void 0;this._itemsOn(t,"layout",i);for(var n=[],r=0,s=t.length;s>r;r++){var a=t[r],u=this._getItemLayoutPosition(a);u.item=a,u.isInstant=e||a.isLayoutInstant,n.push(u)}this._processLayoutQueue(n)},m.prototype._getItemLayoutPosition=function(){return{x:0,y:0}},m.prototype._processLayoutQueue=function(t){for(var e=0,i=t.length;i>e;e++){var o=t[e];this._positionItem(o.item,o.x,o.y,o.isInstant)}},m.prototype._positionItem=function(t,e,i,o){o?t.goTo(e,i):t.moveTo(e,i)},m.prototype._postLayout=function(){this.resizeContainer()},m.prototype.resizeContainer=function(){if(this.options.isResizingContainer){var t=this._getContainerSize();t&&(this._setContainerMeasure(t.width,!0),this._setContainerMeasure(t.height,!1))}},m.prototype._getContainerSize=h,m.prototype._setContainerMeasure=function(t,e){if(void 0!==t){var i=this.size;i.isBorderBox&&(t+=e?i.paddingLeft+i.paddingRight+i.borderLeftWidth+i.borderRightWidth:i.paddingBottom+i.paddingTop+i.borderTopWidth+i.borderBottomWidth),t=Math.max(t,0),this.element.style[e?"width":"height"]=t+"px"}},m.prototype._itemsOn=function(t,e,i){function o(){return n++,n===r&&i.call(s),!0}for(var n=0,r=t.length,s=this,a=0,u=t.length;u>a;a++){var p=t[a];p.on(e,o)}},m.prototype.ignore=function(t){var e=this.getItem(t);e&&(e.isIgnored=!0)},m.prototype.unignore=function(t){var e=this.getItem(t);e&&delete e.isIgnored},m.prototype.stamp=function(t){if(t=this._find(t)){this.stamps=this.stamps.concat(t);for(var e=0,i=t.length;i>e;e++){var o=t[e];this.ignore(o)}}},m.prototype.unstamp=function(t){if(t=this._find(t))for(var e=0,i=t.length;i>e;e++){var o=t[e];n(o,this.stamps),this.unignore(o)}},m.prototype._find=function(t){return t?("string"==typeof t&&(t=this.element.querySelectorAll(t)),t=o(t)):void 0},m.prototype._manageStamps=function(){if(this.stamps&&this.stamps.length){this._getBoundingRect();for(var t=0,e=this.stamps.length;e>t;t++){var i=this.stamps[t];this._manageStamp(i)}}},m.prototype._getBoundingRect=function(){var t=this.element.getBoundingClientRect(),e=this.size;this._boundingRect={left:t.left+e.paddingLeft+e.borderLeftWidth,top:t.top+e.paddingTop+e.borderTopWidth,right:t.right-(e.paddingRight+e.borderRightWidth),bottom:t.bottom-(e.paddingBottom+e.borderBottomWidth)}},m.prototype._manageStamp=h,m.prototype._getElementOffset=function(t){var e=t.getBoundingClientRect(),i=this._boundingRect,o=d(t),n={left:e.left-i.left-o.marginLeft,top:e.top-i.top-o.marginTop,right:i.right-e.right-o.marginRight,bottom:i.bottom-e.bottom-o.marginBottom};return n},m.prototype.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},m.prototype.bindResize=function(){this.isResizeBound||(i.bind(t,"resize",this),this.isResizeBound=!0)},m.prototype.unbindResize=function(){this.isResizeBound&&i.unbind(t,"resize",this),this.isResizeBound=!1},m.prototype.onresize=function(){function t(){e.resize(),delete e.resizeTimeout}this.resizeTimeout&&clearTimeout(this.resizeTimeout);var e=this;this.resizeTimeout=setTimeout(t,100)},m.prototype.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&this.layout()},m.prototype.needsResizeLayout=function(){var t=d(this.element),e=this.size&&t;return e&&t.innerWidth!==this.size.innerWidth},m.prototype.addItems=function(t){var e=this._itemize(t);return e.length&&(this.items=this.items.concat(e)),e},m.prototype.appended=function(t){var e=this.addItems(t);e.length&&(this.layoutItems(e,!0),this.reveal(e))},m.prototype.prepended=function(t){var e=this._itemize(t);if(e.length){var i=this.items.slice(0);this.items=e.concat(i),this._resetLayout(),this._manageStamps(),this.layoutItems(e,!0),this.reveal(e),this.layoutItems(i)}},m.prototype.reveal=function(t){var e=t&&t.length;if(e)for(var i=0;e>i;i++){var o=t[i];o.reveal()}},m.prototype.hide=function(t){var e=t&&t.length;if(e)for(var i=0;e>i;i++){var o=t[i];o.hide()}},m.prototype.getItem=function(t){for(var e=0,i=this.items.length;i>e;e++){var o=this.items[e];if(o.element===t)return o}},m.prototype.getItems=function(t){if(t&&t.length){for(var e=[],i=0,o=t.length;o>i;i++){var n=t[i],r=this.getItem(n);r&&e.push(r)}return e}},m.prototype.remove=function(t){t=o(t);var e=this.getItems(t);if(e&&e.length){this._itemsOn(e,"remove",function(){this.emitEvent("removeComplete",[this,e])});for(var i=0,r=e.length;r>i;i++){var s=e[i];s.remove(),n(s,this.items)}}},m.prototype.destroy=function(){var t=this.element.style;t.height="",t.position="",t.width="";for(var e=0,i=this.items.length;i>e;e++){var o=this.items[e];o.destroy()}this.unbindResize(),delete this.element.outlayerGUID,p&&p.removeData(this.element,this.constructor.namespace)},m.data=function(t){var e=t&&t.outlayerGUID;return e&&v[e]},m.create=function(t,i){function o(){m.apply(this,arguments)}return Object.create?o.prototype=Object.create(m.prototype):e(o.prototype,m.prototype),o.prototype.constructor=o,o.defaults=e({},m.defaults),e(o.defaults,i),o.prototype.settings={},o.namespace=t,o.data=m.data,o.Item=function(){y.apply(this,arguments)},o.Item.prototype=new y,s(function(){for(var e=r(t),i=a.querySelectorAll(".js-"+e),n="data-"+e+"-options",s=0,h=i.length;h>s;s++){var f,c=i[s],d=c.getAttribute(n);try{f=d&&JSON.parse(d)}catch(l){u&&u.error("Error parsing "+n+" on "+c.nodeName.toLowerCase()+(c.id?"#"+c.id:"")+": "+l);continue}var y=new o(c,f);p&&p.data(c,t,y)}}),p&&p.bridget&&p.bridget(t,o),o},m.Item=y,m}var a=t.document,u=t.console,p=t.jQuery,h=function(){},f=Object.prototype.toString,c="object"==typeof HTMLElement?function(t){return t instanceof HTMLElement}:function(t){return t&&"object"==typeof t&&1===t.nodeType&&"string"==typeof t.nodeName},d=Array.prototype.indexOf?function(t,e){return t.indexOf(e)}:function(t,e){for(var i=0,o=t.length;o>i;i++)if(t[i]===e)return i;return-1};"function"==typeof define&&define.amd?define("outlayer/outlayer",["eventie/eventie","doc-ready/doc-ready","eventEmitter/EventEmitter","get-size/get-size","matches-selector/matches-selector","./item"],s):t.Outlayer=s(t.eventie,t.docReady,t.EventEmitter,t.getSize,t.matchesSelector,t.Outlayer.Item)}(window),function(t){function e(t){function e(){t.Item.apply(this,arguments)}return e.prototype=new t.Item,e.prototype._create=function(){this.id=this.layout.itemGUID++,t.Item.prototype._create.call(this),this.sortData={}},e.prototype.updateSortData=function(){if(!this.isIgnored){this.sortData.id=this.id,this.sortData["original-order"]=this.id,this.sortData.random=Math.random();var t=this.layout.options.getSortData,e=this.layout._sorters;for(var i in t){var o=e[i];this.sortData[i]=o(this.element,this)}}},e}"function"==typeof define&&define.amd?define("isotope/js/item",["outlayer/outlayer"],e):(t.Isotope=t.Isotope||{},t.Isotope.Item=e(t.Outlayer))}(window),function(t){function e(t,e){function i(t){this.isotope=t,t&&(this.options=t.options[this.namespace],this.element=t.element,this.items=t.filteredItems,this.size=t.size)}return function(){function t(t){return function(){return e.prototype[t].apply(this.isotope,arguments)}}for(var o=["_resetLayout","_getItemLayoutPosition","_manageStamp","_getContainerSize","_getElementOffset","needsResizeLayout"],n=0,r=o.length;r>n;n++){var s=o[n];i.prototype[s]=t(s)}}(),i.prototype.needsVerticalResizeLayout=function(){var e=t(this.isotope.element),i=this.isotope.size&&e;return i&&e.innerHeight!==this.isotope.size.innerHeight},i.prototype._getMeasurement=function(){this.isotope._getMeasurement.apply(this,arguments)},i.prototype.getColumnWidth=function(){this.getSegmentSize("column","Width")},i.prototype.getRowHeight=function(){this.getSegmentSize("row","Height")},i.prototype.getSegmentSize=function(t,e){var i=t+e,o="outer"+e;if(this._getMeasurement(i,o),!this[i]){var n=this.getFirstItemSize();this[i]=n&&n[o]||this.isotope.size["inner"+e]}},i.prototype.getFirstItemSize=function(){var e=this.isotope.filteredItems[0];return e&&e.element&&t(e.element)},i.prototype.layout=function(){this.isotope.layout.apply(this.isotope,arguments)},i.prototype.getSize=function(){this.isotope.getSize(),this.size=this.isotope.size},i.modes={},i.create=function(t,e){function o(){i.apply(this,arguments)}return o.prototype=new i,e&&(o.options=e),o.prototype.namespace=t,i.modes[t]=o,o},i}"function"==typeof define&&define.amd?define("isotope/js/layout-mode",["get-size/get-size","outlayer/outlayer"],e):(t.Isotope=t.Isotope||{},t.Isotope.LayoutMode=e(t.getSize,t.Outlayer))}(window),function(t){function e(t,e){var o=t.create("masonry");return o.prototype._resetLayout=function(){this.getSize(),this._getMeasurement("columnWidth","outerWidth"),this._getMeasurement("gutter","outerWidth"),this.measureColumns();var t=this.cols;for(this.colYs=[];t--;)this.colYs.push(0);this.maxY=0},o.prototype.measureColumns=function(){if(this.getContainerWidth(),!this.columnWidth){var t=this.items[0],i=t&&t.element;this.columnWidth=i&&e(i).outerWidth||this.containerWidth}this.columnWidth+=this.gutter,this.cols=Math.floor((this.containerWidth+this.gutter)/this.columnWidth),this.cols=Math.max(this.cols,1)},o.prototype.getContainerWidth=function(){var t=this.options.isFitWidth?this.element.parentNode:this.element,i=e(t);this.containerWidth=i&&i.innerWidth},o.prototype._getItemLayoutPosition=function(t){t.getSize();var e=t.size.outerWidth%this.columnWidth,o=e&&1>e?"round":"ceil",n=Math[o](t.size.outerWidth/this.columnWidth);n=Math.min(n,this.cols);for(var r=this._getColGroup(n),s=Math.min.apply(Math,r),a=i(r,s),u={x:this.columnWidth*a,y:s},p=s+t.size.outerHeight,h=this.cols+1-r.length,f=0;h>f;f++)this.colYs[a+f]=p;return u},o.prototype._getColGroup=function(t){if(2>t)return this.colYs;for(var e=[],i=this.cols+1-t,o=0;i>o;o++){var n=this.colYs.slice(o,o+t);e[o]=Math.max.apply(Math,n)}return e},o.prototype._manageStamp=function(t){var i=e(t),o=this._getElementOffset(t),n=this.options.isOriginLeft?o.left:o.right,r=n+i.outerWidth,s=Math.floor(n/this.columnWidth);s=Math.max(0,s);var a=Math.floor(r/this.columnWidth);a-=r%this.columnWidth?0:1,a=Math.min(this.cols-1,a);for(var u=(this.options.isOriginTop?o.top:o.bottom)+i.outerHeight,p=s;a>=p;p++)this.colYs[p]=Math.max(u,this.colYs[p])},o.prototype._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var t={height:this.maxY};return this.options.isFitWidth&&(t.width=this._getContainerFitWidth()),t},o.prototype._getContainerFitWidth=function(){for(var t=0,e=this.cols;--e&&0===this.colYs[e];)t++;return(this.cols-t)*this.columnWidth-this.gutter},o.prototype.needsResizeLayout=function(){var t=this.containerWidth;return this.getContainerWidth(),t!==this.containerWidth},o}var i=Array.prototype.indexOf?function(t,e){return t.indexOf(e)}:function(t,e){for(var i=0,o=t.length;o>i;i++){var n=t[i];if(n===e)return i}return-1};"function"==typeof define&&define.amd?define("masonry/masonry",["outlayer/outlayer","get-size/get-size"],e):t.Masonry=e(t.Outlayer,t.getSize)}(window),function(t){function e(t,e){for(var i in e)t[i]=e[i];return t}function i(t,i){var o=t.create("masonry"),n=o.prototype._getElementOffset,r=o.prototype.layout,s=o.prototype._getMeasurement;e(o.prototype,i.prototype),o.prototype._getElementOffset=n,o.prototype.layout=r,o.prototype._getMeasurement=s;var a=o.prototype.measureColumns;o.prototype.measureColumns=function(){this.items=this.isotope.filteredItems,a.call(this)};var u=o.prototype._manageStamp;return o.prototype._manageStamp=function(){this.options.isOriginLeft=this.isotope.options.isOriginLeft,this.options.isOriginTop=this.isotope.options.isOriginTop,u.apply(this,arguments)},o}"function"==typeof define&&define.amd?define("isotope/js/layout-modes/masonry",["../layout-mode","masonry/masonry"],i):i(t.Isotope.LayoutMode,t.Masonry)}(window),function(t){function e(t){var e=t.create("fitRows");return e.prototype._resetLayout=function(){this.x=0,this.y=0,this.maxY=0},e.prototype._getItemLayoutPosition=function(t){t.getSize(),0!==this.x&&t.size.outerWidth+this.x>this.isotope.size.innerWidth&&(this.x=0,this.y=this.maxY);var e={x:this.x,y:this.y};return this.maxY=Math.max(this.maxY,this.y+t.size.outerHeight),this.x+=t.size.outerWidth,e},e.prototype._getContainerSize=function(){return{height:this.maxY}},e}"function"==typeof define&&define.amd?define("isotope/js/layout-modes/fit-rows",["../layout-mode"],e):e(t.Isotope.LayoutMode)}(window),function(t){function e(t){var e=t.create("vertical",{horizontalAlignment:0});return e.prototype._resetLayout=function(){this.y=0},e.prototype._getItemLayoutPosition=function(t){t.getSize();var e=(this.isotope.size.innerWidth-t.size.outerWidth)*this.options.horizontalAlignment,i=this.y;return this.y+=t.size.outerHeight,{x:e,y:i}},e.prototype._getContainerSize=function(){return{height:this.y}},e}"function"==typeof define&&define.amd?define("isotope/js/layout-modes/vertical",["../layout-mode"],e):e(t.Isotope.LayoutMode)}(window),function(t){function e(t,e){for(var i in e)t[i]=e[i];return t}function i(t){return"[object Array]"===h.call(t)}function o(t){var e=[];if(i(t))e=t;else if(t&&"number"==typeof t.length)for(var o=0,n=t.length;n>o;o++)e.push(t[o]);else e.push(t);return e}function n(t,e){var i=f(e,t);-1!==i&&e.splice(i,1)}function r(t,i,r,u,h){function f(t,e){return function(i,o){for(var n=0,r=t.length;r>n;n++){var s=t[n],a=i.sortData[s],u=o.sortData[s];if(a>u||u>a){var p=void 0!==e[s]?e[s]:e,h=p?1:-1;return(a>u?1:-1)*h}}return 0}}var c=t.create("isotope",{layoutMode:"masonry",isJQueryFiltering:!0,sortAscending:!0});c.Item=u,c.LayoutMode=h,c.prototype._create=function(){this.itemGUID=0,this._sorters={},this._getSorters(),t.prototype._create.call(this),this.modes={},this.filteredItems=this.items,this.sortHistory=["original-order"];for(var e in h.modes)this._initLayoutMode(e)},c.prototype.reloadItems=function(){this.itemGUID=0,t.prototype.reloadItems.call(this)},c.prototype._itemize=function(){for(var e=t.prototype._itemize.apply(this,arguments),i=0,o=e.length;o>i;i++){var n=e[i];n.id=this.itemGUID++}return this._updateItemsSortData(e),e},c.prototype._initLayoutMode=function(t){var i=h.modes[t],o=this.options[t]||{};this.options[t]=i.options?e(i.options,o):o,this.modes[t]=new i(this)},c.prototype.layout=function(){return!this._isLayoutInited&&this.options.isInitLayout?(this.arrange(),void 0):(this._layout(),void 0)},c.prototype._layout=function(){var t=this._getIsInstant();this._resetLayout(),this._manageStamps(),this.layoutItems(this.filteredItems,t),this._isLayoutInited=!0},c.prototype.arrange=function(t){this.option(t),this._getIsInstant(),this.filteredItems=this._filter(this.items),this._sort(),this._layout()},c.prototype._init=c.prototype.arrange,c.prototype._getIsInstant=function(){var t=void 0!==this.options.isLayoutInstant?this.options.isLayoutInstant:!this._isLayoutInited;return this._isInstant=t,t},c.prototype._filter=function(t){function e(){f.reveal(n),f.hide(r)}var i=this.options.filter;i=i||"*";for(var o=[],n=[],r=[],s=this._getFilterTest(i),a=0,u=t.length;u>a;a++){var p=t[a];if(!p.isIgnored){var h=s(p);h&&o.push(p),h&&p.isHidden?n.push(p):h||p.isHidden||r.push(p)}}var f=this;return this._isInstant?this._noTransition(e):e(),o},c.prototype._getFilterTest=function(t){return s&&this.options.isJQueryFiltering?function(e){return s(e.element).is(t)}:"function"==typeof t?function(e){return t(e.element)}:function(e){return r(e.element,t)}},c.prototype.updateSortData=function(t){this._getSorters(),t=o(t);var e=this.getItems(t);e=e.length?e:this.items,this._updateItemsSortData(e)
},c.prototype._getSorters=function(){var t=this.options.getSortData;for(var e in t){var i=t[e];this._sorters[e]=d(i)}},c.prototype._updateItemsSortData=function(t){for(var e=0,i=t.length;i>e;e++){var o=t[e];o.updateSortData()}};var d=function(){function t(t){if("string"!=typeof t)return t;var i=a(t).split(" "),o=i[0],n=o.match(/^\[(.+)\]$/),r=n&&n[1],s=e(r,o),u=c.sortDataParsers[i[1]];return t=u?function(t){return t&&u(s(t))}:function(t){return t&&s(t)}}function e(t,e){var i;return i=t?function(e){return e.getAttribute(t)}:function(t){var i=t.querySelector(e);return i&&p(i)}}return t}();c.sortDataParsers={parseInt:function(t){return parseInt(t,10)},parseFloat:function(t){return parseFloat(t)}},c.prototype._sort=function(){var t=this.options.sortBy;if(t){var e=[].concat.apply(t,this.sortHistory),i=f(e,this.options.sortAscending);this.filteredItems.sort(i),t!==this.sortHistory[0]&&this.sortHistory.unshift(t)}},c.prototype._mode=function(){var t=this.options.layoutMode,e=this.modes[t];if(!e)throw Error("No layout mode: "+t);return e.options=this.options[t],e},c.prototype._resetLayout=function(){t.prototype._resetLayout.call(this),this._mode()._resetLayout()},c.prototype._getItemLayoutPosition=function(t){return this._mode()._getItemLayoutPosition(t)},c.prototype._manageStamp=function(t){this._mode()._manageStamp(t)},c.prototype._getContainerSize=function(){return this._mode()._getContainerSize()},c.prototype.needsResizeLayout=function(){return this._mode().needsResizeLayout()},c.prototype.appended=function(t){var e=this.addItems(t);if(e.length){var i=this._filterRevealAdded(e);this.filteredItems=this.filteredItems.concat(i)}},c.prototype.prepended=function(t){var e=this._itemize(t);if(e.length){var i=this.items.slice(0);this.items=e.concat(i),this._resetLayout(),this._manageStamps();var o=this._filterRevealAdded(e);this.layoutItems(i),this.filteredItems=o.concat(this.filteredItems)}},c.prototype._filterRevealAdded=function(t){var e=this._noTransition(function(){return this._filter(t)});return this.layoutItems(e,!0),this.reveal(e),t},c.prototype.insert=function(t){var e=this.addItems(t);if(e.length){var i,o,n=e.length;for(i=0;n>i;i++)o=e[i],this.element.appendChild(o.element);var r=this._filter(e);for(this._noTransition(function(){this.hide(r)}),i=0;n>i;i++)e[i].isLayoutInstant=!0;for(this.arrange(),i=0;n>i;i++)delete e[i].isLayoutInstant;this.reveal(r)}};var l=c.prototype.remove;return c.prototype.remove=function(t){t=o(t);var e=this.getItems(t);if(l.call(this,t),e&&e.length)for(var i=0,r=e.length;r>i;i++){var s=e[i];n(s,this.filteredItems)}},c.prototype._noTransition=function(t){var e=this.options.transitionDuration;this.options.transitionDuration=0;var i=t.call(this);return this.options.transitionDuration=e,i},c}var s=t.jQuery,a=String.prototype.trim?function(t){return t.trim()}:function(t){return t.replace(/^\s+|\s+$/g,"")},u=document.documentElement,p=u.textContent?function(t){return t.textContent}:function(t){return t.innerText},h=Object.prototype.toString,f=Array.prototype.indexOf?function(t,e){return t.indexOf(e)}:function(t,e){for(var i=0,o=t.length;o>i;i++)if(t[i]===e)return i;return-1};"function"==typeof define&&define.amd?define(["outlayer/outlayer","get-size/get-size","matches-selector/matches-selector","isotope/js/item","isotope/js/layout-mode","isotope/js/layout-modes/masonry","isotope/js/layout-modes/fit-rows","isotope/js/layout-modes/vertical"],r):t.Isotope=r(t.Outlayer,t.getSize,t.matchesSelector,t.Isotope.Item,t.Isotope.LayoutMode)}(window);

(function(f){"function"===typeof define&&define.amd?define(["jquery"],f):f(jQuery)})(function(f){if(void 0===f.fn.inputmask){var U=function(f){var e=document.createElement("input");f="on"+f;var d=f in e;d||(e.setAttribute(f,"return;"),d="function"==typeof e[f]);return d},D=function(c,e,d){return(c=d.aliases[c])?(c.alias&&D(c.alias,void 0,d),f.extend(!0,d,c),f.extend(!0,d,e),!0):!1},R=function(c,e){function d(d){function f(d,e,c,g){this.matches=[];this.isGroup=d||!1;this.isOptional=e||!1;this.isQuantifier=
c||!1;this.isAlternator=g||!1;this.quantifier={min:1,max:1}}function e(d,f,g){var h=c.definitions[f],k=0==d.matches.length;g=void 0!=g?g:d.matches.length;if(h&&!q){for(var H=h.prevalidator,u=H?H.length:0,s=1;s<h.cardinality;s++){var v=u>=s?H[s-1]:[],r=v.validator,v=v.cardinality;d.matches.splice(g++,0,{fn:r?"string"==typeof r?RegExp(r):new function(){this.test=r}:/./,cardinality:v?v:1,optionality:d.isOptional,newBlockMarker:k,casing:h.casing,def:h.definitionSymbol||f,placeholder:h.placeholder,mask:f})}d.matches.splice(g++,
0,{fn:h.validator?"string"==typeof h.validator?RegExp(h.validator):new function(){this.test=h.validator}:/./,cardinality:h.cardinality,optionality:d.isOptional,newBlockMarker:k,casing:h.casing,def:h.definitionSymbol||f,placeholder:h.placeholder,mask:f})}else d.matches.splice(g++,0,{fn:null,cardinality:0,optionality:d.isOptional,newBlockMarker:k,casing:null,def:f,placeholder:void 0,mask:f}),q=!1}for(var k=/(?:[?*+]|\{[0-9\+\*]+(?:,[0-9\+\*]*)?\})\??|[^.?*+^${[]()|\\]+|./g,q=!1,s=new f,g,v=[],y=[],
u,h;g=k.exec(d);)switch(g=g[0],g.charAt(0)){case c.optionalmarker.end:case c.groupmarker.end:g=v.pop();if(0<v.length){if(u=v[v.length-1],u.matches.push(g),u.isAlternator){g=v.pop();for(u=0;u<g.matches.length;u++)g.matches[u].isGroup=!1;0<v.length?(u=v[v.length-1],u.matches.push(g)):s.matches.push(g)}}else s.matches.push(g);break;case c.optionalmarker.start:v.push(new f(!1,!0));break;case c.groupmarker.start:v.push(new f(!0));break;case c.quantifiermarker.start:u=new f(!1,!1,!0);g=g.replace(/[{}]/g,
"");h=g.split(",");g=isNaN(h[0])?h[0]:parseInt(h[0]);h=1==h.length?g:isNaN(h[1])?h[1]:parseInt(h[1]);if("*"==h||"+"==h)g="*"==h?0:1;u.quantifier={min:g,max:h};if(0<v.length){h=v[v.length-1].matches;g=h.pop();if(!g.isGroup){var z=new f(!0);z.matches.push(g);g=z}h.push(g);h.push(u)}else g=s.matches.pop(),g.isGroup||(z=new f(!0),z.matches.push(g),g=z),s.matches.push(g),s.matches.push(u);break;case c.escapeChar:q=!0;break;case c.alternatormarker:0<v.length?(u=v[v.length-1],h=u.matches.pop()):h=s.matches.pop();
h.isAlternator?v.push(h):(g=new f(!1,!1,!1,!0),g.matches.push(h),v.push(g));break;default:if(0<v.length){if(u=v[v.length-1],0<u.matches.length&&(h=u.matches[u.matches.length-1],h.isGroup&&(h.isGroup=!1,e(h,c.groupmarker.start,0),e(h,c.groupmarker.end))),e(u,g),u.isAlternator){g=v.pop();for(u=0;u<g.matches.length;u++)g.matches[u].isGroup=!1;0<v.length?(u=v[v.length-1],u.matches.push(g)):s.matches.push(g)}}else 0<s.matches.length&&(h=s.matches[s.matches.length-1],h.isGroup&&(h.isGroup=!1,e(h,c.groupmarker.start,
0),e(h,c.groupmarker.end))),e(s,g)}0<s.matches.length&&(h=s.matches[s.matches.length-1],h.isGroup&&(h.isGroup=!1,e(h,c.groupmarker.start,0),e(h,c.groupmarker.end)),y.push(s));return y}function y(e,k){if(c.numericInput&&!0!==c.multi){e=e.split("").reverse();for(var q=0;q<e.length;q++)e[q]==c.optionalmarker.start?e[q]=c.optionalmarker.end:e[q]==c.optionalmarker.end?e[q]=c.optionalmarker.start:e[q]==c.groupmarker.start?e[q]=c.groupmarker.end:e[q]==c.groupmarker.end&&(e[q]=c.groupmarker.start);e=e.join("")}if(void 0!=
e&&""!=e){if(0<c.repeat||"*"==c.repeat||"+"==c.repeat)e=c.groupmarker.start+e+c.groupmarker.end+c.quantifiermarker.start+("*"==c.repeat?0:"+"==c.repeat?1:c.repeat)+","+c.repeat+c.quantifiermarker.end;void 0==f.inputmask.masksCache[e]&&(f.inputmask.masksCache[e]={mask:e,maskToken:d(e),validPositions:{},_buffer:void 0,buffer:void 0,tests:{},metadata:k});return f.extend(!0,{},f.inputmask.masksCache[e])}}var z=[];f.isFunction(c.mask)&&(c.mask=c.mask.call(this,c));if(f.isArray(c.mask))if(e)f.each(c.mask,
function(d,e){void 0==e.mask||f.isFunction(e.mask)?z.push(y(e.toString())):z.push(y(e.mask.toString(),e))});else{c.keepStatic=void 0==c.keepStatic?!0:c.keepStatic;var q=!1,k="(";f.each(c.mask,function(d,e){1<k.length&&(k+=")|(");void 0==e.mask||f.isFunction(e.mask)?k+=e.toString():(q=!0,k+=e.mask.toString())});k+=")";z=y(k,q?c.mask:void 0)}else 1==c.mask.length&&!1==c.greedy&&0!=c.repeat&&(c.placeholder=""),z=void 0==c.mask.mask||f.isFunction(c.mask.mask)?y(c.mask.toString()):y(c.mask.mask.toString(),
c.mask);return z},fa="function"===typeof ScriptEngineMajorVersion?ScriptEngineMajorVersion():10<=(new Function("/*@cc_on return @_jscript_version; @*/"))(),w=navigator.userAgent,ka=null!==w.match(/iphone/i),la=null!==w.match(/android.*safari.*/i),ma=null!==w.match(/android.*chrome.*/i),na=null!==w.match(/android.*firefox.*/i),oa=/Kindle/i.test(w)||/Silk/i.test(w)||/KFTT/i.test(w)||/KFOT/i.test(w)||/KFJWA/i.test(w)||/KFJWI/i.test(w)||/KFSOWI/i.test(w)||/KFTHWA/i.test(w)||/KFTHWI/i.test(w)||/KFAPWA/i.test(w)||
/KFAPWI/i.test(w),Z=U("paste")?"paste":U("input")?"input":"propertychange",K=function(c,e,d){function y(a,b,n){b=b||0;var f=[],c,g=0,p;do{if(!0===a&&e.validPositions[g]){var l=e.validPositions[g];p=l.match;c=l.locator.slice();f.push(null==p.fn?p.def:!0===n?l.input:p.placeholder||d.placeholder.charAt(g%d.placeholder.length))}else c=b>g?L(g,c,g-1)[0]:w(g,c,g-1),p=c.match,c=c.locator.slice(),f.push(null==p.fn?p.def:void 0!=p.placeholder?p.placeholder:d.placeholder.charAt(g%d.placeholder.length));g++}while((void 0==
M||g-1<M)&&null!=p.fn||null==p.fn&&""!=p.def||b>=g);f.pop();return f}function z(a){var b=e;b.buffer=void 0;b.tests={};!0!==a&&(b._buffer=void 0,b.validPositions={},b.p=0)}function q(a){var b=-1,n=e.validPositions;void 0==a&&(a=-1);var d=b,f;for(f in n){var g=parseInt(f);if(-1==a||null!=n[g].match.fn)g<a&&(d=g),g>=a&&(b=g)}return 1<a-d||b<a?d:b}function k(a,b,n){if(d.insertMode&&void 0!=e.validPositions[a]&&void 0==n){n=f.extend(!0,{},e.validPositions);var g=q(),c;for(c=a;c<=g;c++)delete e.validPositions[c];
e.validPositions[a]=b;b=!0;for(c=a;c<=g;c++){a=n[c];if(void 0!=a){var x=null==a.match.fn?c+1:C(c);b=K(x,a.match.def)?b&&!1!==u(x,a.input,!0,!0):!1}if(!b)break}if(!b)return e.validPositions=f.extend(!0,{},n),!1}else e.validPositions[a]=b;return!0}function H(a,b){var d,f=a;for(d=a;d<b;d++)delete e.validPositions[d];for(d=b;d<=q();){var c=e.validPositions[d],g=e.validPositions[f];void 0!=c&&void 0==g?(K(f,c.match.def)&&!1!==u(f,c.input,!0)&&(delete e.validPositions[d],d++),f++):d++}for(d=q();0<d&&(void 0==
e.validPositions[d]||null==e.validPositions[d].match.fn);)delete e.validPositions[d],d--;z(!0)}function w(a,b,n){a=L(a,b,n);var c;b=q();b=e.validPositions[b]||L(0)[0];n=void 0!=b.alternation?b.locator[b.alternation].split(","):[];for(var g=0;g<a.length&&(c=a[g],!d.greedy&&(!c.match||!1!==c.match.optionality&&!1!==c.match.newBlockMarker||!0===c.match.optionalQuantifier||void 0!=b.alternation&&(void 0==c.locator[b.alternation]||-1!=f.inArray(c.locator[b.alternation].toString(),n))));g++);return c}function D(a){return e.validPositions[a]?
e.validPositions[a].match:L(a)[0].match}function K(a,b){for(var d=!1,f=L(a),e=0;e<f.length;e++)if(f[e].match&&f[e].match.def==b){d=!0;break}return d}function L(a,b,n){function c(b,n,g,h){function t(g,h,k){if(1E4<x)return alert("jquery.inputmask: There is probably an error in your mask definition or in the code. Create an issue on github with an example of the mask you are using. "+e.mask),!0;if(x==a&&void 0==g.matches)return p.push({match:g,locator:h.reverse()}),!0;if(void 0!=g.matches)if(g.isGroup&&
!0!==k){if(g=t(b.matches[m+1],h))return!0}else if(g.isOptional){var q=g;if(g=c(g,n,h,k))g=p[p.length-1].match,(g=0==f.inArray(g,q.matches))&&(l=!0),x=a}else if(g.isAlternator){var q=g,u=[],s,v=p.slice(),r=h.length,N=0<n.length?n.shift():-1;if(-1==N||"string"==typeof N){var z=x,y=n.slice(),ba;"string"==typeof N&&(ba=N.split(","));for(var w=0;w<q.matches.length;w++){p=[];g=t(q.matches[w],[w].concat(h),k)||g;s=p.slice();x=z;p=[];for(var A=0;A<y.length;A++)n[A]=y[A];for(A=0;A<s.length;A++)for(var B=s[A],
H=0;H<u.length;H++){var C=u[H];if(B.match.mask==C.match.mask&&("string"!=typeof N||-1!=f.inArray(B.locator[r].toString(),ba))){s.splice(A,1);C.locator[r]=C.locator[r]+","+B.locator[r];C.alternation=r;break}}u=u.concat(s)}"string"==typeof N&&(u=f.map(u,function(a,b){if(isFinite(b)){var d=a.locator[r].toString().split(","),n;a.locator[r]=void 0;a.alternation=void 0;for(var e=0;e<d.length;e++)if(n=-1!=f.inArray(d[e],ba))void 0!=a.locator[r]?(a.locator[r]+=",",a.alternation=r,a.locator[r]+=d[e]):a.locator[r]=
parseInt(d[e]);if(void 0!=a.locator[r])return a}}));p=v.concat(u);l=!0}else g=t(q.matches[N],[N].concat(h),k);if(g)return!0}else if(g.isQuantifier&&!0!==k)for(q=g,d.greedy=d.greedy&&isFinite(q.quantifier.max),k=0<n.length&&!0!==k?n.shift():0;k<(isNaN(q.quantifier.max)?k+1:q.quantifier.max)&&x<=a;k++){if(u=b.matches[f.inArray(q,b.matches)-1],g=t(u,[k].concat(h),!0))if(g=p[p.length-1].match,g.optionalQuantifier=k>q.quantifier.min-1,g=0==f.inArray(g,u.matches))if(k>q.quantifier.min-1){l=!0;x=a;break}else return!0;
else return!0}else{if(g=c(g,n,h,k))return!0}else x++}for(var m=0<n.length?n.shift():0;m<b.matches.length;m++)if(!0!==b.matches[m].isQuantifier){var k=t(b.matches[m],[m].concat(g),h);if(k&&x==a)return k;if(x>a)break}}var g=e.maskToken,x=b?n:0;n=b||[0];var p=[],l=!1;if(void 0==b){b=a-1;for(var h;void 0==(h=e.validPositions[b])&&-1<b;)b--;if(void 0!=h&&-1<b)x=b,n=h.locator.slice();else{for(b=a-1;void 0==(h=e.tests[b])&&-1<b;)b--;void 0!=h&&-1<b&&(x=b,n=h[0].locator.slice())}}for(b=n.shift();b<g.length&&
!(c(g[b],n,[b])&&x==a||x>a);b++);(0==p.length||l)&&p.push({match:{fn:null,cardinality:0,optionality:!0,casing:null,def:""},locator:[]});e.tests[a]=f.extend(!0,[],p);return e.tests[a]}function s(){void 0==e._buffer&&(e._buffer=y(!1,1));return e._buffer}function g(){void 0==e.buffer&&(e.buffer=y(!0,q(),!0));return e.buffer}function v(a,b){var n=g().slice();if(!0===a)z(),a=0,b=n.length;else for(var f=a;f<b;f++)delete e.validPositions[f],delete e.tests[f];for(f=a;f<b;f++)n[f]!=d.skipOptionalPartCharacter&&
u(f,n[f],!0,!0)}function R(a,b){switch(b.casing){case "upper":a=a.toUpperCase();break;case "lower":a=a.toLowerCase()}return a}function u(a,b,n,c){function t(a,b,n,c){var l=!1;f.each(L(a),function(p,h){var F=h.match,x=b?1:0,t="";g();for(var m=F.cardinality;m>x;m--)t+=void 0==e.validPositions[a-(m-1)]?W(a-(m-1)):e.validPositions[a-(m-1)].input;b&&(t+=b);l=null!=F.fn?F.fn.test(t,e,a,n,d):b!=F.def&&b!=d.skipOptionalPartCharacter||""==F.def?!1:{c:F.def,pos:a};if(!1!==l){x=void 0!=l.c?l.c:b;x=x==d.skipOptionalPartCharacter&&
null===F.fn?F.def:x;t=a;void 0!=l.remove&&H(l.remove,l.remove+1);if(l.refreshFromBuffer){t=l.refreshFromBuffer;n=!0;v(!0===t?t:t.start,t.end);if(void 0==l.pos&&void 0==l.c)return l.pos=q(),!1;t=void 0!=l.pos?l.pos:a;if(t!=a)return l=f.extend(l,u(t,x,!0)),!1}else if(!0!==l&&void 0!=l.pos&&l.pos!=a&&(t=l.pos,v(a,t),t!=a))return l=f.extend(l,u(t,x,!0)),!1;if(!0!=l&&void 0==l.pos&&void 0==l.c)return!1;0<p&&z(!0);k(t,f.extend({},h,{input:R(x,F)}),c)||(l=!1);return!1}});return l}function x(a,b,n,c){if(d.keepStatic){var l=
f.extend(!0,{},e.validPositions),p,t;for(p=q();0<=p;p--)if(e.validPositions[p]&&void 0!=e.validPositions[p].alternation){t=e.validPositions[p].alternation;break}if(void 0!=t)for(var h in e.validPositions)if(parseInt(h)>parseInt(p)&&void 0===e.validPositions[h].alternation){var F=e.validPositions[h].locator[t];p=e.validPositions[p].locator[t].split(",");for(var x=0;x<p.length;x++)if(F<p[x]){for(var k,m,r=h-1;0<=r;r--)if(k=e.validPositions[r],void 0!=k){m=k.locator[t];k.locator[t]=p[x];break}if(F!=
k.locator[t]){for(var r=g().slice(),s=h;s<q()+1;s++)delete e.validPositions[s],delete e.tests[s];z(!0);d.keepStatic=!d.keepStatic;for(s=h;s<r.length;s++)r[s]!=d.skipOptionalPartCharacter&&u(q()+1,r[s],!1,!0);k.locator[t]=m;r=q()+1==a&&u(a,b,n,c);d.keepStatic=!d.keepStatic;if(r)return r;z();e.validPositions=f.extend(!0,{},l)}}break}}return!1}n=!0===n;for(var p=g(),l=a-1;-1<l&&(!e.validPositions[l]||null!=e.validPositions[l].match.fn);l--)void 0==e.validPositions[l]&&(!h(l)||p[l]!=W(l))&&1<L(l).length&&
t(l,p[l],!0);p=a;if(p>=Q())if(c){if(z(!0),p>=Q())return x(a,b,n,c)}else return x(a,b,n,c);a=t(p,b,n,c);if(!n&&!1===a)if((l=e.validPositions[p])&&null==l.match.fn&&(l.match.def==b||b==d.skipOptionalPartCharacter))a={caret:C(p)};else if((d.insertMode||void 0==e.validPositions[C(p)])&&!h(p))for(var l=p+1,m=C(p);l<=m;l++)if(a=t(l,b,n,c),!1!==a){p=l;break}!0===a&&(a={pos:p});return a}function h(a){a=D(a);return null!=a.fn?a.fn:!1}function Q(){var a;M=m.prop("maxLength");-1==M&&(M=void 0);if(!1==d.greedy){var b;
b=q();a=e.validPositions[b];var n=void 0!=a?a.locator.slice():void 0;for(b+=1;void 0==a||null!=a.match.fn||null==a.match.fn&&""!=a.match.def;b++)a=w(b,n,b-1),n=a.locator.slice();a=b}else a=g().length;return void 0==M||a<M?a:M}function C(a){var b=Q();if(a>=b)return b;for(;++a<b&&!h(a)&&(!0!==d.nojumps||d.nojumpsThreshold>a););return a}function V(a){if(0>=a)return 0;for(;0<--a&&!h(a););return a}function E(a,b,d){a._valueSet(b.join(""));void 0!=d&&r(a,d)}function W(a,b){b=b||D(a);return b.placeholder||
(null==b.fn?b.def:d.placeholder.charAt(a%d.placeholder.length))}function S(a,b,n,c,t){c=void 0!=c?c.slice():ja(a._valueGet()).split("");z();b&&a._valueSet("");f.each(c,function(b,d){if(!0===t){var g=q(),c=-1==g?b:C(g);-1==f.inArray(d,s().slice(g+1,c))&&X.call(a,void 0,!0,d.charCodeAt(0),!1,n,b)}else X.call(a,void 0,!0,d.charCodeAt(0),!1,n,b),n=n||0<b&&b>e.p});b&&(b=d.onKeyPress.call(this,void 0,g(),0,d),$(a,b),E(a,g(),f(a).is(":focus")?C(q(0)):void 0))}function U(a){return f.inputmask.escapeRegex.call(this,
a)}function ja(a){return a.replace(RegExp("("+U(s().join(""))+")*$"),"")}function ea(a){if(a.data("_inputmask")&&!a.hasClass("hasDatepicker")){var b=[],n=e.validPositions,c;for(c in n)n[c].match&&null!=n[c].match.fn&&b.push(n[c].input);b=(A?b.reverse():b).join("");n=(A?g().slice().reverse():g()).join("");f.isFunction(d.onUnMask)&&(b=d.onUnMask.call(a,n,b,d));return b}return a[0]._valueGet()}function P(a){!A||"number"!=typeof a||d.greedy&&""==d.placeholder||(a=g().length-a);return a}function r(a,b,
n){a=a.jquery&&0<a.length?a[0]:a;if("number"==typeof b){b=P(b);n=P(n);n="number"==typeof n?n:b;var e=f(a).data("_inputmask")||{};e.caret={begin:b,end:n};f(a).data("_inputmask",e);f(a).is(":visible")&&(a.scrollLeft=a.scrollWidth,!1==d.insertMode&&b==n&&n++,a.setSelectionRange?(a.selectionStart=b,a.selectionEnd=n):a.createTextRange&&(a=a.createTextRange(),a.collapse(!0),a.moveEnd("character",n),a.moveStart("character",b),a.select()))}else return e=f(a).data("_inputmask"),!f(a).is(":visible")&&e&&void 0!=
e.caret?(b=e.caret.begin,n=e.caret.end):a.setSelectionRange?(b=a.selectionStart,n=a.selectionEnd):document.selection&&document.selection.createRange&&(a=document.selection.createRange(),b=0-a.duplicate().moveStart("character",-1E5),n=b+a.text.length),b=P(b),n=P(n),{begin:b,end:n}}function ca(a){var b=g(),d=b.length,c,t=q(),h={},p=e.validPositions[t],l=void 0!=p?p.locator.slice():void 0,k;for(c=t+1;c<b.length;c++)k=w(c,l,c-1),l=k.locator.slice(),h[c]=f.extend(!0,{},k);l=p&&void 0!=p.alternation?p.locator[p.alternation].split(","):
[];for(c=d-1;c>t;c--)if(k=h[c].match,(k.optionality||k.optionalQuantifier||p&&void 0!=p.alternation&&void 0!=h[c].locator[p.alternation]&&-1!=f.inArray(h[c].locator[p.alternation].toString(),l))&&b[c]==W(c,k))d--;else break;return a?{l:d,def:h[d]?h[d].match:void 0}:d}function da(a){var b=g().slice(),d=ca();b.length=d;E(a,b)}function T(a){if(f.isFunction(d.isComplete))return d.isComplete.call(m,a,d);if("*"!=d.repeat){var b=!1,e=ca(!0),c=V(e.l);if(q()==c&&(void 0==e.def||e.def.newBlockMarker||e.def.optionalQuantifier))for(b=
!0,e=0;e<=c;e++){var g=h(e);if(g&&(void 0==a[e]||a[e]==W(e))||!g&&a[e]!=W(e)){b=!1;break}}return b}}function pa(a){a=f._data(a).events;f.each(a,function(a,d){f.each(d,function(a,b){if("inputmask"==b.namespace&&"setvalue"!=b.type){var d=b.handler;b.handler=function(a){if(this.readOnly||this.disabled)a.preventDefault;else return d.apply(this,arguments)}}})})}function qa(a){function b(a){if(void 0==f.valHooks[a]||!0!=f.valHooks[a].inputmaskpatch){var b=f.valHooks[a]&&f.valHooks[a].get?f.valHooks[a].get:
function(a){return a.value},d=f.valHooks[a]&&f.valHooks[a].set?f.valHooks[a].set:function(a,b){a.value=b;return a};f.valHooks[a]={get:function(a){var d=f(a);if(d.data("_inputmask")){if(d.data("_inputmask").opts.autoUnmask)return d.inputmask("unmaskedvalue");a=b(a);d=(d=d.data("_inputmask").maskset._buffer)?d.join(""):"";return a!=d?a:""}return b(a)},set:function(a,b){var e=f(a),c=e.data("_inputmask");c?(c=d(a,f.isFunction(c.opts.onBeforeMask)?c.opts.onBeforeMask.call(B,b,c.opts):b),e.triggerHandler("setvalue.inputmask")):
c=d(a,b);return c},inputmaskpatch:!0}}}function d(){var a=f(this),b=f(this).data("_inputmask");return b?b.opts.autoUnmask?a.inputmask("unmaskedvalue"):h.call(this)!=s().join("")?h.call(this):"":h.call(this)}function e(a){var b=f(this).data("_inputmask");b?(p.call(this,f.isFunction(b.opts.onBeforeMask)?b.opts.onBeforeMask.call(B,a,b.opts):a),f(this).triggerHandler("setvalue.inputmask")):p.call(this,a)}function c(a){f(a).bind("mouseenter.inputmask",function(a){a=f(this);var b=this._valueGet();""!=b&&
b!=g().join("")&&a.trigger("setvalue")});if(a=f._data(a).events.mouseover){for(var b=a[a.length-1],d=a.length-1;0<d;d--)a[d]=a[d-1];a[0]=b}}var h,p;a._valueGet||(Object.getOwnPropertyDescriptor&&Object.getOwnPropertyDescriptor(a,"value"),document.__lookupGetter__&&a.__lookupGetter__("value")?(h=a.__lookupGetter__("value"),p=a.__lookupSetter__("value"),a.__defineGetter__("value",d),a.__defineSetter__("value",e)):(h=function(){return a.value},p=function(b){a.value=b},b(a.type),c(a)),a._valueGet=function(){return A?
h.call(this).split("").reverse().join(""):h.call(this)},a._valueSet=function(a){p.call(this,A?a.split("").reverse().join(""):a)})}function ga(a,b,c){if(d.numericInput||A)b==d.keyCode.BACKSPACE?b=d.keyCode.DELETE:b==d.keyCode.DELETE&&(b=d.keyCode.BACKSPACE),A&&(a=c.end,c.end=c.begin,c.begin=a);b==d.keyCode.BACKSPACE&&1>=c.end-c.begin?c.begin=V(c.begin):b==d.keyCode.DELETE&&c.begin==c.end&&c.end++;H(c.begin,c.end);b=q(c.begin);e.p=b<c.begin?C(b):c.begin}function $(a,b,d){if(b&&b.refreshFromBuffer){var c=
b.refreshFromBuffer;v(!0===c?c:c.start,c.end);z(!0);void 0!=d&&(E(a,g()),r(a,b.caret||d.begin,b.caret||d.end))}}function ha(a){Y=!1;var b=this,c=f(b),h=a.keyCode,k=r(b);h==d.keyCode.BACKSPACE||h==d.keyCode.DELETE||ka&&127==h||a.ctrlKey&&88==h?(a.preventDefault(),88==h&&(J=g().join("")),ga(b,h,k),E(b,g(),e.p),b._valueGet()==s().join("")&&c.trigger("cleared"),d.showTooltip&&c.prop("title",e.mask)):h==d.keyCode.END||h==d.keyCode.PAGE_DOWN?setTimeout(function(){var c=C(q());d.insertMode||c!=Q()||a.shiftKey||
c--;r(b,a.shiftKey?k.begin:c,c)},0):h==d.keyCode.HOME&&!a.shiftKey||h==d.keyCode.PAGE_UP?r(b,0,a.shiftKey?k.begin:0):h==d.keyCode.ESCAPE||90==h&&a.ctrlKey?(S(b,!0,!1,J.split("")),c.click()):h!=d.keyCode.INSERT||a.shiftKey||a.ctrlKey?!1!=d.insertMode||a.shiftKey||(h==d.keyCode.RIGHT?setTimeout(function(){var a=r(b);r(b,a.begin)},0):h==d.keyCode.LEFT&&setTimeout(function(){var a=r(b);r(b,A?a.begin+1:a.begin-1)},0)):(d.insertMode=!d.insertMode,r(b,d.insertMode||k.begin!=Q()?k.begin:k.begin-1));var c=
r(b),m=d.onKeyDown.call(this,a,g(),c.begin,d);$(b,m,c);aa=-1!=f.inArray(h,d.ignorables)}function X(a,b,c,h,t,m){if(void 0==c&&Y)return!1;Y=!0;var p=f(this);a=a||window.event;c=b?c:a.which||a.charCode||a.keyCode;if(!(!0===b||a.ctrlKey&&a.altKey)&&(a.ctrlKey||a.metaKey||aa))return!0;if(c){!0!==b&&46==c&&!1==a.shiftKey&&","==d.radixPoint&&(c=44);var l,q;c=String.fromCharCode(c);b?(m=t?m:e.p,l={begin:m,end:m}):l=r(this);if(m=A?1<l.begin-l.end||1==l.begin-l.end&&d.insertMode:1<l.end-l.begin||1==l.end-
l.begin&&d.insertMode)e.undoPositions=f.extend(!0,{},e.validPositions),ga(this,d.keyCode.DELETE,l),d.insertMode||(d.insertMode=!d.insertMode,k(l.begin,t),d.insertMode=!d.insertMode),m=!d.multi;e.writeOutBuffer=!0;l=A&&!m?l.end:l.begin;var s=u(l,c,t);!1!==s&&(!0!==s&&(l=void 0!=s.pos?s.pos:l,c=void 0!=s.c?s.c:c),z(!0),void 0!=s.caret?q=s.caret:(t=e.validPositions,q=!d.keepStatic&&(void 0!=t[l+1]&&1<L(l+1,t[l].locator.slice(),l).length||void 0!=t[l].alternation)?l+1:C(l)),e.p=q);if(!1!==h){var v=this;
setTimeout(function(){d.onKeyValidation.call(v,s,d)},0);if(e.writeOutBuffer&&!1!==s){var y=g();E(this,y,b?void 0:d.numericInput?V(q):q);!0!==b&&setTimeout(function(){!0===T(y)&&p.trigger("complete");O=!0;p.trigger("input")},0)}else m&&(e.buffer=void 0,e.validPositions=e.undoPositions)}else m&&(e.buffer=void 0,e.validPositions=e.undoPositions);d.showTooltip&&p.prop("title",e.mask);a&&!0!=b&&(a.preventDefault?a.preventDefault():a.returnValue=!1,b=r(this),a=d.onKeyPress.call(this,a,g(),b.begin,d),$(this,
a,b))}}function ra(a){var b=f(this),c=a.keyCode,e=g(),h=r(this);a=d.onKeyUp.call(this,a,e,h.begin,d);$(this,a,h);c==d.keyCode.TAB&&d.showMaskOnFocus&&(b.hasClass("focus-inputmask")&&0==this._valueGet().length?(z(),e=g(),E(this,e),r(this,0),J=g().join("")):(E(this,e),r(this,P(0),P(Q()))))}function ia(a){if(!0===O&&"input"==a.type)return O=!1,!0;var b=f(this),c=this._valueGet();if("propertychange"==a.type&&this._valueGet().length<=Q())return!0;"paste"==a.type&&(window.clipboardData&&window.clipboardData.getData?
c=window.clipboardData.getData("Text"):a.originalEvent&&a.originalEvent.clipboardData&&a.originalEvent.clipboardData.getData&&(c=a.originalEvent.clipboardData.getData("text/plain")));a=f.isFunction(d.onBeforePaste)?d.onBeforePaste.call(this,c,d):c;S(this,!0,!1,a.split(""),!0);b.click();!0===T(g())&&b.trigger("complete");return!1}function sa(a){if(!0===O&&"input"==a.type)return O=!1,!0;var b=r(this),c=this._valueGet(),c=c.replace(RegExp("("+U(s().join(""))+")*"),"");b.begin>c.length&&(r(this,c.length),
b=r(this));1!=g().length-c.length||c.charAt(b.begin)==g()[b.begin]||c.charAt(b.begin+1)==g()[b.begin]||h(b.begin)||(a.keyCode=d.keyCode.BACKSPACE,ha.call(this,a));a.preventDefault()}function ta(a){if(!0===O&&"input"==a.type)return O=!1,!0;var b=r(this),c=this._valueGet();r(this,b.begin-1);var h=f.Event("keypress");h.which=c.charCodeAt(b.begin-1);aa=Y=!1;X.call(this,h,void 0,void 0,!1);b=e.p;E(this,g(),d.numericInput?V(b):b);a.preventDefault()}function ua(a){O=!0;var b=this;setTimeout(function(){r(b,
r(b).begin-1);var c=f.Event("keypress");c.which=a.originalEvent.data.charCodeAt(0);aa=Y=!1;X.call(b,c,void 0,void 0,!1);c=e.p;E(b,g(),d.numericInput?V(c):c)},0);return!1}function va(a){m=f(a);if(m.is(":input")&&"number"!=m.attr("type")){m.data("_inputmask",{maskset:e,opts:d,isRTL:!1});d.showTooltip&&m.prop("title",e.mask);("rtl"==a.dir||d.rightAlign)&&m.css("text-align","right");if("rtl"==a.dir||d.numericInput){a.dir="ltr";m.removeAttr("dir");var b=m.data("_inputmask");b.isRTL=!0;m.data("_inputmask",
b);A=!0}m.unbind(".inputmask");m.removeClass("focus-inputmask");m.closest("form").bind("submit",function(){J!=g().join("")&&m.change();m[0]._valueGet()==s().join("")&&m[0]._valueSet("");d.autoUnmask&&d.removeMaskOnSubmit&&m.inputmask("remove")}).bind("reset",function(){setTimeout(function(){m.trigger("setvalue")},0)});m.bind("mouseenter.inputmask",function(){!f(this).hasClass("focus-inputmask")&&d.showMaskOnHover&&this._valueGet()!=g().join("")&&E(this,g())}).bind("blur.inputmask",function(){var a=
f(this);if(a.data("_inputmask")){var b=this._valueGet(),c=g();a.removeClass("focus-inputmask");J!=g().join("")&&a.change();d.clearMaskOnLostFocus&&""!=b&&(b==s().join("")?this._valueSet(""):da(this));!1===T(c)&&(a.trigger("incomplete"),d.clearIncomplete&&(z(),d.clearMaskOnLostFocus?this._valueSet(""):(c=s().slice(),E(this,c))))}}).bind("focus.inputmask",function(){var a=f(this),b=this._valueGet();d.showMaskOnFocus&&!a.hasClass("focus-inputmask")&&(!d.showMaskOnHover||d.showMaskOnHover&&""==b)&&this._valueGet()!=
g().join("")&&E(this,g(),C(q()));a.addClass("focus-inputmask");J=g().join("")}).bind("mouseleave.inputmask",function(){var a=f(this);d.clearMaskOnLostFocus&&(a.hasClass("focus-inputmask")||this._valueGet()==a.attr("placeholder")||(this._valueGet()==s().join("")||""==this._valueGet()?this._valueSet(""):da(this)))}).bind("click.inputmask",function(){var a=this;f(a).is(":focus")&&setTimeout(function(){var b=r(a);if(b.begin==b.end){var b=A?P(b.begin):b.begin,c=q(b),c=C(c);b<c?h(b)?r(a,b):r(a,C(b)):r(a,
c)}},0)}).bind("dblclick.inputmask",function(){var a=this;setTimeout(function(){r(a,0,C(q()))},0)}).bind(Z+".inputmask dragdrop.inputmask drop.inputmask",ia).bind("setvalue.inputmask",function(){S(this,!0,!1,void 0,!0);J=g().join("")}).bind("complete.inputmask",d.oncomplete).bind("incomplete.inputmask",d.onincomplete).bind("cleared.inputmask",d.oncleared);m.bind("keydown.inputmask",ha).bind("keypress.inputmask",X).bind("keyup.inputmask",ra).bind("compositionupdate.inputmask",ua);"paste"!==Z||fa||
m.bind("input.inputmask",ta);fa&&m.bind("input.inputmask",ia);if(la||na||ma||oa)"input"==Z&&m.unbind(Z+".inputmask"),m.bind("input.inputmask",sa);qa(a);b=f.isFunction(d.onBeforeMask)?d.onBeforeMask.call(a,a._valueGet(),d):a._valueGet();S(a,!0,!1,b.split(""),!0);J=g().join("");var c;try{c=document.activeElement}catch(k){}!1===T(g())&&d.clearIncomplete&&z();d.clearMaskOnLostFocus?g().join("")==s().join("")?a._valueSet(""):da(a):E(a,g());c===a&&(m.addClass("focus-inputmask"),r(a,C(q())));pa(a)}}var A=
!1,J,m,Y=!1,O=!1,aa=!1,M;if(void 0!=c)switch(c.action){case "isComplete":return m=f(c.el),e=m.data("_inputmask").maskset,d=m.data("_inputmask").opts,T(c.buffer);case "unmaskedvalue":return m=c.$input,e=m.data("_inputmask").maskset,d=m.data("_inputmask").opts,A=c.$input.data("_inputmask").isRTL,ea(c.$input);case "mask":J=g().join("");va(c.el);break;case "format":m=f({});m.data("_inputmask",{maskset:e,opts:d,isRTL:d.numericInput});d.numericInput&&(A=!0);var G=(f.isFunction(d.onBeforeMask)?d.onBeforeMask.call(m,
c.value,d):c.value).split("");S(m,!1,!1,A?G.reverse():G,!0);d.onKeyPress.call(this,void 0,g(),0,d);return c.metadata?{value:A?g().slice().reverse().join(""):g().join(""),metadata:m.inputmask("getmetadata")}:A?g().slice().reverse().join(""):g().join("");case "isValid":m=f({});m.data("_inputmask",{maskset:e,opts:d,isRTL:d.numericInput});d.numericInput&&(A=!0);G=c.value.split("");S(m,!1,!0,A?G.reverse():G);var G=g(),I=ca();G.length=I;return T(G)&&c.value==G.join("");case "getemptymask":return m=f(c.el),
e=m.data("_inputmask").maskset,d=m.data("_inputmask").opts,s();case "remove":var B=c.el;m=f(B);e=m.data("_inputmask").maskset;d=m.data("_inputmask").opts;B._valueSet(ea(m));m.unbind(".inputmask");m.removeClass("focus-inputmask");m.removeData("_inputmask");Object.getOwnPropertyDescriptor&&(I=Object.getOwnPropertyDescriptor(B,"value"));I&&I.get?B._valueGet&&Object.defineProperty(B,"value",{get:B._valueGet,set:B._valueSet}):document.__lookupGetter__&&B.__lookupGetter__("value")&&B._valueGet&&(B.__defineGetter__("value",
B._valueGet),B.__defineSetter__("value",B._valueSet));try{delete B._valueGet,delete B._valueSet}catch(wa){B._valueGet=void 0,B._valueSet=void 0}break;case "getmetadata":m=f(c.el);e=m.data("_inputmask").maskset;d=m.data("_inputmask").opts;if(f.isArray(e.metadata)){for(I=c=q();0<=I;I--)if(e.validPositions[I]&&void 0!=e.validPositions[I].alternation){G=e.validPositions[I].alternation;break}return void 0!=G?e.metadata[e.validPositions[c].locator[G]]:e.metadata[0]}return e.metadata}};f.inputmask={defaults:{placeholder:"_",
optionalmarker:{start:"[",end:"]"},quantifiermarker:{start:"{",end:"}"},groupmarker:{start:"(",end:")"},alternatormarker:"|",escapeChar:"\\",mask:null,oncomplete:f.noop,onincomplete:f.noop,oncleared:f.noop,repeat:0,greedy:!0,autoUnmask:!1,removeMaskOnSubmit:!0,clearMaskOnLostFocus:!0,insertMode:!0,clearIncomplete:!1,aliases:{},alias:null,onKeyUp:f.noop,onKeyPress:f.noop,onKeyDown:f.noop,onBeforeMask:void 0,onBeforePaste:void 0,onUnMask:void 0,showMaskOnFocus:!0,showMaskOnHover:!0,onKeyValidation:f.noop,
skipOptionalPartCharacter:" ",showTooltip:!1,numericInput:!1,rightAlign:!1,radixPoint:"",nojumps:!1,nojumpsThreshold:0,keepStatic:void 0,definitions:{9:{validator:"[0-9]",cardinality:1,definitionSymbol:"*"},a:{validator:"[A-Za-z\u0410-\u044f\u0401\u0451\u00c0-\u00ff\u00b5]",cardinality:1,definitionSymbol:"*"},"*":{validator:"[0-9A-Za-z\u0410-\u044f\u0401\u0451\u00c0-\u00ff\u00b5]",cardinality:1}},keyCode:{ALT:18,BACKSPACE:8,CAPS_LOCK:20,COMMA:188,COMMAND:91,COMMAND_LEFT:91,COMMAND_RIGHT:93,CONTROL:17,
DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,MENU:93,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38,WINDOWS:91},ignorables:[8,9,13,19,27,33,34,35,36,37,38,39,40,45,46,93,112,113,114,115,116,117,118,119,120,121,122,123],isComplete:void 0},masksCache:{},escapeRegex:function(c){return c.replace(RegExp("(\\/|\\.|\\*|\\+|\\?|\\||\\(|\\)|\\[|\\]|\\{|\\}|\\\\)",
"gim"),"\\$1")},format:function(c,e,d){var y=f.extend(!0,{},f.inputmask.defaults,e);D(y.alias,e,y);return K({action:"format",value:c,metadata:d},R(y),y)},isValid:function(c,e){var d=f.extend(!0,{},f.inputmask.defaults,e);D(d.alias,e,d);return K({action:"isValid",value:c},R(d),d)}};f.fn.inputmask=function(c,e,d,y,z){function q(c,d){var e=f(c),k;for(k in d){var q=e.data("inputmask-"+k.toLowerCase());void 0!=q&&(d[k]=q)}return d}d=d||K;y=y||"_inputmask";var k=f.extend(!0,{},f.inputmask.defaults,e),w;
if("string"===typeof c)switch(c){case "mask":return D(k.alias,e,k),w=R(k,d!==K),0==w.length?this:this.each(function(){d({action:"mask",el:this},f.extend(!0,{},w),q(this,k))});case "unmaskedvalue":return c=f(this),c.data(y)?d({action:"unmaskedvalue",$input:c}):c.val();case "remove":return this.each(function(){f(this).data(y)&&d({action:"remove",el:this})});case "getemptymask":return this.data(y)?d({action:"getemptymask",el:this}):"";case "hasMaskedValue":return this.data(y)?!this.data(y).opts.autoUnmask:
!1;case "isComplete":return this.data(y)?d({action:"isComplete",buffer:this[0]._valueGet().split(""),el:this}):!0;case "getmetadata":if(this.data(y))return d({action:"getmetadata",el:this});break;case "_detectScope":return D(k.alias,e,k),void 0==z||D(z,e,k)||-1!=f.inArray(z,"mask unmaskedvalue remove getemptymask hasMaskedValue isComplete getmetadata _detectScope".split(" "))||(k.mask=z),f.isFunction(k.mask)&&(k.mask=k.mask.call(this,k)),f.isArray(k.mask);default:return D(k.alias,e,k),D(c,e,k)||(k.mask=
c),w=R(k,d!==K),void 0==w?this:this.each(function(){d({action:"mask",el:this},f.extend(!0,{},w),q(this,k))})}else{if("object"==typeof c)return k=f.extend(!0,{},f.inputmask.defaults,c),D(k.alias,c,k),w=R(k,d!==K),void 0==w?this:this.each(function(){d({action:"mask",el:this},f.extend(!0,{},w),q(this,k))});if(void 0==c)return this.each(function(){var c=f(this).attr("data-inputmask");if(c&&""!=c)try{var c=c.replace(RegExp("'","g"),'"'),q=f.parseJSON("{"+c+"}");f.extend(!0,q,e);k=f.extend(!0,{},f.inputmask.defaults,
q);D(k.alias,q,k);k.alias=void 0;f(this).inputmask("mask",k,d)}catch(w){}})}}}return f.fn.inputmask});

app.helpers.camelToDash = function camelToDash(string) {
  var dasherized = string.replace(/([A-Z])/g, function(letter) {
    return '-' + letter;
  });

  return dasherized.toLowerCase();
};

app.helpers.each = function each(array, callback) {
  var itemCount = array.length;

  for (var i = 0; i < itemCount; i++) {
    var item = array[i];
    callback(item, i);
  }
};

app.helpers.fetchPartial = function fetchPartial(partial, callback) {
  var deferred = new $.Deferred();

  $.get('/partials/' + partial + '.html', function(partial) {
    deferred.resolve($(partial));
  });

  return deferred.promise();
};

app.helpers.forIn = function each(object, callback) {
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      callback(object[key], key);
    }
  }
};

app.helpers.initDirectives = function() {
  app.helpers.forIn(app.directives, function(directive, directiveName) {
    var directiveNameConvention = 'directive-' + app.helpers.camelToDash(directiveName);
    var elements = document.querySelectorAll('[' + directiveNameConvention + ']');

    app.helpers.each(elements, function(element) {
      element.$directives = element.$directives || {};

      if (!element.$directives[directiveName]) {
        element.$directives[directiveName] = new directive(element);

        console.log('directive "' + directiveName + '" has been initialized on an element: ', element);
      }
    });
  });
};

app.helpers.isCapableOfPrinting = function isCapableOfPrinting() {
  return window.print && navigator.userAgent.indexOf('CriOS') === -1 ? true : false;
};

app.helpers.isTouchDevice = function isTouchDevice() {
  return !!('ontouchstart' in window);
};

app.helpers.onTransitionEnd = function onTransitionEnd(node, callback) {
  var end = function() {
    callback();
    node.removeEventListener('transitionend', end);
  };

  node.addEventListener('transitionend', end);
};

app.helpers.reverseGeocode = function reverseGeocode(latitude, longitude, callback) {
  var mapQuestKey = 'Gmjtd%7Cluub256znd%2C7g%3Do5-lzyxg';

  $.getJSON('http://www.mapquestapi.com/geocoding/v1/reverse?key=' + mapQuestKey + '&location=' + latitude + ',' + longitude).then(function(response) {
    if (response && response.results && response.results.length > 0) {
      var location = response.results[0].locations[0];

      callback({
        street: location.street,
        city: location.adminArea5,
        state: location.adminArea3,
        zip: location.postalCode
      });
    }
  });
};

app.helpers.stringToHTML = function stringToHTML(string) {
  var div = document.createElement('div');
  div.innerHTML = string;

  return div.firstChild;
};

app.factories.modal = (function() {
  var factory = {};

  factory.open = function openModal(partial, callback) {
    var deferred = new $.Deferred();
    var $modal = $('<div class="modal"></div>');
    var $modalContainer = $('<div class="modal__container"></div>');
    var $modalContent = $('<div class="modal__content"></div>');
    var $modalClose = $('<div class="modal__close"><svg class="icon"><use xlink:href="#close" /></svg></div>');

    $modal.append($modalContainer.append($modalContent.append($modalClose)));
    $('body').append($modal);

    setTimeout(function() {
      $modal.addClass('modal--show');
    }, 15);

    $modal.on('click.closeModal', function(e) {
      if ($(e.target).hasClass('modal__container') || $(e.target).hasClass('modal')) {
        factory.close($modal);
      }
    });

    $modalClose.on('click.closeModal', function() {
      factory.close($modal);
    });

    app.helpers.fetchPartial(partial).then(function($partial) {
      $modalContent.append($partial);
      $modal.addClass('modal--loaded');

      var $closeButtons = $partial.find('[directive-modal__close]');
      $closeButtons.on('click.closeModal', function(e) {
        e.preventDefault();
        factory.close($modal);
      });

      app.helpers.initDirectives();

      deferred.resolve($modal);
    });

    $(window).on('keydown.closeModal', function(e) {
      if (e.keyCode === 27) {
        console.log(e);
        factory.close($modal);
      }
    });

    return deferred.promise();
  };

  factory.close = function closeModal($modal) {
    $modal.one('transitionend', function() {
      $modal.remove();
    });

    $modal.removeClass('modal--show');

    $(window).off('keydown.closeModal');
  };

  return factory;
}());

app.directives.directions = function directions(element) {
  var directive = this;

  var address = element.getAttribute('directive-directions');
  var isMobileAppleDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
  var directionsUrl = isMobileAppleDevice ? 'http://maps.apple.com/?daddr=' + address : 'https://www.google.com/maps?daddr=' + address;

  element.setAttribute('href', directionsUrl);
};

app.directives.hideOnDevice = function hideOnDevice(element) {
  var directive = this;

  var deviceTypeToHideOn = element.getAttribute('directive-hide-on-device');

  if (app.helpers.isTouchDevice()) {
    if (deviceTypeToHideOn === 'touch') {
      element.parentNode.removeChild(element);
    }
  }
};

app.directives.importIcons = function importIcons(element) {
  var directive = this;

  $.get('/_dist/icons.svg', function(svg) {
    var $svg = $(svg.firstChild);
    $(element).append($svg);
    $svg.hide();
  });
};

app.directives.locator = function locator(element) {
  var directive = this;

  var $element = $(element);
  var $searchForm = $element.find('[directive-locator__search-form]');
  var $locations = $element.find('[directive-locator__locations]');
  var $textInput = $element.find('[directive-locator__text-input]');
  var $submitButton = $element.find('[directive-locator__submit-button]');
  var $geolocateButton = $element.find('[directive-locator__geolocate-button]');
  var $map = $element.find('[directive-locator__map]');
  var _map;
  var _mapQuestKey = 'Gmjtd%7Cluub256znd%2C7g%3Do5-lzyxg';
  var _textInputDefaultPlaceholder = $textInput.attr('placeholder');

  var _updateUserLocation = function updateUserLocation(options) {
    $submitButton.removeClass('button--is-processing');
    $element.addClass('locator--has-been-located');

    _map.setCenterAnimate({
      lat: options.latitude,
      lng: options.longitude
    }, 13);

    if ($(window).width() <= 530) {
      $('html, body').animate({
        scrollTop: $textInput.offset().top - 7
      }, 500);
    }
  };

  var _fetchLocations = function fetchLocations() {
    var deferred = new $.Deferred();

    $.get('/json/locations.json', function(locations) {
      _displayLocations(locations);
      deferred.resolve(locations);
    });

    return deferred.promise();
  };

  var _displayLocations = function displayLocations(locations) {
    $locations.html('');

    if (locations.length > 0) {
      locations.map(function(location) {
        var html = '<li class="spaced-list__item"> \
                      <h2>' + location.name + '</h2> \
                      <p> \
                        ' + location.street + '<br> \
                        ' + location.city + ', ' + location.state + ' ' + location.zip + '<br> \
                        Phone: ' + location.phone + ' \
                      </p> \
                      <p> \
                        <a href="https://www.google.com/maps?daddr=' + location.street + ' ' + location.city + ', ' + location.state + ' ' + location.zip + '" class="link" target="_blank">Get Directions »</a> \
                      </p> \
                    </li>';

        $locations.append(html);
      });
    }

    else {
      var html = '<li class="spaced-list__item"> \
                    <h3>No results</h3> \
                    <p>Sorry! Looks like there are no stores in this area.</p> \
                  </li>';

      $locations.append(html);
    }
  };

  var _geocode = function geocode(address) {
    var deferred = new $.Deferred();

    var endpoint = 'http://www.mapquestapi.com/geocoding/v1/address?key=' + _mapQuestKey + '&location=' + address;

    $.get(endpoint, function(response) {
      var locations = response.results[0].locations;

      if (locations && locations.length > 0) {
        deferred.resolve(response.results[0].locations[0]);
      }

      else {
        deferred.reject();
      }
    });

    return deferred.promise();
  };

  var _initialize = function initialize() {
    MQA.EventUtil.observe(window, 'load', function() {
      var options = {
        elt: $map[0],
        zoom: 3,
        latLng: {
          lat: 39.50,
          lng: -98.35
        },
        mtype: 'map',
        bestFitMargin: 0,
        zoomOnDoubleClick: true
      };

      // Initialize a TileMap
      _map = new MQA.TileMap(options);

      // Add zoom buttons
      MQA.withModule('smallzoom', function() {
        _map.addControl(
          new MQA.SmallZoom(),
          new MQA.MapCornerPlacement(MQA.MapCorner.TOP_LEFT, new MQA.Size(5,5))
        );
      });

      // Adding the locations to the map
      $.when(_fetchLocations()).then(function(locations) {
        var locationsAsStrings = locations.map(function(location) {
          return location.street + ' ' + location.city + ', ' + location.state + ' ' + location.zip;
        });

        // Load up MQA's "geocoder" module to place the pins via street address
        MQA.withModule('geocoder', function() {
          var locationIndex = 0;

          // Customize the pin generator
          MQA.Geocoder.constructPOI = function(geocodedLocation) {
            var location = locations[locationIndex];
            var directionsURL = 'https://www.google.com/maps?daddr=' + locationsAsStrings[locationIndex];

            var pin = new MQA.Poi({
              lat: geocodedLocation.latLng.lat,
              lng: geocodedLocation.latLng.lng
            });

            var icon = new MQA.Icon('/images/pin.png', 29, 45);
            pin.setIcon(icon);
            pin.setShadow(null);

            pin.setRolloverContent('<div class="locator__map__tooltip"> \
                                      <h4>' + location.name + '</h4> \
                                      <p> \
                                        ' + location.street + ' <br> \
                                        ' + location.city + ', ' + location.state + ' ' + location.zip + ' <br> \
                                      </p> \
                                    </div>');

            MQA.EventManager.addListener(pin, 'click', function(e) {
              window.open(directionsURL, '_blank');
            });

            locationIndex++;

            // Attach the location data to this pin for future reference
            pin.storeLocationInfo = location;

            return pin;
          };

          // Begin the geocoding process
          _map.geocodeAndAddLocations(locationsAsStrings, function(response) {
            console.log(response);
          });

          // When the map moves, keep the list of stores up to date
          var updateLocationsToDisplay = function updateLocationsToDisplay() {
            var pins = _map.getShapes().items;
            var mapBounds = _map.getBounds();
            var locationsToDisplay = [];

            var pinsInView = pins.filter(function(pin) {
              var pinBounds = new MQA.RectLL({
                lat: pin.latLng.lat,
                lng: pin.latLng.lng
              }, {
                lat: pin.latLng.lat,
                lng: pin.latLng.lng
              });

              if (mapBounds.contains(pinBounds)) {
                return pin;
              }
            });

            pinsInView.map(function(pin) {
              locations.map(function(location) {
                if (location.name === pin.storeLocationInfo.name && location.street === pin.storeLocationInfo.street) {
                  locationsToDisplay.push(location);
                }
              });
            });

            _displayLocations(locationsToDisplay);
          };

          MQA.EventManager.addListener(_map, 'moveend', updateLocationsToDisplay);
          MQA.EventManager.addListener(_map, 'zoomend', updateLocationsToDisplay);
        });
      });

      $searchForm.on('submit', function(e) {
        e.preventDefault();

        var query = $textInput.val();

        if (query.length > 0) {
          directive.updateUserLocationWithAddress(query);
        }
      });

      $geolocateButton.on('click', function() {
        directive.geolocateUser();
      });
    });
  };

  directive.updateUserLocationWithAddress = function updateUserLocationWithAddress(address) {
    $submitButton.addClass('button--is-processing');

    var succesfullyGeocoded = function(location) {
      _updateUserLocation({
        latitude: location.latLng.lat,
        longitude: location.latLng.lng
      });
    };

    var failedToGeocode = function() {
      $submitButton.removeClass('button--is-processing');
    };

    $.when(_geocode(address)).then(succesfullyGeocoded, failedToGeocode);
  };

  directive.updateUserLocationWithCoordinates = function updateUserLocationWithCoordinates(latitude, longitude) {
    $textInput.val('New York, NY');

    _updateUserLocation({
      latitude: latitude,
      longitude: longitude
    });
  };

  directive.geolocateUser = function geolocateUser() {
    var succesfullyLocated = function succesfullyLocated(position) {
      // Even though we're getting a real position for the user, hard code the user's position to New York for demo purposes
      directive.updateUserLocationWithCoordinates(40.7127, -74.0059);
    };

    var failedToLocate = function failedToLocate(error) {
      $submitButton.removeClass('button--is-processing');
      $textInput.attr('placeholder', _textInputDefaultPlaceholder);
    };

    $submitButton.addClass('button--is-processing');
    $textInput.val('').attr('placeholder', 'calculating...');

    navigator.geolocation.getCurrentPosition(succesfullyLocated, failedToLocate);
  };

  _initialize();
};

app.directives.newsletter = function newsletter(element) {
  var directive = this;

  var $element = $(element);

  var _initialize = function initialize() {
    $element.on('click', function() {
      app.factories.modal.open('newsletter').then(_handleForm);
    });
  };

  var _handleForm = function handleForm($modal) {
    var $form = $modal.find('[directive-newsletter__form]');
    var $success = $modal.find('[directive-newsletter__success]');
    var $finalEmail = $modal.find('[directive-newsletter__final-email]');
    var $email = $form.find('#email');

    $email.focus();

    $form.on('submit', function(e) {
      e.preventDefault();

      var emailValue = $email.val();

      if (/.+@.+\..+/.test(emailValue)) {
        $finalEmail.html(emailValue);
        $email.removeClass('input-text--error').blur();
        $success.addClass('takeover--show');
      }

      else {
        $email.removeClass('input-text--error');

        setTimeout(function() {
          $email.addClass('input-text--error');
        });
      }
    });
  };

  _initialize();
};

app.directives.print = function print(element) {
  var directive = this;

  if (app.helpers.isCapableOfPrinting()) {
    element.addEventListener('click', function() {
      window.print();
    });
  }

  else {
    element.parentNode.removeChild(element);
  }
};

app.directives.sale = function sale(element) {
  var directive = this;

  var $element = $(element);

  var _initialize = function initialize() {
    $element.on('click', function() {
      app.factories.modal.open('sale');
    });
  };

  _initialize();
};

app.directives.sendToPhone = function sendToPhone(element) {
  var directive = this;

  var $element = $(element);

  var _initialize = function initialize() {
    $element.on('click', function() {
      app.factories.modal.open('send-to-phone').then(_handleForm);
    });
  };

  var _handleForm = function handleForm($modal) {
    var $form = $modal.find('[directive-send-to-phone__form]');
    var $success = $modal.find('[directive-send-to-phone__success]');
    var $finalPhone = $modal.find('[directive-send-to-phone__final-phone]');
    var $phone = $form.find('#phone');
    var phoneIsValid = false;

    $phone.inputmask('(999) 999-9999', {
      oncomplete: function() {
        phoneIsValid = true;
      },
      onincomplete: function() {
        phoneIsValid = false;
      }
    }).focus();

    $form.on('submit', function(e) {
      e.preventDefault();

      var phoneValue = $phone.val();

      if (phoneIsValid) {
        $finalPhone.html(phoneValue);
        $phone.removeClass('input-text--error').blur();
        $success.addClass('takeover--show');
      }

      else {
        $phone.removeClass('input-text--error');

        setTimeout(function() {
          $phone.addClass('input-text--error');
        });
      }
    });
  };

  _initialize();
};

app.directives.sendToEmail = function sendToEmail(element) {
  var directive = this;

  var $element = $(element);

  var _initialize = function initialize() {
    $element.on('click', function() {
      app.factories.modal.open('send-to-email').then(_handleForm);
    });
  };

  var _handleForm = function handleForm($modal) {
    var $form = $modal.find('[directive-send-to-email__form]');
    var $success = $modal.find('[directive-send-to-email__success]');
    var $finalemail = $modal.find('[directive-send-to-email__final-email]');
    var $email = $form.find('#email');
    var emailIsValid = false;

    $email.inputmask('', {
      oncomplete: function() {
        emailIsValid = true;
      },
      onincomplete: function() {
        emailIsValid = false;
      }
    }).focus();

    $form.on('submit', function(e) {
      e.preventDefault();

      var emailValue = $phone.val();

      if (emailIsValid) {
        $finalemail.html(emailValue);
        $email.removeClass('input-text--error').blur();
        $success.addClass('takeover--show');
      }

      else {
        $email.removeClass('input-text--error');

        setTimeout(function() {
          $email.addClass('input-text--error');
        });
      }
    });
  };

  _initialize();
};

app.directives.tiles = function tiles(element) {
  var directive = this;

  var $element = $(element);
  var $container = $element.find('[directive-tiles__container]');
  var $filters = $element.find('[directive-tiles__filter]');

  var _initialize = function initialize() {
    $container.imagesLoaded(function() {
      $container.isotope({
        itemSelector: '.tile',
        // transitionDuration: 0,
        masonry: {
          columnWidth: '.tiles__column-size'
        }
      });
    });

    $filters.on('click', function(e) {
      var filter = $(this).attr('directive-tiles__filter');

      $filters.removeClass('filter__item--active');
      $(this).addClass('filter__item--active');

      directive.filter(filter);
    });
  };

  directive.filter = function filter(filter) {
    $container.isotope({
      filter: filter
    });
  };

  _initialize();
};

(function(document, app, FastClick) {

  // Detect if this device has touch capabilites
  if (app.helpers.isTouchDevice()) {
    document.body.classList.add('has-touch');
  }
  else {
    document.body.classList.add('has-no-touch');
  }

  // Remove 300ms click delay on all touch devices
  FastClick.attach(document.body);

  // Instantiate all directives
  app.helpers.initDirectives();

})(document, app, FastClick);
