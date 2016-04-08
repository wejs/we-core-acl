var assert = require('assert');
var ACL = require('../../lib');
var acl;
var options = require('../example-config.js');
var fs = require('fs');

describe('we-core-acl', function () {
  before(function (done){
    acl = new ACL();

    acl.init(options,done);
  });

  describe('exportRoles', function() {
    it('acl.exportRoles should return roles in json', function (done) {
      assert(typeof acl.exportRoles());
      done();
    });
  });

  describe('writeRolesToConfigFile', function() {
    it('acl.writeRolesToConfigFile should write roles to config file', function (done) {
      acl.writeRolesToConfigFile(function (err){
        if (err) throw err;
        fs.lstat(acl.app.config.rolesConfigFile, function(err){
          if (err) throw err;
          done();
        })
      });
    });

    it('acl.writeRolesToConfigFile should run done with error if cant create the file', function (done) {

      var rolesConfigFile = acl.app.config.rolesConfigFile;
      acl.app.config.rolesConfigFile = rolesConfigFile+'/asdasd/asdasda';

      acl.writeRolesToConfigFile(function (err){
        assert(err);
        acl.app.config.rolesConfigFile = rolesConfigFile;
        done();
      });
    });
  });

  describe('canStatic', function () {
    it('acl.canStatic with administrator role can do will everything and return true', function (done) {
      assert(acl.canStatic('access_admin', ['administrator']), 'administrator can access all routes');
      done();
    });

    it('acl.canStatic with authenticated role can access_admin', function (done) {
      assert(acl.canStatic('access_admin', ['authenticated']), 'authenticated role can access admin set in options');
      done();
    });

    it('acl.canStatic with authenticated role cant findOne_user', function (done) {
      assert.equal(acl.canStatic('findOne_user', ['authenticated']), false, 'authenticated cant findOne_user');
      done();
    });

    it('acl.canStatic with authenticated role cant findOne_user', function (done) {
      assert.equal(acl.canStatic('findOne_user', ['authenticated']), false, 'authenticated cant findOne_user');
      done();
    });

    it('acl.canStatic with unAuthenticated role cant findOne_user', function (done) {
      assert.equal(acl.canStatic('findOne_user', ['unAuthenticated']), false, 'unAuthenticated cant findOne_user');
      done();
    });

    it('acl.canStatic with unAuthenticated role cant access_admin', function (done) {
      assert.equal(acl.canStatic('access_admin', ['unkonwRole', 'unAuthenticated']), false,
        'unAuthenticated cant access_admin');
      done();
    });

    it('acl.canStatic should skip acl check if acl is disabled', function (done) {
      acl.app.config.acl.disabled = true;
      assert.equal(acl.canStatic('access_admin', ['unAuthenticated']), true);

      acl.app.config.acl.disabled = false;
      done();
    });

    it('acl.canStatic should throw error is dont have roles or permissions', function (done) {
      try {
        acl.canStatic(null, ['unAuthenticated']);
      } catch(e) {
        assert(e);
        done();
      }
    });
  });

  describe('can', function () {
    it('acl.can will check access and run callback with result', function (done) {
      acl.can('access_admin', ['administrator'], function(err, result){
        assert.equal(result, true);
        done();
      });
    });

    it('acl.can will check access and return without callback', function (done) {
      assert.equal(true, acl.can('access_admin', ['administrator']));
      done();
    });
  });

  describe('registerOneDefaltRole', function () {
    it('acl.registerOneDefaltRole register one role with isSystemRole flag', function (done) {

      assert(!acl.roles.teacher, 'not set after run the create');

      acl.registerOneDefaltRole('teacher', function (err, role, old){
        if (err) throw err;
        assert(!old);
        assert(acl.roles.teacher);
        assert(acl.roles.teacher.isSystemRole);
        done();
      });
    });

    it('acl.registerOneDefaltRole will skip if role already exists', function (done) {

      acl.roles.teacher1 =  {
        name: 'teacher1',
        permissions: []
      }

      acl.registerOneDefaltRole('teacher1', function (err, role, old){
        if (err) throw err;
        assert(old);
        assert(acl.roles.teacher1);
        assert(!acl.roles.teacher1.isSystemRole);
        done();
      });
    });
  });

  describe('createRole', function () {
    it('acl.createRole register one role', function (done) {

      assert(!acl.roles.teacher4, 'not set after run the create');

      acl.createRole('teacher4', function (err, role, old){
        if (err) throw err;
        assert(!old);
        assert(acl.roles.teacher4);
        assert(!acl.roles.teacher4.isSystemRole);
        done();
      });
    });

    it('acl.createRole register one role and save in config file', function (done) {

      acl.app.config.autoUpdateRolesConfig = true;
      assert(!acl.roles.teacher44, 'not set after run the create');

      acl.createRole('teacher44', function (err, role, old){
        if (err) throw err;
        assert(!old);
        assert(acl.roles.teacher44);
        assert(!acl.roles.teacher44.isSystemRole);

        var file = fs.readFileSync(acl.app.config.rolesConfigFile);
        assert(file.indexOf('teacher44') > -1);

        acl.app.config.autoUpdateRolesConfig = false;

        done();
      });
    });
  });

  describe('deleteRole', function () {
    it('acl.deleteRole should delete one role', function (done) {

      acl.roles.teacher5 = {
        name: 'teacher5',
        permissions: []
      }

      acl.deleteRole('teacher5', function (err){
        if (err) throw err;
        assert(!acl.roles.teacher5);
        done();
      });
    });

    it('acl.deleteRole should delete one role and update config roles file', function (done) {
      acl.app.config.autoUpdateRolesConfig = true;

      acl.roles.teacher55 = {
        name: 'teacher55',
        permissions: []
      }

      acl.deleteRole('teacher55', function (err){
        if (err) throw err;
        assert(!acl.roles.teacher55);

        var file = fs.readFileSync(acl.app.config.rolesConfigFile);
        assert(file.indexOf('teacher55') == -1);

        acl.app.config.autoUpdateRolesConfig = false;

        done();
      });
    });
  });

  describe('addPermissionToRole', function () {
    it('acl.addPermissionToRole should add one permission to role', function (done) {

      acl.roles.teacher6 = {
        name: 'teacher6'
      }

      acl.createRole('teacher6', function (err){
        if (err) throw err;
        assert(acl.roles.teacher6);

        acl.addPermissionToRole('teacher6', 'can_fly', function (err) {
          if (err) throw err;

          assert(acl.roles.teacher6.permissions.indexOf('can_fly') > -1);

          done();
        });
      });
    });

    it('acl.addPermissionToRole should set permissions and update config file', function (done) {
      acl.app.config.autoUpdateRolesConfig = true;

      acl.createRole('teacher123', function (err){
        if (err) throw err;
        assert(acl.roles.teacher123);

        acl.addPermissionToRole('teacher123', 'can_fly', function (err) {
          if (err) throw err;

          assert(acl.roles.teacher123.permissions.indexOf('can_fly') > -1);

          var file = fs.readFileSync(acl.app.config.rolesConfigFile);
          assert(file.indexOf('teacher123') > -1);
          acl.app.config.autoUpdateRolesConfig = false;

          done();
        });
      });
    });
  });

  describe('removePermissionFromRole', function () {
    it('acl.removePermissionFromRole should remove one permission from role', function (done) {
      acl.roles.teacher7 = {
        name: 'teacher7',
        permissions: ['run_fast']
      }

      acl.removePermissionFromRole('teacher7', 'run_fast', function (err) {
        if (err) throw err;
        assert(acl.roles.teacher7.permissions.indexOf('run_fast') === -1);
        done();
      });
    });

    it('acl.removePermissionFromRole should ship if role dont have permissions', function (done) {
      acl.roles.teacher77 = { name: 'teacher77' };
      acl.removePermissionFromRole('teacher77', 'run_fast', function (err) {
        if (err) throw err;
        assert(!acl.roles.teacher77.permissions);
        done();
      });

    });

    it('acl.removePermissionFromRole should remove one permission from role and update config file', function (done) {
      acl.app.config.autoUpdateRolesConfig = true;

      acl.createRole('teacher17',function (err){
        if (err) throw err;
        assert(acl.roles.teacher17);

        acl.roles.teacher17 = {
          name: 'teacher17',
          permissions: ['run_fastrr']
        }

        var file = fs.readFileSync(acl.app.config.rolesConfigFile);
        assert(file.indexOf('teacher17') > -1);

        acl.removePermissionFromRole('teacher17', 'run_fastrr', function (err) {
          if (err) throw err;

          assert(acl.roles.teacher17.permissions.indexOf('run_fastrr') === -1);

          var file = fs.readFileSync(acl.app.config.rolesConfigFile);
          assert(file.indexOf('run_fastrr') === -1);
          acl.app.config.autoUpdateRolesConfig = false;

          done();
        });
      });
    });
  });

  describe('logMiddlewareForbiddenRequest', function () {
    it('acl.logMiddlewareForbiddenRequest should run log with authenticated user', function (done) {
      acl.logMiddlewareForbiddenRequest.bind({
        app: {
          log: {
            info: function(text, userId) {
              assert.equal(text, 'ACL:canMiddleware: forbidden for user id: ');
              assert.equal(userId, 1);
              done();
            }
          }
        }
      })({
        user: { id: 1 }
      }, {
        locals: { permission: 'do_something' }
      });
    });

    it('acl.logMiddlewareForbiddenRequest should run log with unAuthenticated user', function (done) {
      acl.logMiddlewareForbiddenRequest.bind({
        app: {
          log: {
            info: function(text, permission) {
              assert.equal(text, 'ACL:canMiddleware: forbidden for unAuthenticated user:');
              assert.equal(permission, 'do_something');
              done();
            }
          }
        }
      })({}, {
        locals: { permission: 'do_something' }
      });
    });
  });

  after(function (done) {
    fs.unlink(acl.app.config.rolesConfigFile, done);
  });
});
