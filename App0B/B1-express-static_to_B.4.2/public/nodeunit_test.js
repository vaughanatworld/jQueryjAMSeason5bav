
/*
 * nodeunit_test.js
 *
 */

/*jslint      node  : true, slopy : true,   white : true */

// A trivial nodeunit example
//
// Begin /testAcct/
var testAcct = function ( test ) {
  test.expect( 1 );
  test.ok( true, 'this passes' );
  test.done();
};
// End /testAcct/
//
module.exports = { testAcct : testAcct };

