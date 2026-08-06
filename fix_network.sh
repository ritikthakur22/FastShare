#!/bin/bash
sed -i 's/this._getConfig().then(() => this._connect());/this._connect();/g' frontend/scripts/network.js
