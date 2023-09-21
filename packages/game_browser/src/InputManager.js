import { Command } from '@ud-viz/game_shared';

/**
 * @callback EventCallback
 * @param {Event} event - native event
 */

/**
 * @callback CommandCallback
 * @returns {Command}
 */

/**
 * @class
 */
export class InputManager {
  /**
   * Manage user inputs with a poll system (https://en.wikipedia.org/wiki/Polling_(computer_science))
   *
   * @param {boolean} [isCaseSensitive=false] true so that the inputs are case sensitive
   */
  constructor(isCaseSensitive = false) {
    /**
     * register callback associated to an event + command id
     *
      @type {Object<string,Object<string,function(MouseState):Command>>} */
    this.mouseCommands = {};

    /**
     * store state of the mouse
     *
      @type {MouseState} */
    this.mouseState = new MouseState();

    /**
     * avoid a command to be computed two times if multiple keys are attach to it
     *
      @type {Object<string,boolean>} */
    this.commandsBuffer = {};

    /**
     * register if a key is pressed or not
     *
      @type {Object<string,boolean>} */
    this.keyMap = {};

    /**
     * register if a key state is down
     *
      @type {string[]} */
    this.keyMapKeyDown = [];

    /**
     * register if a key state is up
     *
      @type {string[]} */
    this.keyMapKeyUp = [];

    /**
     * register a callback associated to a key event
     *
      @type {CommandCallback}  */
    this.keyCommands = {};

    /**
     * true so that the inputs are case sensitive
     *
     * @type {boolean}
     */
    this.isCaseSensitive = isCaseSensitive;

    /**
     * register listeners to dispose them
     *
      @type {Array<{element:HTMLElement,id:string,cb:EventCallback,listener:EventCallback}>} */
    this.listeners = [];

    /**
     * element catching mouse event
     *
      @type {HTMLElement} */
    this.element = null;

    /**
     * if true {@link EventCallback} and {@link CommandCallback} are not called
     *
      @type {boolean} */
    this.pause = false;
  }

  /**
   *
   * @param {string} key - key id
   * @returns {boolean} - true if the key state is down
   */
  isKeyDown(key) {
    return this.keyMapKeyDown.includes(key);
  }

  /**
   *
   * @param {string} key - key id
   * @returns {boolean} - true if the key state is up
   */
  isKeyUp(key) {
    return this.keyMapKeyUp.includes(key);
  }

  /**
   * @param {string} key - keyboard input
   * @returns {boolean} - returns true if the key is a letter
   */
  isKeyALetter(key) {
    return key && key.length == 1 && key.toLowerCase() != key.toUpperCase();
  }

  /**
   * Converts a key to lowercase if case sensitivity is not required.
   *
   * @param {string} key - keyboard input
   * @returns {string} the input key in lowercase if the `isCaseSensitive` is `false` and the input key is a letter. Returns the base key otherwise.
   */
  controlSensitivity(key) {
    if (this.isCaseSensitive) return key;

    return this.isKeyALetter(key) ? key.toLowerCase() : key;
  }

  /**
   *
   * @param {boolean} pause - new inputmanager pause value
   */
  setPause(pause) {
    this.pause = pause;
  }

  /**
   * Used this if a key has not been register in addKeyCommand and you need to know if it's isPressed
   *
   * @param {string[]} keys - ids of the key to listen to
   */
  listenKeys(keys) {
    keys.forEach((k) => {
      this.keyMap[k] = false;
    });
  }

  /**
   * Return true if the key is pressed, dont forget to listenKeys if no addKeyCommand has been used for this key
   *
   * @param {string} key - key id
   * @returns {boolean} - true if pressed, false otherwise
   */
  isPressed(key) {
    return this.keyMap[key];
  }

  /**
   * Register a callback for a particular key and event
   *
   * @param {string|null} key - id of the key if null every key trigger the event
   * @param {string} eventID - id of the event (keyup, keydown)
   * @param {EventCallback} cb - callback called for this event
   */
  addKeyInput(key, eventID, cb) {
    key = this.controlSensitivity(key);

    const listener = (event) => {
      const eventKey = this.controlSensitivity(event.key);
      if ((key == eventKey || key == null) && !this.pause) cb(event);
    };
    window.addEventListener(eventID, listener);
    // Register to dispose it
    this.listeners.push({
      element: window,
      cb: cb, // Keep it to make easier the remove
      id: eventID,
      listener: listener,
    });
  }

  /**
   * Add a command for severals keys
   *
   * @param {string} commandID - command id
   * @param {string[]} keys - keys id assigned
   * @param {function():Command} cb - callback called
   */
  addKeyCommand(commandID, keys, cb) {
    this.commandsBuffer[commandID] = false; // Avoid to stack multiple commands if two key of keys are pressed
    keys.forEach((key) => {
      key = this.controlSensitivity(key);

      if (this.keyCommands[key] != undefined) {
        console.error(key, ' is already assign');
        return;
      }

      // Init keymap
      if (this.keyMap[key] == undefined) this.keyMap[key] = false;

      this.keyCommands[key] = () => {
        if (this.commandsBuffer[commandID]) {
          // command have been already produce by another key associated
          return null;
        }
        const cmd = cb(); // The callback must return a command (don't know why jsdoc imply cmd is a function there ??)
        if (cmd) {
          this.commandsBuffer[commandID] = true;
          return cmd;
        }
        return null;
      };
    });
  }

