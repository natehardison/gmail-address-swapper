// ==UserScript==
// @name          Gmail Address Swapper
// @namespace     http://www.natehardison.com
// @description   This script will swap the 'To' and 'CC in the email compose pages
// @include       https://mail.google.com/*
// ==/UserScript==

// ------------------------------------------------------------------------- //
// Author: Nate Hardison, May 2012                                           //
// Credit to http://swaroop.in/tag/gmail-address-swapper for initial code    //
// ------------------------------------------------------------------------- //

// ------------------------------- CONSTANTS ------------------------------- //
// The ID of the iframe that holds all of the visible Gmail content.
var CANVAS_ID = 'canvas_frame';

// Check this often to figure out if we're in the Compose view
var MAIN_LOOP_INTERVAL = 1000;

// Check this often to figure out if our swapper link should be redisplayed.
var DISPLAY_LOOP_INTERVAL = 100;
// ------------------------------------------------------------------------- //

function Swapper() {
  this.linkArea = null;
  this.intervalID = null;
  this.swapLink = null;

  /**
   * This function displays our swapper link inline next to the other "Add Cc"
   * and "Add Bcc" links. We run this function on a short interval because it
   * turns out that Gmail reloads the linkArea element every time one of the
   * other links in the area is clicked, and the reloading blows away our
   * swapper link. The interval allows us to detect whether or not the swapper
   * link still exists in the linkArea and whether or not it's visible, since
   * we initially set the display to none so that we don't display if the To
   * and Cc fields are both empty.
   */
  this.displaySwapperLink = function() {
    if (!this.swapLink) {
      this.swapLink = this.document().createElement("span");

      // These attributes make it look and behave just like the other links
      this.swapLink.setAttribute("class", "el");
      this.swapLink.setAttribute("role", "link");
      this.swapLink.setAttribute("tabindex", "2");

      this.swapLink.style.display = "none";
      this.swapLink.innerHTML = "Swap To/Cc";
      this.swapLink.addEventListener('click', this.swap.bind(this), true);

      // Now we style the link area a bit to get the padding right
      this.linkArea.setAttribute("class", "eF");
      this.linkArea.style.paddingBottom = "2px";
      this.linkArea.appendChild(this.swapLink);
    }

    try {
      if (this.document().getElementsByName('to')[0].value.length > 0 ||
          this.document().getElementsByName('cc')[0].value.length > 0) {
        this.swapLink.style.display = "inline";
      } else {
        this.swapLink.style.display = "none";
      }
    } catch (error) {
      this.pause();
    }
  };

  this.document = function() {
    return document.getElementById(CANVAS_ID).contentDocument;
  };

  /**
   * The initialize function needs to get us a valid reference to the linkArea,
   * a td element where we're going to stuff our swapper link. The best way to
   * get to the proper linkArea is to find the Cc field and go one tr up from 
   * it. Once we've found the linkArea, we can display the swapper link.
   */
  this.initialize = function() {
    var bcc;
    var table;
    try {
      cc = this.document().getElementsByName('cc')[0].parentNode.parentNode;
      if (cc.style.display === "none") return;
      table = cc.parentNode;
    } catch (error) {
      return;
    }
    for (var i = 0; i < table.childNodes.length; i++) {
      if (table.childNodes[i] === cc) {
        this.linkArea = table.childNodes[i - 1].childNodes[1];
        break;
      }
    }
    this.intervalID = setInterval(this.displaySwapperLink.bind(this), DISPLAY_LOOP_INTERVAL);
  };

  /**
   * Best way to tell if we're initialized is to check if we have a valid
   * reference to the linkArea.
   */
  this.initialized = function() {
    return (this.linkArea !== undefined && this.linkArea !== null);
  }

  /** 
   * The pause function clears displaySwapperLink's short interval and resets
   * the Swapper. Intended to be used when we find ourselves outside of the
   * Compose view after being initialized.
   */
  this.pause = function() {
    if (this.intervalID) {
      clearInterval(this.intervalID);
      this.intervalID = null;
    }
    this.linkArea = null;
    this.swapLink.removeEventListener('click', this.swap.bind(this), true);
    this.swapLink = null;
  }

  this.swap = function() {
    var to = this.document().getElementsByName('to')[0];
    var cc = this.document().getElementsByName('cc')[0];
    var temp = to.value;
    to.value = cc.value;
    cc.value = temp;
  };
}

/**
 * We know we're in the compose view if we can get a valid reference to a
 * textarea with name="to". It's a hell of a hack, but I can't think of a
 * better way for now.
 */
function inComposeView() {
  var canvas = document.getElementById(CANVAS_ID);
  try {
    var to = canvas.contentDocument.getElementsByName('to')[0];
    return (to.tagName.toLowerCase() === "textarea");
  } catch (error) {
    return false;
  }
}

/**
 * This main loop sets up our Swapper and runs throughout the time that we're
 * on Gmail. If there's a better way to hook into Gmail's Javascript and figure
 * out when we move from the Compose view to the Inbox view (and others), it'd
 * be great to know...
 */
if (!window.top || top.location.href == window.location.href) {
  var swapper = new Swapper();
  setInterval(function() {
    var canvas = document.getElementById(CANVAS_ID);    
    if (canvas != null && canvas.contentDocument != null &&
        canvas.contentDocument.readyState === "complete") {
      if (inComposeView() && !swapper.initialized()) {
        swapper.initialize();
      } else if (swapper.initialized() && !inComposeView()) {
        swapper.pause();
      }
    }
  }, MAIN_LOOP_INTERVAL);
}