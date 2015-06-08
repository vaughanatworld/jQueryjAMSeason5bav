/*
 * spa.model.js
 * Model module
 */
/*jslint          browser : true,   continue  : true,
  devel   : true, indent  : 2,      maxerr    : 50,
  newcap  : true,   nomen : true,   plusplus  : true,
  regexp  : true,  sloppy : true,       vars  : false,
  white   : true
*/
/*global $, spa */

spa.model = (function () {

  // the people object API
  // ---------------------
  // The people object is available at spa.model.people.
  // The people object provides methods and events to manage
  // a collection of person objects Its public methods include:
  //  * get_user()  - return the current user person object.
  //    If the current user is not signed-in, an anonymous person
  //    object is returned.
  //  * get_db()    - return the TaffyDB database of all the person
  //    objects - includeing the current user - presorted.
  //  * get_by_cid( <client_id> ) - return a person object with
  //    provided unique id.
  //  * login( <user_name> )      - login as the user with the provided
  //    user name. The current user object is changed to reflect
  //    the new identity.
  //  * logout()  - revert the current user object to anonymouse.
  //
  // JQuery global custom events published by the object include:
  //  * 'spa-login' is published when a user login process
  //    completes. The updated user object is provided as data.
  //  * 'spa-logout' is published when a logout completes.
  //    The former user object is provided as data.
  //
  // Each person is represented by a person object.
  // Person ojbects provide the following methods:
  //  * get_is_user() - return true if object is the current user
  //  * get_is_anon() - return true if object is anonymouse
  //
  // The attributes for a person object include:
  //  * cid   - string client id. This is always defined, and
  //            is only different from the id attribute if
  //            the client cata is not synced with the backend.
  //  * id    - the unique id. This may be undefined if the
  //            object is not synced with the backend.
  //  * name  - the string name of the user.
  //  * css_map - a map of attributes used for avatar
  //            presentation.
  //
  //
  return {};
} ());