  /**
   * Dispose a command associated to keys
   *
   * @param {string} commandID - id command
   * @param {string[]} keys - keys id
   */
  removeKeyCommand(commandID, keys) {
    delete this.commandsBuffer[commandID];
    keys.forEach((key) => {
      delete this.keyCommands[key];
      delete this.keyMap[key];
    });
  }

  /**
   * Add a command for mouse
   *
   * @param {string} commandID - id of the command
   * @param {string} eventID - id of the mouse to listen to
   * @param {function(Event):Command} cb - callback called at event
   */
  addMouseCommand(commandID, eventID, cb) {
    if (!this.mouseCommands[eventID]) {
      this.mouseCommands[eventID] = {}; // Init
    }
    if (this.mouseCommands[eventID][commandID])
      console.warn('there is already cb ' + commandID, eventID);
    this.mouseCommands[eventID][commandID] = cb;
  }

  /**
   *
   * @param {string} commandID - command id
   * @param {string} eventID - mouse event id {@link MOUSE_STATE_EVENTS}
   */
  removeMouseCommand(commandID, eventID) {
    if (!this.mouseCommands[eventID][commandID])
      console.warn('nothing to remove ', commandID, eventID);
    delete this.mouseCommands[eventID][commandID];
  }

  /**
   * Register a callback for a particular mouse event
   *
   * @param {HTMLElement} element - element listened
   * @param {string} eventID - id of the event (mousedown, mouseup, mousemove)
   * @param {EventCallback} cb - callback called for this event
   */
  addMouseInput(element, eventID, cb) {
    const listener = (event) => {
      if (!this.pause) {
        cb(event);
      }
    };

    element.addEventListener(eventID, listener);
    // Register to dispose it
    this.listeners.push({
      element: element,
      cb: cb, // Keep it to make easier the remove
      id: eventID,
      listener: listener,
    });
  }

  /**
   * Start listening
   *
   * @param {HTMLElement} element - element listened by mouse
   */
  startListening(element) {
    if (this.element) {
      this.dispose(); // was listening dispose old listener and start listening this element
    }

    this.element = element;

    // Start listening key state
    const keydown = (event) => {
      const key = this.controlSensitivity(event.key);

      if (this.keyMap[key] == false) {
        this.keyMap[key] = true;
        this.keyMapKeyDown.push(key);
      }
    };
    window.addEventListener('keydown', keydown);
    this.listeners.push({ element: window, listener: keydown, id: 'keydown' });

    const keyup = (event) => {
      const key = this.controlSensitivity(event.key);

      if (this.keyMap[key] == true) {
        this.keyMap[key] = false;
        this.keyMapKeyUp.push(key);
      }
    };
    window.addEventListener('keyup', keyup);
    this.listeners.push({ element: window, listener: keyup, id: 'keyup' });

    // Start listening mouse state
    this.mouseState.startListening(element);

    this.initPointerLock();
  }

  /**
   * Initialize pointer lock management
   * On keypress keyup and click event try to request pointer lock on this.element if this.pointerLock is true
   */
  initPointerLock() {
    this.element.requestPointerLock =
      this.element.requestPointerLock || this.element.mozRequestPointerLock;
    document.exitPointerLock =
      document.exitPointerLock || document.mozExitPointerLock;

    // Gesture require to enter the pointerLock mode are click mousemove keypress keyup
    const checkPointerLock = () => {
      if (this.pointerLock && this.element) {
        try {
          // Enter pointerLock
          this.element.requestPointerLock();
        } catch (error) {
          console.error('cant request pointer lock');
        }
      }
    };
    //
    this.addKeyInput(null, 'keypress', checkPointerLock);
    this.addKeyInput(null, 'keyup', checkPointerLock);
    this.addMouseInput(this.element, 'click', checkPointerLock);
  }

  /**
   * If value is true pointerLock mode is activated else it's exited
   *
   * @param {boolean} value - new pointerlock value
   */
  setPointerLock(value) {
    this.pointerLock = value;
    if (!value) document.exitPointerLock(); // Exit since this not require a gesture
  }

  /**
   *
   * @returns {boolean} - input manager pointer lock value
   */
  getPointerLock() {
    return this.pointerLock;
  }

  /**
   * Remove event listener with the callback used to register it
   *
   * @param {EventCallback} cb - listener pass at the registration
   */
  removeInputListener(cb) {
    for (let index = 0; index < this.listeners.length; index++) {
      const o = this.listeners[index];
      if (o.cb == cb) {
        o.element.removeEventListener(o.id, o.listener);
        this.listeners.splice(index, 1);
        break;
      }
    }
  }

