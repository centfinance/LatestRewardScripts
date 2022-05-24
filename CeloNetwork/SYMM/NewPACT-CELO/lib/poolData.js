"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPoolBalances = getPoolBalances;
exports.getPoolInvariantData = getPoolInvariantData;
exports.getPoolVariantData = getPoolVariantData;
exports.poolLiquidity = poolLiquidity;
exports.splitLiquidityProviders = splitLiquidityProviders;

var _tokens = require("./tokens");

var _users = require("./users");

var _bignumber = _interopRequireDefault(require("bignumber.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var poolAbi = require('../abi/BPool.json');

var _require = require('./utils'),
    bnum = _require.bnum,
    scale = _require.scale;

var addressMaps = require('../lib/mappedlist');

var _require2 = require('./factors'),
    getFeeFactor = _require2.getFeeFactor,
    getBalFactor = _require2.getBalFactor,
    getBalAndRatioFactor = _require2.getBalAndRatioFactor,
    getWrapFactor = _require2.getWrapFactor;

_bignumber["default"].config({
  EXPONENTIAL_AT: [-100, 100],
  ROUNDING_MODE: _bignumber["default"].ROUND_DOWN,
  DECIMAL_PLACES: 18
});

function atLeastTwoTokensHavePrice(tokens, prices) {
  var nTokensHavePrice = 0;

  var _iterator = _createForOfIteratorHelper(tokens),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var token = _step.value;
      console.log("TOKEN TOKEN : ".concat(token.tokenId, " -- ").concat(token.tokenId));

      if (prices[token.tokenId] !== undefined && prices[token.tokenId].length > 0) {
        nTokensHavePrice++;

        if (nTokensHavePrice > 1) {
          return true;
        }
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  return false;
}

function poolCreatedByBlock(pool, block) {
  return pool.createTime < block.timestamp && pool.tokensList;
}

function closestPrice(token, timestamp, prices) {
  var price = prices[token].reduce(function (a, b) {
    return Math.abs(b[0] - timestamp * 1000) < Math.abs(a[0] - timestamp * 1000) ? b : a;
  })[1];
  return bnum(price);
}

function tokenMetrics(_x, _x2, _x3, _x4, _x5) {
  return _tokenMetrics.apply(this, arguments);
}

function _tokenMetrics() {
  _tokenMetrics = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(bPool, tokens, tokenDecimals, prices, block) {
    var tokenData, _iterator2, _step2, token, hasPrice, bTokenDecimals, tokenBalanceWei, normWeight, tokenBalance, price, origLiquidity;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            tokenData = [];
            _iterator2 = _createForOfIteratorHelper(tokens);
            _context2.prev = 2;

            _iterator2.s();

          case 4:
            if ((_step2 = _iterator2.n()).done) {
              _context2.next = 29;
              break;
            }

            token = _step2.value;
            console.log("TOKEN: ".concat(JSON.stringify(token))); // Skip token if it doesn't have a price

            hasPrice = !(prices[token.tokenId] === undefined || prices[token.tokenId].length === 0);

            if (hasPrice) {
              _context2.next = 10;
              break;
            }

            return _context2.abrupt("continue", 27);

          case 10:
            bTokenDecimals = tokenDecimals[token.currentChainAddress];
            console.log("bTokenDecimals: ".concat(bTokenDecimals));
            _context2.next = 14;
            return bPool.methods.getBalance(token.currentChainAddress).call(undefined, block.number);

          case 14:
            tokenBalanceWei = _context2.sent;
            console.log("tokenBalanceWei: ".concat(tokenBalanceWei));
            _context2.next = 18;
            return bPool.methods.getNormalizedWeight(token.currentChainAddress).call(undefined, block.number);

          case 18:
            normWeight = _context2.sent;
            console.log("normWeight: ".concat(normWeight)); // may be null if no tokens have been added

            tokenBalance = scale(tokenBalanceWei || 0, -bTokenDecimals);
            console.log("tokenBalance: ".concat(tokenBalance));
            price = bnum(closestPrice(token.tokenId, block.timestamp, prices));
            console.log("price: ".concat(price));
            origLiquidity = tokenBalance.times(price).dp(18);
            console.log("origLiq: ".concat(origLiquidity));
            tokenData.push({
              token: token.currentChainAddress,
              origLiquidity: origLiquidity,
              price: price,
              normWeight: scale(normWeight, -18)
            });

          case 27:
            _context2.next = 4;
            break;

          case 29:
            _context2.next = 34;
            break;

          case 31:
            _context2.prev = 31;
            _context2.t0 = _context2["catch"](2);

            _iterator2.e(_context2.t0);

          case 34:
            _context2.prev = 34;

            _iterator2.f();

            return _context2.finish(34);

          case 37:
            return _context2.abrupt("return", tokenData);

          case 38:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[2, 31, 34, 37]]);
  }));
  return _tokenMetrics.apply(this, arguments);
}

