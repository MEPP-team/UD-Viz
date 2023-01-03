const THREE = require('three');
import { AssetManager, InputManager, THREEUtil } from '../Component';
import { Game, JSONUtil, Command } from '@ud-viz/core';
import { RenderController } from './RenderController';
import { AudioController } from './AudioController';
import { Base } from '../Frame3D/Frame3D';

const defaultConfigScene = {
  shadowMapSize: 2046,
  sky: {
    color: {
      r: 0.4,
      g: 0.6,
      b: 0.8,
    },
    sun_position: {
      offset: 10,
      phi: 1,
      theta: 0.3,
    },
  },
};

/**
 * Context pass to the GameObject BrowserScript to work (TODO this class is relevant ? all attributes could be in gameview class)
 */
export class Context {
  /**
   *
   * @param {Base} frame3D - could be a Frame3DBase or a Frame3DPlanar
   * @param {AssetManager} assetManager
   * @param {InputManager} inputManager
   * @param externalGameScriptClass
   * @param options
   */
  constructor(
    frame3D,
    assetManager,
    inputManager,
    externalGameScriptClass,
    options = {}
  ) {
    /** @type {number} */
    this.dt = 0;

    /** @type {class{}} */
    this.externalGameScriptClass = externalGameScriptClass;

    /** @type {Base} */
    this.frame3D = frame3D; // maybe create two attributes one planar and the other one base to have autocompletion

    /** @type {AssetManager} */
    this.assetManager = assetManager;

    /** @type {InputManager} */
    this.inputManager = inputManager;

    /** @type {THREE.Object3D} */
    this.object3D = new THREE.Object3D();
    this.object3D.name = 'External_Game_Context_Object3D';
    this.frame3D.scene.add(this.object3D);

    /** @type {object} store uuid of object3D in context use to identify new one incoming*/
    this.currentUUID = {};

    /** @type {Game.Object3D} */
    this.currentGameObject3D = null;

    // Overwrite conf
    const overWriteConf = JSON.parse(JSON.stringify(defaultConfigScene));
    JSONUtil.overWrite(overWriteConf, options.sceneConfig || {});
    this.configScene = overWriteConf;
    this.directionalLight = null;
    this.initScene();

    // register listener
    this.frame3D.on(Base.EVENT.DISPOSE, () => {
      if (this.currentGameObject3D) {
        this.currentGameObject3D.traverse(function (child) {
          if (!child.isGameObject3D) return;

          const scriptComponent = child.getComponent(
            Game.Component.ExternalScript.TYPE
          );
          if (scriptComponent) {
            scriptComponent.getController().execute(Context.EVENT.DISPOSE);
          }
          const audioComponent = child.getComponent(Game.Component.Audio.TYPE);
          if (audioComponent) audioComponent.getController().dispose();
        });
      }
    });

    this.frame3D.on(Base.EVENT.RESIZE, () => {
      if (this.currentGameObject3D) {
        this.currentGameObject3D.traverse(function (child) {
          if (!child.isGameObject3D) return;

          const scriptComponent = child.getComponent(
            Game.Component.ExternalScript.TYPE
          );
          if (scriptComponent) {
            scriptComponent.getController().execute(Context.EVENT.ON_RESIZE);
          }
        });
      }
    });
  }

  initScene() {
    // Init renderer
    THREEUtil.initRenderer(
      this.frame3D.getRenderer(),
      new THREE.Color(
        this.configScene.sky.color.r,
        this.configScene.sky.color.g,
        this.configScene.sky.color.b
      )
    );

    // Add lights
    const { directionalLight } = THREEUtil.addLights(this.frame3D.getScene());
    this.directionalLight = directionalLight;

    // Configure shadows based on a config files
    this.directionalLight.shadow.mapSize = new THREE.Vector2(
      this.configScene.shadowMapSize,
      this.configScene.shadowMapSize
    );
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.bias = -0.0005;

    if (this.configScene.sky.paths) {
      THREEUtil.addCubeTexture(
        this.configScene.sky.paths,
        this.frame3D.getScene()
      );
    }
  }

