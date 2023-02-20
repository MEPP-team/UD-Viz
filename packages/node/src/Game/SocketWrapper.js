const { Constant, Game } = require('@ud-viz/shared');
const Socket = require('socket.io').Socket;

module.exports = class SocketWrapper {
  /**
   * Send game state to client
   *
   * @param {Socket} socket - socket to wrap
   */
  constructor(socket) {
    /**
     * socket embeded
     *  
     @type {Socket}*/
    this.socket = socket;

    /**
     *  last state send to client use to compute GameStateDiff
     * 
     @type {Game.State|null} */
    this.lastStateSend = null;
  }

  /**
   * Send a statediff or a state to client
   *
   * @param {object} stateJSON - state serialized
   */
  sendState(stateJSON) {
    const state = new Game.State(
      new Game.Object3D(stateJSON.object3D),
      stateJSON.timestamp
    );

    if (!this.lastState) {
      // there is no last state meaning it's the first time the user is notify for this game
      this.socket.emit(Constant.WEBSOCKET.MSG_TYPE.NEW_GAME, {
        state: stateJSON,
      });
    } else {
      this.socket.emit(
        Constant.WEBSOCKET.MSG_TYPE.GAME_DIFF,
        state.sub(this.lastState)
      );
    }

    this.lastState = state;
  }
};
