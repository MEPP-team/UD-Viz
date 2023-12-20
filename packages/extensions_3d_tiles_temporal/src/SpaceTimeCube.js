import * as itowns from 'itowns';
import * as THREE from 'three';
import { arrayPushOnce } from '@ud-viz/utils_shared';
import { Temporal3DTilesLayerWrapper } from '@ud-viz/extensions_3d_tiles_temporal';

const TEMPORAL_COLOR_OPACITY = {
  noTransaction: {
    color: 'white',
    opacity: 1,
    priority: 0.5,
  },
  invisible: {
    color: 'blue',
    opacity: 0,
    priority: 0,
  },
  debug: {
    color: 'brown',
    opacity: 0.2,
    priority: 1,
  },
  creation: {
    color: 'green',
    opacity: 0.6,
    priority: 1,
  },
  demolition: {
    color: 'red',
    opacity: 0.6,
    priority: 1,
  },
  modification: {
    color: 'yellow',
    opacity: 0.6,
    priority: 1,
  },
};

const translateMatrix = new THREE.Matrix4();

class Level {
  constructor(date, boundingBox, features) {
    /** @type {THREE.Box3} */
    this.boundingBox = boundingBox;

    /** @type {THREE.Box3Helper} */
    this.boundingBoxHelper = new THREE.Box3Helper(
      this.boundingBox,
      new THREE.Color(1, 1, 0)
    );

    /** @type {THREE.PlaneGeometry} */
    this.planeGeometry;

    /** @type {THREE.Mesh} */
    this.plane = null;

    /** @type {Array<itowns.C3DTFeature>} */
    this.features = features;

    this.transactions = [];

    /** @type {number} */
    this.date = date;

    /** @type {number} */
    this._offsetZ = 0;

    /** @type {number} */
    this._offsetY = 0;

    /** @type {Level} */
    this._previous = null;

    /** @type {Level} */
    this._next = null;
  }

  set offsetZ(value) {
    this.boundingBox.min.z -= this._offsetZ;
    this.boundingBox.max.z -= this._offsetZ;

    this._offsetZ = value;

    this.boundingBox.min.z += this._offsetZ;
    this.boundingBox.max.z += this._offsetZ;
  }

  set offsetY(value) {
    this.boundingBox.min.y -= this._offsetY;
    this.boundingBox.max.y -= this._offsetY;

    this._offsetY = value;

    this.boundingBox.min.y += this._offsetY;
    this.boundingBox.max.y += this._offsetY;
  }

  get offsetZ() {
    return this._offsetZ;
  }

  get offsetY() {
    return this._offsetY;
  }
  get width() {
    return this.boundingBox.max.x - this.boundingBox.min.x;
  }

  get lenght() {
    return this.boundingBox.max.y - this.boundingBox.min.y;
  }

  get height() {
    return this.boundingBox.max.z - this.boundingBox.min.z;
  }

  get previous() {
    return this._previous;
  }

  get next() {
    return this._next;
  }

  set previous(level) {
    this._previous = level;
  }

  set next(level) {
    this._next = level;
  }

  createPlane(width, lenght, position) {
    this.planeGeometry = new THREE.PlaneGeometry(width, lenght);

    /** @type {THREE.Mesh} */
    const planeMesh = new THREE.Mesh(
      this.planeGeometry,
      new THREE.MeshStandardMaterial({ color: 'white', side: THREE.DoubleSide })
    );

    planeMesh.position.set(position.x, position.y, position.z);
    this.plane = planeMesh;
  }

  addFeature(feature) {
    this.features.push(feature);

    // update bb
    this.boundingBox.min.x = Math.min(
      this.boundingBox.min.x,
      feature.userData.worldInitialBox3.min.x
    );
    this.boundingBox.min.y = Math.min(
      this.boundingBox.min.y,
      feature.userData.worldInitialBox3.min.y
    );
    this.boundingBox.min.z =
      Math.min(
        this.boundingBox.min.z - this._offsetZ,
        feature.userData.worldInitialBox3.min.z
      ) + this._offsetZ;

    this.boundingBox.max.x = Math.max(
      this.boundingBox.max.x,
      feature.userData.worldInitialBox3.max.x
    );
    this.boundingBox.max.y = Math.max(
      this.boundingBox.max.y,
      feature.userData.worldInitialBox3.max.y
    );
    this.boundingBox.max.z =
      Math.max(
        this.boundingBox.max.z - this._offsetZ,
        feature.userData.worldInitialBox3.max.z
      ) + this._offsetZ;

    this.boundingBoxHelper.updateMatrixWorld();
  }
}

