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
        assert(result, true);
        done();
      });
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
  });

  describe('addPermissionToRole', function () {
    it('acl.addPermissionToRole should add one permission to role', function (done) {

      acl.roles.teacher6 = {
        name: 'teacher6',
        permissions: []
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
  });

  describe('removePermissionFromRole', function () {
    it('acl.removePermissionFromRole should remove one permission from role', function (done) {

      acl.roles.teacher7 = {
        name: 'teacher7',
        permissions: ['run_fast']
      }

      acl.createRole('teacher7',function (err){
        if (err) throw err;
        assert(acl.roles.teacher7);

        acl.removePermissionFromRole('teacher7', 'run_fast', function (err) {
          if (err) throw err;

          assert(acl.roles.teacher7.permissions.indexOf('run_fast') > -1);

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
