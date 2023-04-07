import { $3DTemporalExtension } from './Model/3DTemporalExtension.js';
import { $3DTemporalBatchTable } from './Model/3DTemporalBatchTable';
import { $3DTemporalBoundingVolume } from './Model/3DTemporalBoundingVolume';
import { $3DTemporalTileset } from './Model/3DTemporalTileset';
import * as itownsWidget from 'itowns/widgets';
import * as itowns from 'itowns';

import { setup3DTilesLayer } from '../../ItownsUtil';

/**
 * @typedef {object} TemporalOptions - options for initializing the temporal module.
 * @property {number} currentTime - Current year
 * @property {string} view - window type {@link EnumWindows}
 * @property {number} minTime - Minimum year
 * @property {number} maxTime - Maximum year
 * @property {number} timeStep - Step of the temporal slider
 * @property {Function} getAsynchronousData - DON'T USE should be removed, only use like a variable
 */

/**
 * Entrypoint of the temporal module (that can be instanciated in the demos)
 */
export class TemporalModule {
  /**
   * Constructs a new temporal module.
   *
   * @param {itowns.PlanarView} itownsView - view
   * @param {TemporalOptions} temporalOptions - options for initializing the temporal module
   */
  constructor(itownsView, temporalOptions) {
    this.model = new $3DTemporalExtension();

    // this.provider = new TemporalProvider(
    //   this.model,
    //   itownsView,
    //   temporalOptions.currentTime
    // );

    // this.view = new TemporalView(this.provider, temporalOptions);
    this.view = new TemporalView(itownsView, temporalOptions);
  }

  static create3DTilesTemporalExtension(extensionsConfig) {
    const extensions = new itowns.C3DTExtensions();
    for (let i = 0; i < extensionsConfig.length; i++) {
      if (extensionsConfig[i] === '3DTILES_temporal') {
        extensions.registerExtension('3DTILES_temporal', {
          [itowns.C3DTilesTypes.batchtable]: $3DTemporalBatchTable,
          [itowns.C3DTilesTypes.boundingVolume]: $3DTemporalBoundingVolume,
          [itowns.C3DTilesTypes.tileset]: $3DTemporalTileset,
        });
      } else if (extensionsConfig[i] === '3DTILES_batch_table_hierarchy') {
        extensions.registerExtension('3DTILES_batch_table_hierarchy', {
          [itowns.C3DTilesTypes.batchtable]:
            itowns.C3DTBatchTableHierarchyExtension,
        });
      } else {
        console.warn(
          'The 3D Tiles extension ' +
            extensionsConfig[i] +
            ' specified in 3D_tiles_layers is not supported ' +
            'by @ud-viz/browser yet. Only 3DTILES_temporal and ' +
            '3DTILES_batch_table_hierarchy are supported.'
        );
      }
    }

    return extensions;
  }

  static add3DTilesTemporalFromConfig(config, itownsView) {
    // Positional arguments verification
    if (!config) {
      console.warn('no 3DTilesLayers config');
      return null;
    }

    for (const layer of config) {
      const extensions = this.create3DTilesTemporalExtension(
        layer['extensions']
      );
      itowns.View.prototype.addLayer.call(
        itownsView,
        setup3DTilesLayer(layer, itownsView, extensions)
      );
    }
  }
}

const DEFAULT_OPTIONS = {
  position: 'bottom-left',
  width: '400px',
};