  /**
   *
   * @param {number} dt - delta time
   * @param {Game.State[]} states - new states to update to
   * @param {boolean} updateGameObject
   */
  step(dt, states, updateGameObject = true) {
    this.dt = dt; // ref it for external scripts

    /** @type {Game.Object3D[]} */
    const newGO = [];
    const state = states[states.length - 1]; // The more current of states

    // Update currentGameObject3D with the new states
    if (this.currentGameObject3D) {
      if (updateGameObject) {
        this.currentGameObject3D.traverse((child) => {
          if (!child.isGameObject3D) return;

          const gameContextChild = state
            .getObject3D()
            .getObjectByProperty('uuid', child.uuid);
          if (gameContextChild) {
            // still present in game context
            if (child.hasGameContextUpdate()) {
              if (!child.isStatic()) {
                // if no static update transform
                child.position.copy(gameContextChild.position);
                child.scale.copy(gameContextChild.scale);
                child.rotation.copy(gameContextChild.rotation);
              }

              // Stack the same go of all states not consumed yet
              const bufferedGO = [];
              states.forEach((s) => {
                const bGO = s
                  .getObject3D()
                  .getObjectByProperty('uuid', child.uuid);
                if (bGO) bufferedGO.push(bGO);
              });

              // Update local component for bufferedGO
              let componentHasBeenUpdated = false; // Flag to know if a change of state occured

              const childRenderComp = child.getComponent(
                Game.Component.Render.TYPE
              );
              const childExternalScriptComp = child.getComponent(
                Game.Component.ExternalScript.TYPE
              );

              for (let index = 0; index < bufferedGO.length; index++) {
                const gameContextGONotConsumned = bufferedGO[index];

                // Render comp
                if (childRenderComp) {
                  const bufferedRenderComp =
                    gameContextGONotConsumned.getComponent(
                      Game.Component.Render.TYPE
                    );

                  // Check if color change
                  if (
                    !childRenderComp
                      .getModel()
                      .getColor()
                      .equals(bufferedRenderComp.getModel().getColor())
                  ) {
                    console.error('DEPRECATED');
                    childRenderComp.setColor(bufferedRenderComp.getColor());
                    componentHasBeenUpdated = true; // Notify change
                  }

                  // Check if idModel change
                  if (
                    childRenderComp.getModel().getIdRenderData() !=
                    bufferedRenderComp.getModel().getIdRenderData()
                  ) {
                    console.error('DEPRECATED');
                    childRenderComp
                      .getController()
                      .setIdRenderData(
                        bufferedRenderComp.getModel().getIdRenderData()
                      );

                    componentHasBeenUpdated = true;
                  }
                }

                if (
                  childExternalScriptComp &&
                  gameContextGONotConsumned.isOutdated()
                ) {
                  const bufferedExternalScriptComp =
                    gameContextGONotConsumned.getComponent(
                      Game.Component.ExternalScript.TYPE
                    );

                  // Replace variables in external script
                  childExternalScriptComp
                    .getController()
                    .setVariables(
                      bufferedExternalScriptComp.getModel().getVariables()
                    );

                  // Launch event onOutdated
                  componentHasBeenUpdated =
                    componentHasBeenUpdated ||
                    childExternalScriptComp
                      .getController()
                      .execute(Context.EVENT.ON_OUTDATED);
                }
              }

              if (componentHasBeenUpdated && childExternalScriptComp) {
                // Launch event onComponentUpdate
                childExternalScriptComp
                  .getController()
                  .execute(Context.EVENT.ON_COMPONENT_UPDATE);
              }
            }
          } else {
            // Render removal
            child.parent.remove(child);

            // Do not exist remove it
            child.removeFromParent();

            // BrowserScript removal
            const scriptComponent = child.getComponent(
              Game.Component.ExternalScript.TYPE
            );
            if (scriptComponent) {
              scriptComponent.getController().execute(Context.EVENT.ON_REMOVE);
            }

            // Audio removal
            const audioComponent = child.getComponent(
              Game.Component.Audio.TYPE
            );
            if (audioComponent) {
              audioComponent.getController().dispose();
            }

            delete this.currentUUID[child.uuid];
          }
        });

        state.getObject3D().traverse((child) => {
          if (!child.isGameObject3D) return; // => this one should be useless since Game.State should be only compose of GameObject3D

          const old = this.currentGameObject3D.getObjectByProperty(
            'uuid',
            child.uuid
          );
          if (!old) {
            // New one add it
            const parent = this.currentGameObject3D.getObjectByProperty(
              'uuid',
              child.parentUUID
            );

            parent.add(child);
          }

          if (!this.currentUUID[child.uuid]) {
            newGO.push(child.uuid);
          }
        });
      }
    } else {
      // first state
      this.currentGameObject3D = state.getObject3D();
      // add object3D to the context
      this.object3D.add(this.currentGameObject3D);

      this.currentGameObject3D.traverse((child) => {
        if (!child.isGameObject3D) return; // => this one should be useless since Game.State should be only compose of GameObject3D

        newGO.push(child);
      });
    }

    // Init Game.Object3D component controllers of the new Game.Object3D
    newGO.forEach((go) => {
      this.initComponentControllers(go);
      // update matrix world so even object.static have a correct since the autoupdate is disable
      go.updateMatrixWorld(true);
    });

    // External Script INIT + ON_NEW_GAMEOBJECT
    newGO.forEach((g) => {
      // Console.log('New GO => ', g.name);
      this.currentUUID[g.uuid] = true;

      // Init newGO localscript
      const scriptComponent = g.getComponent(
        Game.Component.ExternalScript.TYPE
      );
      if (scriptComponent) {
        scriptComponent.getController().execute(Context.EVENT.INIT);
      }

      // Notify other go that a new go has been added
      this.currentGameObject3D.traverse((child) => {
        if (!child.isGameObject3D) return;

        const otherScriptComponent = child.getComponent(
          Game.Component.ExternalScript.TYPE
        );
        if (otherScriptComponent) {
          otherScriptComponent
            .getController()
            .execute(Context.EVENT.ON_NEW_GAMEOBJECT, [g]);
        }
      });
    });

    // Update matrixWorld
    this.object3D.updateMatrixWorld();

    // Update shadow
    if (newGO.length) {
      THREEUtil.bindLightTransform(
        this.configScene.sky.sun_position.offset,
        this.configScene.sky.sun_position.phi,
        this.configScene.sky.sun_position.theta,
        this.object3D,
        this.directionalLight
      );
    }

    // TODO updateGameObject ??? refacto editor
    if (updateGameObject) {
      this.currentGameObject3D.traverse((child) => {
        if (!child.isGameObject3D) return;

        // Tick local script
        const scriptComponent = child.getComponent(
          Game.Component.ExternalScript.TYPE
        );
        if (scriptComponent) {
          scriptComponent.getController().execute(Context.EVENT.TICK);
        }

        // Tick audio component
        const audioComp = child.getComponent(Game.Component.Audio.TYPE);
        // Position in world referential
        if (audioComp) {
          const camera = this.frame3D.getCamera();
          const cameraMatWorldInverse = camera.matrixWorldInverse;
          audioComp.getController().tick(cameraMatWorldInverse);
        }

        // Render component
        const renderComp = child.getComponent(Game.Component.Render.TYPE);
        if (renderComp) renderComp.getController().tick(dt);
      });
    }
  }