/**
 *
 * @param date
 * @param head
 */
function getLevelWithDate(head, date) {
  let current = head;
  while (current != null) {
    if (current.date == date) return current;
    current = current.next;
  }
  return null;
}

export class Version {
  constructor(object3DTiles, c3DTiles, date) {
    /** @type {Array<THREE.Object3D>}*/
    this.object3DTiles = object3DTiles;

    /** @type {itowns.C3DTilesLayer}*/
    this.c3DTiles = c3DTiles;

    /** @type {number} */
    this.date = date;

    /** @type {THREE.Vector3} */
    this.centroid;

    /** @type {THREE.Sprite} */
    this.dateSprite;

    /** @type {itowns.C3DTilesLayer} */
    this.diffOlder;

    /** @type {itowns.C3DTilesLayer} */
    this.diffNew;

    /** @type {Array<THREE.Line>} */
    this.transactionsLines = [];

    /** @type {Temporal3DTilesLayerWrapper} */
    this.temporalWrapper;

    this.updateCentroid();
  }

  createSpriteDate() {
    const size = 64;
    const baseWidth = 150;
    const name = this.date.toString();
    const borderSize = 2;
    const ctx = document.createElement('canvas').getContext('2d');
    const font = `${size}px bold sans-serif`;
    ctx.font = font;
    // measure how long the name will be
    const textWidth = ctx.measureText(name).width;

    const doubleBorderSize = borderSize * 2;
    const width = baseWidth + doubleBorderSize;
    const height = size + doubleBorderSize;
    ctx.canvas.width = width;
    ctx.canvas.height = height;

    // need to set font again after resizing canvas
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // scale to fit but don't stretch
    const scaleFactor = Math.min(1, baseWidth / textWidth);
    ctx.translate(width / 2, height / 2);
    ctx.scale(scaleFactor, 1);
    ctx.fillStyle = 'white';
    ctx.fillText(name, 0, 0);

    const canvasTexture = new THREE.CanvasTexture(ctx.canvas);
    // canvasTexture.magFilter = THREE.NearestFilter;
    const label = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: canvasTexture })
    );
    label.material.sizeAttenuation = false;
    this.dateSprite = label;

    return this.dateSprite;
  }

  /**
   *
   * @param {THREE.Line} line
   * @param {THREE.Vector3} p1
   * @param {THREE.Vector3} p2
   */
  updateTransaction(line, p1, p2) {
    const curve = new THREE.CatmullRomCurve3([
      p1,
      new THREE.Vector3(
        (p1.x + p2.x) / 2,
        (p1.y + p2.y) / 2,
        (p1.z + p2.z) / 2 + 150
      ),
      p2,
    ]);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    line.geometry = geometry;
  }

  /**
   *
   */
  updateCentroid() {
    this.centroid = new THREE.Vector3();
    const sumPos = new THREE.Vector3(0, 0, 0);
    this.object3DTiles.forEach((object3D) => {
      sumPos.add(object3D.position);
    });
    this.centroid.set(
      sumPos.x / this.object3DTiles.length,
      sumPos.y / this.object3DTiles.length,
      sumPos.z / this.object3DTiles.length
    );
  }

  differenceVisibility(visibility) {
    if (this.diffNew) this.diffNew.object3d.visible = visibility;
    if (this.diffOlder) this.diffNew.object3d.visible = visibility;
  }
}

