"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sumUserLiquidity = sumUserLiquidity;

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var _require = require('./utils'),
    bnum = _require.bnum;

function sumUserLiquidity(pools, bal_per_snapshot) {
  console.log("bal_per_snapshot--->>>>>>>> ".concat(JSON.stringify(bal_per_snapshot)));
  console.log("Pools--->>>>>>>> ".concat(JSON.stringify(pools)));
  var finalBalancerLiquidity = pools.reduce(function (aggregator, pool) {
    return aggregator.plus(pool.adjustedPoolLiquidity);
  }, bnum(0));
  console.log("bal_per_snapshot OK ".concat(JSON.stringify(pools))); // assert that the final liquidity is gives a "boost" of 1 in the stakingBoost function when this val is passed as totalBalancerLiquidityTemp
  // targetFinalBalancerLiquidity == finalLiquidity
  // All the pools the user was involved with in the block

  var userPools = {}; // The total liquidity each user contributed in the block

  var userLiquidity = {}; // Adjust pool liquidity

  var _iterator = _createForOfIteratorHelper(pools),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var pool = _step.value;
      var bptSupply = pool.bptSupply; // if total supply == 0, it's private

      var isPrivatePool = bptSupply.eq(bnum(0));

      if (isPrivatePool) {
        // Private pool
        var privatePool = {
          pool: pool.poolAddress,
          feeFactor: pool.feeFactor.toString(),
          balAndRatioFactor: pool.balAndRatioFactor.toString(),
          wrapFactor: pool.wrapFactor.toString(),
          valueUSD: pool.liquidity.toString(),
          factorUSD: pool.adjustedPoolLiquidity.toString()
        };
        var lp = pool.controller;

        if (userPools[lp]) {
          userPools[lp].push(privatePool);
        } else {
          userPools[lp] = [privatePool];
        }

        userLiquidity[lp] = (userLiquidity[lp] || bnum(0)).plus(pool.adjustedPoolLiquidity);
      } else {
        // Shared pool
        var totalLPBal = pool.lpBalances.reduce(function (a, b) {
          return a.plus(b);
        }, bnum(0)); //console.log(
        //"\nSHARED POOL",
        //bptSupply.toNumber(),
        //pool.lpBalances.map((a) => a.toNumber()),
        //totalLPBal.toNumber(),
        //pool.adjustedPoolLiquidity.toNumber(),
        //"\n"
        //);

        console.log("shared Pools--->>>>>>>> ".concat(JSON.stringify(userPools)));

        for (var i in pool.liquidityProviders) {
          var _lp = pool.liquidityProviders[i];
          var userBalance = pool.lpBalances[i];
          console.log("userBalance--->>>>>>>> ".concat(JSON.stringify(userBalance)));

          if (userBalance.gt(bnum(0))) {
            // the value of the user's share of the pool's liquidity
            var lpPoolValue = userBalance.div(bptSupply).times(pool.liquidity).dp(18); // the value of the user's share of the pool's adjusted liquidity

            var lpPoolValueFactor = userBalance.div(bptSupply).times(pool.adjustedPoolLiquidity).dp(18);
            var sharedPool = {
              pool: pool.poolAddress,
              feeFactor: pool.feeFactor.toString(),
              balAndRatioFactor: pool.balAndRatioFactor.toString(),
              wrapFactor: pool.wrapFactor.toString(),
              valueUSD: lpPoolValue.toString(),
              factorUSD: lpPoolValueFactor.toString()
            };

            if (userPools[_lp]) {
              userPools[_lp].push(sharedPool);
            } else {
              userPools[_lp] = [sharedPool];
            } // Add this pool's liquidity to the user's total liquidity


            userLiquidity[_lp] = (userLiquidity[_lp] || bnum(0)).plus(lpPoolValueFactor);
          }
        }
      }
    } // Final iteration across all users to calculate their BAL tokens for this block

  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  var userBalReceived = {};

  for (var user in userLiquidity) {
    userBalReceived[user] = userLiquidity[user].div(finalBalancerLiquidity).times(bal_per_snapshot).dp(18);
  }

  var totalUserBal = Object.values(userBalReceived).reduce(function (a, bal) {
    return a.plus(bal);
  }, bnum(0));
  console.log("userBalReceived--->>>>>>>> ".concat(JSON.stringify(userBalReceived)));
  console.log("totalUserBal--->>>>>>>> ".concat(JSON.stringify(totalUserBal)));

  if (totalUserBal.minus(bal_per_snapshot).abs().gt(0.1)) {
    console.log('TOTAL USER BAL', totalUserBal, 'BAL PER SNAPSHOT', bal_per_snapshot);
    throw 'Wrong amount of user Bal has been assigned to users';
  }

  console.log('\nTotal Bal distributed', totalUserBal.toNumber(), '\n');
  return {
    userPools: userPools,
    userBalReceived: userBalReceived
  };
}