"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchTotalSupply = exports.fetchTokenDenormWeight = exports.fetchTokenBalanceOf = exports.fetchBalanceOf = exports.fetchAllPools = void 0;

var _isomorphicFetch = _interopRequireDefault(require("isomorphic-fetch"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var SUBGRAPH_URL = process.env.SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/centfinance/cent-swap-celo';

var fetchAllPools = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(web3Utils, block) {
    var poolResults, skip, paginatePools, query, response, _yield$response$json, data, finalResults, _iterator, _step, pool, paginateShares, shareSkip, shareResults, _query, _response, _yield$_response$json, _data, newShareHolders;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            poolResults = [];
            skip = 0;
            paginatePools = true; // MCREAL pool

          case 3:
            if (!paginatePools) {
              _context.next = 21;
              break;
            }

            query = "\n            {\n                pools (where: { id_in: [\"0xfd26c200f6eed5ab14e1114121cfa216c24075d7\"]},\n                    first: 1000, skip: ".concat(skip, ", block: { number: ").concat(block, " } ) {\n                    id\n                    publicSwap\n                    swapFee\n                    controller\n                    createTime\n                    tokensList\n                    totalShares\n                    shares (first: 1000) {\n                        userAddress {\n                            id\n                        }\n                    }\n                }\n            }\n        ");
            _context.next = 7;
            return (0, _isomorphicFetch["default"])(SUBGRAPH_URL, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: query
              })
            });

          case 7:
            response = _context.sent;
            _context.next = 10;
            return response.json();

          case 10:
            _yield$response$json = _context.sent;
            data = _yield$response$json.data;
            poolResults = poolResults.concat(data.pools);

            if (!(data.pools.length < 1000)) {
              _context.next = 17;
              break;
            }

            paginatePools = false;
            _context.next = 19;
            break;

          case 17:
            skip += 1000;
            return _context.abrupt("continue", 3);

          case 19:
            _context.next = 3;
            break;

          case 21:
            finalResults = [];
            _iterator = _createForOfIteratorHelper(poolResults);
            _context.prev = 23;

            _iterator.s();

          case 25:
            if ((_step = _iterator.n()).done) {
              _context.next = 62;
              break;
            }

            pool = _step.value;
            pool.shareHolders = pool.shares.map(function (a) {
              return web3Utils.toChecksumAddress(a.userAddress.id);
            });

            if (!(pool.shareHolders.length == 1000)) {
              _context.next = 57;
              break;
            }

            paginateShares = true;
            shareSkip = 0;
            shareResults = [];

          case 32:
            if (!paginateShares) {
              _context.next = 51;
              break;
            }

            _query = "\n                    {\n                        pools (where: { id: \"".concat(pool.id, "\"}, block: { number: ").concat(block, " }) {\n                            shares (first: 1000, skip: ").concat(shareSkip, ") {\n                                userAddress {\n                                    id\n                                }\n                            }\n                        }\n                    }\n                ");
            _context.next = 36;
            return (0, _isomorphicFetch["default"])(SUBGRAPH_URL, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: _query
              })
            });

          case 36:
            _response = _context.sent;
            _context.next = 39;
            return _response.json();

          case 39:
            _yield$_response$json = _context.sent;
            _data = _yield$_response$json.data;
            newShareHolders = _data.pools[0].shares.map(function (a) {
              return web3Utils.toChecksumAddress(a.userAddress.id);
            });
            shareResults = shareResults.concat(newShareHolders);

            if (!(newShareHolders.length < 1000)) {
              _context.next = 47;
              break;
            }

            paginateShares = false;
            _context.next = 49;
            break;

          case 47:
            shareSkip += 1000;
            return _context.abrupt("continue", 32);

          case 49:
            _context.next = 32;
            break;

          case 51:
            pool.shareHolders = shareResults;
            pool.controller = web3Utils.toChecksumAddress(pool.controller);
            delete pool.shares;
            finalResults.push(pool);
            _context.next = 60;
            break;

          case 57:
            delete pool.shares;
            pool.controller = web3Utils.toChecksumAddress(pool.controller);
            finalResults.push(pool);

          case 60:
            _context.next = 25;
            break;

          case 62:
            _context.next = 67;
            break;

          case 64:
            _context.prev = 64;
            _context.t0 = _context["catch"](23);

            _iterator.e(_context.t0);

          case 67:
            _context.prev = 67;

            _iterator.f();

            return _context.finish(67);

          case 70:
            return _context.abrupt("return", finalResults);

          case 71:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[23, 64, 67, 70]]);
  }));

  return function fetchAllPools(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

exports.fetchAllPools = fetchAllPools;

var fetchTotalSupply = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(web3Utils, block) {
    var poolResults, query, response, _yield$response$json2, data;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            poolResults = [];
            query = "\n            {\n                pools (where: { id_in: [\"0xfd26c200f6eed5ab14e1114121cfa216c24075d7\"]},\n                    first: 1000, block: { number: ".concat(block, " } ) {\n                    totalShares\n                }\n            }\n        ");
            _context2.next = 4;
            return (0, _isomorphicFetch["default"])(SUBGRAPH_URL, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: query
              })
            });

          case 4:
            response = _context2.sent;
            _context2.next = 7;
            return response.json();

          case 7:
            _yield$response$json2 = _context2.sent;
            data = _yield$response$json2.data;
            return _context2.abrupt("return", data.pools[0].totalShares);

          case 10:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function fetchTotalSupply(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

exports.fetchTotalSupply = fetchTotalSupply;

var fetchBalanceOf = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(web3Utils, block, lp, poolAddress) {
    var poolResults, query, response, _yield$response$json3, data, returnVal;

    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            poolResults = [];
            query = "\n            {\n            poolShares(first: 1000, block: { number: ".concat(block, " }, where: {userAddress: \"").concat(lp.toLowerCase(), "\", poolId: \"").concat(poolAddress.toLowerCase(), "\"})\n            {\n              id\n              userAddress {\n                id\n              }\n              balance\n            }\n          }\n          ");
            _context3.next = 4;
            return (0, _isomorphicFetch["default"])(SUBGRAPH_URL, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: query
              })
            });

          case 4:
            response = _context3.sent;
            _context3.next = 7;
            return response.json();

          case 7:
            _yield$response$json3 = _context3.sent;
            data = _yield$response$json3.data;
            returnVal = 0;

            if (data.poolShares.length > 0) {
              returnVal = data.poolShares[0].balance;
            }

            return _context3.abrupt("return", returnVal);

          case 12:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function fetchBalanceOf(_x5, _x6, _x7, _x8) {
    return _ref3.apply(this, arguments);
  };
}();