  /**
   *
   * @param {Game.Object3D} go
   */
  initComponentControllers(go) {
    const components = go.getComponents();
    for (const type in components) {
      const component = go.getComponent(type);
      if (component.getController()) {
        throw new Error('controller already init ' + go.name);
      }
      const scripts = {};
      switch (type) {
        case Game.Component.Audio.TYPE:
          component.initController(
            new AudioController(component.getModel(), go, this.assetManager)
          );
          break;
        case Game.Component.Render.TYPE:
          component.initController(
            new RenderController(component.getModel(), go, this.assetManager)
          );
          break;
        case Game.Component.ExternalScript.TYPE:
          component
            .getModel()
            .getIdScripts()
            .forEach((idScript) => {
              scripts[idScript] = this.createInstanceOf(
                idScript,
                go,
                component.getModel().getVariables()
              );
            });
          component.initController(
            new Game.Component.ScriptController(
              component.getModel(),
              go,
              scripts
            )
          );
          break;
        default:
        // no need to initialize controller for this component
      }
    }
  }

  createInstanceOf(id, object3D, modelVariables) {
    const constructor = this.externalGameScriptClass[id];
    if (!constructor) {
      console.log('script loaded');
      for (const id in this.externalGameScriptClass) {
        console.log(this.externalGameScriptClass[id]);
      }
      throw new Error('no script with id ' + id);
    }
    return new constructor(this, object3D, modelVariables);
  }

