import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { Howl } from 'howler';
import { colorSpace } from '@ud-viz/utils_browser';

/**
 * @typedef {object} RenderDataConfig - Contains path, anchor, scale and rotation.
 * @property {string} anchor - Values: center | max | min | center_min
 * @property {{x:number,y:number,z:number}} scale - Object's local scale
 * @property {{x:number,y:number,z:number}} rotation - Object's local rotation
 * @property {string} path - Path to the 3D data file
 */

/**
 * @typedef {object} SoundsConfig - Contains path
 * @property {string} path - Path to the audio file
 */

/**
 * @typedef {object} AssetManagerConfig - Contains configs of assets.
 * @property {Object<string,SoundsConfig>} sounds {@link SoundsConfig}
 * @property {Object<string,RenderDataConfig>} renderData {@link RenderDataConfig}
 */

/**
 * Default material used by native objects
 */
const DEFAULT_MATERIAL = new THREE.MeshLambertMaterial({
  color: 0x00ff00,
});

/**
 * @classdesc Load async assets (gltf, JSON, ...) from a config file and create render data, sounds, and native objects.
 */
export class AssetManager {
  /**
   * Initialize the native render data.
   */
  constructor() {
    /** @type {AssetManagerConfig} */
    this.conf = null;

    /** @type {Object<string,SoundsConfig>} */
    this.sounds = {};

    /** @type {Object<string,RenderData>}*/
    this.renderData = {};

    this.initNativeRenderData();
  }

  /**
   * Return new renderData corresponding to the id passed
   *
   * @param {string} idRenderData - Id of the renderData
   * @returns {RenderData} - A clone of the renderData object
   */
  createRenderData(idRenderData) {
    if (!this.renderData[idRenderData])
      console.error('no render data with id ', idRenderData);

    return this.renderData[idRenderData].clone();
  }

  /**
   * Create a a new Howl object with the given idSound and options.
   *
   * @param {string} idSound - Id of sounds in config
   * @param {object} [options={}] - Arguments to create Howl object.
   * @param {boolean} options.loop - Set to true to automatically loop the sound forever.
   * @returns {Howl} - Used to control the sound
   */
  createSound(idSound, options = {}) {
    const pathSound = this.sounds[idSound].path;

    if (!pathSound) console.error('no sound with id ', idSound);
    return new Howl({
      src: pathSound,
      preload: true,
      html5: true,
      loop: options.loop || false,
      onload: () => {
        console.log(pathSound, ' has loaded');
      },
      onloaderror: (id, err) => {
        // refer here https://github.com/goldfire/howler.js
        console.warn('error while loading ', pathSound, err);
        // eslint-disable-next-line no-undef
        console.info(Howler._codecs, ' are the supported Howler codecs');
        switch (err) {
          case 1:
            console.warn(
              "The fetching process for the media resource was aborted by the user agent at the user's request."
            );
            break;
          case 2:
            console.warn(
              'A network error of some description caused the user agent to stop fetching the media resource, after the resource was established to be usable.'
            );
            break;
          case 3:
            console.warn(
              'An error of some description occurred while decoding the media resource, after the resource was established to be usable.'
            );
            break;
          case 4:
            console.warn(
              'The media resource indicated by the src attribute or assigned media provider object was not suitable.'
            );
            break;
          default:
            console.warn('unknow error');
        }
      },
    });
  }

  /**
   * Build native objects (procedural objects) and stores them in `this.renderData` object.
   *
   */
  initNativeRenderData() {
    const geometryBox = new THREE.BoxGeometry();
    const cube = new THREE.Mesh(geometryBox, DEFAULT_MATERIAL);
    this.renderData['cube'] = new RenderData(cube, { anchor: 'center_min' });

    const geometrySphere = new THREE.SphereGeometry(1, 32, 32);
    const sphere = new THREE.Mesh(geometrySphere, DEFAULT_MATERIAL);
    this.renderData['sphere'] = new RenderData(sphere);

    const geometryTorus = new THREE.TorusGeometry(10, 0.1, 16, 100);
    const torus = new THREE.Mesh(geometryTorus, DEFAULT_MATERIAL);
    this.renderData['torus'] = new RenderData(torus);

    const geometryQuad = new THREE.PlaneGeometry();
    const quad = new THREE.Mesh(geometryQuad, DEFAULT_MATERIAL);
    this.renderData['quad'] = new RenderData(quad);
  }

  /**
   * Load a 3D render data from a config. Then create the {@link LoadingView} process.
   *
   * @param {AssetManagerConfig} config configuration details
   * @param {HTMLDivElement} [parentDiv=document.body] where to add the loadingView
   * @returns {Promise} promise processed to load assets
   */
  loadFromConfig(config = {}, parentDiv = document.body) {
    this.conf = config;
    /** @type {LoadingView}*/
    const loadingView = new LoadingView();
    parentDiv.appendChild(loadingView.domElement);

    /** @type {Promise[]} */
    const promises = [];

    if (config.renderData) {
      const idLoadingRenderData = '3D';
      loadingView.addLoadingBar(idLoadingRenderData);

      const loader = new GLTFLoader();
      promises.push(
        new Promise((resolve, reject) => {
          let count = 0;
          for (const idRenderData in config.renderData) {
            const renderDataConfig = config.renderData[idRenderData];
            loader.load(
              renderDataConfig.path,
              (result) => {
                result.scene.name = idRenderData;

                this.renderData[idRenderData] = new RenderData(
                  result.scene,
                  renderDataConfig,
                  result.animations
                );

                count++;

                // Update loading bar
                loadingView.updateProgress(
                  idLoadingRenderData,
                  (100 * count) / Object.keys(config.renderData).length
                );

                // Check if finish
                if (count == Object.keys(config.renderData).length) {
                  console.log('render data loaded ', this.renderData);
                  resolve();
                }
              },
              null,
              reject
            );
          }
        })
      );
    }

    if (config.sounds) {
      this.sounds = this.conf.sounds;
    }

    return new Promise((resolve) => {
      Promise.all(promises).then(function () {
        loadingView.domElement.remove();
        resolve();
      });
    });
  }
}

