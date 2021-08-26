import { ModuleView } from '../../../Components/ModuleView/ModuleView';
import { SparqlEndpointResponseProvider } from '../service/SparqlEndpointResponseProvider';
import { SparqlEndpointService } from '../service/SparqlEndpointService';
import { SparqlQueryWindow } from './SparqlQueryWindow';

  /**
   * The SPARQL ModuleView class which manages the SPARQL query window.
   */
export class SparqlModuleView extends ModuleView {
  /**
   * Creates a new SparqlModuleView.
   *
   * @param {object} config The configuration of UD-Viz.
   * @param {object} config.sparqlModule The sparqlModule configuration.
   * @param {string} config.sparqlModule.url The SPARQL endpoint url.
   * @param {SparqlEndpointService} serviceContains SPARQL endpoint information.
   */
  constructor(service, provider) {
    super();

    /**
     * The SPARQL Endpoint Service
     * 
     * @type {SparqlEndpointService}
     */
     this.service = service;

    /**
     * The SPARQL Endpoint Response Provider
     * 
     * @type {SparqlEndpointResponseProvider}
     */
    this.provider = provider;
    /**
     * Contains a SparqlQueryWindow for capturing user input and displaying
     * query results.
     *
     * @type {SparqlQueryWindow}
     */
    this.window = new SparqlQueryWindow(this.provider);
  }

  /**
   * Display the view
   */
  enableView() {
    this.window.appendTo(this.parentElement);
  }

  /**
   *  Close the view
   */
  disableView() {
    this.window.dispose();
  }
}
