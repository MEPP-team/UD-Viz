import * as THREE from 'three';
import { RequestAnimationFrameProcess } from '@ud-viz/utils_browser';
import * as itowns from 'itowns';

/**
 * @typedef {object} TextureFile
 * @property {number} index Index of the file (use to order file)
 * @property {string} name Name of the file
 * @property {THREE.CanvasTexture|THREE.VideoTexture} texture Texture to apply on the plane
 * @property {{height:number,width:number}} size Size of the texture
 * @property {HTMLVideoElement} [video] Html video element if it is an video texture.
 */

/**
 * @example
 * Config Example
 * {
  "slides": [
    {
      "name": "diapo1",
      "folder": "./assets/img/slide",
      "diapositives": ["1.jpeg", "2.jpeg", "3.jpeg"]
    },
    {
      "name": "diapo2",
      "folder": "./assets/img/slide",
      "diapositives": ["11.jpeg", "12.jpeg", "13.jpeg"]
    }
  ],
 "textureRotation": 0,
 "durationLoopInSec":10
}
 * @classdesc Slideshow Widget class
 */
export class SlideShow {
  /**
   * It initializes the widget.
   *
   *
   * @param {itowns.PlanarView} itownsView - The itowns view.
   * @param {object} [configSlideShow] - The configuration of the widget. need description
   * @param {Array<object>} configSlideShow.slides - Array of slide Object
   * @param {string} configSlideShow.slides[].name - Name of a slideshow
   * @param {string} configSlideShow.slides[].folder - Path of the folder
   * @param {Array<string>} configSlideShow.slides[].diapositives - Array of path of name files
   * @param {number} configSlideShow.durationLoopInSec - Seconds between two slides
   * @param {number} configSlideShow.textureRotation - Rotation in degrees of textures
   * @param {import('itowns').Extent} extent - The extent of the widget.
   */
  constructor(itownsView, configSlideShow, extent) {
    /** @type {import('itowns').Extent} */
    this.extent = extent;
    /** @type {import('itowns').PlanarView} */
    this.itownsView = itownsView;

    /**
     * Root html of slideshow view 
     *
      @type {HTMLElement} */
    this.domElement = null;

    // Ids
    this.coordinatesInputVector = null;
    this.rotationInputVector = null;
    this.sizeInputVector = null;
    this.aspectRatioCheckbox = null;
    this.loopSlideShowCheckbox = null;
    this.slideSelect = null;
    this.durationLoopInputID = null;
    this.counterLoopTimeDiv = null;

    // Vectors
    this.coordinatesVector = new THREE.Vector3();
    this.rotationVector = new THREE.Vector3();
    this.sizeVector = new THREE.Vector2();

    /**
     * List of callbacks to set when the window is created
     *
      @type {Array<{event:string,element:HTMLElement,cb:Function}>}  */
    this.callbacksHTMLEl = [];

    /** @type {THREE.Mesh} */
    this.plane = null;

    /**
     * if true the application update its view3D eachFrame
     *
      @type {boolean} */
    this.notifyValue = false;

    this.defaultTexture = null;
    this.initDefaultTexture();

    /**
     * List of textures with data
     *
      @type {TextureFile[]} */
    this.textureFiles = [this.createDefaultTextureFile(0)];

    this.currentTextureFile = null;
    this.currentTexture = null;

    this.intervalLoop = null;
    this.counterIntervalLoop = null;

    this.configSlideShow = configSlideShow || {};
    this.slides = this.configSlideShow.slides;
    this.durationLoopInSec = this.configSlideShow.durationLoopInSec || 10; // Take config value or 10s by default
    this.textureRotation = this.configSlideShow.textureRotation || 0;
    this.textureRotation = (this.textureRotation * Math.PI) / 180.0;

    this.initHtml();

    if (this.slides) {
      this.setSlideshowInConfig(0);
    } else {
      this.setTexture(0);
    }

    // listeners
    this.dropListener = null;
    this.dragOverListener = null;
    this.nextListener = null;
    this.previousListener = null;
    this.hidePlaneListener = null;

    // Through this.callbacksHTMLEl and addEventListeners to HTMLElements in DOM (elements which created by Window class)
    this.callbacksHTMLEl.forEach((callbackHtmlEl) => {
      callbackHtmlEl.element.addEventListener(
        callbackHtmlEl.event,
        callbackHtmlEl.cb.bind(this)
      );
    });
    this.matchExtent();

    /** A function call at 30 fps by the browser */
    const process = new RequestAnimationFrameProcess(30);
    process.start(() => {
      if (this.notifyValue) {
        this.itownsView.notifyChange();
      }
    });
  }

