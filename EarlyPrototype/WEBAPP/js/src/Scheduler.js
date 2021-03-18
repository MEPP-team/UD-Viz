/** 
 * Copyright University of Lyon, 2012 - 2017
 * Distributed under the GNU Lesser General Public License Version 2.1 (LGPLv2)
 * (Refer to accompanying file License.md or copy at
 *  https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html )
 */

/**
 *
 * Handle priority FiFo list in order to load geometries and textures more fluently
 * @class VCC.Scheduler
 * @constructor
 **/

VCC.Scheduler = function() {

	/** "Privates" properties used to make the scheduler work*/
	this.textureCount = 0;
	this.currentLoadingTileId = "";
	this.isBusy = false;

	/**
	 * High priority FiFo, items in it will be loaded before the items in lowPriorityFifo
	 * @property highPriorityFifo
	 * @type Array
	 */
	this.highPriorityFifo = [];

	/**
	 * Low priority FiFo, items in it will be loaded after the items in highPriorityFifo
	 * @property lowPriorityFifo
	 * @type Array
	 */
	this.lowPriorityFifo = [];

	/**
	 * Fifo of tasks to be deleted
	 * @property removeFifo
	 * @type Array
	 */
	this.removeFifo = [];


};


/**
 * Add a task
 * @method addToHighPriorityFifo
 * @params {SchedulerTask} task task to execute
 * @params {bool} hasHighPriority set priority
 */
VCC.Scheduler.prototype.addTaskToScheduler = function(task, hasHighPriority) {
	switch (task.taskCode) {
		case VCC.Enum.SCHEDULER_TASK.ST_LOAD_GEOM:
			/** make VCC.ViewPort.tilemanager.tileExist(idTile) returns true*/
			var tileId = task.tileRow + "_" + task.tileCol;
			if (VCC.ViewPort.tileManager.tabTile[tileId] === undefined) {
				VCC.ViewPort.tileManager.tabTile[tileId] = new VCC.Tile(tileId,undefined, VCC.ViewPort.config.layersList);
			}
			if(task.params !== undefined && VCC.ViewPort.tileManager.tabTile[tileId].layersMeshes[task.params] !== undefined){
				VCC.ViewPort.tileManager.tabTile[tileId].layersMeshes[task.params][0] = new Array();
			}
			break;
		case VCC.Enum.SCHEDULER_TASK.ST_LOAD_TEXTURE:
			break;
		case VCC.Enum.SCHEDULER_TASK.ST_LOAD_HIGHER_RES:
			break;
		case VCC.Enum.SCHEDULER_TASK.ST_LOAD_OPENLAYER:
			var tileId = task.tileRow + "_" + task.tileCol;
			if(task.params !== undefined && VCC.ViewPort.tileManager.tabTile[tileId].openLayerMeshes[task.params] === undefined){
				VCC.ViewPort.tileManager.tabTile[tileId].openLayerMeshes[task.params] = "something";
			}else{
				console.log("task already done or added");
				return
			}
			break;
		break;
		default:
			console.error("error unknow task");
			return;
	}
	if (hasHighPriority) {
		this.highPriorityFifo.push(task);
		//	console.log("task added to high priority queue");
		//	console.log(task);
	} else {
		this.lowPriorityFifo.push(task);
		//	console.log("task added to low priority queue");
		//	console.log(task);
	}
};

/**
 * Execute a task given in argument
 * @method executeTask
 * @param {VCC.SchedulerTask} task task to be done
 */
