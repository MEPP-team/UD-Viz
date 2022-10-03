/** @format */

const THREE = require('three');
const { Circle, Polygon } = require('detect-collisions');

/**
 * Component used to handle collision of a GameObject
 * Support by detect-collisions npm package
 */
const ColliderModule = class Collider {
  constructor(parent, json) {
    if (!json) throw new Error('no json');

    // Gameobject of this component
    this.parent = parent;

    // Uuid
    this.uuid = json.uuid || THREE.MathUtils.generateUUID();

    // Shapes in json format
    this.shapesJSON = json.shapes || [];

    // Boolean to know if its a physics collisions or not
    this.body = json.body || false;

    // Shapes wrappers
    this.shapeWrappers = [];
    this.createShapeWrappers();
  }

  /**
   *
   * @returns {boolean}
   */
  isBody() {
    return this.body;
  }

  /**
   * Nothing has to be initialized (just here because this function is called from GameObject initAssets)
   *
   * @param {*} assetsManager
   */
  // eslint-disable-next-line no-unused-vars
  initAssets(assetsManager) {
    // Nada
  }

  /**
   * Create ShapeWrappers object from the json shapes
   */
  createShapeWrappers() {
    const shapeWrappers = this.shapeWrappers;
    const _this = this;
    this.shapesJSON.forEach(function (json) {
      const wrapper = new ShapeWrapper(_this.parent, json);
      shapeWrappers.push(wrapper);
    });
  }

  /**
   *
   * @returns {Array[ShapeWrapper]}
   */
  getShapeWrappers() {
    return this.shapeWrappers;
  }

  /**
   * Update worldtransform of the shapeWrappers
   */
  update() {
    const worldTransform = this.parent.computeWorldTransform();
    this.shapeWrappers.forEach(function (b) {
      b.update(worldTransform);
    });
  }

  /**
   * This component can run on the server side
   *
   * @returns {boolean}
   */
  isServerSide() {
    return true;
  }

  /**
   *
   * @param {JSON} json
   */
  setShapesJSON(json) {
    this.shapesJSON = json;
  }

  /**
   *
   * @returns {JSON}
   */
  getShapesJSON() {
    return this.shapesJSON;
  }

  /**
   * Compute this to JSON
   *
   * @returns {JSON}
   */
  toJSON() {
    return {
      uuid: this.uuid,
      type: ColliderModule.TYPE,
      shapes: this.shapesJSON,
      body: this.body,
    };
  }

  getUUID() {
    return this.uuid;
  }
};

ColliderModule.TYPE = 'Collider';

module.exports = ColliderModule;

/**
 * Object to wrap the Polygon and Circle of the detect-collisions npm package
 */
class ShapeWrapper {
  constructor(gameObject, json) {
    // Gameobject of this shapewrapper
    this.gameObject = gameObject;

    // Json
    this.json = json;

    // Shape detect-collisions npm package
    this.shape = null;

    // Init
    this.initFromJSON(json);
  }

  /**
   *
   * @returns {Circle/Polygon}
   */
  getShape() {
    return this.shape;
  }

  /**
   *
   * @returns {GameObject}
   */
  getGameObject() {
    return this.gameObject;
  }

  /**
   * Create Circle/Polygon of detect-collisions
   * then add an update function to update the worldtransform
   * then attach getter function of the gameobject
   *
   * @param {JSON} json
   */
  initFromJSON(json) {
    switch (json.type) {
      case 'Circle':
        {
          const circle = new Circle(
            parseFloat(json.center.x),
            parseFloat(json.center.y),
            parseFloat(json.radius)
          );

          this.update = function (worldtransform) {
            const wp = worldtransform.getPosition();
            circle.x = json.center.x + wp.x;
            circle.y = json.center.y + wp.y;
          };

          this.shape = circle;
        }
        break;
      case 'Polygon':
        {
          const points = [];
          json.points.forEach(function (p) {
            points.push([parseFloat(p.x), parseFloat(p.y)]);
          });

          const polygon = new Polygon(0, 0, points);

          // Attach userData to perform update
          this.update = function (worldtransform) {
            const points = [];
            json.points.forEach(function (p) {
              const wp = worldtransform.getPosition();
              const point = [p.x + wp.x, p.y + wp.y];
              points.push(point);
              // TODO handle rotation
            });
            polygon.setPoints(points);
          };

          this.shape = polygon;
        }
        break;
      default:
    }

    // Add a getter to the gameObject
    this.shape.getGameObject = this.getGameObject.bind(this);
  }
}