  addListeners() {
    this.initCBDrop();
    this.initInputListener();
  }

  removeListeners() {
    window.removeEventListener('keydown', this.hidePlaneListener);
    window.removeEventListener('keydown', this.previousListener);
    window.removeEventListener('keydown', this.nextListener);

    document.body.removeEventListener('drop', this.dropListener);
    document.body.removeEventListener('dragover', this.dragOverListener);
  }

  dispose() {
    this.domElement.remove();
    this.stopLoopSlideShow();
    if (this.plane) {
      this.plane.removeFromParent();
    }

    this.itownsView.notifyChange();

    this.removeListeners();
  }

  /**
   * It loads the textures and videos of the slideshow and stores them in the `this.textureFiles` array
   *
   * @param {number} slideIndex - the index of the slideshow in the config file
   */
  setSlideshowInConfig(slideIndex) {
    if (isNaN(slideIndex)) return;
    const slide = this.slides[slideIndex];
    const folder = slide.folder;
    const diapos = slide.diapositives;
    this.textureFiles = [];

    for (let i = 0; i < diapos.length; i++) {
      this.textureFiles.push(this.createDefaultTextureFile(i));
      const xhr = new XMLHttpRequest();
      xhr.open('GET', folder.concat('/'.concat(diapos[i])));

      xhr.onload = (response) => {
        const type = response.target.getResponseHeader('Content-Type');
        if (type.includes('image')) {
          new THREE.TextureLoader().load(
            response.target.responseURL,
            (texture) => {
              // Rotate the texture with
              texture.center.set(0.5, 0.5);
              texture.rotation = this.textureRotation;
              this.textureFiles[i] = {
                index: i,
                name: diapos[i],
                size: {
                  height: texture.image.height,
                  width: texture.image.width,
                },
                texture: texture,
              };
              if (i == 0) this.setTexture(0);
            }
          );
        } else if (type.includes('video')) {
          const video = document.createElement('video');
          video.src = response.target.responseURL;
          video.autoplay = false;
          video.muted = false;
          video.loop = true;
          video.load();

          video.onloadedmetadata = () => {
            const videoTexture = new THREE.VideoTexture(video);
            // Rotate the texture with
            videoTexture.center.set(0.5, 0.5);
            videoTexture.rotation = this.textureRotation;
            this.textureFiles[i] = {
              index: i,
              name: diapos[i],
              size: {
                height: video.videoHeight,
                width: video.videoWidth,
              },
              texture: videoTexture,
              video: video,
            };

            if (i == 0) this.setTexture(0);
          };
        } else {
          console.error(
            response.target.responseURL,
            ' is not a valid video or image file'
          );
        }
      };
      xhr.send();
    }
    this.setTexture(0);
  }

  /** Set the callback function of event 'drop' @warn !event.preventDefault! */
  initCBDrop() {
    const body = document.body;

    this.dropListener = (event) => {
      event.preventDefault();
      // Setting the value of the select element to null.
      this.slideSelect.value = null;
      if (!this.plane) return;
      const files = Array.from(event.dataTransfer.files);

      files.sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });

