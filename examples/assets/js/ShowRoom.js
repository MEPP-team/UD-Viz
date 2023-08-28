// eslint-disable-next-line no-unused-vars
const ShowRoom = class {
  constructor(extent, frame3DPlanarOptions, version) {
    /** @type {udvizBrowser.itowns.Extent} */
    this.extent = extent; // ref it to add layers then

    /** @type {udvizBrowser.Frame3DPlanar} */
    this.frame3DPlanar = new udvizBrowser.Frame3DPlanar(
      extent,
      frame3DPlanarOptions
    );

    // right click open a menu to copy position
    this.addContextMenu();

    udvizBrowser.URLSetCameraMatrix(this.frame3DPlanar.camera);

    /** @type {udvizBrowser.itowns.Style} */
    this.c3DTilesStyle = new udvizBrowser.itowns.Style({
      fill: {
        color: (feature) => {
          return feature.userData.selectedColor
            ? feature.userData.selectedColor
            : 'white';
        },
      },
    });

    // add pick to frame3DPlanar
    const contextSelection = {
      feature: null,
      layer: null,
    };
    this.frame3DPlanar.domElement.onclick = (event) => {
      if (contextSelection.feature) {
        contextSelection.feature.userData.selectedColor = null;
        contextSelection.layer.updateStyle();
        contextSelection.feature = null;
        contextSelection.layer = null;
      }

      const intersects = this.frame3DPlanar.itownsView.pickObjectsAt(
        event,
        0,
        this.frame3DPlanar.itownsView
          .getLayers()
          .filter((el) => el.isC3DTilesLayer)
      );

      if (intersects.length) {
        const elementClicked =
          intersects[0].layer.getC3DTileFeatureFromIntersectsArray(intersects);
        if (elementClicked) {
          elementClicked.userData.selectedColor = 'blue';
          contextSelection.feature = elementClicked;
          contextSelection.layer = intersects[0].layer;
          contextSelection.layer.updateStyle();
        }
      }
      if (this.widgetC3DTiles)
        this.widgetC3DTiles.displayC3DTFeatureInfo(
          contextSelection.feature,
          contextSelection.layer
        );
      this.frame3DPlanar.itownsView.notifyChange(); // need a redraw of the view
    };

    /** @type {udvizBrowser.RequestService} */
    this.requestService = new udvizBrowser.RequestService();

    // HTML ELEMENT NEEDED TO BE REFERENCED

    // CHILD UI

    /** @type {HTMLElement} */
    this.menuSideBar = null;

    /** @type {HTMLElement} */
    this.logoContainer = null;

    // CHILD AUTHENTICATION FRAME

    /** @type {HTMLElement} */
    this.authenticationMenuLoggedIn = null;

    /** @type {HTMLElement} */
    this.authenticationMenuLoggedOut = null;

    /** @type {HTMLElement} */
    this.authenticationUserNameID = null;

    /** @type {HTMLElement} */
    this.authenticationButtonLogOut = null;

    /** @type {HTMLElement} */
    this.buttonLogIn = null;

    // WIDGET (not all reference are used but can be that way for now)

    /** @type {udvizBrowser.Widget.Server.AuthenticationView|null} */
    this.authenticationView = null;

    /** @type {udvizBrowser.Widget.Server.GeocodingView|null} */
    this.geocodingView = null;

    /** @type {udvizBrowser.Widget.Server.Document.Core|null} */
    this.documentCore = null;

    /** @type {udvizBrowser.Widget.Server.Document.GuidedTourController|null} */
    this.guidedTourController = null;

    /** @type {udvizBrowser.Widget.CameraPositioner|null} */
    this.cameraPositioner = null;

    /** @type {udvizBrowser.Widget.LayerChoice|null} */
    this.layerChoice = null;

    /** @type {udvizBrowser.Widget.SlideShow|null} */
    this.slideShow = null;

    /** @type {udvizBrowser.Widget.Server.SparqlQueryWindow|null} */
    this.sparqlQueryWindow = null;

    /** @type {udvizBrowser.Widget.C3DTiles|null} */
    this.widgetC3DTiles = null;

    /** @type {udvizBrowser.Widget.Bookmark|null} */
    this.widgetBookmark = null;

    // INTIALIZE
    this.initUI(version);
  }

  /**
   * Add a context menu to copy coord
   */
  addContextMenu() {
    const contextMenuDomElement = document.createElement('div');
    contextMenuDomElement.classList.add('context-menu');
    contextMenuDomElement.hidden = true;
    this.frame3DPlanar.domElementUI.appendChild(contextMenuDomElement);

    const downloadCoordButton = document.createElement('button');
    downloadCoordButton.innerText = 'Copy coord';
    contextMenuDomElement.appendChild(downloadCoordButton);

    // world coord in view.referenceCrs
    const worldPosition = new udvizBrowser.THREE.Vector3();

    downloadCoordButton.onclick = () => {
      udvizBrowser.downloadObjectAsJson(
        worldPosition,
        'showroom_coord_' + this.frame3DPlanar.itownsView.referenceCrs
      );
    };

    const forceNoneStatePlanarControls = () => {
      this.frame3DPlanar.itownsView.controls.state = -1; // TODO: ask itowns to expose state NONE of the PlanarControls
      this.frame3DPlanar.itownsView.controls.updateMouseCursorType();
    };

    const closeContextMenu = () => {
      if (!contextMenuDomElement.hidden) {
        contextMenuDomElement.hidden = true;
        this.frame3DPlanar.itownsView.controls.enabled = true;
        forceNoneStatePlanarControls();
        return true;
      }
      return false;
    };

    this.frame3DPlanar.domElement.addEventListener('click', closeContextMenu);

    this.frame3DPlanar.domElement.oncontextmenu = (event) => {
      if (closeContextMenu()) return;

      this.frame3DPlanar.itownsView.controls.enabled = false; // disable controls while context menu
      forceNoneStatePlanarControls();

      const mouse = new udvizBrowser.THREE.Vector2(
        event.clientX,
        event.clientY
      );

      this.frame3DPlanar.itownsView.getPickingPositionFromDepth(
        mouse,
        worldPosition
      );

      const onScreenCoord = worldPosition.clone();

      onScreenCoord.project(this.frame3DPlanar.camera);

      // compute position on screen
      const widthHalf = this.frame3DPlanar.domElementWebGL.clientWidth * 0.5,
        heightHalf = this.frame3DPlanar.domElementWebGL.clientHeight * 0.5;
      onScreenCoord.x = onScreenCoord.x * widthHalf + widthHalf;
      onScreenCoord.y = -(onScreenCoord.y * heightHalf) + heightHalf;

      contextMenuDomElement.style.left = onScreenCoord.x + 'px';
      contextMenuDomElement.style.top = onScreenCoord.y + 'px';

      contextMenuDomElement.hidden = false;
      console.debug(worldPosition);
    };
  }

  /**
   * Add layers of geo data
   *
   * @param {object} configs - different config
   * @todo describe all configs
   */
  addLayers(configs) {
    if (configs.$3DTiles) {
      configs.$3DTiles.forEach((layerConfig) => {
        udvizBrowser.itowns.View.prototype.addLayer.call(
          this.frame3DPlanar.itownsView,
          new udvizBrowser.itowns.C3DTilesLayer(
            layerConfig['id'],
            {
              style: this.c3DTilesStyle,
              name: layerConfig['id'],
              source: new udvizBrowser.itowns.C3DTilesSource({
                url: layerConfig['url'],
              }),
            },
            this.frame3DPlanar.itownsView
          )
        );
      });
    }
    if (configs.elevation) {
      const isTextureFormat =
        configs.elevation['format'] == 'image/jpeg' ||
        configs.elevation['format'] == 'image/png';
      this.frame3DPlanar.itownsView.addLayer(
        new udvizBrowser.itowns.ElevationLayer(
          configs.elevation['layer_name'],
          {
            useColorTextureElevation: isTextureFormat,
            colorTextureElevationMinZ: isTextureFormat
              ? configs.elevation['colorTextureElevationMinZ']
              : null,
            colorTextureElevationMaxZ: isTextureFormat
              ? configs.elevation['colorTextureElevationMaxZ']
              : null,
            source: new udvizBrowser.itowns.WMSSource({
              extent: this.extent,
              url: configs.elevation['url'],
              name: configs.elevation['name'],
              crs: this.extent.crs,
              heightMapWidth: 256,
              format: configs.elevation['format'],
            }),
          }
        )
      );
    }
    if (configs.baseMap) {
      this.frame3DPlanar.itownsView.addLayer(
        new udvizBrowser.itowns.ColorLayer(configs.baseMap['layer_name'], {
          updateStrategy: {
            type: udvizBrowser.itowns.STRATEGY_DICHOTOMY,
            options: {},
          },
          source: new udvizBrowser.itowns.WMSSource({
            extent: this.extent,
            name: configs.baseMap['name'],
            url: configs.baseMap['url'],
            version: configs.baseMap['version'],
            crs: this.extent.crs,
            format: configs.baseMap['format'],
          }),
          transparent: true,
        })
      );
    }
    if (configs.labels) {
      configs.labels.forEach((layerConfig) => {
        if (
          !layerConfig['id'] ||
          !layerConfig['url'] ||
          !layerConfig['sourceType']
        ) {
          console.warn(
            'Your "LabelLayer" field does not have either "url", "id" or "sourceType" properties. '
          );
          return;
        }

        let source = null;

        // Declare the data source for the LabelLayer
        if (layerConfig['sourceType'] == 'file') {
          source = new udvizBrowser.itowns.FileSource({
            url: layerConfig.url,
            crs: this.extent.crs,
            format: 'application/json',
          });
        } else if (layerConfig['sourceType'] == 'wfs') {
          source = new udvizBrowser.itowns.WFSSource({
            url: layerConfig.url,
            version: '2.0.0',
            typeName: layerConfig.name,
            crs: this.extent.crs,
            format: 'application/json',
          });
        } else {
          console.warn(
            'Unsupported LabelLayer sourceType ' + layerConfig['sourceType']
          );
          return;
        }

        const layerStyle = new udvizBrowser.itowns.Style(layerConfig.style);

        const zoom = { min: 0 };
        if (layerConfig.zoom) {
          if (layerConfig.zoom.min) zoom.min = layerConfig.zoom.min;
          if (layerConfig.zoom.max) zoom.max = layerConfig.zoom.max;
        }

        const labelLayer = new udvizBrowser.itowns.LabelLayer(layerConfig.id, {
          transparent: true,
          source: source,
          style: layerStyle,
          zoom: zoom,
        });
        this.frame3DPlanar.itownsView.addLayer(labelLayer);
      });
    }
    if (configs.geoJSON) {
      configs.geoJSON.forEach((layerConfig) => {
        this.frame3DPlanar.itownsView.addLayer(
          new udvizBrowser.itowns.ColorLayer(layerConfig.id, {
            name: layerConfig.id,
            transparent: true,
            source: new udvizBrowser.itowns.FileSource({
              url: layerConfig.url,
              crs: this.extent.crs,
              format: 'application/json',
            }),
            style: new udvizBrowser.itowns.Style(layerConfig.style),
          })
        );
      });
    }
  }

  /**
   * Add a logo in the logo container
   *
   * @param {string} pathLogoArray - path to your logo image
   */
  addLogos(pathLogoArray) {
    pathLogoArray.forEach((pathLogo) => {
      const logo = document.createElement('img');
      logo.classList.add('logo');
      logo.src = pathLogo;
      this.logoContainer.appendChild(logo);
    });
  }

  initUI(version) {
    // Menu Side bar
    this.menuSideBar = document.createElement('div');
    this.menuSideBar.classList.add('_sidebar_widget_menu_sidebar');
    this.frame3DPlanar.domElementUI.appendChild(this.menuSideBar, 3);
    {
      // title
      const titleNavBar = document.createElement('div');
      titleNavBar.classList.add('ud-viz-label');
      titleNavBar.innerHTML = 'UD-VIZ ' + version;
      this.menuSideBar.appendChild(titleNavBar);

      // hr
      const hrElement = document.createElement('hr');
      this.menuSideBar.appendChild(hrElement);
    }

    // Pan Menu Side bar
    this.panMenuSideBar = new PanMenuSideBar();
    this.frame3DPlanar.domElementUI.appendChild(this.panMenuSideBar.domElement);

    // Logo container
    this.logoContainer = document.createElement('div');
    this.logoContainer.setAttribute('id', 'logo-container');
    this.frame3DPlanar.domElementUI.appendChild(this.logoContainer);
  }

  addURLButton(pathIcon) {
    // url camera matrix button
    const urlCameraMatrixButton = document.createElement('img');
    urlCameraMatrixButton.src = pathIcon;
    urlCameraMatrixButton.title = 'Camera Position Url';
    this.menuSideBar.appendChild(urlCameraMatrixButton);

    urlCameraMatrixButton.onclick = () => {
      const url = new URL(window.location.origin + window.location.pathname);

      udvizBrowser.appendCameraMatrixToURL(url, this.frame3DPlanar.camera);

      // put it in clipboard
      navigator.clipboard.writeText(url);
      alert('Camera Position Url copied !');
    };
  }

  // ADD METHOD WIDGET

  addWidgetAuthentication(configServer, pathAuthenticationIcon) {
    const initAuthenticationFrame = () => {
      // Authentication Frame
      const authenticationFrame = document.createElement('div');
      authenticationFrame.setAttribute('id', '_sidebar_widget_profile');
      this.frame3DPlanar.domElementUI.appendChild(authenticationFrame);
      {
        // Authentication Menu Logged in
        this.authenticationMenuLoggedIn = document.createElement('div');
        this.authenticationMenuLoggedIn.setAttribute(
          'id',
          '_sidebar_widget_profile_menu_logged_in'
        );
        authenticationFrame.appendChild(this.authenticationMenuLoggedIn);
        {
          // User Name
          this.authenticationUserNameID = document.createElement('div');
          this.authenticationUserNameID.setAttribute(
            'id',
            '_sidebar_widget_profile_name'
          );
          this.authenticationMenuLoggedIn.appendChild(
            this.authenticationUserNameID
          );

          // Button log out
          this.authenticationButtonLogOut = document.createElement('button');
          this.authenticationButtonLogOut.classList.add('logInOut');
          this.authenticationButtonLogOut.innerHTML = 'Logout';
          this.authenticationButtonLogOut.setAttribute(
            'id',
            '_sidebar_widget_button_logout'
          );
          this.authenticationMenuLoggedIn.appendChild(
            this.authenticationButtonLogOut
          );
        }

        // Authentication Menu Logged out
        this.authenticationMenuLoggedOut = document.createElement('div');
        this.authenticationMenuLoggedOut.setAttribute(
          'id',
          '_sidebar_widget_profile_menu_logged_out'
        );
        authenticationFrame.appendChild(this.authenticationMenuLoggedOut);
        {
          // button log in
          this.buttonLogIn = document.createElement('img');
          this.buttonLogIn.setAttribute('id', '_sidebar_widget_button_login');
          this.buttonLogIn.classList.add('logInout');
          this.buttonLogIn.src = pathAuthenticationIcon;
          this.authenticationMenuLoggedOut.appendChild(this.buttonLogIn);
        }
      }
    };

    const updateAuthenticationFrame = () => {
      if (!this.authenticationView) return;

      const service = this.authenticationView.authenticationService;

      if (service.isUserLoggedIn()) {
        const user = service.getUser();
        this.authenticationMenuLoggedIn.hidden = false;
        this.authenticationMenuLoggedOut.hidden = true;
        this.authenticationUserNameID.innerHTML = `Logged in as <em>${user.firstname} ${user.lastname}</em>`;

        if (this.authenticationView.domElement.parentElement) {
          this.authenticationView.dispose();
        }
      } else {
        this.authenticationMenuLoggedIn.hidden = true;
        this.authenticationMenuLoggedOut.hidden = false;
      }
    };

    // intialize ui
    initAuthenticationFrame();

    // create widget view
    this.authenticationView = new udvizBrowser.Widget.Server.AuthenticationView(
      new udvizBrowser.Widget.Server.AuthenticationService(
        this.requestService,
        configServer
      )
    );

    // link button event
    this.buttonLogIn.onclick = () => {
      this.frame3DPlanar.domElementUI.appendChild(
        this.authenticationView.domElement
      );
    };

    this.authenticationButtonLogOut.onclick = () => {
      try {
        this.authenticationView.authenticationService.logout();
      } catch (e) {
        console.error(e);
      }
    };

    // listen for user state changes
    this.authenticationView.authenticationService.addObserver(
      updateAuthenticationFrame.bind(this)
    );
    updateAuthenticationFrame();
  }

  addWidgetGeocoding(configServer, pathIcon) {
    this.geocodingView = new udvizBrowser.Widget.Server.GeocodingView(
      new udvizBrowser.Widget.Server.GeocodingService(
        this.requestService,
        this.extent,
        configServer
      ),
      this.frame3DPlanar.itownsView
    );

    const sideBarButton = document.createElement('img');
    sideBarButton.src = pathIcon;
    this.menuSideBar.appendChild(sideBarButton);

    sideBarButton.onclick = () => {
      if (this.geocodingView.domElement.parentElement) {
        this.geocodingView.dispose();
        sideBarButton.classList.remove(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      } else {
        this.frame3DPlanar.domElementUI.appendChild(
          this.geocodingView.domElement
        );
        sideBarButton.classList.add(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      }
    };
  }

  addWidgetDocument(configServer, pathIcon) {
    const rootDocumentHtml = document.createElement('div');
    const parentHtmlFeature = document.createElement('div');

    // CORE
    this.documentCore = new udvizBrowser.Widget.Server.Document.Core(
      this.requestService,
      configServer
    );

    // VISUALIZER
    const visualizerView =
      new udvizBrowser.Widget.Server.Document.VisualizerView(
        this.frame3DPlanar.itownsView,
        this.documentCore.provider
      );

    const visualizeButton = document.createElement('button');
    visualizeButton.innerHTML = 'Visualize';
    visualizeButton.onclick = async () => {
      await visualizerView.startTravelToDisplayedDocument();
      this.frame3DPlanar.domElementUI.appendChild(visualizerView.domElement);
    };
    this.documentCore.view.inspectorWindow.domElement.appendChild(
      visualizeButton
    );

    // CONTRIBUTE

    const documentContribute =
      new udvizBrowser.Widget.Server.Document.Contribute(
        this.documentCore.provider,
        visualizerView,
        this.requestService,
        this.frame3DPlanar.itownsView,
        this.frame3DPlanar.itownsView.controls,
        configServer,
        this.frame3DPlanar.domElementUI
      );

    const updateButton = document.createElement('button');
    updateButton.innerHTML = 'Update';
    updateButton.onclick = async () => {
      await documentContribute.updateWindow.updateFromDisplayedDocument();
      udvizBrowser.clearChildren(parentHtmlFeature);
      parentHtmlFeature.appendChild(documentContribute.updateWindow.domElement);
    };
    this.documentCore.view.inspectorWindow.domElement.appendChild(updateButton);

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = 'Delete';
    deleteButton.onclick = async () => {
      if (
        !confirm(
          'You are going to delete the document. This operation ' +
            'is irreversible. Do you want to continue ?'
        )
      ) {
        return;
      }
      try {
        await documentContribute.contributeService.deleteDocument();
      } catch (e) {
        alert(e);
      }
    };
    this.documentCore.view.inspectorWindow.domElement.appendChild(deleteButton);

    const createDocumentButton = document.createElement('button');
    createDocumentButton.innerHTML = 'Create new document';
    createDocumentButton.onclick = () => {
      udvizBrowser.clearChildren(parentHtmlFeature);
      parentHtmlFeature.appendChild(
        documentContribute.creationWindow.domElement
      );
    };
    this.documentCore.view.navigatorWindow.documentListContainer.appendChild(
      createDocumentButton
    );

    // VALIDATION
    const documentValidation =
      new udvizBrowser.Widget.Server.Document.Validation(
        this.documentCore.provider,
        this.requestService,
        configServer,
        this.documentCore.view.inspectorWindow.domElement
      );

    this.documentCore.view.navigatorWindow.displayableFiltersContainer.appendChild(
      documentValidation.validationView.domElement
    );

    // COMMENT
    const documentComment = new udvizBrowser.Widget.Server.Document.Comment(
      this.documentCore.provider,
      this.requestService,
      configServer
    );

    const commentButton = document.createElement('button');
    commentButton.innerHTML = 'Comment';
    commentButton.onclick = async () => {
      udvizBrowser.clearChildren(parentHtmlFeature);
      await documentComment.commentsWindow.getComments();
      parentHtmlFeature.appendChild(documentComment.commentsWindow.domElement);
    };

    this.documentCore.view.inspectorWindow.domElement.appendChild(
      commentButton
    );

    // PLUG WITH SIDEBAR BUTTON
    const sideBarButton = document.createElement('img');
    sideBarButton.src = pathIcon;
    this.menuSideBar.appendChild(sideBarButton);

    sideBarButton.onclick = () => {
      if (rootDocumentHtml.parentElement) {
        this.panMenuSideBar.remove(rootDocumentHtml);
        this.documentCore.view.navigatorWindow.domElement.remove();
        this.documentCore.view.inspectorWindow.domElement.remove();

        sideBarButton.classList.remove(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      } else {
        // rebuild rootDocument
        udvizBrowser.clearChildren(rootDocumentHtml);
        udvizBrowser.clearChildren(parentHtmlFeature);
        rootDocumentHtml.appendChild(
          this.documentCore.view.navigatorWindow.domElement
        );
        rootDocumentHtml.appendChild(
          this.documentCore.view.inspectorWindow.domElement
        );
        rootDocumentHtml.appendChild(parentHtmlFeature);
        this.panMenuSideBar.add('Document', rootDocumentHtml);
        sideBarButton.classList.add(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      }
    };
  }

  addWidgetGuidedTour(configServer, pathIcon) {
    if (!this.documentCore) {
      console.warn('You should addWidgetDocument first');
      return;
    }

    this.guidedTourController =
      new udvizBrowser.Widget.Server.Document.GuidedTourController(
        this.documentCore,
        this.requestService,
        configServer
      );

    const sideBarButton = document.createElement('img');
    sideBarButton.src = pathIcon;
    this.menuSideBar.appendChild(sideBarButton);

    sideBarButton.onclick = () => {
      if (this.guidedTourController.guidedTour.domElement.parentElement) {
        this.panMenuSideBar.remove(
          this.guidedTourController.guidedTour.domElement
        );
        this.guidedTourController.guidedTour.domElement.remove();
        sideBarButton.classList.remove(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      } else {
        this.panMenuSideBar.add(
          'Guided Tour',
          this.guidedTourController.guidedTour.domElement
        );
        sideBarButton.classList.add(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      }
    };
  }

  addWidgetCameraPositioner(pathIcon) {
    this.cameraPositioner = new udvizBrowser.Widget.CameraPositioner(
      this.frame3DPlanar.itownsView
    );

    const sideBarButton = document.createElement('img');
    sideBarButton.src = pathIcon;
    this.menuSideBar.appendChild(sideBarButton);

    sideBarButton.onclick = () => {
      if (this.cameraPositioner.domElement.parentElement) {
        this.panMenuSideBar.remove(this.cameraPositioner.domElement);
        this.cameraPositioner.domElement.remove();
        sideBarButton.classList.remove(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      } else {
        this.panMenuSideBar.add(
          'Camera Positioner',
          this.cameraPositioner.domElement
        );
        sideBarButton.classList.add(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      }
    };
  }

  addWidgetLayerChoice(pathIcon) {
    this.layerChoice = new udvizBrowser.Widget.LayerChoice(
      this.frame3DPlanar.itownsView
    );

    const sideBarButton = document.createElement('img');
    sideBarButton.src = pathIcon;
    this.menuSideBar.appendChild(sideBarButton);

    sideBarButton.onclick = () => {
      if (this.layerChoice.domElement.parentElement) {
        this.panMenuSideBar.remove(this.layerChoice.domElement);
        this.layerChoice.domElement.remove();
        sideBarButton.classList.remove(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      } else {
        this.panMenuSideBar.add('Layer Choice', this.layerChoice.domElement);
        sideBarButton.classList.add(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      }
    };
  }

  addWidgetSlideShow(configSlideShow, pathIcon) {
    this.slideShow = new udvizBrowser.Widget.SlideShow(
      this.frame3DPlanar.itownsView,
      configSlideShow,
      this.extent
    );

    const sideBarButton = document.createElement('img');
    sideBarButton.src = pathIcon;
    this.menuSideBar.appendChild(sideBarButton);

    sideBarButton.onclick = () => {
      if (this.slideShow.domElement.parentElement) {
        this.panMenuSideBar.remove(this.slideShow.domElement);
        this.slideShow.dispose();
        sideBarButton.classList.remove(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      } else {
        this.panMenuSideBar.add('Slide Show', this.slideShow.domElement);
        sideBarButton.classList.add(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
        this.slideShow.addListeners();
        this.frame3DPlanar.scene.add(this.slideShow.plane);
        this.frame3DPlanar.itownsView.notifyChange();
      }
    };
  }

  addWidgetSparql(configServer, configWidget, pathIcon) {
    this.sparqlQueryWindow = new udvizBrowser.Widget.Server.SparqlQueryWindow(
      new udvizBrowser.Widget.Server.SparqlEndpointResponseProvider(
        configServer
      ),
      this.frame3DPlanar.itownsView,
      configWidget
    );

    const sideBarButton = document.createElement('img');
    sideBarButton.src = pathIcon;
    this.menuSideBar.appendChild(sideBarButton);

    sideBarButton.onclick = () => {
      if (this.sparqlQueryWindow.domElement.parentElement) {
        this.panMenuSideBar.remove(this.sparqlQueryWindow.domElement);
        this.sparqlQueryWindow.domElement.remove();
        sideBarButton.classList.remove(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      } else {
        this.panMenuSideBar.add('Sparql', this.sparqlQueryWindow.domElement);
        sideBarButton.classList.add(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      }
    };
  }

  addCustomHtml(pathIcon, customHtml, label) {
    const sideBarButton = document.createElement('img');
    sideBarButton.src = pathIcon;
    this.menuSideBar.appendChild(sideBarButton);
    sideBarButton.onclick = () => {
      if (customHtml.parentElement) {
        this.panMenuSideBar.remove(customHtml);
        sideBarButton.classList.remove(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      } else {
        this.panMenuSideBar.add(label, customHtml);

        sideBarButton.classList.add(
          '_sidebar_widget_menu_sidebar_img_selected'
        );
      }
    };
  }

  addDragAndDropAvatar(pathIcon, assetManager, idRenderDataAvatar) {
    console.warn(
      'Drag and drop avatar is still experimental, since it can conflict with camera movement of other widget, notice also that itowns.MAIN_LOOP is quite hacked see SinglePlanarProcess start method'
    );
    const domElement = document.createElement('div');

    // create a single planar process using drag and drop game template
    const singleProcessPlanar =
      new udvizBrowser.Game.External.SinglePlanarProcess(
        new udvizBrowser.Shared.Game.Object3D({
          static: true,
          components: {
            GameScript: {
              idScripts: [
                udvizBrowser.Shared.Game.ScriptTemplate.DragAndDropAvatar
                  .ID_SCRIPT,
                udvizBrowser.Shared.Game.ScriptTemplate.NativeCommandManager
                  .ID_SCRIPT,
              ],
              variables: {
                idRenderDataAvatar: idRenderDataAvatar,
                defaultSpeedRotate: 0.0005,
              },
            },
            ExternalScript: {
              idScripts: [
                udvizBrowser.Game.External.ScriptTemplate.DragAndDropAvatar
                  .ID_SCRIPT,
                udvizBrowser.Game.External.ScriptTemplate.CameraManager
                  .ID_SCRIPT,
              ],
            },
          },
        }),
        this.frame3DPlanar,
        assetManager,
        new udvizBrowser.InputManager(),
        {
          gameScriptClass: [
            udvizBrowser.Shared.Game.ScriptTemplate.DragAndDropAvatar,
            udvizBrowser.Shared.Game.ScriptTemplate.NativeCommandManager,
          ],
          externalGameScriptClass: [
            udvizBrowser.Game.External.ScriptTemplate.DragAndDropAvatar,
            udvizBrowser.Game.External.ScriptTemplate.CameraManager,
          ],
          gameOrigin: {
            x: this.extent.center().x,
            y: this.extent.center().y,
            z: 0,
          },
        }
      );

    // tell to the drag and drop external script where to add its html
    singleProcessPlanar.externalGameContext.userData.dragAndDropAvatarDomElement =
      domElement;

    singleProcessPlanar.start();

    this.addCustomHtml(pathIcon, domElement, 'Drag and drop avatar');
  }

  addWidgetC3DTiles(pathIcon) {
    this.widgetC3DTiles = new udvizBrowser.Widget.C3DTiles(
      this.frame3DPlanar.itownsView,
      {
        overrideStyle: this.c3DTilesStyle,
        parentElement: this.frame3DPlanar.domElementUI, // some hack see => https://github.com/iTowns/itowns/discussions/2098
      }
    );

    this.widgetC3DTiles.domElement.remove();

    this.addCustomHtml(pathIcon, this.widgetC3DTiles.domElement, '3DTiles');
  }

  addWidgetBookmark(pathIcon) {
    this.widgetBookmark = new udvizBrowser.Widget.Bookmark(
      this.frame3DPlanar.itownsView,
      {
        parentElement: this.frame3DPlanar.domElementUI, // some hack see => https://github.com/iTowns/itowns/discussions/2098
      }
    );

    this.widgetBookmark.domElement.remove();

    this.addCustomHtml(pathIcon, this.widgetBookmark.domElement, 'Bookmark');
  }
};

class PanMenuSideBar {
  constructor() {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('_sidebar_widget_pan_menu_sidebar');

    this.domElement.onclick = (event) => event.stopImmediatePropagation();

    this.containers = [];
  }

  add(label, el) {
    const newContainer = document.createElement('div');
    newContainer.innerHTML = label;
    newContainer.classList.add('_sidebar_widget_pan_menu_sidebar_container');
    newContainer.appendChild(el);
    this.containers.push(newContainer);
    this.domElement.appendChild(newContainer);
    this.fold(false);
  }

  remove(el) {
    for (let index = 0; index < this.containers.length; index++) {
      const container = this.containers[index];
      if (udvizBrowser.checkParentChild(el, container)) {
        container.remove();
        el.remove();
        this.containers.splice(index, 1);
        break;
      }
    }

    this.foldIfEmpty();
  }

  foldIfEmpty() {
    if (!this.domElement.firstChild) this.fold(true);
  }

  fold(value) {
    if (value) {
      this.domElement.style.transform = 'translate(-100%,0%)';
    } else {
      this.domElement.style.transform = 'translate(0%,0%)';
    }
  }
}
