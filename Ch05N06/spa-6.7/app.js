/*
 * app.js - Simple Express serve with logging and middleware
 *          Also has Testing code from Appendix B
 */

/*jslint          node    : true,   continue  : true,
  devel   : true, indent  : 2,      maxerr    : 50,
  newcap  : true, nomen   : true,   plusplus  : true,
  regexp  : true, sloppy  : true,       vars  : false,
  white   : true
*/
/*global */

// ---------------------- BEGIN MODULE SCOPE VARIABLES-------------
'use strict';
var 
    http            = require(  'http'  ),
    express         = require(  'express'  ),
    morgan          = require(  'morgan' ),
    errorHandler    = require(  'errorhandler' ),
    methodOverride  = require(  'method-override' ),
    bodyParser      = require(  'body-parser' ),
    multer          = require(  'multer'  ),
    app             = express(),
    jsonParser      = bodyParser.json(),
    urlencodedParser= bodyParser.urlencoded({ extended: false }),
    server          = http.createServer( app ),
    env             = process.env.NODE_ENV || 'development';

// ---------------------- END MODULE SCOPE VARIABLES --------------
// ---------------------- BEGIN SERVER CONFIGURATION --------------

app
  .use( methodOverride() )
  .use( express.static( __dirname + '/public' ) )
  ;

if ( 'development' === env ) {
  app
    .use( morgan('combined') )
    .use( errorHandler( { dumpExceptions : true,
                         showStack       : true
                      })
    )
    ;
}
else if ( 'production' === env ) {
  app
     .use( errorHandler() )
     ;
}


app
  .get( '/', urlencodedParser, function ( request, response ) {
    if ( ! request.body ) {
      return response.sendStatues( 400 );
    }
    //response.send ( 'Hello Express' ); 
    response.redirect( '/spa.html' );
  });
// ---------------------- END SERVER CONFIGURATION ----------------
// ---------------------- BEGIN START SERVER ----------------------
server.listen( 3000 );
console.log(
    'Express server listening on port %d in %s mode',
      server.address().port, app.settings.env
    );
// ---------------------- END START SERVER ------------------------