VCC.Scheduler.prototype.executeTask = function(task) {
	switch (task.taskCode) {
		case VCC.Enum.SCHEDULER_TASK.ST_LOAD_GEOM:
			this.isBusy = true;
			this.currentLoadingTileId = task.tileRow + "_" + task.tileCol;
			VCC.ViewPort.tileManager.createTile(task.tileRow, task.tileCol, task.params);
			break;
		case VCC.Enum.SCHEDULER_TASK.ST_LOAD_TEXTURE:
			this.isBusy = true;
			if (VCC.ViewPort.tileManager.tabTile[task.tileRow + "_" + task.tileCol] !== undefined) {
				VCC.ViewPort.tileManager.tabTile[task.tileRow + "_" + task.tileCol].texturesManager.loadTextures(task.params);
			} else {
				this.isBusy = false;
			}
			break;
		case VCC.Enum.SCHEDULER_TASK.ST_LOAD_HIGHER_RES:
			this.isBusy = true;
			VCC.ViewPort.tileManager.tabTile[task.tileRow + "_" + task.tileCol].texturesManager.loadMipmaps(task.params);
			break;
		case VCC.Enum.SCHEDULER_TASK.ST_LOAD_OPENLAYER:
			try{
			this.isBusy = true;
			VCC.ViewPort.tileManager.wfsManager.getData(task.tileRow+"_"+task.tileCol, VCC.ViewPort.tileManager.tabTile[task.tileRow+"_"+task.tileCol].BBMin,VCC.ViewPort.tileManager.tabTile[task.tileRow+"_"+task.tileCol].BBMax, task.params)
			}catch(e){
				console.log( "exeption occured :" + e);
				this.onAbort();
			}
		break;
		default:
			console.error("error unknow task");
			return;
	}
	//console.log("launch task :");
	//console.log(task);
};

VCC.Scheduler.prototype.onTextureLoaded = function() {
	this.isBusy = false;
	//console.log("texture done");
};

VCC.Scheduler.prototype.onAbort = function() {
	this.isBusy = false;
	//console.log("Abort !");
};

VCC.Scheduler.prototype.onTaskDone = function() {
	this.isBusy = false;
	//console.log("task done");
};

/**
 * remove a task related to a tile from fifos and call the deleteTile function
 * @method removeTasks
 */
VCC.Scheduler.prototype.removeTasks = function() {
	var task;
	while (task = this.removeFifo.shift()) {
		var tileCoord = task[0];

		if (task[1] == "all" ){

			this.highPriorityFifo = this.removeTaskFromFifo(tileCoord, this.highPriorityFifo, task[1]);
			this.lowPriorityFifo = this.removeTaskFromFifo(tileCoord, this.lowPriorityFifo, task[1]);
			VCC.ViewPort.tileManager.deleteTile(tileCoord[0] + "_" + tileCoord[1], task[1]);
		}else{	
			this.highPriorityFifo = this.removeTaskFromFifo(tileCoord, this.highPriorityFifo, task[1]);
			this.lowPriorityFifo = this.removeTaskFromFifo(tileCoord, this.lowPriorityFifo, task[1]);
			VCC.ViewPort.tileManager.removeLayer(tileCoord[0] + "_" + tileCoord[1], task[1]);
		}
	}
};

/**
 * remove a task related to a tile from fifo
 * @method removeTasks
 * @param {Array} tileCoord Array containing row and col coordinate of the tile
 * @param {Array} fifo Fifo to where tasks have to be deleted
 * @return {Array} New Fifo without related tileCoord tasks
 * Attention retires les tâches de chargement de textures et il ne faudrait pas
 */
VCC.Scheduler.prototype.removeTaskFromFifo = function(tileCoord, fifo, layer) {
	var newFifo = [];
	for (idTask in fifo) {
		if (fifo[idTask].tileRow != tileCoord[0] || fifo[idTask].tileCol != tileCoord[1] || layer == fifo[idTask].params) {
			newFifo.push(fifo[idTask]);
		} else {
			if (fifo[idTask].taskCode == VCC.Enum.SCHEDULER_TASK.ST_LOAD_TEXTURE){
				newFifo.push(fifo[idTask]);
			}
		}
	}
	return newFifo;
};

/**
 * If scheduler is not busy, delete all tile in removeFifo and then load an object in either high or low priority fifo
 * @method update
 */
VCC.Scheduler.prototype.update = function() {
	if (!this.isBusy) {
		if (this.removeFifo.length != 0) {
			this.removeTasks();
		}
		/**download tiles */
		else if (this.highPriorityFifo.length != 0) {
			this.executeTask(this.highPriorityFifo.shift());
		} else if (this.lowPriorityFifo.length != 0) {
			this.executeTask(this.lowPriorityFifo.shift());
		}
		if(this.isFifoEmpty()){
			VCC.ViewPort.eventHandler.updateUi(false);
		}else{
			VCC.ViewPort.eventHandler.updateUi(true);
		}
	}
};
VCC.Scheduler.prototype.isFifoEmpty = function(){
	return (this.highPriorityFifo.length == 0 && this.lowPriorityFifo.length == 0);
}
