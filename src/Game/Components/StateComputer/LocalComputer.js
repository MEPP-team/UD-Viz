/** @format */

const WorldContext = require('../../Shared/WorldContext');
const Shared = require('../../Shared/Shared');

//TODO LocalComputer do not have tick to make tick the world

export class LocalComputer {
  constructor(world, assetsManager) {
    this.worldContext = new WorldContext({
      world: world,
      assetsManager: assetsManager,
      Shared: Shared,
    });
  }

  load(onLoad) {
    const _this = this;
    this.worldContext.getWorld().load(onLoad, this.worldContext);
  }

  //API call from GameView
  computeCurrentState() {
    return this.worldContext.getWorld().computeWorldState();
  }
}
