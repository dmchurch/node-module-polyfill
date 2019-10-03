# node-module-polyfill [![Build Status](https://travis-ci.com/dmchurch/node-module-polyfill.svg?branch=master)](https://travis-ci.com/dmchurch/node-module-polyfill) [![Coverage Status](https://coveralls.io/repos/github/dmchurch/node-module-polyfill/badge.svg)](https://coveralls.io/github/dmchurch/node-module-polyfill)

A polyfill for Node.Module.

Uses code from [Node.js](https://github.com/nodejs/node) v12.11, tested back to v8.

## Usage:

```javascript
const Module = require("module");
require("node-module-polyfill");
```

or

```javascript
import Module from 'module';
import 'node-module-polyfill';
```