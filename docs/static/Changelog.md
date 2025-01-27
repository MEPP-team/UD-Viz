# v4.6.0
## @ud-viz/widget_legonizer
- Improved voxel view with the addition of the correct number of lego plates (voxel highlighted in white).
- Slight optimisation of voxel creation in the view.
- Change the ratio parameter to scale to clarify this parameter.
- Maximum lego height parameter added to the UI.
- Removal of data selection by cityObject. Selecting an area to voxelise has become simpler.
- Add listeners to the xLegoPlates and yLegoPlates parameters that update the selection zone

# 4.5.1

## @ud-viz 

  - Examples: (itowns_3d_tiles_pointcoud) replace source['url'] by source

## @ud-viz/visualizer

- New package which is a refacto of point_cloud_visualizer
- Updates:
  - `@ud-viz/point_cloud_visualizer` become `@ud-viz/visualizer`
  - Update Readme
  - Refacto -> split packages in few files by features


# 4.5.0

## @ud-viz

- Add a new demo (versioning widget) to demo mosaic

## @ud-viz/widget_versioning

- Created widget_versioning

## @ud-viz/widget_sparql

- Improved customisation of the SPARQL endpoint response provider

# 4.4.0

## @ud-viz

- Add a new demo (industrial morphology) to demo mosaic
- Fix CI badges
- Add a `name` field in layers config files
- Bump webpack from 5.88.2 to 5.94.0

## @ud-vie/extensions_3d_tiles_temporal

- Fix STParabola to insure curve points indexes are never out of bounds

## @ud-viz/widget_guided_tour

- Allow steps with no layer to hide

## @ud-viz/widget_sparql

- Add dropdown menu for nodes functions
- Add queries for retrieving nodes descendants
- Add clusterisation by neighbors
- Add clusterisation by type

# 4.3.0

## @ud-viz
- Doc: Add Readme mardown files for all packages.

## @ud-viz/utils_browser

- New function `createSpriteFromString`

## @ud-viz/extensions_3d_tiles_temporal

- New method to visualise the evolution of the city. We integrate all the versions simultaneously in the city to allow a better understanding of the evolution.
- We implement our method through 4 timelines shapes: Vector, Helix, Circle, Parabola
- In addition, we implement two ways to position the versions accross the timeline:Sequential, Chronological.
- UI to select display mode in example

# 4.2.0

## @ud-viz/widget_3d_tiles
  - The integrated layer manager that was previously mandatory is now 
    optional. This allows the simultaneous usage of @ud-viz/widget_3d_tiles
    and @ud-viz/wwidget_layer_choice without the UI redundancy/repetition
    of existing layers listings. 

## @ud-viz/widget_layer_choice
  - Each layer description now has a remove button
  - overflow of ui

## @ud-viz/showroom
  - css for the about and help buttons is now provided
  - extralines now deleted
  - html element now have added tiltes
  - about and help button now removed from the sidebar. Instead tiny buttons
    are created at the bottom left of the screen
  - the added code tiny button redirects to .html code

## ci
  - Fix of the always failing labels config test (failure came from a change
   in the WFS API as provided by IGN). The fix consists in skipping the 
   triggered errors within the functional test when the request or the 
   response are not related to localhost.

# 4.1.0

## @ud-viz
    - Created Documentation Github Action
    - Generated documentation with Github Actions
    - Improved the documentation

## @ud-viz/legonizer
    - Created the package and its widget

## @ud-viz/game_shared
    - update(NativeCommandManager.js): checkMaxAltitude and checkMinAltitude now use worldposition of object3D
    - update(ControllerNativeCommandManager.js):stop using mode.type in controls function
    - update(NativeCommandManager):add max and min altitude when move and move down
    - update(ControllerNativeCommandManager):add new mode with up and down

## @ud-viz/widget_layer_choice
    - feat(LayerChoice):Add focus button in layerchoice widget

# v4.0.3

## @ud-viz
    - autoMermaid.js generate architecture.md for each packages
    - reload is call on the backend side only when NODE_ENV=development
    - Readme.md updated
    - fix(examples): change htmlElement to set onclick function
    - create(examples): game_editor
    - remove bundle while npm run local-ci to force the build
    - doc(examples) game_editor example doc + addMarkdown.js to add in a generic way .md