export class SpaceTimeCube {
  /**
   *
   * @param {itowns.PlanarView} view
   * @param delta
   * @param {Map<number, itowns.C3DTileset>} C3DTilesDated
   */
  constructor(view, delta, C3DTilesDated) {
    this.view = view;

    this.temporalLayers = () => {
      return view.getLayers().filter((el) => {
        return (
          el.isC3DTilesLayer &&
          el.registeredExtensions.isExtensionRegistered('3DTILES_temporal')
        );
      });
    };

    this.layers = () => {
      return view.getLayers().filter((el) => {
        return (
          el.isC3DTilesLayer &&
          !el.registeredExtensions.isExtensionRegistered('3DTILES_temporal')
        );
      });
    };

    /** @type {Map<string,object>} */
    this.featureDateID2ColorOpacity = new Map();

    /** @type {Array} */
    this.possibleDates = [];

    /** @type {Array<Temporal3DTilesLayerWrapper>} */
    this.temporalsWrappers = [];

    /** @type {Array<Version>} */
    this.versions = [];

    this.delta = delta;
    /** @type {number} */
    this.RAYON = 1000;

    /** @type {THREE.Vector3} */
    this.centroid;

    this.circleDisplayed;

    /** @type {Map<number, itowns.C3DTileset>} */
    this.C3DTilesDated = C3DTilesDated;

    this.centerLayer = this.layers()[0];
    this.temporalLayerVJA = this.temporalLayers()[0];
    this.centerLayer = this.temporalLayerVJA;

    this.updateCircle = this.updateCircle.bind(this);

    // Circle paramaters
    // const oldestDate = Math.min(...C3DTilesDated.keys());

    this.C3DTilesDated.forEach((c3DTilesLayer, key) => {
      const C3DTiles = new udviz.itowns.C3DTilesLayer(
        this.temporalLayerVJA.id + '_' + key.toString(),
        {
          name: this.temporalLayerVJA.id + key.toString(),
          source: new udviz.itowns.C3DTilesSource({
            url: this.temporalLayerVJA.source.url,
          }),
          registeredExtensions: this.temporalLayerVJA.registeredExtensions,
        },
        this.view
      );
      // c3DTilesLayer = C3DTiles;
      itowns.View.prototype.addLayer.call(view, C3DTiles);
      this.temporalsWrappers.push(new Temporal3DTilesLayerWrapper(C3DTiles));
      if (key - 1 < 2009) {
        this.temporalsWrappers[this.temporalsWrappers.length - 1].styleDate =
          key + 1;
      } else {
        this.temporalsWrappers[this.temporalsWrappers.length - 1].styleDate =
          key - 2;
      }

      this.C3DTilesDated.set(key, C3DTiles);
    });
  }

