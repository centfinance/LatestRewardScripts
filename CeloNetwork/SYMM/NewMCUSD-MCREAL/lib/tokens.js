"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uncappedTokens = exports.tokenCaps = exports.equivalentSets = exports.SYMM_TOKEN = exports.REP_TOKEN_V2 = exports.REP_TOKEN = void 0;

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var capTiers = require('../lib/whitelist');

var _require = require('./utils'),
    bnum = _require.bnum;

var SYMM_TOKEN = '0x7c64aD5F9804458B8c9F93f7300c15D55956Ac2a';
exports.SYMM_TOKEN = SYMM_TOKEN;
var uncappedTokens = Object.entries(capTiers).filter(function (_ref) {
  var _ref2 = _slicedToArray(_ref, 2),
      address = _ref2[0],
      capString = _ref2[1];

  return capString == 'uncapped';
}).map(function (_ref3) {
  var _ref4 = _slicedToArray(_ref3, 2),
      a = _ref4[0],
      c = _ref4[1];

  return a;
});
exports.uncappedTokens = uncappedTokens;
var CAP_TIERS = {
  cap1: bnum(1000000),
  cap2: bnum(3000000),
  cap3: bnum(10000000),
  cap4: bnum(30000000),
  cap5: bnum(100000000)
};
var tokenCaps = Object.entries(capTiers).reduce(function (aggregator, capTuple) {
  var address = capTuple[0];
  var capString = capTuple[1];

  if (capString !== 'uncapped') {
    aggregator[address] = CAP_TIERS[capString];
  }

  return aggregator;
}, {});
exports.tokenCaps = tokenCaps;
var equivalentSets = [];
exports.equivalentSets = equivalentSets;
var REP_TOKEN = '0x1985365e9f78359a9B6AD760e32412f4a445E862';
exports.REP_TOKEN = REP_TOKEN;
var REP_TOKEN_V2 = '0x221657776846890989a759BA2973e427DfF5C9bB';
exports.REP_TOKEN_V2 = REP_TOKEN_V2;