# we-core-acl 

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Code Climate](https://codeclimate.com/github/wejs/we-core-acl/badges/gpa.svg)](https://codeclimate.com/github/wejs/we-core-acl) [![Coverage Status](https://coveralls.io/repos/github/wejs/we-core-acl/badge.svg?branch=master)](https://coveralls.io/github/wejs/we-core-acl?branch=master)

> Simple and powerfull access control list (ACL) module exported from we.js core

## Installation

```sh
npm install --save we-core-acl
```

## Usage

```js
var ACL = require('we-core-acl');
var acl = new ACL();

var options = {
  permissions: {
    'fly_fast': {
      'title': 'Fly super fast'
    }
  },
  // roles with permissions
  roles: {
    bird: {
      // administrators can do everything and dont need permissions
      name: 'bird',
      permissions: []
    },
    jet: {
      name: 'jet',
      permissions: [
        'fly_fast'
      ]
    }
  }
}

acl.init(options, function(){
  // acl is ready to use

  is (acl.canStatic('fly_fast', ['bird'])) {
    // can fly fast, this will not run in this example
  } else {
    // birds cant fly fast
  }

  is (acl.canStatic('fly_fast', ['jet'])) {
    // jet can fly fast
  } else {
    // this not run in this example
  }
});

```
## License

MIT © [Alberto Souza](http://albertosouza.net)