## @ud-viz/game_browser_template
    - Readme.md updated
    - remove addNativeCommands/removeNativeCommands
    - ControllerNativeCommandManager script

## @ud-viz/game_shared
    - Readme.md updated
    - opti(game_shared) avoid new operation in Collider
    - feat(game) ScriptBase overwrite with DEFAULT_VARIABLES
    - fix(Collider) rotation + right order points + small coord referential
    - fix(@ud-viz/game_shared) removal in state add

## @ud-viz/game_shared_template
    - Readme.md updated
    - NativeCommandManager consider withMap option

## @ud-viz/game_browser
    - Readme.md updated
    - Context do not modify state received
    - feat(game) ScriptBase overwrite with DEFAULT_VARIABLES

## @ud-viz/utils_shared
    - polygon2DArea

## @ud-viz/utils_node
    - fix(automermaid):remove double import
    - fix(automermaid):use process.cwd() better id

## @ud-viz/extensions_3d_tiles_temporal
    - Readme.md updated

## @ud-viz/frame3d
    - Readme.md updated
    - feat(frame3d) renderCss while render 3d

## @ud-viz/game_node
    - Readme.md updated

## @ud-viz/game_node_template
    - Readme.md updated

## @ud-viz/point_cloud_visualizer
    - clipping plane instead of near and far camera

## @ud-viz/game_editor
    - double side on shape meshes
    - "f" focus selected game object 3d
    - feat(game_editor) point shape have a constant size on screen
    - feat(game_editor) add/remove component
    - feat(game_editor) game object 3d can be move in hierarchy
    - feat(game_editor) DebugCollision
    - feat(@ud-viz/game_editor) userdata can be edited
    - script input => object input

## @ud-viz/utils_browser
    - feat(RequestAnimationFrameProcess) multi requester


# v4.0.2

## @ud-viz

  - npm cmd webpack-bundle-analyzer 
  - script setPackageVersion.js
  - update to itowns 2.41.1-next.9


## @ud-viz/game_shared

    - compute bandwidth
    - idScritp:string => scriptParam:{id:string, priority:number}
    - applyCommandCallback API
    - update(ColliderComp): add SHAPE_TYPE

## @ud-viz/game_browser_template

    - optimization of the camera manager obstacle computation

## @ud-viz/utils_shared

    - computeFilename
    - throttle

## @ud-viz/game_editor

    - creation of the package


# v4.0.1

## @ud-viz
    - Examples:
      - point_cloud_visualizer.html
      - game_dom_element_3d_cube.html
      - widget_guided_tour.html
      - assets/js/libs/maptastic.js
      - maptastic.html
      - use 2018 buildings
    - Remove useless innerHTML
    - Update ReleasePublish.md 

## @ud-viz/point_cloud_visualizer
    - Creation of the package

## @ud-viz/widget_layer_choice
    - Complete refacto
    - Can order ColorLayer
    - LocalStorage ui element

## @ud-viz/utils_shared
    - round
    - vector3ToLabel
    - insert

## @ud-viz/utils_browser
    - createLocalStorageNumberInput
    - createLocalStorageSlider
    - createLocalStorageCheckbox
    - createLocalStorageDetails

## @ud-viz/utils_node
    - fix(test):splice first '/' of req.url, statusCode

## @ud-viz/game_node_template
    - DomElement3DCubeManager script

## @ud-viz/game_browser_template
    - DomElement3DCube script

## @ud-viz/widget_guided_tour
    - Creation of the package

# v4.0.0

## @ud-viz

    - Refact(ud-viz)! split into multiples packages
    - Add loading screen in examples
    - Fix show room
    - Add avatar jitsi game example
    - Doc:
        - fix doc
        - update doc

# v3.2.0

## @ud-viz

    - Fix socket.io dependencies
    - Update with node18
    - Prettier harmonization
    - Improve `Readme.md`
    - Examples:
      - Showroom download coordinate on right click
      - Add workspace widget example
    - Doc:
      - bin scripts documentation
      - nvm doc
      - fix comments prePublish script
    - CI:
      - Add test of the `RequestAnimationFrame` 

