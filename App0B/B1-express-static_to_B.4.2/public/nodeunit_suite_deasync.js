/*
* nodeunit_suite.js
* Unit test suite for SPA
*
*  Please run using /nodeunit <this_file>/
*/

/*jslint          node    : true,   continue  : true,
  devel   : true, indent  : 2,      maxerr    : 50,
  newcap  : true,   nomen : true,   plusplus  : true,
  regexp  : true,  sloppy : true,       vars  : false,
  white   : true
*/
/*global $, spa */

// third-party modules and globals
var jsdom = require('jsdom');
var fs = require("fs");
var jquery = fs.readFileSync("./js/jq/jquery-1.11.3.js", "utf-8");
var done = false;

// Load up the jquery module into node.js by using jsdom.
// Assign the jquery window to the nodejs global.
// Also make sure the jquery initialization completes
// before adding more jquery support modules.
// Deasync is only used to avoid refactoring the text book
// code.... or at least minimize it.
jsdom.env({  
  html: "<html><body></body></html>",
  src: [jquery],
  done: function (err, window) {
    global.$ = window.jQuery;
    global.jQuery = window.jQuery;
    done = true;
  }
});
require('deasync').loopWhile( function() { return !done; });
  
require( './js/jq/jquery.event.gevent.js' );
global.TAFFY = require( './js/jq/taffy.js' ).taffy;

// our modules and globals
//
// Create an attribute so the SPA modules can use
// the spa namespace when they load.
global.spa    = null;
require ( './js/spa.js'           );
require ( './js/spa.util.js'      );
require ( './js/spa.fake.js'      );
require ( './js/spa.data.js'      );
require ( './js/spa.model.js'     );

// example code
spa.initModule();
spa.model.setDataMode ( 'fake' );

var $t = $( '<div/>' );
$.gevent.subscribe( $t, 'spa-login',
    function ( event, user ) {
      console.log( 'Login user is: ', user );
    }
);

spa.model.people.login( 'Fred' );
    
