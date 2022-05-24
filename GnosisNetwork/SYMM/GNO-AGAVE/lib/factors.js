"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBalAndRatioFactor = getBalAndRatioFactor;
exports.getFeeFactor = getFeeFactor;
exports.getStakingBoostOfPair = getStakingBoostOfPair;
exports.getWrapFactor = getWrapFactor;

var _tokens = require("./tokens");

var _require = require('./utils'),
    bnum = _require.bnum;

var WRAP_FACTOR_HARD = bnum(0.1);
var WRAP_FACTOR_SOFT = bnum(0.2);

function getFeeFactor(feePercentage) {
  return Math.exp(-Math.pow(feePercentage * 0.25, 2));
} // higher when greater proportion of BAL


function getStakingBoostOfPair(balMultiplier, token1, weight1, token2, weight2) {
  if (token1 == _tokens.SYMM_TOKEN && _tokens.uncappedTokens.includes(token2)) {
    return balMultiplier.times(weight1).plus(weight2).div(weight1.plus(weight2));
  } else if (token2 == _tokens.SYMM_TOKEN && _tokens.uncappedTokens.includes(token1)) {
    return weight1.plus(balMultiplier.times(weight2)).div(weight1.plus(weight2));
  } else {
    return bnum(1);
  }
} // brf = stakingBoost*ratioFactor


function getBalAndRatioFactor(tokens, weights) {
  var balMultiplier = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : bnum(2);
  var brfSum = bnum(0);
  var pairWeightSum = bnum(0);
  var n = weights.length;

  for (var j = 0; j < n; j++) {
    if (weights[j].eq(bnum(0))) continue;

    for (var k = j + 1; k < n; k++) {
      var pairWeight = weights[j].times(weights[k]);
      var normalizedWeight1 = weights[j].div(weights[j].plus(weights[k]));
      var normalizedWeight2 = weights[k].div(weights[j].plus(weights[k]));
      var stakingBoostOfPair = getStakingBoostOfPair(balMultiplier, tokens[j], weights[j], tokens[k], weights[k]);
      var ratioFactorOfPair = bnum(4) // stretches factor for equal weighted pairs to 1
      .times(normalizedWeight1).times(normalizedWeight2).times(pairWeight); // brfOfPair = stakingBoostOfPair*ratioFactorOfPair

      var brfOfPair = stakingBoostOfPair.times(ratioFactorOfPair); // brfSum

      brfSum = brfSum.plus(brfOfPair);
      pairWeightSum = pairWeightSum.plus(pairWeight);
    }
  } // brfSum


  return brfSum.div(pairWeightSum);
}

function getWrapFactorOfPair(tokenA, tokenB) {
  var foundTokenA = false;
  var foundTokenB = false;

  for (var set1 in _tokens.equivalentSets) {
    for (var set2 in _tokens.equivalentSets[set1]) {
      var includesTokenA = _tokens.equivalentSets[set1][set2].includes(tokenA);

      var includesTokenB = _tokens.equivalentSets[set1][set2].includes(tokenB);

      if (includesTokenA && includesTokenB) {
        return WRAP_FACTOR_HARD;
      } else if (includesTokenA && foundTokenB || includesTokenB && foundTokenA) {
        return WRAP_FACTOR_SOFT;
      } else if (includesTokenA) {
        foundTokenA = true;
      } else if (includesTokenB) {
        foundTokenB = true;
      }
    }

    if (foundTokenA || foundTokenB) {
      break;
    }
  }

  return bnum(1.0);
}

function getWrapFactor(tokens, weights) {
  var wrapFactorSum = bnum(0);
  var pairWeightSum = bnum(0);
  var n = weights.length;

  for (var x = 0; x < n; x++) {
    if (!weights[x].eq(bnum(0))) {
      for (var y = x + 1; y < n; y++) {
        var pairWeight = weights[x].times(weights[y]);
        var wrapFactorPair = getWrapFactorOfPair(tokens[x], tokens[y]);
        wrapFactorSum = wrapFactorSum.plus(wrapFactorPair.times(pairWeight));
        pairWeightSum = pairWeightSum.plus(pairWeight);
      }
    }
  }

  return wrapFactorSum.div(pairWeightSum);
}