/**
 * @class A view in which loading bar can be added
 */
class LoadingView {
  /**
   * It creates a root HTML, then adds HTML elements for the loading bar.
   */
  constructor() {
    /** @type {HTMLDivElement} */
    this.domElement = document.createElement('div');
    this.domElement.classList.add('assetsLoadingView');

    /** @type {HTMLDivElement} */
    this.parentLoadingBar = document.createElement('div');
    this.parentLoadingBar.classList.add('parent_loading_bar_asset');
    this.domElement.appendChild(this.parentLoadingBar);

    /** @type {HTMLDivElement} */
    const label = document.createElement('label');
    label.classList.add('loadingLabel_Assets');
    label.innerHTML = 'Loading assets';
    this.parentLoadingBar.appendChild(label);

    /**
     * Loading bars 
     *
      @type {Object<string,HTMLDivElement>} */
    this.loadingBars = {};
  }

  /**
   * Updates the progress bar of a loading bar with the given id.
   * Sets the width of the loading bar with the given percent.
   *
   * @param {string} id of the loading bar
   * @param {number} percent the new percent of the bar
   */
  updateProgress(id, percent) {
    this.loadingBars[id].style.width = percent + '%';
  }

  /**
   * Add a loading bar to this view with a label equals to the id
   *
   * @param {string} id if of the loading bar to add
   */
  addLoadingBar(id) {
    const parent = document.createElement('div');
    parent.classList.add('barBackground-Assets');

    const progress = document.createElement('div');
    progress.classList.add('progressBar-Assets');

    parent.appendChild(progress);

    const label = document.createElement('div');
    label.innerHTML = id;
    parent.appendChild(label);

    this.loadingBars[id] = progress;

    this.parentLoadingBar.appendChild(parent);
  }
}

/**
 * @class Contains a THREE.Object3D and an array of animations
 */
export class RenderData {
  /**
   * It takes an object3D and an optional animations object, and sets the object3D and animations
   * properties of the object
   *
   * @param {THREE.Object3D} childObject3D - The object to add.
   * @param {RenderDataConfig} [renderDataConfig = {}]  - Contains path, anchor, scale and rotation.
   * @param {THREE.AnimationClip[]} [animations=null] - An array of animations.
   */
  constructor(childObject3D, renderDataConfig = {}, animations = null) {
    /**
     * Parent object of the object3D to set up
     *
      @type {THREE.Object3D} */
    this.object3D = new THREE.Object3D();

    const anchor = renderDataConfig.anchor;
    const scale = renderDataConfig.scale;
    const rotation = renderDataConfig.rotation;

    // Anchor point
    const bbox = new THREE.Box3().setFromObject(childObject3D);
    switch (anchor) {
      case 'center':
        {
          const center = bbox.min.lerp(bbox.max, 0.5);
          childObject3D.position.sub(center);
        }
        break;
      case 'max':
        {
          childObject3D.position.sub(bbox.max);
        }
        break;
      case 'min':
        {
          childObject3D.position.sub(bbox.min);
        }
        break;
      case 'center_min':
        {
          const centerMin = bbox.min.clone().lerp(bbox.max, 0.5);
          centerMin.z = bbox.min.z;
          childObject3D.position.sub(centerMin);
        }
        break;
      default:
    }

    // Scale
    if (scale) {
      const newScale = childObject3D.scale;
      newScale.x *= scale.x;
      newScale.y *= scale.y;
      newScale.z *= scale.z;
      childObject3D.scale.copy(newScale);
    }

    // Rotation
    if (rotation) {
      const newRotation = childObject3D.rotation;
      newRotation.x += rotation.x;
      newRotation.y += rotation.y;
      newRotation.z += rotation.z;
      childObject3D.rotation.copy(newRotation);
    }

    this.object3D.add(childObject3D);

    this.object3D.traverse(function (child) {
      if (child.geometry) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.material) {
        if (child.material.map) child.material.map.colorSpace = colorSpace;
        child.material.side = THREE.FrontSide;
        child.material.needsUpdate = true;
      }
    });

    this.object3D.name = childObject3D.name + '_set_up_';

    this.animations = animations;
  }

  /**
   * It clones the object3D and then clones all of the materials in the object3D
   *
   * @returns {RenderData} A new RenderData object with a cloned object3D and the same animations.
   */
  clone() {
    const cloneObject = this.object3D.clone();
    cloneObject.traverse((child) => {
      if (child.material) {
        child.material = child.material.clone();
        child.material.needsUpdate = true;
      }
    });

    return new RenderData(cloneObject, {}, this.animations);
  }
}
