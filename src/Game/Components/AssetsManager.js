/** @format */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import * as jquery from 'jquery';
import GameObjectModule from '../Shared/GameObject/GameObject';
import { THREEUtils } from '../Components/THREEUtils';

const DEFAULT_MATERIAL = new THREE.MeshLambertMaterial({ color: 0x00ff00 });

export class AssetsManager {
  constructor() {
    //manager to load scripts
    this.prefabs = {};
    this.scripts = {};
    this.models = {};
  }

  createModel(idModel) {
    if (!this.models[idModel]) console.error('no model with id ', idModel);
    return this.models[idModel].clone();
  }

  fetchScript(idScript) {
    if (!this.scripts[idScript]) console.error('no script with id ', idScript);
    return this.scripts[idScript];
  }

  fetchPrefab(idprefab) {
    if (!this.prefabs[idprefab]) console.error('no prefab with id ', idprefab);
    return new GameObjectModule(this.prefabs[idprefab]);
  }

  fetchPrefabJSON(idprefab) {
    if (!this.prefabs[idprefab]) console.error('no prefab with id ', idprefab);
    return JSON.parse(JSON.stringify(this.prefabs[idprefab]));
  }

  buildNativeModel() {
    const geometryBox = new THREE.BoxGeometry();
    const cube = new THREE.Mesh(geometryBox, DEFAULT_MATERIAL);
    this.models['cube'] = cube;

    const geometrySphere = new THREE.SphereGeometry(1, 32, 32);
    const sphere = new THREE.Mesh(geometrySphere, DEFAULT_MATERIAL);
    this.models['sphere'] = sphere;

    this.buildGizmo();
    this.buildPointerMouse();
  }

  buildGizmo() {
    const result = new THREE.Object3D();

    const buildArrowGizmo = function (color, direction, rotation) {
      const scale = 5;
      const height = scale;
      const radius = scale / 20;
      const geo = new THREE.CylinderGeometry(radius, radius, height);
      const material = new THREE.MeshLambertMaterial({ color: color });
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.add(direction.multiplyScalar(height / 2));
      mesh.rotation.copy(rotation);
      return mesh;
    };

    result.add(
      buildArrowGizmo(
        'green',
        new THREE.Vector3(0, 1, 0),
        new THREE.Euler(0, 0, 0)
      )
    );
    result.add(
      buildArrowGizmo(
        'red',
        new THREE.Vector3(1, 0, 0),
        new THREE.Euler(0, 0, Math.PI * 0.5)
      )
    );
    result.add(
      buildArrowGizmo(
        'blue',
        new THREE.Vector3(0, 0, 1),
        new THREE.Euler(Math.PI * 0.5, 0, 0)
      )
    );

    this.models['gizmo'] = result;
  }

  createFrame(w, h) {
    const buildBox = function (
      x,
      y,
      z,
      offset,
      rotation = new THREE.Vector3()
    ) {
      const geo = new THREE.BoxGeometry();
      const result = new THREE.Mesh(geo, DEFAULT_MATERIAL);
      result.position.add(offset);
      result.scale.set(x, y, z);
      result.rotation.setFromVector3(rotation);
      return result;
    };

    const frame = new THREE.Object3D();
    frame.name = 'frame';

    const thickness = 0.1;
    const depth = 0.05;
    frame.add(buildBox(w, thickness, depth, new THREE.Vector3(0, h / 2, 0)));
    frame.add(buildBox(w, thickness, depth, new THREE.Vector3(0, -h / 2, 0)));
    frame.add(
      buildBox(
        h + thickness,
        thickness,
        depth,
        new THREE.Vector3(-w / 2, 0, 0),
        new THREE.Vector3(0, 0, Math.PI * 0.5)
      )
    );
    frame.add(
      buildBox(
        h + thickness,
        thickness,
        depth,
        new THREE.Vector3(w / 2, 0, 0),
        new THREE.Vector3(0, 0, Math.PI * 0.5)
      )
    );

    return frame;
  }

  buildPointerMouse() {
    const geometry = new THREE.CylinderGeometry(0.15, 0, 0.3, 32);
    const cylinder = new THREE.Mesh(geometry, DEFAULT_MATERIAL);
    cylinder.rotateX(Math.PI * 0.5);
    this.models['pointer_mouse'] = cylinder;
  }

  createSprite(label) {
    const texture = this.createLabelTexture(label, 'rgba(255, 255, 255, 0)');
    const material = new THREE.SpriteMaterial({
      map: texture,
    });
    material.alphaTest = 0.5;
    const result = new THREE.Sprite(material);
    result.scale.set(1, 0.3, 1);
    return result;
  }

  createLabelTexture(text, clearColor) {
    //create texture with name on it
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'black';
    ctx.font = '50px Arial';
    const wT = ctx.measureText(text).width;
    ctx.fillText(text, (canvas.width - wT) * 0.5, canvas.height * 0.5);

    const texture = new THREE.TextureLoader().load(
      canvas.toDataURL('image/png')
    );
    texture.flipY = true;
    texture.flipX = true;

    return texture;
  }

