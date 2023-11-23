const Collider = require('./component/Collider');
const Script = require('./component/Script');
const GameScript = require('./component/GameScript');
const Object3D = require('./Object3D');
const State = require('./state/State');
const Command = require('./Command');

const { Collisions } = require('detect-collisions');
const THREE = require('three');

/**
 * @callback ContextListener
 * @param {*} params - params pass when event is dispatched
 */

/** @class */
const Context = class {
  /**
   * Handle collisions, add/remove gameobject3D, process commands + trigger {@link ScriptBase} event
   *
   * @param {Object<string,import("./Context").ScriptBase>} gameScriptClass - map of class extended {@link ScriptBase}
   * @param {Object3D} object3D - root game object3D
   */
  constructor(gameScriptClass, object3D) {
    /**
     *
     * @returns {Object<string,import("./Context").ScriptBase>} - formated gamescript class
     */
    const formatGameScriptClass = () => {
      const result = {};

      const parse = (object) => {
        for (const key in object) {
          const value = object[key];

          if (value.IS_SCRIPTBASE) {
            if (result[value.ID_SCRIPT])
              throw new Error('no unique id ' + value.ID_SCRIPT);
            result[value.ID_SCRIPT] = value;
          } else if (value instanceof Object) {
            parse(value);
          } else {
            console.error(object, value, key, object.name);
            throw new Error(
              'wrong value type ' + typeof object + ' key ' + key
            );
          }
        }
      };

      parse(gameScriptClass);

      return result;
    };

    /**
     * class that can be reference by {@link GameScript} of an object3D
     *
     * @type {Object<string,import("./Context").ScriptBase>}
     */
    this.gameScriptClass = formatGameScriptClass();

    /**
     * root game object3D
     *
     * @type {import("./Object3D").Object3D}
     */
    this.object3D = object3D;

    /**
     * Collisions system {@link https://www.npmjs.com/package/detect-collisions}
     *
     * @type {Collisions}
     */
    this.collisions = new Collisions();

    /**
     * Buffer to handle collision events {@link Context.EVENT}
     *
     * @type {Object<string,string>}
     */
    this.collisionsBuffer = {};

    /**
     * Listeners of custom events
     *
     * @type {Object<string,ContextListener[]>}
     */

    this.listeners = {};

    /**
     * delta time
     *
     * @type {number}
     */
    this.dt = 0;

    /** 
     * commands buffer
     *  
     @type {Array<Command>} */
    this.commands = [];
  }

  /**
   * Create a class instance of game script class for an object3D  given an id
   *
   * @param {string} id - id of the class
   * @param {Object3D} object3D - object3D that is going to use this instance
   * @param {object} modelVariables - custom variables associated to this instance
   * @returns {import("./Context").ScriptBase} - instance of the class bind with object3D and modelVariables
   */
  createInstanceOf(id, object3D, modelVariables) {
    const constructor = this.gameScriptClass[id];
    if (!constructor) {
      console.log('script loaded');
      for (const key in this.gameScriptClass) {
        console.log(this.gameScriptClass[key]);
      }
      throw new Error('no script with id ' + id);
    }
    return new constructor(this, object3D, modelVariables);
  }

  /**
   * Load its object3D
   *
   * @returns {Promise} - promise resolving at the end of the load
   */
  load() {
    return this.loadObject3D(this.object3D);
  }

  /**
   * Load an object3D into context
   *
   * @param {import("./Object3D").Object3D} obj - object3D to load
   * @returns {Promise} - promise resolving at the end of the load
   */
  loadObject3D(obj) {
    return new Promise((resolve) => {
      // init game component controllers of object3D
      this.initComponentControllers(obj);

      // compute promises
      const promises = [];

      obj.traverse(function (child) {
        const scriptC = child.getComponent(GameScript.Component.TYPE);
        if (scriptC) {
          const scripts = scriptC.getController().scripts;
          for (const [, script] of scripts) {
            const result = scriptC
              .getController()
              .executeScript(script, Context.EVENT.LOAD);
            if (result) promises.push(result);
          }
        }
      });

      Promise.all(promises).then(() => {
        this.registerObject3DCollision(obj);

        // trigger Context.EVENT.INIT
        this.dispatchScriptEvent(obj, Context.EVENT.INIT);

        resolve();
      });
    }).catch((error) => {
      console.error(error);
    });
  }

  /**
   * Step context
   *
   * @param {number} dt - new delta time of step
   */
  step(dt) {
    this.dt = dt;

    this.commands.forEach((cmd) => {
      this.dispatchScriptEvent(this.object3D, Context.EVENT.ON_COMMAND, [
        cmd.type,
        cmd.data,
      ]);
    });
    this.commands.length = 0; // clear command

    this.dispatchScriptEvent(this.object3D, Context.EVENT.TICK);

    this.updateCollision(this.object3D);

    this.object3D.traverse((child) => {
      if (child.isStatic()) return;
      const colliderComponent = child.getComponent(Collider.Component.TYPE);
      if (colliderComponent) {
        const collidedObject3D = [];
        const buffer = this.collisionsBuffer[child.uuid];

        colliderComponent
          .getController()
          .getShapeWrappers()
          .forEach((wrapper) => {
            const shape = wrapper.getShape();
            const potentials = shape.potentials();
            const result = this.collisions.createResult();
            for (const p of potentials) {
              /** In {@link ShapeWrapper} shape are link to shapewrapper */
              const potentialObject3D = p.getWrapper().getObject3D();
              if (!potentialObject3D.isStatic()) continue;
              if (shape.collides(p, result)) {
                collidedObject3D.push(potentialObject3D.uuid);

                // child collides with potentialObject3D
                if (buffer.includes(potentialObject3D.uuid)) {
                  // Already collided
                  this.dispatchScriptEvent(
                    child,
                    Context.EVENT.IS_COLLIDING,
                    [potentialObject3D],
                    false
                  );
                  this.dispatchScriptEvent(
                    potentialObject3D,
                    Context.EVENT.IS_COLLIDING,
                    [child],
                    false
                  );
                } else {
                  // OnEnter
                  buffer.push(potentialObject3D.uuid); // Register in buffer

                  // notify both gameobject
                  this.dispatchScriptEvent(
                    child,
                    Context.EVENT.ON_ENTER_COLLISION,
                    [potentialObject3D],
                    false
                  );
                  this.dispatchScriptEvent(
                    potentialObject3D,
                    Context.EVENT.ON_ENTER_COLLISION,
                    [child],
                    false
                  );
                }

                // move position of the no static object3D according the collide result
                if (
                  colliderComponent.getModel().isBody() &&
                  p.getWrapper().isBody()
                ) {
                  child.position.sub(
                    new THREE.Vector3(
                      result.overlap * result.overlap_x,
                      result.overlap * result.overlap_y,
                      0
                    )
                  );
                  child.setOutdated(true);
                  // child position has changed updated collider
                  this.updateCollision(child);
                }
              }
            }
          });

        // Notify onLeave
        for (let i = buffer.length - 1; i >= 0; i--) {
          const uuid = buffer[i];
          if (!collidedObject3D.includes(uuid)) {
            const gameObjectCollided = this.object3D.getObjectByProperty(
              'uuid',
              uuid
            );

            this.dispatchScriptEvent(
              child,
              Context.EVENT.ON_LEAVE_COLLISION,
              [gameObjectCollided],
              false
            );
            this.dispatchScriptEvent(
              gameObjectCollided,
              Context.EVENT.ON_LEAVE_COLLISION,
              [child],
              false
            );
            buffer.splice(i, 1); // Remove from buffer
          }
        }
      }
    });
  }

  /**
   * It will dispatch an event to all {@link ScriptBase} in object3D
   *
   * @param {import("./Object3D").Object3D} object3D - object3D that you want to dispatch the event to.
   * @param {string} event - name of the event to dispatch see possible value in {@link Context.EVENT}
   * @param {any[]} params - params to pass to {@link ScriptBase}
   * @param {boolean} [recursive=true] - traverse object3D child if true
   */
  dispatchScriptEvent(object3D, event, params = [], recursive = true) {
    if (recursive) {
      object3D.traverse(function (child) {
        const scriptComponent = child.getComponent(GameScript.Component.TYPE);
        if (scriptComponent) {
          scriptComponent.getController().execute(event, params);
        }
      });
    } else {
      const scriptComponent = object3D.getComponent(GameScript.Component.TYPE);
      if (scriptComponent) {
        scriptComponent.getController().execute(event, params);
      }
    }
  }

  /**
   * Initialize controllers used in context
   *
   * @param {Object3D} obj - object3D to initialize controllers
   */
  initComponentControllers(obj) {
    obj.traverse((child) => {
      const components = child.getComponents();
      for (const type in components) {
        const component = child.getComponent(type);
        if (component.getController())
          throw new Error('controller already init ' + child.name);
        let scripts = null;
        switch (type) {
          case GameScript.Component.TYPE:
            scripts = new Map();
            component.getModel().scriptParams.forEach((sParams) => {
              scripts.set(
                sParams.id,
                this.createInstanceOf(
                  sParams.id,
                  child,
                  component.getModel().variables
                )
              );
            });

            scripts = new Map(
              [...scripts.entries()].sort((a, b) => {
                const aSParam = component
                  .getModel()
                  .scriptParams.filter((el) => el.id === a[0]);
                const bSParam = component
                  .getModel()
                  .scriptParams.filter((el) => el.id === b[0]);

                const aPrio = !isNaN(aSParam[0].priority)
                  ? aSParam[0].priority
                  : -Infinity;
                const bPrio = !isNaN(bSParam[0].priority)
                  ? bSParam[0].priority
                  : -Infinity;

                return bPrio - aPrio;
              })
            );

            component.initController(
              new Script.Controller(component.getModel(), child, scripts)
            );
            break;
          case Collider.Component.TYPE:
            component.initController(
              new Collider.Controller(component.getModel(), child)
            );
            break;
          default:
          // no need to initialize controller for this component
        }
      }
    });
  }

  /**
   * Add a object3D into the collision system
   *
   * @param {import("./Object3D").Object3D} object3D - object3D to register
   */
  registerObject3DCollision(object3D) {
    object3D.traverse((child) => {
      if (this.collisionsBuffer[child.uuid]) return; // Already add
      this.collisionsBuffer[child.uuid] = [];

      const colliderComponent = child.getComponent(Collider.Component.TYPE);
      if (colliderComponent) {
        colliderComponent
          /** @type {Context} */ .getController()
          .getShapeWrappers()
          .forEach((wrapper) => {
            this.collisions.insert(wrapper.getShape());
          });
      }
    });

    this.updateCollisionBuffer();
  }

  /**
   * Update object3D collider controller + update collisions system
   *
   * @param {Object3D} object3D - object3D to update
   */
  updateCollision(object3D) {
    object3D.traverse((child) => {
      const colliderComponent = child.getComponent(Collider.Component.TYPE);
      if (colliderComponent) colliderComponent.getController().update();
    });
    this.collisions.update();
  }

  /**
   * Update the collision buffer
   */
  updateCollisionBuffer() {
    this.updateCollision(this.object3D);

    for (const uuid in this.collisionsBuffer) {
      this.collisionsBuffer[uuid].length = 0; // reset buffer
    }

    this.object3D.traverse((child) => {
      if (child.isStatic()) return;
      const colliderComponent = child.getComponent(Collider.Component.TYPE);
      if (colliderComponent) {
        colliderComponent
          .getController()
          .getShapeWrappers()
          .forEach((wrapper) => {
            const shape = wrapper.getShape();
            const potentials = shape.potentials();
            const result = this.collisions.createResult();
            for (const p of potentials) {
              /** In {@link ShapeWrapper} shape are link to gameObject*/
              const potentialObject3D = p.getWrapper().getObject3D();
              if (!potentialObject3D.isStatic()) continue;
              if (shape.collides(p, result)) {
                if (
                  !this.collisionsBuffer[child.uuid].includes(
                    potentialObject3D.uuid
                  )
                )
                  this.collisionsBuffer[child.uuid].push(
                    potentialObject3D.uuid
                  );
              }
            }
          });
      }
    });

    // this.logCollisionBuffer('update collision buffer');
  }

  logCollisionBuffer(tag) {
    console.log('**************************** LOG_COLLISION_BUFFER' + tag);
    for (const id in this.collisionsBuffer) {
      const bufferArray = this.collisionsBuffer[id];
      if (bufferArray.length) {
        console.log(
          this.object3D.getObjectByProperty('uuid', id).name,
          'collide with'
        );
        bufferArray.forEach((idc) => {
          console.log(this.object3D.getObjectByProperty('uuid', idc).name);
        });
      }
    }
    console.log('****************************');
  }

  /**
   * Remove a GameObject from the collision system
   *
   * @param {Object3D} object3D - object3D to remove
   */
  unregisterObject3DCollision(object3D) {
    object3D.traverse((child) => {
      const comp = child.getComponent(Collider.Component.TYPE);
      if (comp) {
        comp
          .getController()
          .getShapeWrappers()
          .forEach((wrapper) => {
            wrapper.getShape().remove();
          });

        // Delete from buffer
        delete this.collisionsBuffer[child.uuid];
        for (const id in this.collisionsBuffer) {
          const index = this.collisionsBuffer[id].indexOf(object3D.uuid);
          if (index >= 0) this.collisionsBuffer[id].splice(index, 1); // Remove from the other
        }
      }
    });
  }

  /**
   * Add an object3D in context. If a parentUUID is specifed it will be add to its, root otherwise
   *
   * @param {Object3D} obj - object3D to add
   * @param {string=} parentUUID - uuid of parent object3D
   * @returns {Promise} - promise resolving when add
   */
  addObject3D(obj, parentUUID = null) {
    if (parentUUID) {
      const parent = this.object3D.getObjectByProperty('uuid', parentUUID);
      parent.add(obj);
    } else {
      this.object3D.add(obj);
    }

    return this.loadObject3D(obj);
  }

  /**
   * Remove a object3D of context
   *
   * @param {string} uuid - uuid of the object3D to remove
   */
  removeObject3D(uuid) {
    const object3D = this.object3D.getObjectByProperty('uuid', uuid);
    if (object3D) {
      object3D.removeFromParent();
      this.unregisterObject3DCollision(object3D);
    } else {
      console.warn('no object with uuid = ', uuid);
    }
  }

  /**
   * Register a custom event
   *
   * @param {string} eventID - Id of the event
   * @param {Function} cb - Callback to be called when the event is dispatched
   */
  on(eventID, cb) {
    if (!this.listeners[eventID]) this.listeners[eventID] = [];
    this.listeners[eventID].push(cb);
  }

  /**
   * Dispatch custom event to listeners
   *
   * @param {string} eventID - Id of the event to dispatch
   * @param {Array} args - Params to passed to listeners
   */
  dispatch(eventID, args) {
    if (this.listeners[eventID]) {
      this.listeners[eventID].forEach(function (cb) {
        cb(args);
      });
    }
  }

  /**
   * Pass new commands to apply at the next step
   *
   * @param {Command[]} cmds - new commands to apply at the next step
   */
  onCommands(cmds) {
    this.commands.push(...cmds);
  }

  /**
   * Convert context root object3D to {@link State} and reset outdated attributes of all object3D
   *
   * @param {boolean} full - model of object3D with controllers should be export
   * @returns {State} - current state of context
   */
  toState(full = true) {
    const result = new State(
      new Object3D(this.object3D.toJSON(full)),
      Date.now()
    );

    // Everything is not outdated yet
    this.object3D.traverse(function (child) {
      child.setOutdated(false);
    });

    return result;
  }

  /**
   *
   * @param {string} id - id of script
   * @param {Object3D} [object3D=this.object3D] - object3D to traverse to find the game script (default is the root game object3D)
   * @returns {ScriptBase|null} - first game script with id or null if none are found
   */
  findGameScriptWithID(id, object3D = this.object3D) {
    let result = null;

    object3D.traverse(function (child) {
      if (!child.isGameObject3D) return;

      const gameScriptComp = child.getComponent(GameScript.Component.TYPE);

      if (!gameScriptComp) return;

      const scripts = gameScriptComp.getController().scripts;
      if (scripts && scripts.has(id)) {
        result = scripts.get(id);
        return true;
      }
      return false;
    });

    return result;
  }
};