      this.textureFiles = [];
      for (let i = 0; i < files.length; i++) {
        this.textureFiles.push(this.createDefaultTextureFile(i));
        const file = files[i];
        if (file) {
          try {
            const reader = new FileReader();

            reader.onload = (data) => {
              if (file.type.includes('image/')) {
                new THREE.TextureLoader().load(
                  data.target.result,
                  (texture) => {
                    // Rotate the texture with
                    texture.center.set(0.5, 0.5);
                    texture.rotation = this.textureRotation;
                    this.textureFiles[i] = {
                      index: i,
                      name: file.name,
                      texture: texture,
                      size: {
                        height: texture.image.height,
                        width: texture.image.width,
                      },
                    };
                    if (i == 0) this.setTexture(0);
                  }
                );
              } else if (file.type.includes('video/')) {
                const video = document.createElement('video');
                video.src = data.target.result;
                video.autoplay = false;
                video.muted = false;
                video.loop = true;
                video.load();

                video.onloadedmetadata = () => {
                  const videoTexture = new THREE.VideoTexture(video);
                  // Rotate the video texture with
                  videoTexture.center.set(0.5, 0.5);
                  videoTexture.rotation = this.textureRotation;
                  this.textureFiles[i] = {
                    index: i,
                    name: file.name,
                    texture: videoTexture,
                    video: video,
                    size: {
                      height: video.videoHeight,
                      width: video.videoWidth,
                    },
                  };
                  if (i == 0) this.setTexture(0);
                };
              }
            };

            reader.readAsDataURL(file);
          } catch (e) {
            throw new Error(e);
          }
        }
      }
      this.setTexture(0);
    };
    body.addEventListener('drop', this.dropListener);

    this.dragover = (event) => {
      event.preventDefault();
    };

    body.addEventListener('dragover', this.dragover, false);
  }

  /** Create a default texture and put in `this.defaultTexture` */
  initDefaultTexture() {
    const canvas = document.createElement('canvas');
    canvas.height = 512;
    canvas.width = 512;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();

    const colors = [
      'red',
      'orange',
      'DarkOliveGreen',
      'SpringGreen',
      'cyan',
      'MidnightBlue',
      'MediumVioletRed',
    ];
    for (let i = 0; i < colors.length; i++) {
      ctx.beginPath();
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.width);
      gradient.addColorStop(0, colors[i]);
      gradient.addColorStop(1, 'white');
      ctx.fillStyle = gradient;
      ctx.fillRect(
        (canvas.width / colors.length) * i,
        0,
        (canvas.width / colors.length) * (i + 1),
        canvas.height
      );
    }

    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.font = '70px Arial';
    const stringDefaultTexture = 'Default Texture';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(stringDefaultTexture, 256, 256);

    this.defaultTexture = new THREE.CanvasTexture(canvas);
  }

  /**
   * It creates a new texture file object with the default texture and returns it
   *
   * @param {number} index - The index of the texture file.
   * @returns {TextureFile} A new texture file object.
   */
  createDefaultTextureFile(index) {
    const newTextureFile = {
      index: index,
      name: 'DEFAULT',
      texture: this.defaultTexture,
      size: {
        height: this.defaultTexture.image.height,
        width: this.defaultTexture.image.width,
      },
    };
    return newTextureFile;
  }

  /** Create all HTMLElements and fill `this.domElement`*/
  initHtml() {
    const domElement = document.createElement('div');
    const coordinatesElement = this.createInputVector(
      ['X', 'Y', 'Z'],
      'Coordinates',
      100
    );
    domElement.appendChild(coordinatesElement.title);
    this.coordinatesInputVector = coordinatesElement.inputVector;
    domElement.appendChild(coordinatesElement.inputVector);

    const rotationElement = this.createInputVector(
      ['X', 'Y', 'Z'],
      'Rotation',
      0.1
    );
    domElement.appendChild(rotationElement.title);
    this.rotationInputVector = rotationElement.inputVector;
    domElement.appendChild(rotationElement.inputVector);

    const sizeElement = this.createInputVector(
      ['Height', 'Width'],
      'Size',
      100
    );
    domElement.appendChild(sizeElement.title);
    this.sizeInputVector = sizeElement.inputVector;
    domElement.appendChild(sizeElement.inputVector);

    const matchExtentButton = document.createElement('button');
    matchExtentButton.id = '_button_match_extent';
    matchExtentButton.innerHTML = 'Match Extent';
    this.callbacksHTMLEl.push({
      event: 'click',
      element: matchExtentButton,
      cb: this.matchExtent,
    });
    domElement.appendChild(matchExtentButton);

    const aspectRatioDiv = document.createElement('div');
    domElement.appendChild(aspectRatioDiv);

    const aspectRatioCheckbox = document.createElement('input');
    aspectRatioCheckbox.id = 'aspectRatio';
    aspectRatioCheckbox.type = 'checkbox';
    this.callbacksHTMLEl.push({
      event: 'change',
      element: aspectRatioCheckbox,
      cb: function (event) {
        if (event.target.checked) {
          const currentW = this.getSizeValues().width;
          const w =
            currentW != 0 ? currentW : this.currentTextureFile.size.width;
          this.setSizeInputs(new THREE.Vector2(null, w));
        }
      },
    });

    this.aspectRatioCheckbox = aspectRatioCheckbox;
    aspectRatioDiv.appendChild(aspectRatioCheckbox);

    const labelAspectRatio = document.createElement('label');
    labelAspectRatio.htmlFor = aspectRatioCheckbox.id;
    labelAspectRatio.innerHTML = 'Aspect Ratio';
    aspectRatioDiv.appendChild(labelAspectRatio);

    const loopDiv = document.createElement('div');
    domElement.appendChild(loopDiv);

    const loopCheckbox = document.createElement('input');
    loopCheckbox.id = 'loopSlideShow';
    loopCheckbox.type = 'checkbox';
    this.callbacksHTMLEl.push({
      event: 'change',
      element: loopCheckbox,
      cb: function (event) {
        if (this.intervalLoop) this.stopLoopSlideShow();
        if (event.target.checked) {
          this.loopSlideShow();
        }
      },
    });

    this.loopSlideShowCheckbox = loopCheckbox;
    loopDiv.appendChild(loopCheckbox);

    const labelLoopSlideShow = document.createElement('label');
    labelLoopSlideShow.htmlFor = loopCheckbox.id;
    labelLoopSlideShow.innerHTML = 'Loop SlideShow';
    loopDiv.appendChild(labelLoopSlideShow);

    const durationLoopInSecDiv = document.createElement('div');
    domElement.appendChild(durationLoopInSecDiv);

    const durationLoopInSecInput = document.createElement('input');
    durationLoopInSecInput.id = 'durationLoopInputSlideShow';
    durationLoopInSecInput.type = 'number';
    durationLoopInSecInput.max = 100;
    durationLoopInSecInput.min = 1;
    durationLoopInSecInput.setAttribute('value', this.durationLoopInSec);
    durationLoopInSecDiv.step = 0.5;
    this.callbacksHTMLEl.push({
      event: 'change',
      element: durationLoopInSecInput,
      cb: function (event) {
        this.durationLoopInSec = parseFloat(event.target.value);
        if (this.intervalLoop) {
          this.restartLoopSlideShow();
        }
      },
    });

    this.durationLoopInputID = durationLoopInSecInput.id;
    durationLoopInSecDiv.appendChild(durationLoopInSecInput);

    const durationLoopInSecLabel = document.createElement('label');
    durationLoopInSecLabel.htmlFor = durationLoopInSecInput.id;
    durationLoopInSecLabel.innerHTML = 'Duration Loop (s)';
    durationLoopInSecDiv.appendChild(durationLoopInSecLabel);

    const counterLoopTimeDiv = document.createElement('div');
    counterLoopTimeDiv.id = 'counterLoopTimeDivSlideShow';
    counterLoopTimeDiv.innerHTML = this.durationLoopInSec;

    this.counterLoopTimeDiv = counterLoopTimeDiv;
    durationLoopInSecDiv.appendChild(counterLoopTimeDiv);

    const slideSelect = document.createElement('select');
    slideSelect.id = 'slideSelect';
    domElement.appendChild(slideSelect);

    const unsetOptionSlide = document.createElement('option');
    unsetOptionSlide.value = 'null';
    unsetOptionSlide.innerHTML = 'Select config slide';
    slideSelect.appendChild(unsetOptionSlide);
    this.slideSelect = slideSelect;

    if (this.slides) {
      for (let i = 0; i < this.slides.length; i++) {
        const element = this.slides[i];
        const option = document.createElement('option');
        option.value = i;
        option.innerHTML = element.name;
        slideSelect.appendChild(option);
      }
      this.callbacksHTMLEl.push({
        event: 'input',
        element: slideSelect,
        cb: function (event) {
          this.setSlideshowInConfig(event.target.value);
        },
      });
    }

    this.domElement = domElement;
  }

  /**
   * It sets the size, coordinates and rotation inputs to the values of the extent
   */
  matchExtent() {
    const extentCenter = this.extent.center();
    this.setSizeInputs(
      new THREE.Vector2(
        Math.abs(this.extent.west - this.extent.east),
        Math.abs(this.extent.north - this.extent.south)
      )
    );
    let elevationZ = 0.1;

    const itownsViewLayers = this.itownsView.getLayers();
    for (let index = 0; index < itownsViewLayers.length; index++) {
      const layer = itownsViewLayers[index];
      if (layer.isElevationLayer) {
        elevationZ = layer.colorTextureElevationMaxZ;
        break;
      }
    }

    this.setCoordinatesInputs(
      new THREE.Vector3(extentCenter.x, extentCenter.y, elevationZ)
    );
    this.setRotationInputs(new THREE.Vector3(0, 0, 0));
  }

  /**
   * Add event listeners to input
   */
  initInputListener() {
    this.hidePlaneListener = (event) => {
      if (event.key.toLowerCase() != 'h') return;
      if (!this.plane) return;
      this.plane.visible = !this.plane.visible;
      this.itownsView.notifyChange();
    };

    // Hide and show the geometryPlane
    window.addEventListener('keydown', this.hidePlaneListener);

    this.nextListener = (event) => {
      if (event.key != 'ArrowRight') return;
      this.nextSlide();
      this.restartLoopSlideShow();
    };

    // Change the next slide
    window.addEventListener('keydown', this.nextListener);

    this.previousListener = (event) => {
      if (event.key != 'ArrowLeft') return;

      this.previousSlide();
      this.restartLoopSlideShow();
    };

    // Change the previous slide
    window.addEventListener('keydown', this.previousListener);
  }

  nextSlide() {
    if (!this.plane) return;

    const newIndexTextureFile =
      (this.iCurrentTextureFile + 1) % this.textureFiles.length; // Loop

    this.setTexture(newIndexTextureFile);

    this.itownsView.notifyChange();
  }

  previousSlide() {
    if (!this.plane) return;

    const newIndexTextureFile =
      this.iCurrentTextureFile - 1 < 0
        ? this.textureFiles.length - 1
        : this.iCurrentTextureFile - 1;

    this.setTexture(newIndexTextureFile);

    this.itownsView.notifyChange();
  }

  /**
   * @param {Array.String} labels List of labels name
   * @param {string} vectorName Name of the vector
   * @param {number} step The step of HTMLElement input (type number)
   * @returns {{title:HTMLHeadingElement, inputVector:HTMLDivElement}} The `inputVector` 'div' contains labels and inputs HTMLElements
   */
  createInputVector(labels, vectorName, step = 0.5) {
    const titleVector = document.createElement('h3');
    titleVector.innerHTML = vectorName;

    const inputVector = document.createElement('div');
    inputVector.id = vectorName + '_inputVector';
    inputVector.style.display = 'grid';
    for (let iInput = 0; iInput < labels.length; iInput++) {
      const labelElement = document.createElement('label');
      labelElement.innerHTML = labels[iInput];

      const componentElement = document.createElement('input');
      componentElement.id = vectorName + labelElement.innerHTML;
      componentElement.type = 'number';
      componentElement.setAttribute('value', '0');
      componentElement.step = step;

      labelElement.htmlFor = componentElement.id;
      this.callbacksHTMLEl.push({
        event: 'change',
        element: componentElement,
        cb: function (event) {
          const value = event.target.value;
          const element = event.target;
          element.setAttribute('value', value);
          if (this.aspectRatioCheckbox.checked)
            if (vectorName.toLowerCase().includes('size'))
              this.matchRatio(iInput, value);
          this.updateVectors();
        },
      });

      inputVector.appendChild(labelElement);
      inputVector.appendChild(componentElement);
    }
    return {
      title: titleVector,
      inputVector: inputVector,
    };
  }

  /**
   * Function called when aspectRatio is checked
   *
   * @param {number} iInput The index of the input element
   * @param {number} value The value of the input element
   */
  matchRatio(iInput, value) {
    const linkedSizeElement =
      this.sizeInputVector.getElementsByTagName('input')[iInput == 0 ? 1 : 0];
    const height = this.currentTextureFile.size.height;
    const width = this.currentTextureFile.size.width;
    const ratio = width / height;
    const newValue = iInput == 0 ? value / ratio : value * ratio;

    linkedSizeElement.value = newValue;
  }

  /** Update vectors variables with the values contained in inputs elements in DOM */
  updateVectors() {
    this.coordinatesVector =
      this.inputVectorToVector(this.coordinatesInputVector) ||
      new THREE.Vector3();

    this.rotationVector =
      this.inputVectorToVector(this.rotationInputVector) || new THREE.Vector3();

    this.sizeVector =
      this.inputVectorToVector(this.sizeInputVector) || new THREE.Vector2();

    this.modifyPlane();
  }

  /**
   * Convert inputVector HTMLElement to THREE.Vector
   *
   * @param {HTMLDivElement} inputVector HTMLElement 'div' contains labels and inputs HTMLElements
   * @returns {THREE.Vector} vector
   */
  inputVectorToVector(inputVector) {
    const inputEls = inputVector.getElementsByTagName('input');

    const countEls = inputEls.length;

    switch (countEls) {
      case 2:
        return new THREE.Vector2(inputEls[0].value, inputEls[1].value);
      case 3:
        return new THREE.Vector3(
          inputEls[0].value,
          inputEls[1].value,
          inputEls[2].value
        );
      case 4:
        return new THREE.Vector4(
          inputEls[0].value,
          inputEls[1].value,
          inputEls[2].value,
          inputEls[3].value
        );
    }

    return null;
  }

  /**
   * Set `this.currentTexture`
   *
   * @param {number} iText The index of the texture to set
   */
  setTexture(iText) {
    if (this.currentTextureFile && this.currentTextureFile.video) {
      this.currentTextureFile.video.pause();
      this.currentTextureFile.video.currentTime = 0;
      this.notifyValue = false;
    }

    this.textureFiles.forEach((tf) => {
      if (tf.index == iText) {
        this.currentTextureFile = tf;
        if (tf.video) {
          tf.video.play();
          this.notifyValue = true;
        }
      }
    });

    this.currentTexture = this.currentTextureFile.texture;
    this.modifyPlane();
    this.itownsView.notifyChange();
    this.aspectRatioCheckbox.dispatchEvent(new Event('change'));
  }

  /** Modify `this.plane` {THREE.Mesh} */
  modifyPlane() {
    if (!this.plane) {
      this.createPlane();
    }
    this.plane.position.set(
      this.coordinatesVector.x,
      this.coordinatesVector.y,
      this.coordinatesVector.z
    );

    this.plane.rotation.set(
      this.rotationVector.x,
      this.rotationVector.y,
      this.rotationVector.z
    );
    this.plane.scale.set(this.sizeVector.x, this.sizeVector.y, 1);
    this.plane.material.map = this.currentTexture || this.plane.material.map;

    this.plane.updateMatrixWorld();
    // this.itownsView.scene.add(this.plane);
    this.itownsView.notifyChange();
  }

  /**
   * It creates a PlaneGeometry and a MeshBasicMaterial, to create the Mesh `this.plane`
   */
  createPlane() {
    const geometry = new THREE.PlaneGeometry(1, 1);

    const material = new THREE.MeshBasicMaterial({
      map: this.currentTextureFile.texture,
      side: THREE.DoubleSide,
    });

    this.plane = new THREE.Mesh(geometry, material);
  }

  /**
   * Loop through a slide show of textures
   *
   */
  loopSlideShow() {
    if (!this.loopSlideShowCheckbox.checked) return;
    const durationInMS = this.durationLoopInSec * 1000; // Loop event
    this.counterLoopTimeDiv.innerHTML = this.durationLoopInSec;
    this.intervalLoop = setInterval(() => {
      this.nextSlide();
    }, durationInMS);

    this.counterIntervalLoop = setInterval(() => {
      this.updateCounterLoop();
    }, 100);
  }

  updateCounterLoop() {
    const value = parseFloat(this.counterLoopTimeDiv.innerHTML);
    const newValue = value - 0.1 <= 0 ? this.durationLoopInSec : value - 0.1;
    this.counterLoopTimeDiv.innerHTML = newValue.toFixed(1);
  }

  stopLoopSlideShow() {
    clearInterval(this.intervalLoop);
    clearInterval(this.counterIntervalLoop);
  }

  restartLoopSlideShow() {
    this.stopLoopSlideShow();
    this.loopSlideShow();
  }

  // DOM GETTERS

  get innerContentHtml() {
    return this.domElement.outerHTML;
  }

  get iCurrentTextureFile() {
    return this.currentTextureFile.index;
  }

  // INPUTS ELEMENTS SETTERS
  /* Setting the values of the input fields in the DOM. */
  setSizeInputs(vec2) {
    const sizeInputEls = this.sizeInputVector.getElementsByTagName('input');

    if (vec2.x !== null) {
      const element0 = sizeInputEls[0];
      element0.value = vec2.x;
      element0.dispatchEvent(new Event('change'));
    }

    if (vec2.y !== null) {
      const element1 = sizeInputEls[1];
      element1.value = vec2.y;
      element1.dispatchEvent(new Event('change'));
    }
  }

  setCoordinatesInputs(vec3) {
    const coordinatesInputEls =
      this.coordinatesInputVector.getElementsByTagName('input');

    if (vec3.x !== null) {
      const element0 = coordinatesInputEls[0];
      element0.value = vec3.x;
      element0.dispatchEvent(new Event('change'));
    }
    if (vec3.y !== null) {
      const element1 = coordinatesInputEls[1];
      element1.value = vec3.y;
      element1.dispatchEvent(new Event('change'));
    }

    if (vec3.z !== null) {
      const element2 = coordinatesInputEls[2];
      element2.value = vec3.z || this.coordinatesVector.z;
      element2.dispatchEvent(new Event('change'));
    }
  }

  setRotationInputs(vec3) {
    const rotationInputEls =
      this.rotationInputVector.getElementsByTagName('input');

    if (vec3.x !== null) {
      const element0 = rotationInputEls[0];
      element0.value = vec3.x;
      element0.dispatchEvent(new Event('change'));
    }
    if (vec3.y !== null) {
      const element1 = rotationInputEls[1];
      element1.value = vec3.y;
      element1.dispatchEvent(new Event('change'));
    }
    if (vec3.z !== null) {
      const element2 = rotationInputEls[2];
      element2.value = vec3.z;
      element2.dispatchEvent(new Event('change'));
    }
  }

  /**
   * Get size values contained in inputs elements in DOM
   *
   * @returns {{height:number,width:number}} sizevalues
   */
  getSizeValues() {
    const sizeInputEls = this.sizeInputVector.getElementsByTagName('input');
    return {
      height: parseInt(sizeInputEls[0].value),
      width: parseInt(sizeInputEls[1].value),
    };
  }
}
