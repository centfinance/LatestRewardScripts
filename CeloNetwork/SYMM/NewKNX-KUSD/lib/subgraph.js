"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchAllPools = void 0;

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
            paginatePools = true;

          case 3:
            if (!paginatePools) {
              _context.next = 22;
              break;
            }

            query = "\n            {\n                pools (where: { id_in: [\"0x1d7106c08365ccd823b90201cc2d3d3e1335870f\"]},\n                    first: 1000, skip: ".concat(skip, ", block: { number: ").concat(block, " } ) {\n                    id\n                    publicSwap\n                    swapFee\n                    controller\n                    createTime\n                    tokensList\n                    totalShares\n                    shares (first: 1000) {\n                        userAddress {\n                            id\n                        }\n                    }\n                }\n            }\n        ");
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
            console.log("Pools Fetched Response: ".concat(JSON.stringify(response)));
            _context.next = 11;
            return response.json();

          case 11:
            _yield$response$json = _context.sent;
            data = _yield$response$json.data;
            poolResults = poolResults.concat(data.pools);

            if (!(data.pools.length < 1000)) {
              _context.next = 18;
              break;
            }

            paginatePools = false;
            _context.next = 20;
            break;

          case 18:
            skip += 1000;
            return _context.abrupt("continue", 3);

          case 20:
            _context.next = 3;
            break;

          case 22:
            finalResults = [];
            _iterator = _createForOfIteratorHelper(poolResults);
            _context.prev = 24;

            _iterator.s();

          case 26:
            if ((_step = _iterator.n()).done) {
              _context.next = 63;
              break;
            }

            pool = _step.value;
            pool.shareHolders = pool.shares.map(function (a) {
              return web3Utils.toChecksumAddress(a.userAddress.id);
            });

            if (!(pool.shareHolders.length == 1000)) {
              _context.next = 58;
              break;
            }

            paginateShares = true;
            shareSkip = 0;
            shareResults = [];

          case 33:
            if (!paginateShares) {
              _context.next = 52;
              break;
            }

            _query = "\n                    {\n                        pools (where: { id: \"".concat(pool.id, "\"}, block: { number: ").concat(block, " }) {\n                            shares (first: 1000, skip: ").concat(shareSkip, ") {\n                                userAddress {\n                                    id\n                                }\n                            }\n                        }\n                    }\n                ");
            _context.next = 37;
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

          case 37:
            _response = _context.sent;
            _context.next = 40;
            return _response.json();

          case 40:
            _yield$_response$json = _context.sent;
            _data = _yield$_response$json.data;
            newShareHolders = _data.pools[0].shares.map(function (a) {
              return web3Utils.toChecksumAddress(a.userAddress.id);
            });
            shareResults = shareResults.concat(newShareHolders);

            if (!(newShareHolders.length < 1000)) {
              _context.next = 48;
              break;
            }

            paginateShares = false;
            _context.next = 50;
            break;

          case 48:
            shareSkip += 1000;
            return _context.abrupt("continue", 33);

          case 50:
            _context.next = 33;
            break;

          case 52:
            pool.shareHolders = shareResults;
            pool.controller = web3Utils.toChecksumAddress(pool.controller);
            delete pool.shares;
            finalResults.push(pool);
            _context.next = 61;
            break;

          case 58:
            delete pool.shares;
            pool.controller = web3Utils.toChecksumAddress(pool.controller);
            finalResults.push(pool);

          case 61:
            _context.next = 26;
            break;

          case 63:
            _context.next = 68;
            break;

          case 65:
            _context.prev = 65;
            _context.t0 = _context["catch"](24);

            _iterator.e(_context.t0);

          case 68:
            _context.prev = 68;

            _iterator.f();

            return _context.finish(68);

          case 71:
            return _context.abrupt("return", finalResults);

          case 72:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[24, 65, 68, 71]]);
  }));

  return function fetchAllPools(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

exports.fetchAllPools = fetchAllPools;