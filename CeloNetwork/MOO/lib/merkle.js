"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MerkleTree = void 0;
exports.loadTree = loadTree;

var _ethereumjsUtil = require("ethereumjs-util");

var _web3Utils = require("web3-utils");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Merkle tree called with 32 byte hex values
var MerkleTree = /*#__PURE__*/function () {
  function MerkleTree(elements) {
    _classCallCheck(this, MerkleTree);

    _defineProperty(this, "elements", void 0);

    _defineProperty(this, "layers", void 0);

    this.elements = elements.filter(function (el) {
      return el;
    }).map(function (el) {
      return Buffer.from((0, _web3Utils.hexToBytes)(el));
    }); // Sort elements

    this.elements.sort(Buffer.compare); // Deduplicate elements

    this.elements = this.bufDedup(this.elements); // Create layers

    this.layers = this.getLayers(this.elements);
  }

  _createClass(MerkleTree, [{
    key: "getLayers",
    value: function getLayers(elements) {
      if (elements.length === 0) {
        return [['']];
      }

      var layers = [];
      layers.push(elements); // Get next layer until we reach the root

      while (layers[layers.length - 1].length > 1) {
        layers.push(this.getNextLayer(layers[layers.length - 1]));
      }

      return layers;
    }
  }, {
    key: "getNextLayer",
    value: function getNextLayer(elements) {
      var _this = this;

      return elements.reduce(function (layer, el, idx, arr) {
        if (idx % 2 === 0) {
          // Hash the current element with its pair element
          layer.push(_this.combinedHash(el, arr[idx + 1]));
        }

        return layer;
      }, []);
    }
  }, {
    key: "combinedHash",
    value: function combinedHash(first, second) {
      if (!first) {
        return second;
      }

      if (!second) {
        return first;
      }

      return (0, _ethereumjsUtil.keccak256)(this.sortAndConcat(first, second));
    }
  }, {
    key: "getRoot",
    value: function getRoot() {
      return this.layers[this.layers.length - 1][0];
    }
  }, {
    key: "getHexRoot",
    value: function getHexRoot() {
      return (0, _ethereumjsUtil.bufferToHex)(this.getRoot());
    }
  }, {
    key: "getProof",
    value: function getProof(el) {
      var _this2 = this;

      var idx = this.bufIndexOf(el, this.elements);

      if (idx === -1) {
        throw new Error('Element does not exist in Merkle tree');
      }

      return this.layers.reduce(function (proof, layer) {
        var pairElement = _this2.getPairElement(idx, layer);

        if (pairElement) {
          proof.push(pairElement);
        }

        idx = Math.floor(idx / 2);
        return proof;
      }, []);
    } // external call - convert to buffer

  }, {
    key: "getHexProof",
    value: function getHexProof(_el) {
      var el = Buffer.from((0, _web3Utils.hexToBytes)(_el));
      var proof = this.getProof(el);
      return this.bufArrToHexArr(proof);
    }
  }, {
    key: "getPairElement",
    value: function getPairElement(idx, layer) {
      var pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;

      if (pairIdx < layer.length) {
        return layer[pairIdx];
      } else {
        return null;
      }
    }
  }, {
    key: "bufIndexOf",
    value: function bufIndexOf(el, arr) {
      var hash; // Convert element to 32 byte hash if it is not one already

      if (el.length !== 32 || !Buffer.isBuffer(el)) {
        hash = (0, _ethereumjsUtil.keccakFromString)(el);
      } else {
        hash = el;
      }

      for (var i = 0; i < arr.length; i++) {
        if (hash.equals(arr[i])) {
          return i;
        }
      }

      return -1;
    }
  }, {
    key: "bufDedup",
    value: function bufDedup(elements) {
      return elements.filter(function (el, idx) {
        return idx === 0 || !elements[idx - 1].equals(el);
      });
    }
  }, {
    key: "bufArrToHexArr",
    value: function bufArrToHexArr(arr) {
      if (arr.some(function (el) {
        return !Buffer.isBuffer(el);
      })) {
        throw new Error('Array is not an array of buffers');
      }

      return arr.map(function (el) {
        return '0x' + el.toString('hex');
      });
    }
  }, {
    key: "sortAndConcat",
    value: function sortAndConcat() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return Buffer.concat([].concat(args).sort(Buffer.compare));
    }
  }]);

  return MerkleTree;
}();

exports.MerkleTree = MerkleTree;

function loadTree(balances) {
  var elements = [];
  Object.keys(balances).forEach(function (address) {
    var balance = (0, _web3Utils.toWei)(balances[address]);
    var leaf = (0, _web3Utils.soliditySha3)(address, balance);
    elements.push(leaf);
  });
  return new MerkleTree(elements);
}