class TemporalView extends itownsWidget.Widget {
  constructor(itownsView, options) {
    super(itownsView, options, DEFAULT_OPTIONS);

    // create select of the C3DTilesLayers
    const selectC3DTilesLayer = document.createElement('select');
    this.domElement.appendChild(selectC3DTilesLayer);

    /** @type {Map<HTMLElement,HTMLElement>} */
    const selectOptionLayerContent = new Map();

    const updateSelectedLayer = () => {
      for (const [sO, lC] of selectOptionLayerContent) {
        lC.hidden = sO !== selectC3DTilesLayer.selectedOptions[0];
      }
    };
    selectC3DTilesLayer.onchange = updateSelectedLayer;

    itownsView
      .getLayers()
      .filter((el) => el.isC3DTilesLayer === true)
      .forEach((c3DTilesLayer) => {
        const selectC3DTilesLayerOption = document.createElement('option');
        selectC3DTilesLayerOption.innerText = c3DTilesLayer.name;
        selectC3DTilesLayer.add(selectC3DTilesLayerOption);

        const layerContent = document.createElement('div');
        this.domElement.appendChild(layerContent);

        // link select option to layer content
        selectOptionLayerContent.set(selectC3DTilesLayerOption, layerContent);

        // wait for batch elements to load
        c3DTilesLayer.addEventListener(
          itowns.C3DTilesLayer.EVENT_TILE_CONTENT_LOADED,
          () => {
            // reset
            while (layerContent.firstChild) {
              layerContent.firstChild.remove();
            }

            const possibleDates = [];

            // map of transaction style
            const transactionType2ColorOpacity = {
              noTransaction: {
                color: 'white',
                opacity: 1,
              },
              invisible: {
                color: 'blue',
                opacity: 0,
              },
              debug: {
                color: 'brown',
                opacity: 0.2,
              },
              creation: {
                color: 'green',
                opacity: 0.6,
              },
              demolition: {
                color: 'red',
                opacity: 0.6,
              },
              modification: {
                color: 'yellow',
                opacity: 0.6,
              },
            };
            /** @type {Map<string,object>} */
            const featureDateID2ColorOpacity = new Map();

            c3DTilesLayer.tileset.extensions[
              '3DTILES_temporal'
            ].transactions.forEach((transaction) => {
              // add possibleDate
              const transactionDuration =
                transaction.endDate - transaction.startDate;

              const firstHalfDate =
                transaction.startDate + transactionDuration / 3;
              const secondHalfDate =
                transaction.endDate - transactionDuration / 3;
              if (!possibleDates.includes(firstHalfDate))
                possibleDates.push(firstHalfDate);
              if (!possibleDates.includes(secondHalfDate))
                possibleDates.push(secondHalfDate);
              if (!possibleDates.includes(transaction.startDate))
                possibleDates.push(transaction.startDate);
              if (!possibleDates.includes(transaction.endDate))
                possibleDates.push(transaction.endDate);

              transaction.source.forEach((fId) => {
                if (transaction.type == 'modification') {
                  featureDateID2ColorOpacity.set(
                    fId + firstHalfDate,
                    transactionType2ColorOpacity.modification
                  );
                  featureDateID2ColorOpacity.set(
                    fId + secondHalfDate,
                    transactionType2ColorOpacity.invisible
                  );
                } else {
                  // all other transaction
                  featureDateID2ColorOpacity.set(
                    fId + firstHalfDate,
                    transactionType2ColorOpacity.noTransaction
                  );
                  featureDateID2ColorOpacity.set(
                    fId + secondHalfDate,
                    transactionType2ColorOpacity.noTransaction
                  );
                }
              });

              transaction.destination.forEach((fId) => {
                if (transaction.type == 'modification') {
                  featureDateID2ColorOpacity.set(
                    fId + firstHalfDate,
                    transactionType2ColorOpacity.invisible
                  );
                  featureDateID2ColorOpacity.set(
                    fId + secondHalfDate,
                    transactionType2ColorOpacity.modification
                  );
                } else {
                  // all other transaction
                  featureDateID2ColorOpacity.set(
                    fId + firstHalfDate,
                    transactionType2ColorOpacity.noTransaction
                  );
                  featureDateID2ColorOpacity.set(
                    fId + secondHalfDate,
                    transactionType2ColorOpacity.noTransaction
                  );
                }
              });
            });

            // handle demolition/creation which are not in batchTable/extension
            possibleDates.sort((a, b) => a - b);
            c3DTilesLayer.batchElementsArray().forEach((bE) => {
              const temporalExtension = bE.info.extensions['3DTILES_temporal'];

              for (let index = 0; index < possibleDates.length - 1; index++) {
                const date = possibleDates[index];
                const nextDate = possibleDates[index + 1];

                if (temporalExtension.endDate == date) {
                  // if no transaction next index should demolition (no modification)
                  const featureDateID = temporalExtension.featureId + nextDate;
                  if (!featureDateID2ColorOpacity.has(featureDateID)) {
                    featureDateID2ColorOpacity.set(
                      featureDateID,
                      transactionType2ColorOpacity.demolition
                    );
                  }
                }

                if (temporalExtension.startDate == nextDate) {
                  // if no transaction previous index should creation (no modification)
                  const featureDateID = temporalExtension.featureId + date;
                  if (!featureDateID2ColorOpacity.has(featureDateID)) {
                    featureDateID2ColorOpacity.set(
                      featureDateID,
                      transactionType2ColorOpacity.creation
                    );
                  }
                }
              }
            });

            // create ui
            const selectDates = document.createElement('select');
            layerContent.appendChild(selectDates);
            possibleDates.forEach((year) => {
              const optionDate = document.createElement('option');
              optionDate.value = year;
              optionDate.innerText = year;
              selectDates.add(optionDate);
            });

            const computeColorOpacity = (batchElement) => {
              const dateSelected = selectDates.selectedOptions[0].value;
              const temporalExtension =
                batchElement.info.extensions['3DTILES_temporal'];

              if (
                temporalExtension.startDate <= dateSelected &&
                temporalExtension.endDate >= dateSelected
              ) {
                // no transaction
                return transactionType2ColorOpacity.noTransaction;
              }
              // check if color opacity associated to featureDateID
              const featureDateID = temporalExtension.featureId + dateSelected;
              if (featureDateID2ColorOpacity.has(featureDateID)) {
                return featureDateID2ColorOpacity.get(featureDateID);
              }

              return transactionType2ColorOpacity.invisible;
            };

            c3DTilesLayer.style = new itowns.Style({
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
            itownsView.notifyChange();

            selectDates.onchange = () => {
              c3DTilesLayer.notifyStyleChange();
              itownsView.notifyChange();
            };
          }
        );
      });

    updateSelectedLayer();
  }
}
