/**
 * Example configuration file
 */
var EventEmiter = require('events');
var path = require('path');

module.exports = {
  config: {
    acl: {
      // set to true for disable ACL checks, this is util for dev env
      disabled: false
    },
    // auto write config file after update roles or permissions
    autoUpdateRolesConfig: false,
    // config file where configuretions will be write
    rolesConfigFile: path.resolve(__dirname, '..', 'config', 'roles.js'),
    // add all permissions avaible in you app
    permissions: {
      'findOne_user': {
        'title': 'Find one user'
      },
      'access_admin': {
        'group': 'admin',
        'title': 'Access admin page'
      }
    },
    // roles with permissions
    roles: {
      administrator: {
        // administrators can do everything and dont need permissions
        name: 'administrator',
        permissions: []
      },
      authenticated: {
        name: 'authenticated',
        permissions: [
          'access_admin'
        ]
      },
      unAuthenticated: {
        name: 'unAuthenticated',
        permissions: []
      },
      owner: {
        name: 'owner',
        permissions: [
          'findOne_user'
        ]
      }
    }
  },
  events: new EventEmiter(),

  log: {
    info: console.log
  }
}