## @ud-viz/shared
    
    - Remove `EventSender` class to use `THREE.EventDispatcher` instead 

## @ud-viz/node

## @ud-viz/browser

    - Widgets view reference their dom element as attribute
    - C3DTiles widget display bounding box of the C3DTFeature selected
    - Add Workspace module
    - Refacto of the SPARQL module
    - Expose `RequestAnimationFrame` in API
    - Fix bug Frame3DPlanar render labels
    - THREEUtil encoding => colorSpace
    - Update itowns 2.40.0

# v3.1.1

## @ud-viz
    - NPM :
        - Remove `^` in all package.json
    - Examples:
        - 2D Visualisation Mode
        - SidebarWidget renamed as Showroom and moved in Examples
        - 3DTiles loading feedback
        - Bookmark widget
        - Change GrandLyon basemaps and elevation
        - Remove unused 'color' attribute from 3DTiles config
        - Projections are now defined in a config file
        - New C3DTilesEditor example
    - Doc
        - Camera
        - Fix links
        - Add Contributing.md
        - Update Contributors.md
        - Add Architecture.md
        - Packages description
        - Use Showdown package to add mermaid in online doc
    - CI
        - Throw only the client errors
        - Change Node version to 18 and npm version to 9

## @ud-viz/shared

  - NativeCommandManager: possibility to customize speed
  - Context: add IS_SCRIPTBASE static in ScriptBase class

## @ud-viz/node

  - JS Script to generate mermaid diagrams in markdown from JS projects

## @ud-viz/browser

  - update to iTowns 2.39.1-next.25
  - Remove addLayer methods (now in examples)
  - Frame3D: change default maxSubdivisionLevel from 3 to 5
  - Frame3D: remove 'size" attribute
  - Fix AudioController: spatialized sounds decompose feature
  - LocalStorage: vector3 tracking
  - Context: add IS_SCRIPTBASE static in ScriptBase class
  - Remove JQuery
  - Use domElement instead of rootHtml
  - `URLUtil`
  - Game: commands are applied at step
  - FileUtil is no longer exposed in the API

# v3.1.0

## @ud-viz:

- Docs:
  - Mermaid is interpreted on jsdoc generation
  - Simple game tutorial
  - Camera intialization tutorial
  - How to import bundle
- CI:
  - validate docs generation
  - validate .md links (remark-cli + remark-validate-links)
- Examples:
  - `ShowRoom`: url can encoded camera pov + loading screen
  - 3DTiles wireframe
  - 3DTiles pointCloud
  - FitExtent
  - PlanarControls widget
  - 3DTiles widget
  - MultiPlayer note game
  - 3DTiles style
  - Authentication
  - Guided tour
  - Window
- Architecture:
  - dev worflow improve with auto-reload (reload)
  - dynamic html (string-replace-middleware)
  - test folder created
  - examples are no more in @ud-viz/browser
  - docs folder is currently cleaned (still in progression)
  - some clean

## @ud-viz/shared

- Add Game script template

## @ud-viz/node:

- Add Game script template
- Game `SocketService` (socket.io)

## @ud-viz/browser:

- Widget `3DTiles`
- Widget `PlanarControls`
- `LocalStorageUtil`
- `InputManager` can be no insensitive
- Add Game external script template
- Game `MultiPlanarProcess` created (socket.io-client)
- Bug fixes
- `SlideShow`:
  - sound on video
  - bug fixes
- `Window`:
  - reduce button
  - removed from `AllWidget` and is no more used (no removed yet)
- `AllWidget` => `ShowRoom` and is now an example
- SPARQL Module new features
- Update to itowns 2.39.1-next.18:
- Remove Itowns folder :
  - `TilesManager`
  - `LayerManager`
  - `CityObject`
  - `CityObjectStyle`
  - `StyleManager`
  - `Tiles`
- Remove `LinkDocument`
- Remove `3DTilesDebugWindow`

# v3.0.0

