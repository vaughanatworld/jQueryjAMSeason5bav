/*
 * spa.fake.js
 * Fake module
 */
/*jslint          browser : true,   continue  : true,
  devel   : true, indent  : 2,      maxerr    : 50,
  newcap  : true,   nomen : true,   plusplus  : true,
  regexp  : true,  sloppy : true,       vars  : false,
  white   : true
*/
/*global $, spa */

spa.fake = (function () {
  'use strict';
  var peopleList, fakeIdSerial, makeFakeId, mockSio;

  fakeIdSerial = 5;

  // No leading zeros with fakeIdSerial. Different from getPeopleList
  // below. 
  makeFakeId = function () {
    return 'id_' + String( fakeIdSerial++ );
  };

  peopleList = [
     { name : 'Betty', _id : 'id_01',
        css_map : { top : 20, left : 20,
                    'background-color' : 'rgb( 128, 128, 128)'
        }
     },
     { name : 'Mike', _id : 'id_02',
        css_map : { top : 60, left : 20,
                    'background-color' : 'rgb( 128, 255, 128)'
        }
     },
     { name : 'Pebbles', _id : 'id_03',
        css_map : { top : 100, left : 20,
                    'background-color' : 'rgb( 128, 192, 192)'
        }
     },
     { name : 'Wilma', _id : 'id_04',
        css_map : { top : 140, left : 20,
                    'background-color' : 'rgb( 192, 128, 128)'
        }
     }
    ];

  mockSio = ( function () {
    var on_sio, emit_sio, emit_mock_msg,
          send_listchange, listchange_idto,
          callback_map = {};

    // Begin /on_sio/
    on_sio = function ( msg_type, callback ) {
      callback_map[ msg_type ] = callback;
    };
    // End /on_sio/

    // Begin /emit_sio/
    emit_sio = function ( msg_type, data ) {
      var person_map, i;

      // respond to 'adduser' event with 'userupdate'
      // callback after a 3s delay
      //
      if ( msg_type === 'adduser' && callback_map.userupdate ) {
        setTimeout( function () {
          person_map = {
            _id     : makeFakeId(),
            name    : data.name,
            css_map : data.css_map
          };
          peopleList.push( person_map );    // add user sign in causes
                                            // push the user to the mock
                                            // people list.
          callback_map.userupdate([ person_map ]);
        }, 3000 );
      }

      // Code to respond to a sent message with a mock response after
      // a 2 second delay.
      // Respond to 'updatechat' event with an 'updatechat'
      // callback after a 2s delay. Echo back user info.
      if ( msg_type === 'updatechat' && callback_map.updatechat ) {
        setTimeout( function () {
          var user = spa.model.people.get_user();
          callback_map.updatechat([{
            dest_id     : user.id,
            dest_name   : user.name,
            sender_id   : data.dest_id,
            msg_text    : 'Thanks for the note, ' + user.name
          }]);
        }, 2000);
      }

      // Clear the callbacks used by chat if leavechat 
      // message is received. This means the user signed out.
      if ( msg_type === 'leavechat' ) {
        // reset login status
        delete callback_map.listchange;
        delete callback_map.updatechat;

        if ( listchange_idto ) {
          clearTimeout (listchange_idto );
          listchange_idto = undefined;
        }
        send_listchange();
      }

      // simulate send of 'updateavatar' message and data
      // to server
      if ( msg_type === 'updateavatar' && callback_map.listchange ) {
        // simulate receipt of 'listchange' message
        for ( i = 0; i < peopleList.length; i++ ) {
            if ( peopleList[i]._id === data.person_id ) {
              peopleList[i].css_map = data.css_map;
              break;
            }
        }

        // execute callback for the 'listchange' message
        callback_map.listchange([peopleList]);
      }

    };
    // End /emit_sio/

    // Begin /emit_mock_msg/
    // Tries to send a mock message to the signed-in user
    // once every 8 seconds.
    // Succeeds only after a user is signed in because
    // this is the time the callback updatechat is set.
    // Once successful, the routine doesn't call itself
    // again and no further mock messages are built and sent.
    emit_mock_msg = function () {

      setTimeout ( function () {
        var user = spa.model.people.get_user();
        if ( callback_map.updatechat ) {
   
          callback_map.updatechat( [{
            dest_id     : user.id,
            dest_name    : user.name,
            sender_id    : 'id_04',
            msg_text     : 'Hi there ' + user.name + '!Wilma here.'
          }]);
        }
        else {
          emit_mock_msg(); // recursive call to self. 
        }
      }, 8000 ); // end setTimeout
    };
    // End /emit_modck_msg/
    
    // Begin /send_listchange/
    // Try once per second to use listchange callback
    // Stop trying after first success.
    send_listchange = function () {
      listchange_idto = setTimeout( function () {
        if ( callback_map.listchange ) {
          callback_map.listchange( [ peopleList ]);
          // Start trying to send a mock message after 
          // the user signs in
          emit_mock_msg();

          listchange_idto = undefined;
        }
        else {
          send_listchange();
        }
      }, 1000 );
    };
    // End /send_listchange/
    
    
    // Start the process
    send_listchange(); 
    
    return { 
      emit : emit_sio, 
      on : on_sio 
    };
  }());

  return { 
    mockSio       : mockSio
  };
} ());