exports.fetchBalanceOf = fetchBalanceOf;

var fetchTokenBalanceOf = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(block, poolAddress, tokenAddress) {
    var poolResults, query, response, _yield$response$json4, data;

    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            poolResults = [];
            query = "\n        {\n            poolTokens(first: 1, block: { number: ".concat(block.number, " }, where: {address: \"").concat(tokenAddress.toLowerCase(), "\", poolId: \"").concat(poolAddress.toLowerCase(), "\" }) {\n              id\n              symbol\n              poolId {\n                id\n              }\n              address\n              balance\n              denormWeight\n            }\n            }\n        ");
            _context4.next = 4;
            return (0, _isomorphicFetch["default"])(SUBGRAPH_URL, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: query
              })
            });

          case 4:
            response = _context4.sent;
            _context4.next = 7;
            return response.json();

          case 7:
            _yield$response$json4 = _context4.sent;
            data = _yield$response$json4.data;
            return _context4.abrupt("return", data.poolTokens[0].balance);

          case 10:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function fetchTokenBalanceOf(_x9, _x10, _x11) {
    return _ref4.apply(this, arguments);
  };
}();

exports.fetchTokenBalanceOf = fetchTokenBalanceOf;

var fetchTokenDenormWeight = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(block, poolAddress, tokenAddress) {
    var poolResults, query, response, _yield$response$json5, data;

    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            poolResults = [];
            query = "\n        {\n            poolTokens(first: 1, block: { number: ".concat(block.number, " }, where: {address: \"").concat(tokenAddress.toLowerCase(), "\", poolId: \"").concat(poolAddress.toLowerCase(), "\" }) {\n              id\n              symbol\n              poolId {\n                id\n              }\n              address\n              balance\n              denormWeight\n            }\n            }\n        ");
            _context5.next = 4;
            return (0, _isomorphicFetch["default"])(SUBGRAPH_URL, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: query
              })
            });

          case 4:
            response = _context5.sent;
            _context5.next = 7;
            return response.json();

          case 7:
            _yield$response$json5 = _context5.sent;
            data = _yield$response$json5.data;
            return _context5.abrupt("return", data.poolTokens[0].denormWeight);

          case 10:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));

  return function fetchTokenDenormWeight(_x12, _x13, _x14) {
    return _ref5.apply(this, arguments);
  };
}();

exports.fetchTokenDenormWeight = fetchTokenDenormWeight;