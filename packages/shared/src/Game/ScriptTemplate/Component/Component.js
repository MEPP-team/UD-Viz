const Object3D = require('../../Object3D');
const { Component } = require('../../Component/ExternalScript');
const Constants = require('../Constants');
const THREE = require('three');

module.exports = {
  /**
   * Apply native commands {@link Constants.COMMAND} to an object3D
   *
   * @param {Command[]} commands - native commands handle by script template
   */
  applyNativeCommands: function (context) {
    const SPEED_TRANSLATE = 0.04;
    const SPEED_ROTATE = 0.0006;

    context.commands.forEach((command) => {
      if (!command.data) return;

      const updatedObject3D = context.object3D.getObjectByProperty(
        'uuid',
        command.data.object3DUUID
      );

      if (!updatedObject3D) return;

      const externalScriptComponent = updatedObject3D.getComponent(
        Component.TYPE
      );

      switch (command.type) {
        case Constants.COMMAND.MOVE_FORWARD:
          Object3D.moveForward(updatedObject3D, SPEED_TRANSLATE * context.dt);
          updatedObject3D.setOutdated(true);
          break;
        case Constants.COMMAND.MOVE_BACKWARD:
          Object3D.moveBackward(updatedObject3D, SPEED_TRANSLATE * context.dt);
          updatedObject3D.setOutdated(true);
          break;
        case Constants.COMMAND.ROTATE_LEFT:
          Object3D.rotate(
            updatedObject3D,
            new THREE.Vector3(0, 0, SPEED_ROTATE * context.dt)
          );
          updatedObject3D.setOutdated(true);
          break;
        case Constants.COMMAND.ROTATE_RIGHT:
          Object3D.rotate(
            updatedObject3D,
            new THREE.Vector3(0, 0, -SPEED_ROTATE * context.dt)
          );
          updatedObject3D.setOutdated(true);
          break;
        case Constants.COMMAND.UPDATE_TRANSFORM:
          if (command.data.position) {
            if (!isNaN(command.data.position.x)) {
              updatedObject3D.position.x = command.data.position.x;
              updatedObject3D.setOutdated(true);
            }
            if (!isNaN(command.data.position.y)) {
              updatedObject3D.position.y = command.data.position.y;
              updatedObject3D.setOutdated(true);
            }
            if (!isNaN(command.data.position.z)) {
              updatedObject3D.position.z = command.data.position.z;
              updatedObject3D.setOutdated(true);
            }
          }
          if (command.data.scale) {
            if (!isNaN(command.data.scale.x)) {
              updatedObject3D.scale.x = command.data.scale.x;
              updatedObject3D.setOutdated(true);
            }
            if (!isNaN(command.data.scale.y)) {
              updatedObject3D.scale.y = command.data.scale.y;
              updatedObject3D.setOutdated(true);
            }
            if (!isNaN(command.data.scale.z)) {
              updatedObject3D.scale.z = command.data.scale.z;
              updatedObject3D.setOutdated(true);
            }
          }
          break;
        case Constants.COMMAND.UPDATE_EXTERNALSCRIPT_VARIABLES:
          if (externalScriptComponent) {
            externalScriptComponent.getModel().variables[
              command.data.nameVariable
            ] = command.data.variableValue;
            updatedObject3D.setOutdated(true);
            // console.log(
            //   'update ',
            //   command.data.nameVariable,
            //   ' set with ',
            //   command.data.variableValue
            // );
          }
          break;
        default:
          break;
      }
    });
  },
};
