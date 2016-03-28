/**
 * We.js simple ACL module
 */

// libs
var fs = require('fs'),
  path = require('path');

var ACL = function ACL(){
  // variable to store roles
  this.roles = {};
  // variable to store permissions
  this.permissions = {};

  // administrators can do everything
  this.administratorRole = 'administrator';
};

/**
 * Init function, start the acl and pass acl configurations
 *
 * @param  {Object} app see test/examples
 * @param  {Function} cb callback
 */
ACL.prototype.init = function initAcl (app, cb){
  // save one reference to app
  this.app = app;

  this.permissions = app.config.permissions;
  this.roles = app.config.roles;

  if (app.events) app.events.emit('we:acl:after:init', app);

  return cb();
};

/**
 * Function to check if one user has some permission without callback
 *
 * @param  {string} permissionName
 * @param  {string} roleName
 */
ACL.prototype.canStatic = function canStatic (permissionName, roleNames){
  // config for enable or disable ACL
  if (this.app.config.acl.disabled) return true;

  // roleNames and permissionName is required
  if (!roleNames || !permissionName) throw new Error('permissionName and roleNames is required for we.acl.canStatic');

  if ( roleNames.indexOf(this.administratorRole) > -1 ) return true;

  return this.checkIfCanInRoles(permissionName, roleNames);
};

ACL.prototype.checkIfCanInRoles = function checkIfCanInRoles(permissionName, roleNames) {
  for (var i = roleNames.length - 1; i >= 0; i--) {
    if (!this.roles[roleNames[i]]) continue; // role not exists
    // check if role have the permission
    if (this.roles[roleNames[i]].permissions.indexOf(permissionName) >-1 ) {
      return true;
    }
  }
  return false
}

/**
 * Function to check if one user has some permission
 *
 * @param  {string} permissionName
 * @param  {string} roleName
 * @param  {Function} callback
 */
ACL.prototype.can = function userCan(permissionName, roleNames, callback){
  callback(null, this.canStatic(permissionName, roleNames));
};

/**
 * Create and register one of the default roles if not exists,
 * default roles have isSystemRole flag, this is usable in administrative interfaces to block role removal
 *
 * @param  {object} we
 * @param  {string} roleName
 * @param  {Function} done / callback
 *
 */
ACL.prototype.registerOneDefaltRole = function registerOneDefaltRole(roleName, done){
  this.createRole({
    name: roleName,
    isSystemRole: true
  }, done);
};

/**
 * Create and register one role
 *
 * @param  {object|String} data { name: 'roleName', ... } the new role object
 * @param  {Function} cb  callback
 */
ACL.prototype.createRole = function createRole (data, cb){
  var self = this;

  if (typeof data === 'string') {
    var name = data;
    data = { permissions: [] };
    data.name = name;
  }

  if (this.roles[data.name]) {
    // skip if role already exists
    return cb(null, this.roles[data.name], true);
  }

  // add the role
  this.roles[data.name] = data;

  if (this.app.config.autoUpdateRolesConfig) {
    // then write to file
    return this.writeRolesToConfigFile(function afterSaveRoles (err){
      return cb(err, self.roles[data.name]);
    });
  }

  return cb(null, this.roles[data.name]);
};

/**
 * Delete one role and remove from roles array
 *
 * @param  {String} roleName
 * @param  {Function} cb  callback
 */
ACL.prototype.deleteRole = function deleteRole (roleName, cb){
  // if delete the role
  delete this.roles[roleName];
  // then write to file
  if (this.app.config.autoUpdateRolesConfig) {
    return this.writeRolesToConfigFile(cb);
  }

  return cb();
};

/**
 * Add permission to role
 *
 * @param {String|Object}   roleName or loaded role
 * @param {String|Object}   permissionName or loaded permission
 * @param {Function} cb             callback
 */
ACL.prototype.addPermissionToRole = function addPermissionToRole (roleName, permissionName, cb){
  if (!this.roles[roleName].permissions)
    this.roles[roleName].permissions = [];

  this.roles[roleName].permissions.push(permissionName);

  if (this.app.config.autoUpdateRolesConfig) {
    return this.writeRolesToConfigFile(cb);
  }

  return cb();
};

/**
 * Remove one permission from role
 *
 * @param {String|Object}   roleName or loaded role
 * @param {String|Object}   permissionName or loaded permission
 * @param {Function} cb             callback
 */
