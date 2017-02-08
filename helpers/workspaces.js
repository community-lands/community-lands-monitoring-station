const app  = require('electron').app;
const pkg  = require('../package.json');
const path = require('path');
const fs   = require('fs-extra');

const LOCATION = path.join(app.getPath('userData'), 'workspaces.json');

var model = load();

/**
 * Workspace is a hash of name and directory
 */
function newWorkspace(params, cb) {
  var found = null;
  for (var i = 0; i < model.workspaces.length; i++) {
    if (model.workspaces[i].directory == params.directory) {
      found = model.workspaces[i];
      break;
    }
  }
  if (found) {
    cb({error: true, code: "workspace_conflict", workspace: found});
  } else {
    var workspace = {
      id: new Date().getTime(),
      name: params.name,
      directory: params.directory
    };
    model.workspaces.push(workspace);
    model.current = workspace;

    save();

    cb(null, workspace);
  }
}

function removeWorkspace(params, cb) {
  var found = null;
  for (var i = 0; i < model.workspaces.length; i++) {
    if (matches(model.workspaces[i], params)) {
      found = i;
      break;
    }
  }
  if (found) {
    model.workspaces.splice(found, 1);
    save();
    cb(null, true);
  } else
    cb({error: true, code: "workspace_not_found" });
}

function updateWorkspace(params, cb) {
  var found = null;
  for (var i = 0; i < model.workspaces.length; i++) {
    if (matches(model.workspaces[i], params)) {
      found = model.workspaces[i];
      found.name = workspace.name;
      break;
    }
  }
  if (found) {
    save();
    cb(null, found);
  } else
    cb({error: true, code: "workspace_not_found" });
}

function changeWorkspace(params, cb) {
  var found = null;
  for (var i = 0; i < model.workspaces.length; i++) {
    if (matches(model.workspaces[i], params)) {
      found = model.workspaces[i];
      break;
    }
  }
  if (found) {
    model.current = found;
    save();
    cb(null, found);
  } else
    cb({error: true, code: "workspace_not_found" });
}

function getCurrentWorkspace() {
  if (model.current) {
    var isDir = false;
    try {
      isDir = fs.statSync(model.current.directory).isDirectory();
    } catch (err) {
      isDir = false;
    }

    if (!isDir) {
      console.log('(x) Current workspace "' + model.current.name + '" no longer exists at ' + model.current.directory + '; using defaults instead.');
      return model.home;
    } else {
      return model.current;
    }
  } else
    return model.home;
}

function matches(ws, other) {
  var mine = ws.id + "";
  var theirs = other.id + "";
  return mine == theirs;
}

function listWorkspaces() {
  return JSON.parse(JSON.stringify(model));
}

function load() {
  var workspaces = null;
  try {
    var stats = fs.statSync(LOCATION);
    if (stats.isFile()) {
      workspaces = JSON.parse(fs.readFileSync(LOCATION, 'utf8'));
    } else
      workspaces = null;
  } catch (err) {
  }

  if (workspaces == null) {
    var defaultWorkspace = {
      id: new Date().getTime(),
      name: "My Community",
      directory: path.join(app.getPath('home'), pkg.productName || pkg.name)
    };
    workspaces = {
      current: null,
      home: defaultWorkspace,
      workspaces: [
        defaultWorkspace
      ]
    };
    try {
      fs.ensureDirSync(app.getPath('userData'));
      fs.writeFileSync(LOCATION, JSON.stringify(workspaces), 'utf8');
      fs.ensureDirSync(defaultWorkspace.directory);
      //TODO: Initialize?
    } catch (err) {
      console.log("Failed to initialize application settings file");
      workspaces = null;
    }
  }

  if (workspaces == null)
    throw new Error("Failed to access application settings");

  return workspaces;
}

function save() {
  fs.writeFileSync(LOCATION, JSON.stringify(model), 'utf8');
}


module.exports = {
  create: newWorkspace,
  remove: removeWorkspace,
  update: updateWorkspace,
  getCurrent: getCurrentWorkspace,
  setCurrent: changeWorkspace,
  list: listWorkspaces,
  location: LOCATION
}