  vectorRepresentation() {
    this.temporalLayers().forEach((temporalLayer) => {
      // Modification
      temporalLayer.tileset.extensions['3DTILES_temporal'].transactions.forEach(
        (transaction) => {
          const transactionDuration =
            transaction.endDate - transaction.startDate;

          const firstHalfDate = transaction.startDate + transactionDuration / 3;
          const secondHalfDate = transaction.endDate - transactionDuration / 3;
          arrayPushOnce(this.possibleDates, transaction.startDate);
          arrayPushOnce(this.possibleDates, transaction.endDate);

          arrayPushOnce(this.possibleDates, firstHalfDate);
          arrayPushOnce(this.possibleDates, secondHalfDate);

          transaction.source.forEach((fId) => {
            if (transaction.type == 'modification') {
              this.featureDateID2ColorOpacity.set(
                fId + firstHalfDate,
                TEMPORAL_COLOR_OPACITY.modification
              );
              this.featureDateID2ColorOpacity.set(
                fId + secondHalfDate,
                TEMPORAL_COLOR_OPACITY.invisible
              );
            } else {
              // all other transaction
              this.featureDateID2ColorOpacity.set(
                fId + firstHalfDate,
                TEMPORAL_COLOR_OPACITY.noTransaction
              );
              this.featureDateID2ColorOpacity.set(
                fId + secondHalfDate,
                TEMPORAL_COLOR_OPACITY.noTransaction
              );
            }
          });
          transaction.destination.forEach((fId) => {
            if (transaction.type == 'modification') {
              this.featureDateID2ColorOpacity.set(
                fId + firstHalfDate,
                TEMPORAL_COLOR_OPACITY.invisible
              );
              this.featureDateID2ColorOpacity.set(
                fId + secondHalfDate,
                TEMPORAL_COLOR_OPACITY.modification
              );
            } else {
              // all other transaction
              this.featureDateID2ColorOpacity.set(
                fId + firstHalfDate,
                TEMPORAL_COLOR_OPACITY.noTransaction
              );
              this.featureDateID2ColorOpacity.set(
                fId + secondHalfDate,
                TEMPORAL_COLOR_OPACITY.noTransaction
              );
            }
          });
        }
      );

      // handle demolition/creation which are not in batchTable/extension
      this.possibleDates.sort((a, b) => a - b);

      let head;
      for (const [tileId, tileFeatures] of temporalLayer.tilesC3DTileFeatures) {
        for (const [batchId, feature] of tileFeatures) {
          if (!feature.userData.worldInitialBox3) {
            feature.userData.worldInitialBox3 =
              temporalLayer.computeWorldBox3(feature);
          }

          const date =
            feature.getInfo().extensions['3DTILES_temporal'].startDate;
          // If no head
          if (!head) {
            head = new Level(date, feature.userData.worldInitialBox3.clone(), [
              feature,
            ]);
          }

          // add level if doesnt existed
          const levelExisting = getLevelWithDate(head, date);
          if (!levelExisting) {
            const newLevel = new Level(
              date,
              feature.userData.worldInitialBox3.clone(),
              [feature]
            );

            // Add next
            let current = head;
            if (current == null) {
              head = newLevel;
              return;
            }
            while (current.next) {
              current = current.next;
            }
            newLevel.previous = current;
            current.next = newLevel;
          } else {
            levelExisting.addFeature(feature);
          }
        }
      }

      if (!head) return;

      const minDate = head.date;
      let current = head;
      while (current != null) {
        // update elevation
        const elevation = current.previous ? current.previous.height : 0;
        current.offsetZ = (current.date - minDate) * this.delta;
        current.offsetY = (current.date - minDate) * (this.delta + 50);

        // Set demoliton and construction
        for (let index = 0; index < this.possibleDates.length - 1; index++) {
          const date = this.possibleDates[index];
          const nextDate = this.possibleDates[index + 1];
          current.features.forEach((feature) => {
            const featureTransaction =
              feature.getInfo().extensions['3DTILES_temporal'];
            if (featureTransaction.endDate == date) {
              const featureDateID = featureTransaction.featureId + nextDate;
              if (!this.featureDateID2ColorOpacity.has(featureDateID)) {
                this.featureDateID2ColorOpacity.set(
                  featureDateID,
                  TEMPORAL_COLOR_OPACITY.demolition
                );
              }
            }
            if (featureTransaction.startDate == nextDate) {
              const featureDateID = featureTransaction.featureId + date;
              if (!this.featureDateID2ColorOpacity.has(featureDateID))
                this.featureDateID2ColorOpacity.set(
                  featureDateID,
                  TEMPORAL_COLOR_OPACITY.creation
                );
            }
          });
        }

        // Set plane
        if (current.plane == null) {
          // Update bounding box
          current.boundingBoxHelper.updateMatrixWorld();
          this.view.scene.add(current.boundingBoxHelper);

          current.createPlane(
            current.width,
            current.lenght,
            new THREE.Vector3(
              current.boundingBox.min.x + current.width / 2,
              current.boundingBox.min.y + current.lenght / 2,
              current.boundingBox.min.z
            )
          );
          current.plane.wireframe = true;
          current.plane.quaternion.set(0.0871557, 0, 0, 0.9961947);
          current.plane.updateMatrixWorld();
          this.view.scene.add(current.plane);
        }

        current = current.next;
      }

      console.log(head);

      this.temporalLayers().forEach((layer) => {
        for (const [tileId, tileFeatures] of layer.tilesC3DTileFeatures) {
          for (const [batchId, feature] of tileFeatures) {
            const tileContent = layer.object3d.getObjectByProperty(
              'tileId',
              feature.tileId
            );

            let level = null;

            const date =
              feature.getInfo().extensions['3DTILES_temporal'].startDate;

            let current = head;
            while (current != null) {
              if (current.date == date) {
                level = current;
              }
              current = current.next;
            }

            if (!tileContent || !level) return;

            tileContent.traverse((child) => {
              if (child.geometry && child.geometry.attributes._BATCHID) {
                const verticesDuplicated = [];
                feature.groups.forEach((group) => {
                  const positionIndexStart = group.start * 3;
                  const positionIndexCount = (group.start + group.count) * 3;
                  for (
                    let index = positionIndexStart;
                    index < positionIndexCount;
                    index += 3
                  ) {
                    // verticesDuplicated.push(
                    //   child.geometry.attributes.position.array[index],
                    //   child.geometry.attributes.position.array[index + 1],
                    //   child.geometry.attributes.position.array[index + 2]
                    // );

                    // Set Transformation matrice

                    const pos = new THREE.Vector3(
                      0,
                      child.geometry.attributes.position.array[index + 1],
                      child.geometry.attributes.position.array[index + 2]
                    );

                    translateMatrix.makeTranslation(
                      0,
                      level.offsetY,
                      level.offsetZ
                    );

                    pos.applyMatrix4(translateMatrix);

                    translateMatrix.makeRotationAxis(
                      new THREE.Vector3(1, 0, 0),
                      0.174533
                    );

                    pos.applyMatrix4(translateMatrix);

                    child.geometry.attributes.position.array[index + 1] = pos.y;
                    child.geometry.attributes.position.array[index + 2] = pos.z;
                    level.offsetZ;
                  }
                });

                // testing if feature is a creation or destruction
                const fiD =
                  feature.getInfo().extensions['3DTILES_temporal'].featureId;
                this.possibleDates.forEach((pdate) => {
                  if (this.featureDateID2ColorOpacity.has(fiD + pdate)) {
                    if (
                      this.featureDateID2ColorOpacity.get(fiD + pdate).color ==
                      'green'
                    ) {
                      for (
                        let index = 0;
                        index < verticesDuplicated.length;
                        index += 3
                      ) {
                        verticesDuplicated[index + 2] += level.previous.offset;
                      }
                      const geometry = new THREE.BufferGeometry();
                      geometry.setAttribute(
                        'position',
                        new THREE.BufferAttribute(
                          new Float32Array(verticesDuplicated),
                          3
                        )
                      );

                      const material = new THREE.MeshBasicMaterial({
                        color: 'green',
                        transparent: true,
                      });

                      const mesh = new THREE.Mesh(geometry, material);
                      mesh.applyMatrix4(child.matrixWorld);
                      // view.scene.add(mesh);
                    } else if (
                      this.featureDateID2ColorOpacity.get(fiD + pdate).color ==
                      'red'
                    ) {
                      for (
                        let index = 0;
                        index < verticesDuplicated.length;
                        index += 3
                      ) {
                        verticesDuplicated[index + 2] =
                          verticesDuplicated[index + 2] + level.next.offset;
                      }
                      const geometry = new THREE.BufferGeometry();
                      geometry.setAttribute(
                        'position',
                        new THREE.BufferAttribute(
                          new Float32Array(verticesDuplicated),
                          3
                        )
                      );

                      const material = new THREE.MeshBasicMaterial({
                        color: 'red',
                        transparent: true,
                      });
                      const mesh = new THREE.Mesh(geometry, material);
                      mesh.applyMatrix4(child.matrixWorld);
                      level.boundingBoxHelper.updateMatrixWorld();
                      // view.scene.add(mesh);
                    }
                  }
                });
                child.updateMatrixWorld();
              }
            });
          }
          this.view.notifyChange();
        }

        const computeColorOpacity = (c3DTileFeature) => {
          const temporalExtension =
            c3DTileFeature.getInfo().extensions['3DTILES_temporal'];
          const result = [];

          this.possibleDates.forEach((date) => {
            if (
              temporalExtension.startDate <= date &&
              temporalExtension.endDate >= date
            ) {
              arrayPushOnce(result, TEMPORAL_COLOR_OPACITY.noTransaction);
            }

            const featureDateID = temporalExtension.featureId + date;
            if (this.featureDateID2ColorOpacity.has(featureDateID)) {
              arrayPushOnce(
                result,
                this.featureDateID2ColorOpacity.get(featureDateID)
              );
            }
          });
          arrayPushOnce(result, TEMPORAL_COLOR_OPACITY.invisible);

          result.sort((a, b) => b.priority - a.priority);
          return result[0];
        };

        temporalLayer.style = new itowns.Style({
          fill: {
            color: (bE) => {
              const colorOpacity = computeColorOpacity(bE);
              return colorOpacity.color;
            },
            opacity: (bE) => {
              const colorOpacity = computeColorOpacity(bE);
              return colorOpacity.opacity;
            },
          },
        });
        this.view.notifyChange();
      });
      // temporalLayer.addEventListener(
      //   itowns.C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
      //   () => {

      //   }
      // );
    });
  }