- JSDOC overhaul
- UD-Viz repository becomes a 3-package **mono-repo** :

  - Decompose the ud-viz package into 2 packages :
    - [@ud-viz/shared](https://github.com/VCityTeam/UD-Viz/tree/master/packages/shared)
    - [@ud-viz/browser](https://github.com/VCityTeam/UD-Viz/tree/master/packages/browser)
  - Add a new package
    - [@ud-viz/node](https://github.com/VCityTeam/UD-Viz/tree/master/packages/node)
  - 4 package.json: **mono-repo**, **browser**, **shared**, **node**
  - All eslint's warnings are fixed

- **browser**, **shared**: Add a set of tests for and scripts/features (html files in **browser** are tested with puppeteer)

- **browser**:

  - Delete `View3D` and `GameView`. The notion of View is now assured by `Frame3DBase` and `Frame3DPlanar`.
  - Creation of `ExternalContext`
  - All configs are now split by features
  - Widgets take as arguments their config and not allWidget config anymore
  - API breaking changes
  - Bug fixes for :
    - video loading
    - load texture files

- **shared**:

  - Delete `World`.
  - Refacto of `Context`
  - `GameObject` becomes `Object3D` and now extends `THREE.Object3D`

- **node**:

  - Write an `ExpressAppWrapper`

- **Documentation**:
  - 5 Readmes : **mono-repo**, **browser**, **shared**, **node**, **documentation**.
  - `Contributing.md`
  - `ReleasePublish.md` updated

# v2.39.3

    - Equal CityObjectID
    - Change ColorLayers sequence order in BaseMap widget
    - Decompose Pack method in Game Enfine
    - Fix: correctly set the layers invisible
    - Rename projection -> crs BaseMapWindow
    - Use 'crs' instead of deprecated 'projection'
    - Support non texture format
    - Fix temporal camera
    - Change camera position to see 3DTiles
    - SlideShow enhancement loop
    - GameObject are not outdated when transform is modified
    - Updated-dependencies:
        dependency-name: loader-utils
        dependency-type: indirect

# v2.39.2

    - Allwidget.css : hide widget_content by default
    - Some jsdoc
    - Fix billboard to css method
    - Remove zoomControl in params
    - HtmlUtils method checkchildparent
    - Unpack uri component check

# v2.39.1

    - Remove zindex View3D css
    - LocalContext method findLocalScriptWithID + findGOWithLocalScriptID

# v2.39.0

    - Update config file & example html to work with new CSS
    - Change ExtendedDoc UI
    - Refacto About & Help module
    - Add logo user
    - Better CSS
        - Change font-family
        - Change font color
    - Change Logo & UI

# v2.38.4

    - Refacto GameView update
    - Warn if wrong config in elevation_layer
    - Audio component refacto

# v2.38.3

    - WorldState reference worldUUID
    - Pack uri to vector3 and euler
    - Several callback can be add on the same mouseCommand eventID
    - Remove background-color View3D

# v2.38.2

- Some ui adjust
- Add command :
  - up/down
  - ping
  - speed change

# v2.38.1

- forceSerializeComponent on GameObject feature

# v2.38.0

- [Issue 349](https://github.com/orgs/VCityTeam/projects/17/views/1): GeoJSON data layer integration via JSON config file and created an example in the UD-Viz mosaïc
- [Issue 234](https://github.com/orgs/VCityTeam/projects/17/views/1): Refactoring of the UD-Viz library structure, factorization of the View3D which includes the view itowns as well as the data integration methods in it.
- [Issue 249](https://github.com/orgs/VCityTeam/projects/17/views/1): Check for collisions in this local context rather than in the world/server context.
- [Issue 389](https://github.com/orgs/VCityTeam/projects/17/views/1): Move 3DDebugTiles from extensions to widgets.
- [Issue 284](https://github.com/orgs/VCityTeam/projects/17/views/1): Assert DRYness between avatar example and demo-bon.
- [Issue 231](https://github.com/orgs/VCityTeam/projects/17/views/1): Load 3DTiles from distant server instead of local. The 3DTiles are now on a the Liris server.
- [Issue 361](https://github.com/orgs/VCityTeam/projects/17/views/1): CityObject and 3DTiles Debug widgets can apply style to invisible tiles.
- [Issue 366](https://github.com/orgs/VCityTeam/projects/17/views/1): Dynamic layer creation, 2 ways to create dynamic layers:
  - A first way in which a stream of GeoJson created by GAMA is received.
  - Link to local GeoJson and change every second to give the dynamic effect.
- [Issue 188](https://github.com/orgs/VCityTeam/projects/17/views/1): Propose in a module a pre_selection of background image layer, coming from IGN for example, and created an example in the UD-Viz mosaïc.

# v2.37.7

    - Billboard fixes
    - Add onResize LocalScript event

# v2.37.6

    - Update LocalGameTutorial.md
    - Fix no paths in sky with a sky color
    - New Command.TYPE teleport

# v2.37.5

    - fix:
        apply default style for tilesets without color
        layer without color
        selection of non visible object
        filterWindow having no specific div
        picking and display of picked object
    - focusOnObject distance parameter
    - switch betwenn itowns rendering and game rendering

# v2.37.4

    - Game engine update
    - AllWidget template compute dynamic near and far camera
    - New Landing page
    - SlideShow v2

# v2.37.3

    Sparql module:
        - Fix legend coloring bug
        - Integrate link labels
        - Refactor graph construction and documentation
        - Integrate TIW table filters
        - Initial table integration
        - Integrate cityobjectprovider extension
        - Update graph query pipeline

    - Add websocket Message TYPE + documentation websocket API
    - Delete multilayer demo
    - Fix links to 3D Tiles in examples
    - Delete multilayer demo

# v2.37.2

    - Gltf aren't rotated at importation
    - Fix one example deployment
    - Add cubemap scene background

# v2.37.1

    - Add onRemove EVENT localscript
    - Fix Inputmanager
    - Add getParent
    - Add billboard example
    - Update ReleasePublish.md
    - Keep the id of the layer to tag 3DTiles
    - Remove default style for 3DTiles

# v2.37.0

    - update iTowns dependency to 2.37.0
      - update dependencies : proj4j (version ^2.7.5) and three (version 0.135.0)
    - minor documentation updates

# v2.36.6

    - Add constants in websocket type msg `EDIT_CONF_COMP`
    - WebPack 5 :
        - Update of url-loader
        - Update of style-loader
        - Split configs
    - Update landing page :
        - Documentation
        - Release link
        - LocalAvatar example
    - Update some markdowns

# v2.36.5

    - Remove record example
    - Worldcomputer 60 fps by default
    - Add isKeyUp isKeyDown in InputManager
    - New Command TYPE

# v2.36.4

    - Change worlds.json loading

# v2.36.3

    - Add quad to native model 3D of the assetsmanager
    - Fix of broken link to example deployment in docs

# v2.36.2

    - Fix some examples
    - Delete bundle udv.js in examples' assets
    - Socket fix path url

# v2.36.1

    - Game zeppelin tour
    - Game fix portal
    - Documentation ref on landing page

# v2.36.0

    - reduce time resize gameview
    - add freeze feature go
    - Fix layer choice widget
        - layer choice : better handling of html
        - refacto of GetMesh() method to GetMeshes()
    - Focus on tileset
        - add record.html to examples
    - remove Shared !
    - add basic example of recording
    - properly sending event when tile is loaded
    - improve loading view css
    - start a localGame with assets loaded
    - distant game start return promise
    - pointerLock API

# v2.35.0

    * Add a SlideShow Window
    * Add SlideShow class and example
    * Add verification elevation config
    * Npm audit is now a travis job.
    * Added a description of archived branch retrieval

# v2.34.1

    * update gitignore
    * Update SPARQL example.html
    * Add CodeQL-analysis.yml
    * Update SPARQL widget documentation
    * Added a pushing/PR process documentation

# v2.34.0

    * Add Changelog file in Doc
    * renderData : Introducing the new renderData attribute whose purpose is to render animations.
    * Display a default style per mesh
    * Can get children tiles in tileset
    * Meshes from the same tile are now in different groups
    * Load geometries without _BatchID
    * Change billboard mask material
    * Use materials[0] when using an unique default material
    * Can apply a default style per mesh
    * Register a default style for each tile, unless a color is specified for the layer. In this case, create a default style for the whole tileset
    * Check if the type is 'b3dm' before creating default style
    * Point cloud : handling point cloud layer properly
    * The base gltf material can now be the default style
    * Delete old ifc feature, aimed to be in a demo
    * Don't override material if the material has a texture
    * Remove dependency towards remote data