  /**
   * Remove listeners and reset variables
   */
  dispose() {
    this.listeners.forEach(function (l) {
      l.element.removeEventListener(l.id, l.listener);
    });
    this.mouseState.dispose();

    // Reset variables
    this.keyMap = {};
    this.keyCommands = {};
    this.mouseCommands = {};
    this.commandsBuffer = {};
    this.listeners = [];
    this.element = null;
  }

  /**
   * Compute Commands with the last state stored of keys and mouse
   *
   * @returns {Command[]} - commands computed
   */
  computeCommands() {
    if (this.pause) return []; // If pause no command should be return

    const result = [];

    // Compute key commands
    for (const id in this.keyCommands) {
      // Notify on down press and up
      if (this.keyMap[id] || this.isKeyUp(id)) {
        const cmd = this.keyCommands[id]();
        if (cmd) result.push(cmd);
      }
    }

    // Compute mouse commands
    for (const eventID in this.mouseCommands) {
      if (this.mouseState.isTrigger(eventID)) {
        const map = this.mouseCommands[eventID];

        for (const commandID in map) {
          const cmd = map[commandID].call(
            undefined, // no context pass
            this.mouseState.mouseEvent[eventID]
          );
          if (cmd) result.push(cmd);
        }
      }
    }

    // Reset
    this.mouseState.reset();
    for (const id in this.commandsBuffer) {
      this.commandsBuffer[id] = false;
    }

    /**
     * @todo maybe this is not the right place to do this (try in keyup event keydown event maybe keymap is useless)
     */
    this.keyMapKeyDown.length = 0;
    this.keyMapKeyUp.length = 0;

    return result;
  }

  /**
   *
   * @returns {HTMLElement} - input manager element
   */
  getElement() {
    return this.element;
  }
}

/**
 * List of mouse event handle by MouseState
 */
const MOUSE_STATE_EVENTS = {
  MOUSE_UP: 'mouseup',
  MOUSE_DOWN: 'mousedown',
  MOUSE_MOVE: 'mousemove',
  MOUSE_CLICK: 'click',
};

/**
 * @class
 */
export class MouseState {
  /**
   * Poll system (https://en.wikipedia.org/wiki/Polling_(computer_science))
   * Listen to the MOUSE_STATE_EVENTS and store the mouse state to then be access synchronously
   */
  constructor() {
    /**
     * register if a mouse event is trigger or not
     *
      @type {Object<string,boolean>} */
    this.mouseMap = {};

    /**
     * register event native js to pass it later synchronously
     *
      @type {Object<string,Event>} */
    this.mouseEvent = {};

    /**
     * true if the mouse is dragging
     *
      @type {boolean} */
    this.dragging = false;

    /**
     * register all listeners to well dispose them on dipose
     *
      @type {Array<{element:HTMLElement,listener:EventCallback,id:string}>} */
    this.listeners = [];
  }

  /**
   *
   * @returns {boolean} - true if the mouse is dragging, false otherwise
   */
  isDragging() {
    return this.dragging;
  }

  /**
   * Remove listeners and reset variables
   */
  dispose() {
    // Reset variables
    this.mouseMap = {};
    this.mouseEvent = {};
    this.dragging = false;

    this.listeners.forEach(function (l) {
      l.element.removeEventListener(l.id, l.listener);
    });

    this.listeners = [];
  }

  /**
   * Start listening {@link MOUSE_STATE_EVENTS} on the element
   *
   * @param {HTMLElement} element - html catching events
   */
  startListening(element) {
    for (const id in MOUSE_STATE_EVENTS) {
      this.listeners.push({
        element: element,
        listener: this.addEvent(element, MOUSE_STATE_EVENTS[id]),
        id: MOUSE_STATE_EVENTS[id],
      });
    }
  }

  /**
   * Add a listener for a particular event on element
   *
   * @param {HTMLElement} element - element to listen to
   * @param {string} idEvent - mouse events
   * @returns {EventCallback} - Callback call for this event
   */
  addEvent(element, idEvent) {
    const listener = (event) => {
      if (idEvent === MOUSE_STATE_EVENTS.MOUSE_DOWN) {
        this.dragging = true;
      } else if (idEvent === MOUSE_STATE_EVENTS.MOUSE_UP) this.dragging = false;
      this.mouseMap[idEvent] = true; // Is trigger
      this.mouseEvent[idEvent] = event;
    };
    element.addEventListener(idEvent, listener);
    this.mouseMap[idEvent] = false;

    return listener;
  }

  /**
   * Access the last Event stored for eventID
   *
   * @param {string} eventID - id of the mouse event
   * @returns {Event} - The last event store for this event
   */
  event(eventID) {
    return this.mouseEvent[eventID];
  }

  /**
   * Return true if this event has been triggered on the last poll
   *
   * @param {string} eventID - event id
   * @returns {boolean} - true if the eventID has been triggered
   */
  isTrigger(eventID) {
    return this.mouseMap[eventID];
  }

  /**
   * Reset Event triggered
   */
  reset() {
    // Reset trigger mousemap
    for (const idEvent in this.mouseMap) {
      this.mouseMap[idEvent] = false;
    }
  }
}
