"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ensureDirectoryExists = ensureDirectoryExists;
exports.pricesAvailable = pricesAvailable;
exports.readPrices = readPrices;
exports.writeBlockRewards = writeBlockRewards;
exports.writeData = void 0;
exports.writePools = writePools;
exports.writePrices = writePrices;

var _fs = _interopRequireDefault(require("fs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var writeData = function writeData(data, path) {
  try {
    _fs["default"].writeFileSync("./reports/".concat(path, ".json"), JSON.stringify(data, null, 4));
  } catch (err) {
    console.error(err);
  }
};

exports.writeData = writeData;

function ensureDirectoryExists(week) {
  !_fs["default"].existsSync("./reports/".concat(week, "/")) && _fs["default"].mkdirSync("./reports/".concat(week, "/"));
}

function pricesAvailable(week) {
  return _fs["default"].existsSync("./reports/".concat(week, "/_prices.json"));
}

function readPrices(week) {
  var jsonString = _fs["default"].readFileSync("./reports/".concat(week, "/_prices.json"));

  return JSON.parse(jsonString.toString());
}

function writePrices(week, prices) {
  var path = "/".concat(week, "/_prices");
  writeData(prices, path);
}

function writeBlockRewards(week, blockNum, blockRewards) {
  var path = "/".concat(week, "/").concat(blockNum);
  writeData(blockRewards, path);
}

function writePools(week, pools) {
  writeData(pools, "/".concat(week, "/_pools"));
}