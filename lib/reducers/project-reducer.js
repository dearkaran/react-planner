"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (state, action) {

  switch (action.type) {
    case _constants.NEW_PROJECT:
      return newProject(state);

    case _constants.LOAD_PROJECT:
      return loadProject(state, action.sceneJSON);

    case _constants.OPEN_CATALOG:
      return openCatalog(state);

    case _constants.CHANGE_CATALOG_PAGE:
      return state.setIn(['catalog', 'page'], action.newPage).updateIn(['catalog', 'path'], function (path) {
        return path.push(action.oldPage);
      });

    case _constants.GO_BACK_TO_CATALOG_PAGE:
      var path = state.catalog.path;
      var pageIndex = state.catalog.path.findIndex(function (page) {
        return page === action.newPage;
      });
      return state.setIn(['catalog', 'page'], action.newPage).updateIn(['catalog', 'path'], function (path) {
        return path.take(pageIndex);
      });

    case _constants.SELECT_TOOL_EDIT:
      return state.set('mode', _constants.MODE_IDLE);

    case _constants.UNSELECT_ALL:
      return unselectAll(state);

    case _constants.SET_PROPERTIES:
      return setProperties(state, action.properties);

    case _constants.SET_ITEMS_ATTRIBUTES:
      return setItemsAttributes(state, action.itemsAttributes);

    case _constants.SET_LINES_ATTRIBUTES:
      return setLinesAttributes(state, action.linesAttributes);

    case _constants.SET_HOLES_ATTRIBUTES:
      return setHolesAttributes(state, action.holesAttributes);

    case _constants.REMOVE:
      return remove(state);

    case _constants.UNDO:
      return undo(state);

    case _constants.ROLLBACK:
      return rollback(state);

    case _constants.SET_PROJECT_PROPERTIES:
      return setProjectProperties(state, action.properties);

    case _constants.OPEN_PROJECT_CONFIGURATOR:
      return openProjectConfigurator(state);

    case _constants.INIT_CATALOG:
      return initCatalog(state, action.catalog);

    case _constants.UPDATE_MOUSE_COORDS:
      return updateMouseCoord(state, action.coords);

    case _constants.UPDATE_ZOOM_SCALE:
      return updateZoomScale(state, action.scale);

    case _constants.TOGGLE_SNAP:
      return toggleSnap(state, action.mask);

    case _constants.THROW_ERROR:
      return throwError(state, action.error);

    case _constants.THROW_WARNING:
      return throwWarning(state, action.warning);

    case _constants.COPY_PROPERTIES:
      return copyProperties(state, action.properties);

    case _constants.PASTE_PROPERTIES:
      return pasteProperties(state);

    default:
      return state;

  }
};

exports.rollback = rollback;

var _immutable = require("immutable");

var _constants = require("../constants");

var _models = require("../models");

var _layerOperations = require("../utils/layer-operations");

function openCatalog(state) {
  return rollback(state).set('mode', _constants.MODE_VIEWING_CATALOG);
}

function newProject(state) {
  return new _models.State();
}

function loadProject(state, sceneJSON) {
  return new _models.State({ scene: sceneJSON, catalog: state.catalog.toJS() });
}

function setProperties(state, properties) {
  var scene = state.scene;
  scene = scene.set('layers', scene.layers.map(function (layer) {
    return (0, _layerOperations.setPropertiesOnSelected)(layer, properties);
  }));
  return state.merge({
    scene: scene,
    sceneHistory: state.sceneHistory.push(scene)
  });
}

function updateProperties(state, properties) {
  var scene = state.scene;
  scene = scene.set('layers', scene.layers.map(function (layer) {
    return (0, _layerOperations.updatePropertiesOnSelected)(layer, properties);
  }));
  return state.merge({
    scene: scene,
    sceneHistory: state.sceneHistory.push(scene)
  });
}

function setItemsAttributes(state, attributes) {
  var scene = state.scene;
  scene = scene.set('layers', scene.layers.map(function (layer) {
    return (0, _layerOperations.setAttributesOnSelected)(layer, attributes, state.catalog);
  }));
  return state.merge({
    scene: scene,
    sceneHistory: state.sceneHistory.push(scene)
  });
}