// THis method should return either [[allLPs]] or [[nonshareholders], [liquidityProviders]] depending on whether the pool needs to be split or not
function splitLiquidityProviders(poolLiquidityProviders, poolTokens) {
  var includesBal = poolTokens.includes(_tokens.SYMM_TOKEN);
  var includesUncappedTokenPair = poolTokens.reduce(function (found, token) {
    return found || token !== _tokens.SYMM_TOKEN && _tokens.uncappedTokens.includes(token);
  }, false);

  if (includesBal && includesUncappedTokenPair) {
    var shareholderBlacklist = new Set(_users.BLACKLISTED_SHAREHOLDERS);
    var shareHolderLiquidityProviders = poolLiquidityProviders.filter(function (lp) {
      return shareholderBlacklist.has(lp);
    });
    var nonshareholderLiquidityProviders = poolLiquidityProviders.filter(function (lp) {
      return !shareholderBlacklist.has(lp);
    });
    return [nonshareholderLiquidityProviders, shareHolderLiquidityProviders];
  }

  return [poolLiquidityProviders];
}

function getPoolBalances(bPool, blockNum, liquidityProviders) {
  return Promise.all(liquidityProviders.map( /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(lp) {
      var userBalanceWei, userBalance;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return bPool.methods.balanceOf(lp).call(undefined, blockNum);

            case 2:
              userBalanceWei = _context.sent;
              userBalance = scale(userBalanceWei, -18);
              return _context.abrupt("return", userBalance);

            case 5:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x6) {
      return _ref.apply(this, arguments);
    };
  }()));
}

function getPoolInvariantData(_x7, _x8, _x9, _x10, _x11) {
  return _getPoolInvariantData.apply(this, arguments);
}