/**
 * Events triggered by context to {@link ScriptBase}
 *
 * @type {Object<string,string>}
 */
Context.EVENT = {
  LOAD: 'load',
  INIT: 'init',
  TICK: 'tick',
  ON_ENTER_COLLISION: 'onEnterCollision',
  IS_COLLIDING: 'isColliding',
  ON_LEAVE_COLLISION: 'onLeaveCollision',
  ON_COMMAND: 'onCommand',
};

/**
 * @class
 */
const ScriptBase = class {
  /**
   * Skeleton of a game context script, different {@link Context.EVENT} are trigger by {@link Context}
   *
   * @param {Context} context - context of this script
   * @param {Object3D} object3D - object3D bind (attach) to this script
   * @param {object} variables - custom variables bind (attach) to this script
   */
  constructor(context, object3D, variables) {
    /**
     * context of this script
     *
     * @type {Context}
     */
    this.context = context;
    /**
     * object3D attach to this script
     *
     * @type {Object3D}
     */
    this.object3D = object3D;
    /**
     * custom variables attach to this script
     *
     * @type {object}
     */
    this.variables = variables;
  }
  /**
   * call after object3D controllers initialized
   *
   * @returns {Promise=} - promise when object3D has loaded
   */
  load() {
    // return null by default
    return null;
  }
  /**
   * call after object3D load and register in collision system
   */
  init() {}
  /**
   * call every step
   */
  tick() {}
  /**
   * call if object3D is not static and first collide a static object3D (object3D must have {@link Collider})
   *
   * @param {Object3D} object3D - object3D collided
   */
  // eslint-disable-next-line no-unused-vars
  onEnterCollision(object3D) {}
  /**
   * call if object3D is not static and is colliding a static object3D (object3D must have {@link Collider})
   *
   * @param {Object3D} object3D - object3D collided
   */
  // eslint-disable-next-line no-unused-vars
  isColliding(object3D) {}
  /**
   * call if object3D is not static and was colliding a static object3D (object3D must have {@link Collider})
   *
   * @param {Object3D} object3D - object3D collided leaving
   */
  // eslint-disable-next-line no-unused-vars
  onLeaveCollision(object3D) {}
  /**
   * call when {@link Context} receive new command
   *
   * @param {string} type - type of the command
   * @param {object} data - data of the command
   */
  // eslint-disable-next-line no-unused-vars
  onCommand(type, data) {}

  static get ID_SCRIPT() {
    console.error(this.name);
    throw new Error('this is abstract class you should override ID_SCRIPT');
  }

  static get IS_SCRIPTBASE() {
    return true;
  }
};

module.exports = {
  Context: Context,
  ScriptBase: ScriptBase,
};