  // Util method

  /**
   * Return the first localscript found with the id passed
   *
   * @param {*} id id of the localscript
   * @returns the first localscript found with id
   */
  findBrowserScriptWithID(id) {
    let result = null;
    this.object3D.traverse(function (child) {
      if (!child.isGameObject3D) return;
      const scripts = child.fetchBrowserScripts();
      if (scripts && scripts[id]) {
        result = scripts[id];
        return true;
      }
      return false;
    });

    return result;
  }

  /**
   * Return the first go found with the id of the localscript passed
   *
   * @param {*} id id of the localscript
   * @returns the first go
   */
  findGOWithBrowserScriptID(id) {
    let result = null;
    this.object3D.traverse(function (child) {
      if (!child.isGameObject3D) return;

      const scripts = child.fetchBrowserScripts();
      if (scripts && scripts[id]) {
        result = child;
        return true;
      }
      return false;
    });

    return result;
  }

  forceUpdate() {
    console.error('DEPRECATED');
    // let states = [];
    // if (!state) {
    //   const computer = this.interpolator.getLocalComputer();
    //   if (computer) {
    //     states = [computer.computeCurrentState()];
    //   } else {
    //     throw new Error('no local computer');
    //   }
    // } else states = [state];

    // const old = this.updateGameObject;
    // this.updateGameObject = true;
    // this.update(states);
    // this.updateGameObject = old;
  }

  /**
   *
   * @param {Command[]} cmds
   */
  sendCommandToGameContext(cmds) {
    console.log(cmds, ' cant be sent');
    console.error('this method has to be implement in your app template');
  }
}

Context.EVENT = {
  INIT: 'init', // Before first tick
  TICK: 'tick', // Every tick
  ON_NEW_GAMEOBJECT: 'onNewGameObject', // When a go is added
  ON_OUTDATED: 'onOutdated', // Call when outdated is raised
  DISPOSE: 'dispose', // frame3D is disposed
  ON_REMOVE: 'onRemove', // Object is remove from parent
  ON_COMPONENT_UPDATE: 'onComponentUpdate', // Component updated smthg
  ON_RESIZE: 'onResize', // On resize window
};

export class ExternalScriptBase {
  /**
   * constructor should not be rewrite use init instead
   *
   * @param {Context} context
   * @param {Object3D} object3D
   * @param {object|JSON} variables
   */
  constructor(context, object3D, variables) {
    /** @type {Context} */
    this.context = context;
    /** @type {Game.Object3D} */
    this.object3D = object3D;
    /** @type {object} */
    this.variables = variables;
  }
  init() {}
  tick() {}
  onNewGameObject() {}
  onOutdated() {}
  onRemove() {}
  onComponentUpdate() {}
  dispose() {}
  onResize() {}
}
