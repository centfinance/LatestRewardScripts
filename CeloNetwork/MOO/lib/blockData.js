"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getNewBalMultiplier = getNewBalMultiplier;
exports.getPoolDataAtBlock = getPoolDataAtBlock;
exports.processPoolData = processPoolData;
exports.sumAdjustedTokenLiquidities = sumAdjustedTokenLiquidities;

var _poolData = require("./poolData");

var _tokens = require("./tokens");

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var _require = require('./utils'),
    scale = _require.scale,
    bnum = _require.bnum;

var _require2 = require('./users'),
    BLACKLISTED_SHAREHOLDERS = _require2.BLACKLISTED_SHAREHOLDERS;

var TEMP_BAL_MULTIPLIER = bnum(3);

function getNewBalMultiplier(finalLiquidity, liquidityPreStaking, tempLiquidity) {
  var tempBalMultiplier = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : TEMP_BAL_MULTIPLIER;
  var desiredLiquidityIncrease = finalLiquidity.minus(liquidityPreStaking);
  var tempLiquidityIncrease = tempLiquidity.minus(liquidityPreStaking); // edge case if the liquidity was not increased (no eligible pools)

  if (tempLiquidityIncrease.toNumber() == 0) {
    return tempBalMultiplier;
  }

  return bnum(1.0).plus(desiredLiquidityIncrease.div(tempLiquidityIncrease).times(tempBalMultiplier.minus(bnum(1.0))));
}

function sumAdjustedTokenLiquidities(pools) {
  return pools.reduce(function (aggregator, poolData) {
    var tokens = poolData.tokens,
        eligibleTotalWeight = poolData.eligibleTotalWeight,
        adjustedPoolLiquidity = poolData.adjustedPoolLiquidity;

    var _iterator = _createForOfIteratorHelper(tokens),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var r = _step.value;
        // value of token in pool
        var tokenLiquidityWithCap = r.normWeight.div(eligibleTotalWeight).times(adjustedPoolLiquidity);
        aggregator[r.token] = (aggregator[r.token] || bnum(0)).plus(tokenLiquidityWithCap);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    return aggregator;
  }, {});
}

function getPoolDataAtBlock(_x, _x2, _x3, _x4, _x5, _x6) {
  return _getPoolDataAtBlock.apply(this, arguments);
}

function _getPoolDataAtBlock() {
  _getPoolDataAtBlock = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(web3, blockNum, pools, prices, tokenDecimals, poolProgress) {
    var block, allPoolData, _iterator2, _step2, pool, result, skipReason, poolData;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return web3.eth.getBlock(blockNum);

          case 2:
            block = _context.sent;
            // All the pools that will be included in the calculation
            allPoolData = []; // multiple derivative pools per real pool that are subdivided by whether
            // they contain BAL held by non-shareholders and shareholders
            // Gather data on all eligible pools

            _iterator2 = _createForOfIteratorHelper(pools);
            _context.prev = 5;

            _iterator2.s();

          case 7:
            if ((_step2 = _iterator2.n()).done) {
              _context.next = 20;
              break;
            }

            pool = _step2.value;
            _context.next = 11;
            return (0, _poolData.getPoolInvariantData)(web3, prices, tokenDecimals, block, pool);

          case 11:
            result = _context.sent;
            // this should return one or two pools (Nonstaking or [Shareholder, Nonshareholder]
            poolProgress.increment(1);
            skipReason = result;

            if (!(skipReason.privateSwap || skipReason.unpriceable || skipReason.notCreatedByBlock)) {
              _context.next = 16;
              break;
            }

            return _context.abrupt("continue", 18);

          case 16:
            poolData = result;
            allPoolData = allPoolData.concat(poolData.pools);

          case 18:
            _context.next = 7;
            break;

          case 20:
            _context.next = 25;
            break;

          case 22:
            _context.prev = 22;
            _context.t0 = _context["catch"](5);

            _iterator2.e(_context.t0);

          case 25:
            _context.prev = 25;

            _iterator2.f();

            return _context.finish(25);

          case 28:
            return _context.abrupt("return", allPoolData);

          case 29:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[5, 22, 25, 28]]);
  }));
  return _getPoolDataAtBlock.apply(this, arguments);
}

function processPoolData(_x7) {
  return _processPoolData.apply(this, arguments);
}

