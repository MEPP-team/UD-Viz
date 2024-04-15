import { STShape } from './STShape';
import { MAIN_LOOP_EVENTS } from 'itowns';
import * as THREE from 'three';
import { createSpriteFromString } from '@ud-viz/utils_browser/src/THREEUtil';

export class STSCircle extends STShape {
  constructor(stLayer, options = {}) {
    super(stLayer);
    this.radius = isNaN(options.radius) ? 1000 : options.radius;
    this.height = isNaN(options.height) ? 550 : options.height;

    this.layerCentroid = null;
    this.frameRequester = null;

    this.objectCopies = null;
  }

  display() {
    super.display();

    const view = this.stLayer.view;
    const rootObject3D = this.stLayer.rootObject3D;

    rootObject3D.position.z += this.height;
    // Init circle line
    const pointsDisplayed = [];
    for (let i = 90; i < 360; i += 10) {
      const angle = (i * Math.PI) / 180;
      pointsDisplayed.push(
        new THREE.Vector3(
          this.radius * Math.cos(angle),
          this.radius * Math.sin(angle),
          0
        )
      );
    }
    const geometryDisplayed = new THREE.BufferGeometry().setFromPoints(
      pointsDisplayed
    );
    const materialDisplayed = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const circleLine = new THREE.Line(geometryDisplayed, materialDisplayed);

    rootObject3D.add(circleLine);
    circleLine.position.y += this.radius;
    circleLine.updateMatrixWorld();

    // Place versions cdtlayers + labels on the circle
    let angleDeg = 0;
    this.objectCopies = [];
    this.stLayer.versions.forEach((version) => {
      const objectCopy = new THREE.Object3D().copy(
        version.c3DTLayer.root,
        true
      );
      this.objectCopies.push(objectCopy);
      rootObject3D.add(objectCopy);
      const angleRad = (angleDeg * Math.PI) / 180;
      angleDeg -= 360 / this.stLayer.versions.length;
      const point = new THREE.Vector3(
        this.radius * Math.cos(angleRad),
        this.radius * Math.sin(angleRad),
        0
      );

      version.c3DTLayer.visible = false;

      const dateSprite = createSpriteFromString(version.date.toString());

      let newPosition = new THREE.Vector3(0, 0, -this.height);
      if (version.date != 2012) {
        newPosition = new THREE.Vector3(
          circleLine.position.x + point.x,
          circleLine.position.y + point.y,
          circleLine.position.z
        );
      }
      // position C3DTLayer
      objectCopy.children.forEach((object) => {
        object.position.copy(newPosition);
      });
      dateSprite.position.copy(newPosition);

      // Date label sprite
      dateSprite.position.z += 40;
      dateSprite.scale.multiplyScalar(0.02);
      rootObject3D.add(dateSprite);
    });
    rootObject3D.updateMatrixWorld();

    view.notifyChange();

    if (!this.frameRequester) {
      this.frameRequester = this.update.bind(this);

      view.addFrameRequester(
        MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE,
        this.frameRequester
      );
    }
  }

  update() {
    // Compute the angle between camera and the base layer.
    if (!this.stLayer.rootObject3D.children.length) return;

    const dirToCamera = new THREE.Vector2(
      this.layerCentroid.x - this.stLayer.view.camera.camera3D.position.x,
      this.layerCentroid.y - this.stLayer.view.camera.camera3D.position.y
    ).normalize();
    const dirObject = new THREE.Vector2(0, 1);

    let angle = dirObject.angleTo(dirToCamera);
    const orientation =
      dirToCamera.x * dirObject.y - dirToCamera.y * dirObject.x;
    if (orientation > 0) angle = 2 * Math.PI - angle;

    // Update position of the circle
    if (!this.stLayer.rootObject3D) return;

    this.stLayer.rootObject3D.rotation.set(0, 0, angle);

    this.objectCopies.forEach((object) => {
      object.children.forEach((c) => {
        c.rotation.set(0, 0, -angle);
      });
    });
    this.stLayer.rootObject3D.updateMatrixWorld();
  }

  dispose() {
    super.dispose();
    this.objectCopies = null;
    this.stLayer.view.removeFrameRequester(
      MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE,
      this.frameRequester
    );
    this.frameRequester = null;
  }
}