function _getPoolInvariantData() {
  _getPoolInvariantData = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(web3, prices, tokenDecimals, block, pool) {
    var tokenCapFactors,
        bPool,
        publicSwap,
        currentTokens,
        bptSupplyWei,
        bptSupply,
        poolTokens,
        mappedlist,
        filteredMappedList,
        poolLiquidityProviders,
        subpoolLiquidityProviders,
        subpoolBalances,
        subpoolTotalBalances,
        subpoolWeights,
        tokenData,
        originalPoolLiquidity,
        eligibleTotalWeight,
        normWeights,
        poolFee,
        feeFactor,
        commonFactors,
        lpBalances,
        nonstakingPool,
        pools,
        hasNonshareholderPool,
        liquidity,
        bptSupplySubpool,
        hasShareholderPool,
        _liquidity,
        _bptSupplySubpool,
        _args3 = arguments;

    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            tokenCapFactors = _args3.length > 5 && _args3[5] !== undefined ? _args3[5] : {};

            if (poolCreatedByBlock(pool, block)) {
              _context3.next = 3;
              break;
            }

            return _context3.abrupt("return", {
              notCreatedByBlock: true
            });

          case 3:
            bPool = new web3.eth.Contract(poolAbi, pool.id);
            _context3.next = 6;
            return bPool.methods.isPublicSwap().call(undefined, block.number);

          case 6:
            publicSwap = _context3.sent;

            if (publicSwap) {
              _context3.next = 9;
              break;
            }

            return _context3.abrupt("return", {
              privateSwap: true
            });

          case 9:
            _context3.next = 11;
            return bPool.methods.getCurrentTokens().call(undefined, block.number);

          case 11:
            currentTokens = _context3.sent;
            _context3.next = 14;
            return bPool.methods.totalSupply().call(undefined, block.number);

          case 14:
            bptSupplyWei = _context3.sent;
            bptSupply = scale(bptSupplyWei, -18);
            poolTokens = currentTokens.map(function (pt) {
              return web3.utils.toChecksumAddress(pt);
            }); // TODO:  get mapped eth address for pool tokens
            //console.log(`poolTokens: ${JSON.stringify(poolTokens)}`);

            mappedlist = eval(addressMaps.celoEthMap);
            filteredMappedList = mappedlist.filter(function (l) {
              return poolTokens.includes(l.currentChainAddress);
            }); //ethTokens.filter(pTokens => poolTokens.includes(pTokens));
            //console.log(`Filtered List...`);
            //console.log(opObj);
            // If the pool is unpriceable, we cannot calculate any rewards

            if (atLeastTwoTokensHavePrice(filteredMappedList, prices)) {
              _context3.next = 21;
              break;
            }

            return _context3.abrupt("return", {
              unpriceable: true
            });

          case 21:
            console.log('Got Prices');
            poolLiquidityProviders = pool.shareHolders.map(function (lp) {
              return web3.utils.toChecksumAddress(lp);
            }); // determine if the pool should be split up
            // based on pool and lp composition and get the balances of the providers in
            // the pool

            subpoolLiquidityProviders = splitLiquidityProviders(poolLiquidityProviders, poolTokens); // bpt held by each lp

            _context3.next = 26;
            return Promise.all(subpoolLiquidityProviders.map(function (lps) {
              return getPoolBalances(bPool, block.number, lps);
            }));

          case 26:
            subpoolBalances = _context3.sent;
            // total bpt held by nonshareholders, shareholders
            subpoolTotalBalances = subpoolBalances.map(function (spBals) {
              return spBals.reduce(function (sum, bal) {
                return sum.plus(bal);
              }, bnum(0));
            });
            subpoolWeights = subpoolTotalBalances.map(function (totalSubpoolBpt) {
              return bptSupplyWei > 0 ? // TOTAL
              totalSubpoolBpt.div(bptSupply) : // if bptSupply is 0 in the case of a private pool, sum to 1
              bnum(1).div(subpoolLiquidityProviders.length);
            }); // calculate these values for both subpools if relevant

            _context3.next = 31;
            return tokenMetrics(bPool, filteredMappedList, //poolsToken
            tokenDecimals, prices, block);

          case 31:
            tokenData = _context3.sent;
            console.log('tokenMetrics OK!');
            console.log("".concat(JSON.stringify(tokenData))); // Sum of of the USD value of all tokens in the pool

            originalPoolLiquidity = tokenData.reduce(function (a, t) {
              return a.plus(t.origLiquidity);
            }, bnum(0));
            console.log('tokenData reduced 1 OK!');
            eligibleTotalWeight = tokenData.reduce(function (a, t) {
              return a.plus(t.normWeight);
            }, bnum(0));
            console.log('tokenData reduced 2 OK!');
            normWeights = tokenData.map(function (t) {
              return t.normWeight;
            });
            _context3.next = 41;
            return bPool.methods.getSwapFee().call(undefined, block.number);

          case 41:
            poolFee = _context3.sent;
            poolFee = scale(poolFee, -16); // -16 = -18 * 100 since it's in percentage terms

            feeFactor = bnum(getFeeFactor(poolFee));
            commonFactors = {
              poolAddress: pool.id,
              controller: pool.controller,
              tokens: tokenData,
              feeFactor: feeFactor,
              eligibleTotalWeight: eligibleTotalWeight,
              normWeights: normWeights
            };

            if (!(subpoolLiquidityProviders.length == 1)) {
              _context3.next = 51;
              break;
            }

            // single pool
            lpBalances = subpoolBalances[0];
            nonstakingPool = _objectSpread(_objectSpread({}, commonFactors), {}, {
              canReceiveBoost: false,
              liquidityProviders: pool.shareHolders,
              liquidity: originalPoolLiquidity,
              eligibleTotalWeight: eligibleTotalWeight,
              bptSupply: bptSupply,
              lpBalances: lpBalances
            });
            return _context3.abrupt("return", {
              pools: [nonstakingPool]
            });

          case 51:
            // split into subpools
            pools = [];
            hasNonshareholderPool = subpoolLiquidityProviders[0].length > 0;

            if (hasNonshareholderPool) {
              liquidity = originalPoolLiquidity.times(subpoolWeights[0]);
              bptSupplySubpool = bptSupply.times(subpoolWeights[0]);
              pools.push(_objectSpread(_objectSpread({}, commonFactors), {}, {
                canReceiveBoost: true,
                liquidityProviders: subpoolLiquidityProviders[0],
                lpBalances: subpoolBalances[0],
                liquidity: liquidity,
                bptSupply: bptSupplySubpool
              }));
            }

            hasShareholderPool = subpoolLiquidityProviders[1].length > 0;

            if (hasShareholderPool) {
              _liquidity = originalPoolLiquidity.times(subpoolWeights[1]);
              _bptSupplySubpool = bptSupply.times(subpoolWeights[1]);
              pools.push(_objectSpread(_objectSpread({}, commonFactors), {}, {
                canReceiveBoost: false,
                liquidityProviders: subpoolLiquidityProviders[1],
                lpBalances: subpoolBalances[1],
                liquidity: _liquidity,
                bptSupply: _bptSupplySubpool
              }));
            }

            return _context3.abrupt("return", {
              pools: pools
            });

          case 57:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _getPoolInvariantData.apply(this, arguments);
}

// This is data that is not intrinsic to the pool but depends on
// a particular balMultiplier and tokenCapFactor
function getPoolVariantData(poolData, balMultiplier) {
  var tokenCapFactors = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var liquidity = poolData.liquidity,
      feeFactor = poolData.feeFactor,
      tokens = poolData.tokens,
      normWeights = poolData.normWeights;
  var tokenAddresses = tokens.map(function (t) {
    return t.token;
  });
  var balAndRatioFactor = getBalAndRatioFactor(tokenAddresses, normWeights, balMultiplier);
  var tokenCapFactorArray = tokenAddresses.map(function (address) {
    return tokenCapFactors[address] || bnum(1.0);
  });
  var tokenCapAdjustedWeights = normWeights.map(function (weight, idx) {
    return weight.times(tokenCapFactorArray[idx]);
  }); // We need to adjust pool liquidity by a factor that recognizes the new
  // weights after some token liquidity is capped

  var poolTokenCapsFactor = tokenCapAdjustedWeights.reduce(function (aggregator, tcaw) {
    return aggregator.plus(tcaw);
  }, bnum(0));
  var wrapFactor = getWrapFactor(tokenAddresses, tokenCapAdjustedWeights);
  var adjustedPoolLiquidity = feeFactor.times(balAndRatioFactor).times(wrapFactor).times(poolTokenCapsFactor).times(liquidity).dp(18);
  return {
    balAndRatioFactor: balAndRatioFactor,
    adjustedPoolLiquidity: adjustedPoolLiquidity,
    wrapFactor: wrapFactor
  };
}

function poolLiquidity(tokenCapFactors, tokens) {
  return tokens.reduce(function (aggregateAdjustedLiquidity, t) {
    var tokenCapFactor = tokenCapFactors[t.token];
    var adjustedTokenLiquidity = t.origLiquidity.times(tokenCapFactor).dp(18);
    return aggregateAdjustedLiquidity.plus(adjustedTokenLiquidity);
  }, bnum(0));
}