  initVersions() {
    let i = 0;
    this.C3DTilesDated.forEach((c3DTilesLayer, key) => {
      const version = new Version(
        c3DTilesLayer.root.children,
        c3DTilesLayer,
        key
      );
      version.temporalWrapper = this.temporalsWrappers[i];
      i++;
      this.versions.push(version);
    });
  }

  displayVersionsCircle() {
    this.initVersions();
    const view = this.view;

    const initVersion = new Version(
      this.centerLayer.root.children,
      this.centerLayer,
      0
    );
    initVersion.updateCentroid();

    // TESTING
    const centroid = new THREE.Vector3(
      initVersion.centroid.x,
      initVersion.centroid.y,
      initVersion.centroid.z
    );

    this.centroid = centroid;

    // Init circle line
    const pointsDisplayed = [];
    for (let i = 0; i < 360; i += 10) {
      const angle = (i * Math.PI) / 180;
      pointsDisplayed.push(
        new THREE.Vector3(
          this.RAYON * Math.cos(angle),
          this.RAYON * Math.sin(angle),
          0
        )
      );
    }

    const geometryDisplayed = new THREE.BufferGeometry().setFromPoints(
      pointsDisplayed
    );
    const materialDisplayed = new THREE.LineBasicMaterial({ color: 0x0000ff });
    this.circleDisplayed = new THREE.Line(geometryDisplayed, materialDisplayed);
    this.circleDisplayed.position.set(
      centroid.x,
      centroid.y + this.RAYON,
      centroid.z + 500
    );
    view.scene.add(this.circleDisplayed);
    this.circleDisplayed.updateMatrix();

    let angleDeg = 0;
    this.versions.forEach((version) => {
      // Calcul circle coordinates
      const angleRad = (angleDeg * Math.PI) / 180;
      angleDeg = 360 / this.versions.length + angleDeg;
      const point = new THREE.Vector3(
        this.RAYON * Math.cos(angleRad),
        this.RAYON * Math.sin(angleRad),
        0
      );

      // TO-DO: should be change by a selected param
      if (version.date != 2012) {
        version.object3DTiles.forEach((obj) => {
          obj.position.set(point.x, point.y, 0);
        }); // Initial position for better rotation

        version.updateCentroid();
        version.c3DTiles.object3d.position.set(
          centroid.x,
          centroid.y,
          centroid.z + 500
        );
        version.c3DTiles.object3d.updateMatrixWorld();
      } else {
        version.object3DTiles.forEach((obj) => {
          obj.position.set(0, 0, 0);
        }); // Initial position for better rotation
        version.c3DTiles.object3d.position.copy(this.centroid);
        version.c3DTiles.object3d.updateMatrixWorld();
      }
      // Date sprite creation
      const dateSprite = version.createSpriteDate();
      dateSprite.position.copy(
        version.c3DTiles.object3d.position.add(
          version.object3DTiles[0].position
        )
      );
      dateSprite.scale.multiplyScalar(0.02);
      dateSprite.renderOrder = 1;
      dateSprite.updateMatrixWorld();
      view.scene.add(dateSprite);

      // TESTING Need to generalize
      const geometry = new THREE.BufferGeometry();
      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color: 0xff0000 })
      );

