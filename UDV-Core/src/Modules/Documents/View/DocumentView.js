import { ModuleView } from "../../../Utils/ModuleView/ModuleView";
import { DocumentProvider } from "../ViewModel/DocumentProvider";
import { DocumentSearchWindow } from "./DocumentSearchWindow";
import { Document } from "../Model/Document";
import { DocumentBrowserWindow } from "./DocumentBrowserWindow";
import { Window } from "../../../Utils/GUI/js/Window";
import { AbstractDocumentWindow } from "./AbstractDocumentWindow";

/**
 * The entry point of the document view. It holds the two main windows, browser
 * and search.
 */
export class DocumentView extends ModuleView {
  /**
   * Creates a document view.
   * 
   * @param {DocumentProvider} provider The document provider.
   */
  constructor(provider) {
    super();

    /**
     * The document provider.
     * 
     * @type {DocumentProvider}
     */
    this.provider = provider;

    /**
     * The search window.
     * 
     * @type {DocumentSearchWindow}
     */
    this.searchWindow = new DocumentSearchWindow();

    /**
     * The browser window.
     * 
     * @type {DocumentBrowserWindow}
     */
    this.browserWindow = new DocumentBrowserWindow();

    /**
     * The different windows of the view.
     * 
     * @type {Array<AbstractDocumentWindow>}
     */
    this.windows = []

    /**
     * The windows that have been temporarily hidden.
     * 
     * @type {Array<AbstractDocumentWindow>}
     */
    this.hiddenWindows = [];

    this.addDocumentWindow(this.searchWindow);
    this.addDocumentWindow(this.browserWindow);

    this.searchWindow.addEventListener(Window.EVENT_DISABLED, () => {
      this.disable();
    });
    this.browserWindow.addEventListener(Window.EVENT_DISABLED, () => {
      this.disable();
    });
  }

  /**
   * Adds a new window to display information about documents. The document
   * provider is passed as parameter in this function.
   * 
   * @param {AbstractDocumentWindow} newWindow The window to add.
   */
  addDocumentWindow(newWindow) {
    if (! (newWindow instanceof AbstractDocumentWindow)) {
      throw 'Only instances of AbstractDocumentWindow can be added to the ' +
        'document view';
    }

    this.windows.push(newWindow);
    newWindow.setupDocumentWindow(this, this.provider);
  }

  /**
   * Request to show a specific document window.
   * 
   * @param {AbstractDocumentWindow} windowToDisplay The window to show.
   * @param {boolean} [hideOtherWindows] Set to `true` to hide other document
   * windows.
   */
  requestWindowDisplay(windowToDisplay, hideOtherWindows = false) {
    let found = this.windows
      .findIndex(w => w.windowId === windowToDisplay.windowId) >= 0;
    if (!found) {
      throw 'Window must be registered first';
    }

    if (hideOtherWindows) {
      for (let window of this.windows) {
        if (window.isVisible) {
          this.hiddenWindows.push(window);
          window.hide();
        }
      }

      let listener = () => {
        console.log("mylistener");
        windowToDisplay.removeEventListener(listener);
        for (let window of this.hiddenWindows) {
          window.show();
        }
        this.hiddenWindows = [];
      };

      windowToDisplay.addEventListener(Window.EVENT_DISABLED, listener);
    }

    windowToDisplay.show();
  }

  /////////////////
  ///// MODULE VIEW

  enableView() {
    for (let window of this.windows) {
      window.appendTo(this.parentElement);
    }
    this.provider.refreshDocumentList();
  }

  disableView() {
    this.hiddenWindows = [];
    for (let window of this.windows) {
      window.dispose();
    }
  }
}