ACL.prototype.removePermissionFromRole = function removePermissionFromRole(roleName, permissionName, cb){

  if (!this.roles[roleName].permissions) {
    return cb();
  }

  var index = this.roles[roleName].permissions.indexOf(permissionName);
  if (index > -1) {
    this.roles[roleName].permissions.splice(index, 1);
  }

  if (this.app.config.autoUpdateRolesConfig) {
    return this.writeRolesToConfigFile(cb);
  }

  return cb();
};

/**
 * Export all roles in JSON
 *
 * Override this functions if need to change any role attributes after export
 *
 * @return {Object} roles
 */
ACL.prototype.exportRoles = function exportRoles() {
  return this.roles;
};

ACL.prototype.writeRolesToConfigFile = function writeRolesToConfigFile(done) {
  var app = this.app;

  var roles = this.exportRoles();

  var data = 'module.exports = {\n'+
    '\'roles\': '+
      JSON.stringify(roles, null, '\t').replace(/\"/g, '\'') +
    '\n'+
  '};\n';

  var file = app.config.rolesConfigFile ||
             path.resolve(app.projectPath, '/config/roles.js') ||
             path.resolve(process.cwd(), '/config/roles.js') ;

  fs.writeFile(file, data, function (err) {
    if (err) return done(err);

    if (app.log) app.log.info('Roles saved in file: ' + file);

    done();
  });
};

//
// Works with we.js and express.js
//

/**
 * Can middleware, usable with express or we.js
 * Run for every request
 *
 * @param  {object} req express request
 * @param  {Function} callback
 */
ACL.prototype.canMiddleware = function canMiddleware (req, res, callback){
  var acl = req.acl || req.we.acl;
  // user role names, add user roles here after load current request user
  if (!req.userRoleNames) req.userRoleNames = [];
  // config for enable or disable ACL
  if ( acl.app.config.acl.disabled ) return callback();

  if (!res.locals.permission || (res.locals.permission === true))
    return callback();

  acl.loadUserContextRoles(req, res, function afterLoadUserRoles (err){
    if (err) return res.serverError(err);

    // check if user can access admin pages
    if (res.locals.isAdmin && !acl.canStatic('access_admin', req.userRoleNames)) {
      return res.forbidden();
    }

    if (!acl.canStatic(res.locals.permission, req.userRoleNames)) {
      // cant
      acl.logMiddlewareForbiddenRequest(req, res);
      return res.forbidden();
    }

    // can, then run the next callback
    callback();
  });
};

ACL.prototype.logMiddlewareForbiddenRequest = function logMiddlewareForbiddenRequest(req, res) {
  if (!req.user) {
    this.app.log.info('ACL:canMiddleware: forbidden for unAuthenticated user:', res.locals.permission);
  } else {
    this.app.log.info('ACL:canMiddleware: forbidden for user id: ',
      req.user.id, req.user.username, res.locals.permission, req.userRoleNames
    );
  }
}

/**
 * Middleware for load authenticated and unAuthenticated user roles
 *
 * @param  {[type]}   req
 * @param  {[type]}   res
 * @param  {Function} cb
 */
ACL.prototype.loadUserContextRoles = function loadUserContextRoles(req, res, cb){
  if (req.userRolesIsLoad) return cb(null, req.userRoleNames);

  if (!req.user) {
    req.userRoleNames.push('unAuthenticated');
    return cb(null, req.userRoleNames);
  }

  req.user.getRoles().then(function afterLoadRoles(roles){
    req.userRoleNames = roles;

    req.userRoleNames.push('authenticated');
    req.userRolesIsLoad = true;

    cb(null, roles);
  }).catch(cb);
};

//
// We.js ony methods:
// methods bellow only works with we.js framework
//

/**
 * Set model date field permissions
 *
 * @param {Object} we    we.js app
 */
ACL.prototype.setModelDateFieldPermissions = function setModelDateFieldPermissions(we) {
  for (var name in we.db.models) {
    if (we.db.models.hasOwnProperty(name)) {
      this.permissions[name+'-edit-field-createdAt'] = {
        title: 'Edit '+name+' createdAt field',
        description: ''
      };
      this.permissions[name+'-edit-field-updatedAt'] = {
        title: 'Edit '+name+' updatedAt field',
        description: ''
      };
    }
  }
};

module.exports = ACL;