function setLinesAttributes(state, attributes) {
  var scene = state.scene;

  scene = scene.set('layers', scene.layers.map(function (layer) {
    return (0, _layerOperations.setAttributesOnSelected)(layer, attributes, state.catalog);
  }));

  return state.merge({
    scene: scene,
    sceneHistory: state.sceneHistory.push(scene)
  });
}

function setHolesAttributes(state, attributes) {
  var scene = state.scene;
  scene = scene.set('layers', scene.layers.map(function (layer) {
    return (0, _layerOperations.setAttributesOnSelected)(layer, attributes, state.catalog);
  }));
  return state.merge({
    scene: scene,
    sceneHistory: state.sceneHistory.push(scene)
  });
}

function unselectAll(state) {
  var scene = state.scene;

  scene = scene.update('layers', function (layer) {
    return layer.map(_layerOperations.unselectAll);
  });

  return state.merge({
    scene: scene,
    sceneHistory: state.sceneHistory.push(scene)
  });
}

function remove(state) {
  var scene = state.scene;
  var catalog = state.catalog;

  scene = scene.updateIn(['layers', scene.selectedLayer], function (layer) {
    return layer.withMutations(function (layer) {
      var _layer$selected = layer.selected,
          selectedLines = _layer$selected.lines,
          selectedHoles = _layer$selected.holes,
          selectedItems = _layer$selected.items;

      (0, _layerOperations.unselectAll)(layer);
      selectedLines.forEach(function (lineID) {
        return (0, _layerOperations.removeLine)(layer, lineID);
      });
      selectedHoles.forEach(function (holeID) {
        return (0, _layerOperations.removeHole)(layer, holeID);
      });
      selectedItems.forEach(function (itemID) {
        return (0, _layerOperations.removeItem)(layer, itemID);
      });
      (0, _layerOperations.detectAndUpdateAreas)(layer, catalog);
    });
  });

  return state.merge({
    scene: scene,
    sceneHistory: state.sceneHistory.push(scene)
  });
}

function undo(state) {
  var sceneHistory = state.sceneHistory;

  if (state.scene === sceneHistory.last() && !sceneHistory.size > 1) sceneHistory = sceneHistory.pop();

  switch (sceneHistory.size) {
    case 0:
      return state;

    case 1:
      return state.merge({
        mode: _constants.MODE_IDLE,
        scene: sceneHistory.last()
      });

    default:
      return state.merge({
        mode: _constants.MODE_IDLE,
        scene: sceneHistory.last(),
        sceneHistory: sceneHistory.pop()
      });
  }
}

function rollback(state) {
  var sceneHistory = state.sceneHistory;

  if (sceneHistory.isEmpty()) return state;

  var scene = sceneHistory.last().update('layers', function (layer) {
    return layer.map(_layerOperations.unselectAll);
  });

  return state.merge({
    mode: _constants.MODE_IDLE,
    scene: scene,
    sceneHistory: state.sceneHistory.push(scene),
    snapElements: new _immutable.List(),
    activeSnapElement: null,
    drawingSupport: new _immutable.Map(),
    draggingSupport: new _immutable.Map(),
    rotatingSupport: new _immutable.Map()
  });
}

function setProjectProperties(state, properties) {
  var scene = state.scene.merge(properties);
  return state.merge({
    mode: _constants.MODE_IDLE,
    scene: scene,
    sceneHistory: state.sceneHistory.push(scene)
  });
}

function openProjectConfigurator(state) {
  return state.merge({
    mode: _constants.MODE_CONFIGURING_PROJECT
  });
}

function initCatalog(state, catalog) {
  return state.set('catalog', new _models.Catalog(catalog));
}

function updateMouseCoord(state, coords) {
  return state.set('mouse', new _immutable.Map(coords));
}

function updateZoomScale(state, scale) {
  return state.set('zoom', scale);
}

function toggleSnap(state, mask) {
  return state.set('snapMask', mask);
}

function throwError(state, error) {
  return state.set('errors', state.get('errors').push({
    date: Date.now(),
    error: error
  }));
}

var throwWarning = function throwWarning(state, warning) {
  return state.set('warnings', state.get('warnings').push({
    date: Date.now(),
    warning: warning
  }));
};

var copyProperties = function copyProperties(state, properties) {
  return state.set('clipboardProperties', properties.toJS());
};

var pasteProperties = function pasteProperties(state) {
  return updateProperties(state, state.get('clipboardProperties'));
};