function _processPoolData() {
  _processPoolData = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(poolDatas) {
    var firstPassPools, adjustedLiquidityPreTokenCap, tokenCapFactors, _i, _Object$entries, _Object$entries$_i, tokenAddress, totalLiquidity, uncapped, tokenCap, tokenCapFactor, tokenTotalLiquidities, _i2, _Object$entries2, _Object$entries2$_i, _tokenAddress, _tokenCapFactor, secondPassPools, secondPassPoolsWithBalMultiplier, totalBalancerLiquidity, totalBalancerLiquidityTemp, targetFinalLiquidity, newBalMultiplier, finalPoolsWithBalMultiplier, finalBalancerLiquidity;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            //////////////////////////////////////////////////////////////////
            // FIRST PASS - calculate variant data with balMultiplier = 1
            //////////////////////////////////////////////////////////////////
            firstPassPools = poolDatas.map(function (p) {
              var variantFactors = (0, _poolData.getPoolVariantData)(p, bnum(1.0));
              return _objectSpread(_objectSpread({}, p), variantFactors);
            }); // Sum the adjusted liquidity of each token from it's presence in each pool

            adjustedLiquidityPreTokenCap = sumAdjustedTokenLiquidities(firstPassPools); // Calculate token cap factors

            tokenCapFactors = {};

            for (_i = 0, _Object$entries = Object.entries(adjustedLiquidityPreTokenCap); _i < _Object$entries.length; _i++) {
              _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2), tokenAddress = _Object$entries$_i[0], totalLiquidity = _Object$entries$_i[1];
              uncapped = _tokens.uncappedTokens.includes(tokenAddress);
              tokenCap = _tokens.tokenCaps[tokenAddress];

              if (!uncapped && totalLiquidity.gt(tokenCap)) {
                tokenCapFactor = tokenCap.div(totalLiquidity);
                tokenCapFactors[tokenAddress] = tokenCapFactor;
              } else {
                tokenCapFactors[tokenAddress] = bnum(1);
              }
            } // Capped token liquidities


            tokenTotalLiquidities = {};

            for (_i2 = 0, _Object$entries2 = Object.entries(tokenCapFactors); _i2 < _Object$entries2.length; _i2++) {
              _Object$entries2$_i = _slicedToArray(_Object$entries2[_i2], 2), _tokenAddress = _Object$entries2$_i[0], _tokenCapFactor = _Object$entries2$_i[1];
              tokenTotalLiquidities[_tokenAddress] = _tokenCapFactor.times(adjustedLiquidityPreTokenCap[_tokenAddress]);
            } //////////////////////////////////////////////////////////////////
            // SECOND PASS
            //////////////////////////////////////////////////////////////////


            secondPassPools = poolDatas.map(function (p) {
              var variantFactors = (0, _poolData.getPoolVariantData)(p, bnum(1.0), tokenCapFactors);
              return _objectSpread(_objectSpread({}, p), variantFactors);
            });
            secondPassPoolsWithBalMultiplier = poolDatas.map(function (p) {
              var balMultiplier = p.canReceiveBoost ? TEMP_BAL_MULTIPLIER : bnum(1.0);
              var variantFactors = (0, _poolData.getPoolVariantData)(p, balMultiplier, tokenCapFactors);
              return _objectSpread(_objectSpread({}, p), variantFactors);
            }); // Sum the liquidity of each token from it's presence in each pool

            totalBalancerLiquidity = secondPassPools.reduce(function (aggregator, pool) {
              return aggregator.plus(pool.adjustedPoolLiquidity);
            }, bnum(0));
            totalBalancerLiquidityTemp = secondPassPoolsWithBalMultiplier.reduce(function (aggregator, pool) {
              return aggregator.plus(pool.adjustedPoolLiquidity);
            }, bnum(0));
            targetFinalLiquidity = totalBalancerLiquidity.div(bnum(1).minus(bnum(400).div(bnum(4153.8461))) // why div by 45000 / 145000
            );
            newBalMultiplier = getNewBalMultiplier(targetFinalLiquidity, totalBalancerLiquidity, totalBalancerLiquidityTemp, TEMP_BAL_MULTIPLIER);
            console.log('\nLiquidity Pre Staking:\t', totalBalancerLiquidity.toNumber(), '\nTarget Adjusted Liquidity:\t', targetFinalLiquidity.toNumber(), '\nTemp Adjusted Liquidity:\t', totalBalancerLiquidityTemp.toNumber(), '\nNew Bal Multiplier:\n', newBalMultiplier.toNumber(), '\n'); //////////////////////////////////////////////////////////////////
            // FINAL PASS
            //////////////////////////////////////////////////////////////////

            finalPoolsWithBalMultiplier = poolDatas.map(function (p) {
              var balMultiplier = p.canReceiveBoost ? newBalMultiplier : bnum(1.0);
              var variantFactors = (0, _poolData.getPoolVariantData)(p, balMultiplier, tokenCapFactors);
              return _objectSpread(_objectSpread({}, p), variantFactors);
            });
            finalBalancerLiquidity = finalPoolsWithBalMultiplier.reduce(function (aggregator, pool) {
              return aggregator.plus(pool.adjustedPoolLiquidity);
            }, bnum(0)); //if (
            //finalBalancerLiquidity.minus(targetFinalLiquidity).abs().gt(bnum(0.01))
            //) {
            //// Note that this can happen if no pools are boostable
            //throw 'Final Balancer Liquidity does not match target';
            //}

            console.log("tokenTotalLiquidities: ".concat(JSON.stringify(tokenTotalLiquidities))); // console.log(`finalPoolsWithBalMultiplier: ${JSON.stringify(finalPoolsWithBalMultiplier)}`);

            console.log("tokenCapFactors: ".concat(JSON.stringify(tokenCapFactors)));
            return _context2.abrupt("return", {
              tokenTotalLiquidities: tokenTotalLiquidities,
              finalPoolsWithBalMultiplier: finalPoolsWithBalMultiplier,
              tokenCapFactors: tokenCapFactors
            });

          case 18:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _processPoolData.apply(this, arguments);
}