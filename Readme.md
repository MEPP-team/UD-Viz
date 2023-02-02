# UD-Viz : Urban Data Vizualisation

[![CodeQL](https://github.com/VCityTeam/UD-Viz/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/VCityTeam/UD-Viz/actions/workflows/codeql-analysis.yml)
[![CI status](https://travis-ci.com/VCityTeam/UD-Viz.svg?branch=master)](https://app.travis-ci.com/github/VCityTeam/UD-Viz)
[![Documentation Status](https://readthedocs.org/projects/ansicolortags/badge/?version=latest)](http://vcityteam.github.io/UD-Viz/html/index.html)

UD-Viz is a 3-package JavaScript framework for creating web applications for visualizing and interacting with geospatial 3D urban data.

> [Online demos](https://projet.liris.cnrs.fr/vcity/demos/)

**UD-Viz Packages:**

- [Core](./packages/core/Readme.md)
- [Browser](./packages/browser/Readme.md)
- [Node](./packages/node/Readme.md)

**Index**

- [UD-Viz : Urban Data Vizualisation](#ud-viz--urban-data-vizualisation)
  - [Directory Hierarchy](#directory-hierarchy)
  - [Getting Started](#getting-started)
    - [Installing node/npm](#installing-nodenpm)
    - [Installing the UD-Viz framework per se](#installing-the-ud-viz-framework-per-se)
    - [Run an example urban data web application](#run-an-example-urban-data-web-application)
  - [Developers](#developers)
    - [Pre-requisites](#pre-requisites)
    - [Npm Scripts](#npm-scripts)
    - [Documentation](#documentation)
    - [Development Environment Tips](#development-environment-tips)
      - [Notes for VSCode users](#notes-for-vscode-users)
    - [Tips for Windows developers](#tips-for-windows-developers)
    - [Debugging the examples](#debugging-the-examples)
    - [Continuous Integration (Travis)](#continuous-integration-travis)
    - [Submitting a Pull Request](#submitting-a-pull-request)
      - [Prior to PR-submission 1: assert coding style and build](#prior-to-pr-submission-1-assert-coding-style-and-build)
        - [Coding style (Linter)](#coding-style-linter)
      - [Prior to PR-submission 2: functional testing](#prior-to-pr-submission-2-functional-testing)
    - [Submitting a Release](#submitting-a-release)

### Directory Hierarchy

```
UD-Viz (repo)
├── bin                       # Global NodeJS development and
├── docs                      # Developer and User documentation
├── packages
|    ├── browser              # UD-Viz Browser-side framework
|    ├── core                 # UD-Viz shared Browser+Node framework
|    ├── node                 # UD-Viz Node-side framework
├── .eslintrc.js              # Linting rules and configuration
├── .gitignore                # Files/folders ignored by Git
├── .prettierrc               # Formatting rules
├── travis.yml                # Continuous integration entrypoint
├── favicon.ico               # Examples landing page icon
├── index.html                # Examples landing page entrypoint
├── package-lock.json         # Latest npm package installation file
├── package.json              # Global npm project description
├── Readme.md                 # It's a me, Mario!
├── style.css                 # Examples landing page style
```

## Getting Started

### Installing node/npm

For the node/npm installation instructions refer [here](https://github.com/VCityTeam/UD-SV/blob/master/Tools/ToolNpm.md)

UD-Viz has been reported to work with versions:

- node version 16.X
- npm version: 8.X

### Installing the UD-Viz framework per se

Clone the UD-Viz repository and install requirements with npm

```bash
git clone https://github.com/VCityTeam/UD-Viz.git
cd UD-Viz
npm install # resolve dependencies based on the package.json (and package-lock.json if it exists)
npm run link-local # use the local code instead of the modules published on npm
```

### Run an example urban data web application

To quickly build and locally host the examples landing page which links to several [UD-Viz example applications](./packages/browser/examples/).

```bash
npm run host
```

After running go to [localhost:8000](http://localhost:8000).

## Developers

### Pre-requisites

Developing UD-Viz applications requires knowledge about :

- [JS](https://github.com/VCityTeam/UD-SV/blob/master/UD-Doc/Devel/ToolJavaScript.md)
- [node.js](https://en.wikipedia.org/wiki/Node.js)
- [npm](<https://en.wikipedia.org/wiki/Npm_(software)>)
- [three.js](https://threejs.org/)

### Npm Scripts

| Script                   | Description                                                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run clean`          | Remove files and folders generated by `npm install` and the `npm run build-*` script such as `./node_modules`, `package-lock.json`, and `./dist`                                                                                                                    |
| `npm run reset`          | Reinstalls npm dependencies. This script runs `npm run clean` and `npm install` command                                                                                                                                                                             |
| `npm run link-local`     | Create local aliases to packages (_browser_, _core_ and _node_ ) to avoid using relative paths in the package.json. See [link documentation](https://docs.npmjs.com/cli/v6/commands/npm-link) for more information. To delete these aliases you can run `npm prune` |
| `npm run build-core`     | Call the build command of the [core package](./packages/core/Readme.md#npmscripttodo)                                                                                                                                                                               |
| `npm run build-browser`  | Call the build command of the [browser package](./packages/browser/Readme.md#npmscripttodo)                                                                                                                                                                         |
| `npm run build-node`     | Call the build command of the [node package](./packages/node/Readme.md#npmscripttodo)                                                                                                                                                                               |
| `npm run debug-examples` | Launch a watcher and server for debugging the examples. See [here](#debugging-the-examples) for more information                                                                                                                                                    |
| `npm run eslint`         | Run the linter. See [here](#coding-style-linter) for more information                                                                                                                                                                                               |
| `npm run eslint-quiet`   | Run the linter without displaying warnings, only errors                                                                                                                                                                                                             |
| `npm run eslint-fix`     | Run the linter and attempt to fix errors and warning automatically                                                                                                                                                                                                  |
| `npm run test`           | Build the 3 packages and tests core and browser scripts. Uses [this test script](./bin/test.js)                                                                                                                                                                     |
| `npm run travis`         | Run `npm run eslint` and `npm run test`. Also ran by CI. See [here](#continuous-integration-travis) for more information                                                                                                                                            |
| `npm run docs-core`      | Generate the [JSDOC core package documentation](./docs/jsdocConfig/jsdoc.core.json)                                                                                                                                                                                 |
| `npm run docs-browser`   | Generate the [JSDOC browser package documentation](./docs/jsdocConfig/jsdoc.browser.json)                                                                                                                                                                           |
| `npm run docs-node`      | Generate the [JSDOC node package documentation](./docs/jsdocConfig/jsdoc.node.json)                                                                                                                                                                                 |
| `npm run docs-home`      | Generate the [JSDOC documentation landing page](./docs/jsdocConfig/jsdoc.home.json)                                                                                                                                                                                 |
| `npm run docs`           | Run `npm run docs-core`, `npm run docs-browser`, `npm run docs-node`, and `npm run docs-home`                                                                                                                                                                       |
| `npm run host`           | Run `npm run build-browser` and host the bundle with [an express server](./bin/host.js). <br>http://locahost:8000/                                                                                                                                                  |

For Windows users:

> In order to use scripts that launch a shell script with Powershell: `npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"`

### Documentation

The [browsable documentation](https://vcityteam.github.io/UD-Viz/html/index.html) is generated
[within this repository](./docs/html/index.html).

Refer to this [Readme](./docs/Readme.md) to re-generate it and for more information.

### Development Environment Tips

#### Notes for VSCode users

VSCode is the recommended development environment.
When using [Visual Studio Code](https://code.visualstudio.com/), you can install the following extentions to make your life easier:

- [eslint](https://www.digitalocean.com/community/tutorials/linting-and-formatting-with-eslint-in-vs-code) - allows you e.g. to automatically fix the coding style e.g. [when saving a file](https://www.digitalocean.com/community/tutorials/linting-and-formatting-with-eslint-in-vs-code).
- [Prettier](https://prettier.io/) - JS, JSON, CSS, and HTML formatter.
- [Mintlify](https://marketplace.visualstudio.com/items?itemName=mintlify.document) - AI-powered documentation generator. (may require rewriting by a human)

### Tips for Windows developers

As configured, the coding style requires a Linux style newline characters which might be overwritten in Windows environments
(both by `git` and/or your editor) to become `CRLF`. When such changes happen eslint will warn about "incorrect" newline characters
(which can always be fixed with `npm run eslint -- --fix` but this process quickly gets painful).
In order to avoid such difficulties, the [recommended pratice](https://stackoverflow.com/questions/1967370/git-replacing-lf-with-crlf)
consists in

1.  setting git's `core.autocrlf` to `false` (e.g. with `git config --global core.autocrlf false`)
2.  configure your editor/IDE to use Unix-style endings

### Debugging the examples
The browser package contains several "example" applications that showcase different UD-Viz components and serve as templates for creating demos with UD-Viz.

```bash
npm run debug-examples
```

### Submitting a Pull Request

#### Prior to PR-submission<a name="anchor-devel-pushing-process"></a> 1: assert coding style and build

Before pushing (`git push`) to the origin repository please make sure to run

```bash
npm run travis
```

(or equivalently `npm run eslint` and `npm run build`) in order to assert that the coding style is correct (`eslint`) and that bundle (production) build (`webpack`) is still effective. When failing to do so the CI won't check.

Note that when committing (`git` commit`) you should make sure to provide representative messages because commit messages end-up collected in the PR message and eventually release explanations.

#### Coding style (Linter)

The JavaScript files coding style is defined with [eslint](https://eslint.org/) through the [.eslintrc.js configuration file](.eslintrc.js).
It can be checked (e.g. prior to a commit) with the `npm run eslint` command.
Notice that UD-Viz coding style uses a unix `linebreak-style` (aka `LF` as newline character).

### Prior to PR-submission<a name="anchor-devel-pushing-process"></a> 2: functional testing

Before submitting a pull request, and because [UD-Viz still misses some tests](https://github.com/VCityTeam/UD-SV/issues/34),
**non-regression testing must be done manually**.
A developer must thus at least) check that all the
[demo examples](https://github.com/VCityTeam/UD-Viz/tree/master/examples)
(refer to [their online deployment](https://ud-viz.vcityliris.data.alpha.grandlyon.com/)) are still effective.

#### PR Submission

When creating a PR (Pull Request) make sure to provide a correct description

### Submitting a Release
