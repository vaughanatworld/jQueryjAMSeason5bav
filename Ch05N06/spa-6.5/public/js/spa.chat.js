/*
* spa.chat.js
* Chat feature module for SPA
*/
/*jslint          browser : true,   continue  : true,
devel   : true, indent  : 2,      maxerr    : 50,
newcap  : true,   nomen : true,   plusplus  : true,
regexp  : true,  sloppy : true,       vars  : false,
white   : true
*/
/*global $, spa */

// Create namespace of this module
spa.chat = (function () {
  'use strict';
  //------------------------BEGIN MODULE SCOPE VARIABLES----------------
  var
    configMap = {
      // Store HTML template for chat slider.
      // Note the closer is not part of the header.
      main_html : String()
        + '<div class="spa-chat">'
          + '<div class="spa-chat-head">'
            + '<div class="spa-chat-head-toggle">+</div>'
            + '<div class="spa-chat-head-title">'
              + 'Chat'
            + '</div>'
          + '</div>'
          + '<div class="spa-chat-closer">x</div>'
          + '<div class="spa-chat-sizer">'
            + '<div class="spa-chat-list">'
              + '<div class="spa-chat-list-box"></div>'
            + '</div>'
            + '<div class="spa-chat-msg">'
              + '<div class="spa-chat-msg-log"></div>'
              + '<div class="spa-chat-msg-in">'
                + '<form class="spa-chat-msg-form">'
                  + '<input type="text"/>'
                  + '<input type="submit" style="display:none"/>'
                  + '<div class="spa-chat-msg-send">'
                    + 'send'
                  + '</div>'
                + '</form>'
              + '</div>'
            + '</div>'
          + '</div>'
        + '</div>',

      // Note all the chat settings have been moved 
      // to this module.
      settable_map : {
        slider_open_time    : true,
        slider_close_time   : true,
        slider_opened_em    : true,
        slider_closed_em    : true,
        slider_opened_title : true,
        slider_closed_title : true,

        chat_model          : true,
        people_model        : true,
        set_chat_anchor     : true
      },

      slider_open_time      : 250,
      slider_close_time     : 250,
      slider_opened_em      : 18,
      slider_closed_em      : 2,
      slider_opened_title   : 'Tap to close',
      slider_closed_title   : 'Tap to open',
      slider_opened_min_em  : 10,
      
      window_height_min_em  : 20,

      chat_model            : null,
      people_model          : null,
      set_chat_anchor       : null
    }, // end configMap

    stateMap = {
      $append_target        : null,
      position_type         : 'closed',
      px_per_em             : 0,
      slider_hidden_px      : 0,
      slider_closed_px      : 0,
      slider_opened_px      : 0
    },
    jqueryMap = {},

    setJqueryMap,   setPxSizes,   scrollChat,
    writeChat,      writeAlert,   clearChat,
    setSliderPosition,
    onTapToggle,    onSubmitMsg,  onTapList,
    onSetchatee,    onUpdatechat, onListchange,
    onLogin,        onLogout,
    configModule,   initModule,
    removeSlider,   handleResize
    ;
  //------------------------END MODULE SCOPE VARIABLES -----------------

  //------------------------BEGIN UTILITY METHODS ----------------------
  //------------------------END UTILITY METHODS ------------------------

  //------------------------BEGIN DOM METHODS --------------------------
  // Begin DOM method /setJqueryMap/
  /* Note: Update the setJqueryMap to cache a larger number of jQuery
   * collections.
   * Prefer classes over ids. Allows addition of more than one chat
   * slider to a page without refactoring.
   */
  setJqueryMap = function () {
    var 
      $append_target  = stateMap.$append_target,
      $slider         = $append_target.find( '.spa-chat' );

    jqueryMap = { 
      $slider   : $slider,
      $head     : $slider.find( '.spa-chat-head' ),
      $toggle   : $slider.find( '.spa-chat-head-toggle' ),
      $title    : $slider.find( '.spa-chat-head-title' ),
      $sizer    : $slider.find( '.spa-chat-sizer' ),
      $list_box : $slider.find( '.spa-chat-list-box' ),
      $msg_log  : $slider.find( '.spa-chat-msg-log' ),
      $msg_in   : $slider.find( '.spa-chat-msg-in' ),
      $input    : $slider.find( '.spa-chat-msg-in input[type=text]'),
      $send     : $slider.find( '.spa-chat-msg-send' ),
      $form     : $slider.find( '.spa-chat-msg-form' ),
      $window   : $(window)
    };
  };
  // End DOM method /setJqueryMap/

  // Start DOM method /setPxSizes/
  /* Note: Used to calculate the pixel sizes for elements 
   * managed by this module.
   */
  setPxSizes = function () {
    var px_per_em, window_height_em, opened_height_em;

    px_per_em = spa.util_b.getEmSize( jqueryMap.$slider.get(0) );
    window_height_em = Math.floor(
        ( jqueryMap.$window.height() / px_per_em ) + 0.5
        );
      
    // Secret sauce. Determine the slider opened height by
    // comparing the current window height to the threshold
    opened_height_em = 
      window_height_em > configMap.window_height_min_em
      ? configMap.slider_opened_em
      : configMap.slider_opened_min_em;

    stateMap.px_per_em = px_per_em;
    stateMap.slider_closed_px = configMap.slider_closed_em * px_per_em;
    stateMap.slider_opened_px = opened_height_em * px_per_em;
    jqueryMap.$sizer.css ( {
      height : ( opened_height_em - 2 ) * px_per_em
    } );
  };
  // End DOM method /setPxSizes/

  // Begin public DOM method /setSliderPosition/
  // Example    : spa.chat.setSliderPosition ( 'closed' );
  // Purpose    : Move the chat slider to the requested position
  // Arguments  :
  //  * position_type - enum('closed', 'opened', or 'hidden')
  //  * callback      - optional callback to be run at the end
  //      of slider animation. The callback receives a jQuery
  //      collection reqresenting the slider div as its single
  //      argument
  // Action     :
  //  This method moves the slider into the requested position.
  //  If the requested position is the current position, it
  //  returns true without taking further action.
  // Returns    :
  //  * true  - The requested position was achieved
  //  * false - The requested position was not achieved
  // Throws     : none
  //
  setSliderPosition = function ( position_type, callback ) {
    var
      height_px, animate_time, slider_title, toggle_text;

    // position type of 'opened' is not allowed for anon user.
    // therfore we simpley return false; the shell will fix the
    // uri and try again.
    if( position_type === 'opened' &&
      configMap.people_model.get_user().get_is_anon() ) {
      return false;
    }
    
    // return true if slider already in requested position
    if ( stateMap.position_type === position_type ) {
      if ( position_type === 'opened' ) {
        jqueryMap.$input.focus();
      }
      return true;
    }

    // prepare animate parameters
    switch ( position_type ) {
      case 'opened' :
        height_px = stateMap.slider_opened_px;
        animate_time = configMap.slider_open_time;
        slider_title = configMap.slider_opened_title;
        toggle_text = '=';
        jqueryMap.$input.focus();
        break;
      case 'hidden' :
        height_px = 0;
        animate_time = configMap.slider_open_time;
        slider_title = '';
        toggle_text = '+';
        break;
      case 'closed' :
        height_px = stateMap.slider_closed_px;
        animate_time = configMap.slider_close_time;
        slider_title = configMap.slider_closed_title;
        toggle_text = '+';
        break;
      default       :
        // bail for unknown position_type
        return false;
    }

    // animate slider position change
    stateMap.position_type = '';
    jqueryMap.$slider.animate(
        { height : height_px },
        animate_time,
        function () {
          jqueryMap.$toggle.prop( 'title', slider_title );
          jqueryMap.$toggle.text ( toggle_text );
          stateMap.position_type = position_type;
          if ( callback ) { callback(jqueryMap.$slider ); }
        }
    );
    return true;
  };
  // End public DOM method /setSliderPosition/

  // Begin private DOM methods to manage chat message
  scrollChat = function() {
    var $msg_log = jqueryMap.$msg_log;
    $msg_log.animate(
      { scrollTop : $msg_log.prop( 'scrollHeight' ) - $msg_log.height() },
      150
    );
  };

  writeChat = function( person_name, text, is_user ) {
    var msg_class = 
      is_user ? 'spa-chat-msg-log-me' : 'spa-chat-msg-log-msg';

    jqueryMap.$msg_log.append(
      '<div class="' + msg_class + '">'
      + spa.util_b.encodeHtml(person_name) + ': '
      + spa.util_b.encodeHtml(text) + '</div>'
     );
    scrollChat();
  };
  
  writeAlert = function ( alert_text ) {
    jqueryMap.$msg_log.append(
      '<div class="spa-chat-msg-log-alert">'
      + spa.util_b.encodeHtml(alert_text)
      + '</div>'
    );
    scrollChat();
  };
  
  clearChat = function() {
    jqueryMap.$msg_log.empty();
  };
  // end private DOM methods to manage chat message
  //------------------------END DOM METHODS ----------------------------

  //------------------------BEGIN EVENT HANDLERS -----------------------
  /* Note: Makes a call to change the URI anchor and then promptly
   * returns. The hashchange event handler in the Shell will pick
   * up the change.
   */
  onTapToggle = function ( event ) {
    var set_chat_anchor = configMap.set_chat_anchor;

    if ( stateMap.position_type === 'opened' ) {
      set_chat_anchor( 'closed' );
    }
    else if ( stateMap.position_type === 'closed' ) {
      set_chat_anchor( 'opened' );
    }
    return false;
  };
  
  // user generated event when submitting a message to send
  // Uses the model.chat.send_msg method to send the message.
  onSubmitMsg = function ( event ) {
    var msg_text = jqueryMap.$input.val();
    
    if( msg_text.trim() === '' ) {
      return false;
    }
    configMap.chat_model.send_msg( msg_text );
    jqueryMap.$input.focus();
    jqueryMap.$send.addClass( 'spa-x-select' );
    setTimeout(
      function () { jqueryMap.$send.removeClass( 'spa-x-select' ); },
      250
    );
    return false;
  };
  
  // user generated event when user clicks or taps on a person name.
  // Uses model.chat.set_chatee method to set the chatee.
  onTapList = function ( event ) {
    var $tapped = $( event.elem_target ), chatee_id;
    
    if( ! $tapped.hasClass( 'spa-chat-list-name' ) ) {
      return false;
    }
    
    chatee_id = $tapped.attr( 'data-id' );
    if( ! chatee_id ) {
      return false;
    }
    
    configMap.chat_model.set_chatee( chatee_id );
    
    return false;
  };
  
  // event handler for Model-published event spa-setchatee.
  // Selects the new chatee and deselects the old one. Changes
  // the chat slider title and notifies the user the chatee
  // has changed.
  onSetchatee = function ( event, arg_map ) {
    var
      new_chatee  = arg_map.new_chatee,
      old_chatee  = arg_map.old_chatee;
    
    jqueryMap.$input.focus();
    if( ! new_chatee ) {
      if( old_chatee ) {
        writeAlert( old_chatee.name + ' has left the chat' );
      }
      else {
        writeAlert( 'Your friend has left the chat' );
      }
      jqueryMap.$title.text( 'Chat' );
      return false;
    }
    
    jqueryMap.$list_box
      .find( '.spa-chat-list-name' )
      .removeClass( 'spa-x-select' )
      .end()
      .find( '[data-id=' + arg_map.new_chatee.id + ']' )
      .addClass( 'spa-x-select' );
    
    writeAlert( 'Now chatting with ' + arg_map.new_chatee.name );
    jqueryMap.$title.text( 'Chat with ' + arg_map.new_chatee.name );
    return true;
  };
  
  // event handler for Model-published event spa-listchange
  // Get the current people collection and render the people list
  // and highlights the chatee if defined.
  onListchange = function ( event ) {
    var
      list_html = String(),
      people_db = configMap.people_model.get_db(),
      chatee = configMap.chat_model.get_chatee();
    
    people_db().each( function ( person, idx ) {
      var select_class = '';
      
      if( person.get_is_anon() || person.get_is_user() ) {
        return true;
      }
      if( chatee && chatee.id === person.id ) {
        select_class=' spa-x-select';
      }
      
      list_html
        +=  '<div class="spa-chat-list-name'
        +   select_class + '" data-id="' + person.id + '">'
        +   spa.util_b.encodeHtml( person.name ) + '</div>';
    });
      
    if( ! list_html ) {
      list_html = String()
        +   '<div class="spa-chat-list-note">'
        +   'To chat alone is the fate of all great souls...<br>,br>'
        +   'No one is online'
        +   '</div>';
      clearChat();
    }
    
    jqueryMap.$list_box.html( list_html );
  };
  
  // event handler for Model-published event spa-updatechat.
  // Updates the display of the message log. If the originator
  // of the message is the user, the input area is cleared and refocused.
  // Set chatee to the sender of the message.
  onUpdatechat = function ( event, msg_map ) {
    var
      is_user,
      sender_id = msg_map.sender_id,
      msg_text = msg_map.msg_text,
      chatee = configMap.chat_model.get_chatee() || {},
      sender = configMap.people_model.get_by_cid( sender_id );
    
    if( ! sender ) {
      writeAlert( msg_text );
      return false;
    }
    
    is_user = sender.get_is_user();
    if( ! ( is_user || sender_id === chatee.id ) ) {
      configMap.chat_model.set_chatee( sender_id );
    }
    
    writeChat( sender.name, msg_text, is_user );
    
    if( is_user ) {
      jqueryMap.$input.val( '' );
      jqueryMap.$input.focus();
    }
  };
  
  // event handler for Model published event spa-login.
  // Opens the chat slider.
  onLogin = function ( event, login_user ) {
    configMap.set_chat_anchor( 'opened' );
  };
  
  // event handler for Model published event spa-logout.
  // Clears the chat slider message log. Resets the chat slider
  // title and closes the chat slider.
  onLogout = function ( event, logout_user ) {
    configMap.set_chat_anchor( 'closed' );
    jqueryMap.$title.text( 'Chat' );
    clearChat();
  };
  //------------------------END EVENT HANDLERS -------------------------

  //------------------------BEGIN PUBLIC METHODS -----------------------
  // Begin public method /configModule/
  // Example    : spa.chat.configModule({slider_open_em : 18 });
  // Purpose    : Configure the module prior to initialization
  // Arguments  : 
  //  * set_chat_anchor - a callback to modify the URI anchor to
  //    indicate opened or closed state. This callback must return 
  //    false if the requested state cannot be met.
  //  * chat_model      - the chat model object provides methods
  //      to interact with our instant messaging.
  //  * people_model    - the people model object which provides
  //      methods to manage the list of people the model maintains.
  //  * slider_*        - settings. All these are optional scalars
  //      See mapConfig.settable_map for a full list
  //      Example: slider_open_em is the open height in em's
  // Action     : 
  //  The internal configuration data structure (configMap) is
  //  updated with provided arguements. No other actions are taken.  
  // Returns    : true
  // Throws     : Javascript error object and stack trace on
  //              unacceptable or missing arguments
  //
  // Note: Create a configModule method whenever a feature module
  //        accepts settings. Always use the same method name and
  //        the same spa.util.setConfigMap utility.
  //
  configModule = function ( input_map ) {
    spa.util.setConfigMap({
      input_map     : input_map,
      settable_map  : configMap.settable_map,
      config_map    : configMap
    });
    return true;
  };
  // End public method /configModule/

  // Begin public method /initModule/
  // Example    : spa.chat.initModule( $('#div_id') );
  // Purpose    : Directs Chat to offer its capability to the user
  // Arguments  :
  //  * $append_target (example: $('#div_id')).
  //    A jQuery collection that should represent
  //    a single DOM container
  // Action     :
  //  Appends the chat slider to the provided container and fills
  //  it with HTML content. It then initializes elements,
  //  events, and handlers to provide the user with a chat-room
  //  interface
  // Returns    : true on success, false on failure
  // Throws     : none
  //
  // Note       : Almost all our modules have this method. It
  //              starts module execution.
  /* Note: Meets the API specification. Generally has 3 parts
   *  1) Fill the feature container with HTML
   *  2) Cache jQuery collections
   *  3) Initialize event handlers
   */
  initModule = function( $append_target ) {
    var $list_box;
    
    // load chat slider html and jquery cache
    // Append/fill chat slider container with our HTML template.
    stateMap.$append_target = $append_target;
    $append_target.append( configMap.main_html );
    setJqueryMap();
    setPxSizes();

    // initialize chat slider to default title and state
    jqueryMap.$toggle.prop( 'title', configMap.slider_closed_title );
    stateMap.position_type = 'closed';
 
    // Have $list_box subscribe to jQuery global events
    $list_box = jqueryMap.$list_box;
    $.gevent.subscribe( $list_box, 'spa-listchange', onListchange );
    $.gevent.subscribe( $list_box, 'spa-setchatee', onSetchatee );
    $.gevent.subscribe( $list_box, 'spa-updatechat', onUpdatechat );
    $.gevent.subscribe( $list_box, 'spa-login', onLogin );
    $.gevent.subscribe( $list_box, 'spa-logout', onLogout );
    
    // bind user input events
    jqueryMap.$head.bind(     'utap', onTapToggle );
    jqueryMap.$list_box.bind( 'utap', onTapList );
    jqueryMap.$send.bind(     'utap', onSubmitMsg );
    jqueryMap.$form.bind(     'submit', onSubmitMsg );
  };
  // End public method /initModule/

  // Begin public method /removeSlider/
  // Purpose    :
  //  * Removes chatSlider DOM element
  //  * Reverts to initial state
  //  * Removes pointers to callbacks and other data
  //  Arguments : none
  //  Returns   : true
  //  Throws    : none
  //
  removeSlider = function() {
    // unwind initialization and state
    // remove DOM container; this removes event bindings too.
    if ( jqueryMap.$slider ) {
      jqueryMap.$slider.remove();
      jqueryMap = {};
    }
    stateMap.$append_target = null;
    stateMap.position_type  = 'closed';

    // unwind key configurations
    configMap.chat_model    = null;
    configMap.people_model  = null;
    configMap.set_chat_anchor = null;

    return true;
  };
  // End public method /removeSlider/
  
  // Begin public method /handleResize/
  // Purpose    :
  //  Given a window resize event, adjust the presentation
  //  provided by this module if needed
  // Actions    :
  //  If the window height or width falls below
  //  a given threshold, resize the chat slider for the
  //  reduced window size.
  // Returns    : Boolean
  //  * false - resize not considered
  //  * true  - resize considered
  // Throws     : None
  handleResize = function () {
    // don't do anything if we don't have a slider container
    if ( ! jqueryMap.$slider ) { return false; }

    // Recalculate the pixel sizes each time 
    // the handleResize method is called.
    setPxSizes();
    if ( stateMap.position_type === 'opened' ) {
      // Ensure slider height is set to the value calculated
      // in setPxSizes if changed during resize.
      jqueryMap.$slider.css({ height : stateMap.slider_opened_px });
    }
    return true;
  };
  // End public method /handleResize/

  // Export public methods. These are standard methods for nearly
  // all feature modules.
  return {
    setSliderPosition : setSliderPosition,
    configModule      : configModule,
    initModule        : initModule,
    removeSlider      : removeSlider,
    handleResize      : handleResize
  };
  //------------------------END PUBLIC METHODS -------------------------
} ());