      view.scene.add(line);
      version.transactionsLines.push(line);
    });

    this.updateCircle();
  }

  updateParameters() {
    const points = [];
    for (let i = 90; i < 360; i += 10) {
      const angle = (i * Math.PI) / 180;
      points.push(
        new THREE.Vector3(
          this.RAYON * Math.cos(angle),
          this.RAYON * Math.sin(angle),
          0
        )
      );
    }
    this.circleDisplayed.geometry = new THREE.BufferGeometry().setFromPoints(
      points
    );
    this.circleDisplayed.updateMatrixWorld();

    const a = new THREE.Euler().setFromQuaternion(
      this.circleDisplayed.quaternion
    );

    let angleDeg = (a.z * 180) / Math.PI;
    this.versions.forEach((version) => {
      const angle = (angleDeg * Math.PI) / 180;
      angleDeg = 360 / this.versions.length + angleDeg;
      const pos = new THREE.Vector2(
        Number(this.RAYON) * Math.cos(angle),
        Number(this.RAYON) * Math.sin(angle)
      );

      if (version.date != 2012) {
        version.object3DTiles.forEach((obj) => {
          obj.position.set(pos.x, pos.y, 0);
          obj.updateMatrix();
        });

        version.c3DTiles.object3d.position.copy(this.circleDisplayed.position);
        version.c3DTiles.root.visible = true;
        version.c3DTiles.object3d.updateMatrixWorld();
      }
      version.dateSprite.position.copy(
        version.c3DTiles.object3d.position.add(
          version.object3DTiles[0].position
        )
      );
      version.dateSprite.updateMatrixWorld();
    });

    this.view.notifyChange();
    this.updateCircle();
  }

  updateCircle() {
    const dirToCamera = new THREE.Vector2(
      this.centroid.x - this.view.camera.camera3D.position.x,
      this.centroid.y - this.view.camera.camera3D.position.y
    ).normalize();
    const dirObject = new THREE.Vector2(0, 1);

    let angle = dirObject.angleTo(dirToCamera);
    const orientation =
      dirToCamera.x * dirObject.y - dirToCamera.y * dirObject.x;
    if (orientation > 0) angle = 2 * Math.PI - angle;

    // Circle
    this.circleDisplayed.setRotationFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      angle
    );
    this.circleDisplayed.position.set(
      this.centroid.x + dirToCamera.x * this.RAYON,
      this.centroid.y + dirToCamera.y * this.RAYON,
      this.circleDisplayed.position.z
    );
    this.circleDisplayed.updateMatrixWorld();

    const a = new THREE.Euler().setFromQuaternion(
      this.circleDisplayed.quaternion
    );
    let angleDeg = 90 + (a.z * 180) / Math.PI;

    this.versions.forEach((version) => {
      const angle = (angleDeg * Math.PI) / 180;
      angleDeg = 360 / this.versions.length + angleDeg;
      const pos = new THREE.Vector3(
        this.RAYON * Math.cos(angle),
        this.RAYON * Math.sin(angle),
        0
      );
      if (version.date != 2012) {
        version.object3DTiles.forEach((obj) => {
          obj.position.set(pos.x, pos.y, 0);
          obj.updateMatrix();
        });
        version.c3DTiles.object3d.position.copy(this.circleDisplayed.position);
        version.c3DTiles.object3d.updateMatrixWorld();
      }
      version.dateSprite.position.copy(
        version.c3DTiles.object3d.position.add(
          version.object3DTiles[0].position
        )
      );
      version.dateSprite.updateMatrixWorld();
    });
    // make transactions
    this.versions.forEach((version, index) => {
      const transactionLine = version.transactionsLines[0];
      if (index != this.versions.length - 1) {
        version.dateSprite.position;
        version.updateTransaction(
          transactionLine,
          version.c3DTiles.object3d.position,
          this.versions[index + 1].c3DTiles.object3d.position
        );
      }
    });
    this.view.notifyChange();

    requestAnimationFrame(this.updateCircle);
  }
}
