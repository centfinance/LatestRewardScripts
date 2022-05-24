"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bnum = bnum;
exports.fetchTokenPrices = fetchTokenPrices;
exports.fetchWhitelist = fetchWhitelist;
exports.scale = void 0;

var _bignumber = _interopRequireDefault(require("bignumber.js"));

var _web = _interopRequireDefault(require("web3"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

require('dotenv').config();

var ENDPOINT = process.env.ENDPOINT_URL || 'ws://localhost:8546';
var web3 = new _web["default"](new _web["default"].providers.WebsocketProvider(ENDPOINT));

_bignumber["default"].config({
  EXPONENTIAL_AT: [-100, 100],
  ROUNDING_MODE: _bignumber["default"].ROUND_DOWN,
  DECIMAL_PLACES: 18
});

function bnum(val) {
  return new _bignumber["default"](val.toString());
}

var MARKET_API_URL = process.env.MARKET_API_URL || 'https://api.coingecko.com/api/v3';

var scale = function scale(input, decimalPlaces) {
  var scalePow = new _bignumber["default"](decimalPlaces);
  var scaleMul = new _bignumber["default"](10).pow(scalePow);
  return new _bignumber["default"](input).times(scaleMul);
};

exports.scale = scale;

function sleep(ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
}

function fetchWhitelist() {
  return _fetchWhitelist.apply(this, arguments);
}

function _fetchWhitelist() {
  _fetchWhitelist = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var response, whitelistResponse;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return fetch("https://symmetricrewardstorage.blob.core.windows.net/newcontainer/eligible-sushi-cusd.json", {
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              }
            });

          case 2:
            response = _context.sent;
            _context.next = 5;
            return response.json();

          case 5:
            whitelistResponse = _context.sent;
            return _context.abrupt("return", whitelistResponse.celo);

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _fetchWhitelist.apply(this, arguments);
}

function fetchTokenPrices(_x, _x2, _x3, _x4) {
  return _fetchTokenPrices.apply(this, arguments);
}

function _fetchTokenPrices() {
  _fetchTokenPrices = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(allTokens, startTime, endTime, priceProgress) {
    var prices, _i, _Object$keys, tokenAddress, originalTokenAddress, bSubstituted, query, response, priceResponse;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            prices = {};
            _i = 0, _Object$keys = Object.keys(allTokens);

          case 2:
            if (!(_i < _Object$keys.length)) {
              _context2.next = 28;
              break;
            }

            tokenAddress = _Object$keys[_i];
            originalTokenAddress = tokenAddress;
            /* const address = tokenAddress
                 ? web3.utils.toChecksumAddress(tokenAddress)
                 : null;*/
            //     const address = tokenAddress;

            if (tokenAddress) {
              _context2.next = 7;
              break;
            }

            return _context2.abrupt("continue", 25);

          case 7:
            bSubstituted = false;

            if (tokenAddress == 'symmetricopticsv2') {
              bSubstituted = true;
              tokenAddress = 'symmetric';
            }

            if (tokenAddress == 'celo-euro') {
              bSubstituted = true;
              tokenAddress = 'tether-eurt';
            }

            if (tokenAddress == 'moolacusd') {
              bSubstituted = true;
              tokenAddress = 'celo-dollar';
            }

            if (tokenAddress == 'wrapped-bitcoin-optics-v1') {
              bSubstituted = true;
              tokenAddress = 'wrapped-bitcoin';
            }

            if (tokenAddress == 'wrapped-bitcoin-optics-v2') {
              bSubstituted = true;
              tokenAddress = 'wrapped-bitcoin';
            }

            if (tokenAddress == 'weth-optics-v1') {
              bSubstituted = true;
              tokenAddress = 'weth';
            }

            if (tokenAddress == 'weth-optics-v2') {
              bSubstituted = true;
              tokenAddress = 'weth';
            }

            query = "coins/".concat(tokenAddress, "/market_chart/range?&vs_currency=usd&from=").concat(startTime, "&to=").concat(endTime);
            _context2.next = 18;
            return fetch("".concat(MARKET_API_URL, "/").concat(query), {
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              }
            });

          case 18:
            response = _context2.sent;
            _context2.next = 21;
            return response.json();

          case 21:
            priceResponse = _context2.sent;
            if (bSubstituted) prices[originalTokenAddress] = priceResponse.prices;else prices[tokenAddress] = priceResponse.prices;
            prices[tokenAddress] = priceResponse.prices;
            priceProgress.increment(); // Sleep between requests to prevent rate-limiting
            //        await sleep(1000);

          case 25:
            _i++;
            _context2.next = 2;
            break;

          case 28:
            priceProgress.stop();
            return _context2.abrupt("return", prices);

          case 30:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _fetchTokenPrices.apply(this, arguments);
}