  createImage(path, w = 1, h = 1) {
    const texture = new THREE.TextureLoader().load(path);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry(w, h, 32);
    const plane = new THREE.Mesh(geometry, material);

    const frame = this.createFrame(w, h);
    frame.add(plane);
    return frame;
  }

  createVideo(path, w = 1, h = 1, size) {
    const video = document.createElement('video');
    video.src = path;
    video.autoplay = true;
    video.muted = true;
    video.load(); // must call after setting/changing source
    video.play();

    const videoImage = document.createElement('canvas');

    videoImage.width = size.width;
    videoImage.height = size.height;

    const videoImageContext = videoImage.getContext('2d');
    videoImageContext.fillStyle = '#000000';
    videoImageContext.fillRect(0, 0, videoImage.width, videoImage.height);

    const videoTexture = new THREE.Texture(videoImage);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    const movieMaterial = new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
    });
    const movieGeometry = new THREE.PlaneGeometry(w, h);
    const movieScreen = new THREE.Mesh(movieGeometry, movieMaterial);

    const frame = this.createFrame(w, h);
    frame.add(movieScreen);

    const tick = function () {
      if (video.ended) video.play();
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        videoImageContext.drawImage(video, 0, 0);
        if (videoTexture) videoTexture.needsUpdate = true;
      }
    };

    return { frame: frame, tick: tick };
  }

  createText(text, w = 1, h = 1) {
    const texture = this.createLabelTexture(text, 'rgba(255, 255, 255, 255)');
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry(w, h, 32);
    const plane = new THREE.Mesh(geometry, material);
    const frame = this.createFrame(w, h);
    frame.add(plane);
    return frame;
  }

  parse(id, obj, anchor) {
    //rotation
    const quatTHREE2UDV = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-Math.PI * 0.5, 0, Math.PI)
    );
    obj.applyQuaternion(quatTHREE2UDV);

    const bbox = new THREE.Box3().setFromObject(obj);
    const parent = new THREE.Object3D();
    switch (anchor) {
      case 'center':
        let center = bbox.min.lerp(bbox.max, 0.5);
        obj.position.sub(center);
        break;
      case 'max':
        obj.position.sub(bbox.max);
        break;
      case 'min':
        obj.position.sub(bbox.min);
        break;
      case 'center_min':
        let centerMin = bbox.min.clone().lerp(bbox.max, 0.5);
        centerMin.z = bbox.min.z;
        obj.position.sub(centerMin);
        break;
      default:
        throw new Error('no anchor');
    }

    parent.add(obj);

    parent.traverse(function (child) {
      if (child.geometry) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.material && child.material.map) {
        child.material.map.encoding = THREEUtils.textureEncoding;
        child.material.needsUpdate = true;
      }
    });

    parent.name = id;

    this.models[id] = parent;
  }

  loadFromConfig(config) {
    //load config file
    const _this = this;
    const loader = new GLTFLoader();
    this.buildNativeModel();

    const modelPromise = new Promise((resolve, reject) => {
      let count = 0;
      for (let idModel in config.models) {
        const id = idModel;
        const modelAnchor = config.models[id].anchor;
        const modelPath = config.models[id].path;
        loader.load(
          modelPath,
          (data) => {
            //parse
            _this.parse(id, data.scene, modelAnchor);

            //check if finish
            count++;
            if (count == Object.keys(config.models).length) {
              console.log('Models loaded ', this.models);
              resolve();
            }
          },
          null,
          reject
        );
      }
    });
    const scriptsPromise = new Promise((resolve, reject) => {
      let count = 0;
      for (let idScript in config.scripts) {
        const scriptPath = config.scripts[idScript].path;
        jquery.get(
          scriptPath,
          function (scriptString) {
            _this.scripts[idScript] = eval(scriptString);
            //check if finish
            count++;
            if (count == Object.keys(config.scripts).length) {
              console.log('Scripts loaded ', _this.scripts);
              resolve();
            }
          },
          'text'
        );
      }
    });

    const prefabsPromise = new Promise((resolve, reject) => {
      let count = 0;
      for (let idPrefab in config.prefabs) {
        const scriptPath = config.prefabs[idPrefab].path;
        jquery.get(
          scriptPath,
          function (prefabstring) {
            _this.prefabs[idPrefab] = JSON.parse(prefabstring);

            //check if finish
            count++;
            if (count == Object.keys(config.prefabs).length) {
              console.log('prefabs loaded ', _this.prefabs);
              resolve();
            }
          },
          'text'
        );
      }
    });

    const promises = [];
    if (config.models) promises.push(modelPromise);
    if (config.prefabs) promises.push(prefabsPromise);
    if (config.scripts) promises.push(scriptsPromise);

    return Promise.all(promises);
  }
}
