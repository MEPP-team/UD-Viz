const { Component } = require('./Component');
const Script = require('./Script');

/**
 * GameScript object3D component
 *
 * @see module:GameScript
 */
const GameScriptComponent = class extends Component {
  constructor(model) {
    super(model || new GameScriptModel());
  }
};

GameScriptComponent.TYPE = 'GameScript';

/**
 * @see module:GameScript
 */
const GameScriptModel = class extends Script.Model {
  /**
   *
   * @returns {object} - export gamescript model to json object
   */
  toJSON() {
    return {
      uuid: this.uuid,
      scriptParams: this.scriptParams,
      variables: this.variables,
      type: GameScriptComponent.TYPE,
    };
  }
};

/**
 * `MODULE` GameScript
 *
 * @exports GameScript
 */
module.exports = {
  /** @see GameScriptComponent */
  Component: GameScriptComponent,
  /** @see GameScriptModel */
  Model: GameScriptModel,
};
