interface AddressMaps {
    [address: string]: string;
}
const poolAbi = require('../abi/BPool.json');
const { bnum, scale } = require('./utils');
const addressMaps: AddressMaps = require('../lib/mappedlist');
const { fetchTotalSupply } = require('../lib/subgraph');
const { fetchBalanceOf } = require('../lib/subgraph');
const { fetchTokenBalanceOf } = require('../lib/subgraph');
const { fetchTokenDenormWeight } = require('../lib/subgraph');

import { uncappedTokens, SYMM_TOKEN } from './tokens';
import { BLACKLISTED_SHAREHOLDERS } from './users';
import BigNumber from 'bignumber.js';

const {
    getFeeFactor,
    getBalFactor,
    getBalAndRatioFactor,
    getWrapFactor,
} = require('./factors');

BigNumber.config({
    EXPONENTIAL_AT: [-100, 100],
    ROUNDING_MODE: BigNumber.ROUND_DOWN,
    DECIMAL_PLACES: 18,
});

function atLeastTwoTokensHavePrice(tokens, prices): boolean {
    let nTokensHavePrice = 0;
    for (const token of tokens) {
        console.log(
            `TOKEN : ${token.tokenId}`
        );

        if (
            prices[token.tokenId] !== undefined &&
            prices[token.tokenId].length > 0
        ) {
            nTokensHavePrice++;
            if (nTokensHavePrice > 1) {
                return true;
            }
        }
    }
    return false;
}

function poolCreatedByBlock(pool, block): boolean {
    return pool.createTime < block.timestamp && pool.tokensList;
}

function closestPrice(token, timestamp, prices): BigNumber {
    let price = prices[token].reduce((a, b) => {
        return Math.abs(b[0] - timestamp * 1000) <
            Math.abs(a[0] - timestamp * 1000)
            ? b
            : a;
    })[1];
    return bnum(price);
}

interface TokenData {
    token: string;
    price: BigNumber;
    origLiquidity: BigNumber;
    normWeight: BigNumber;
}

async function tokenMetrics(
    bPool,
    tokens,
    tokenDecimals,
    prices,
    block,
    poolId
): Promise<TokenData[]> {
    let tokenData: TokenData[] = [];

    for (const token of tokens) {
        // Skip token if it doesn't have a price
        const hasPrice = !(
            prices[token.tokenId] === undefined ||
            prices[token.tokenId].length === 0
        );
        if (!hasPrice) {
            continue;
        }
        let bTokenDecimals = tokenDecimals[token.currentChainAddress];
  /*      
        let tokenBalanceWei = await bPool.methods
            .getBalance(token.currentChainAddress)
            .call(undefined, 11352637);
*/
        let tokenBalanceWei = await fetchTokenBalanceOf(block, poolId, token.currentChainAddress);
        tokenBalanceWei = scale(tokenBalanceWei,18);
        let normWeight = await fetchTokenDenormWeight(block, poolId, token.currentChainAddress);
        normWeight = scale(tokenBalanceWei,0);
        /*
        let normWeight = await bPool.methods
            .getNormalizedWeight(token.currentChainAddress)
            .call(undefined, 11352637);
            */
        // may be null if no tokens have been added
        let tokenBalance = scale(tokenBalanceWei || 0, -bTokenDecimals);
        let price = bnum(
            closestPrice(token.tokenId, block.timestamp, prices)
        );
        console.log(`price: ${price}`);
        let origLiquidity = tokenBalance.times(price).dp(18);
        tokenData.push({
            token: token.currentChainAddress,
            origLiquidity,
            price,
            normWeight: scale(normWeight, -18),
        });
    }
    //console.log(`returning tokenData: ${JSON.stringify(tokenData)}`);
    return tokenData;
}

export interface PoolDataBase {
    poolAddress: string;
    tokens: any[];
    liquidity: BigNumber;
    eligibleTotalWeight: BigNumber;
    bptSupply: BigNumber;
    feeFactor: BigNumber;
    liquidityProviders: string[];
    lpBalances: BigNumber[];
    controller: string;
}

interface NonstakingPool extends PoolDataBase {
    // has no pairs between BAL and an uncapped token
    canReceiveBoost: boolean;
}

interface ShareholderPool extends PoolDataBase {
    // contains pairs between BAL and uncapped tokens with exclusively shareholders
    canReceiveBoost: boolean;
}

interface NonshareholderPool extends PoolDataBase {
    // contains pairs between BAL and uncapped tokens with exclusively nonshareholders
    canReceiveBoost: boolean;
}

export interface SkipReason {
    privateSwap?: boolean;
    unpriceable?: boolean;
    notCreatedByBlock?: boolean;
}

export type PoolData = NonstakingPool | NonshareholderPool | ShareholderPool;

interface PoolFromSubgraph {
    id: string;
    createTime: number;
    controller: string;
    publicSwap: boolean;
    tokensList: string[];
    shareHolders: string[];
}

// THis method should return either [[allLPs]] or [[nonshareholders], [liquidityProviders]] depending on whether the pool needs to be split or not
export function splitLiquidityProviders(
    poolLiquidityProviders,
    poolTokens
): [string[]] | [string[], string[]] {
    let includesBal: boolean = poolTokens.includes(SYMM_TOKEN);
    let includesUncappedTokenPair: boolean = poolTokens.reduce(
        (found, token) => {
            return (
                found ||
                (token !== SYMM_TOKEN && uncappedTokens.includes(token))
            );
        },
        false
    );

    if (includesBal && includesUncappedTokenPair) {
        const shareholderBlacklist = new Set(BLACKLISTED_SHAREHOLDERS);

        let shareHolderLiquidityProviders: string[] = poolLiquidityProviders.filter(
            (lp) => shareholderBlacklist.has(lp)
        );
        let nonshareholderLiquidityProviders: string[] = poolLiquidityProviders.filter(
            (lp) => !shareholderBlacklist.has(lp)
        );

        return [
            nonshareholderLiquidityProviders,
            shareHolderLiquidityProviders,
        ];
    }
    return [poolLiquidityProviders];
}

export interface PoolDataResult {
    pools: PoolData[];
}

export function getPoolBalances(
    bPool,
    web3Utils,
    blockNum,
    liquidityProviders,
    poolId
): Promise<BigNumber[]> {
    return Promise.all(
        liquidityProviders.map(async (lp) => {
        let userBalanceWei = await fetchBalanceOf(web3Utils, blockNum, lp, poolId);
   /*         let userBalanceWei = await bPool.methods
                .balanceOf(lp)
                .call(undefined, blockNum);*/
            let userBalance = scale(userBalanceWei, 0);
            return userBalance;
        })
    );
}

export async function getPoolInvariantData(
    web3,
    prices,
    tokenDecimals,
    block,
    pool: PoolFromSubgraph,
    tokenCapFactors = {}
): Promise<PoolDataResult | SkipReason> {
    if (!poolCreatedByBlock(pool, block)) {
        return { notCreatedByBlock: true };
    }

    const bPool = new web3.eth.Contract(poolAbi, pool.id);
    const publicSwap = await bPool.methods
        .isPublicSwap()
        .call(undefined, block.number);

    if (!publicSwap) {
        return { privateSwap: true };
    }

    const currentTokens = await bPool.methods
        .getCurrentTokens()
        .call(undefined, block.number);

    let bptSupplyWei = await fetchTotalSupply(web3.utils, block.number);
    bptSupplyWei = scale(bptSupplyWei, 18);
  /*  let bptSupplyWei = await bPool.methods
        .totalSupply()
        .call(undefined, 11352637);
*/

    let bptSupply: BigNumber = scale(bptSupplyWei, -18);
    const poolTokens: string[] = currentTokens.map((pt) =>
        web3.utils.toChecksumAddress(pt)
    );
    //console.log(`poolTokens: ${JSON.stringify(poolTokens)}`);
    const mappedlist = eval(addressMaps.celoEthMap);

    const filteredMappedList = mappedlist.filter((l) => {
        return poolTokens.includes(l.currentChainAddress);
    });

    //ethTokens.filter(pTokens => poolTokens.includes(pTokens));
    //console.log(`Filtered List...`);
    //console.log(opObj);
    // If the pool is unpriceable, we cannot calculate any rewards
    if (!atLeastTwoTokensHavePrice(filteredMappedList, prices)) {
        return { unpriceable: true };
    }

    console.log('Got Prices');
    const poolLiquidityProviders: string[] = pool.shareHolders.map((lp) =>
        web3.utils.toChecksumAddress(lp)
    );
    // determine if the pool should be split up
    // based on pool and lp composition and get the balances of the providers in
    // the pool
    const subpoolLiquidityProviders:
        | [string[]]
        | [string[], string[]] = splitLiquidityProviders(
        poolLiquidityProviders,
        poolTokens
    );

    // bpt held by each lp
    const subpoolBalances: BigNumber[][] = await Promise.all(
        subpoolLiquidityProviders.map((lps: string[]) =>
            getPoolBalances(bPool, web3.utils, block.number, lps, pool.id)
        )
    );
    // total bpt held by nonshareholders, shareholders
    const subpoolTotalBalances = subpoolBalances.map((spBals) =>
        spBals.reduce((sum, bal) => sum.plus(bal), bnum(0))
    );
    const subpoolWeights = subpoolTotalBalances.map((totalSubpoolBpt) =>
        bptSupplyWei > 0
            ? // TOTAL
              totalSubpoolBpt.div(bptSupply)
            : // if bptSupply is 0 in the case of a private pool, sum to 1
              bnum(1).div(subpoolLiquidityProviders.length)
    );
    // calculate these values for both subpools if relevant
    const tokenData = await tokenMetrics(
        bPool,
        filteredMappedList, //poolsToken
        tokenDecimals,
        prices,
        block,
        pool.id
    );
    console.log('tokenMetrics OK!');
    // Sum of of the USD value of all tokens in the pool
    const originalPoolLiquidity = tokenData.reduce(
        (a, t) => a.plus(t.origLiquidity),
        bnum(0)
    );
    console.log('tokenData reduced 1 OK!');
    const eligibleTotalWeight = tokenData.reduce(
        (a, t) => a.plus(t.normWeight),
        bnum(0)
    );
    console.log('tokenData reduced 2 OK!');
    const normWeights = tokenData.map((t) => t.normWeight);
   // let poolFee = bPool.swapFee;
    let poolFee = await bPool.methods
        .getSwapFee()
        .call(undefined, 11352637);
    poolFee = scale(poolFee, -16); // -16 = -18 * 100 since it's in percentage terms
    const feeFactor = bnum(getFeeFactor(poolFee));

    let commonFactors = {
        poolAddress: pool.id,
        controller: pool.controller,
        tokens: tokenData,
        feeFactor,
        eligibleTotalWeight,
        normWeights,
    };
    if (subpoolLiquidityProviders.length == 1) {
        // single pool

        let lpBalances = subpoolBalances[0];
        let nonstakingPool: NonstakingPool = {
            ...commonFactors,
            canReceiveBoost: false,
            liquidityProviders: pool.shareHolders,
            liquidity: originalPoolLiquidity,
            eligibleTotalWeight,
            bptSupply,
            lpBalances,
        };
        return { pools: [nonstakingPool] };
    } else {
        // split into subpools
        let pools: (ShareholderPool | NonshareholderPool)[] = [];

        let hasNonshareholderPool: boolean =
            subpoolLiquidityProviders[0].length > 0;
        if (hasNonshareholderPool) {
            const liquidity = originalPoolLiquidity.times(subpoolWeights[0]);
            const bptSupplySubpool = bptSupply.times(subpoolWeights[0]);
            pools.push({
                ...commonFactors,
                canReceiveBoost: true,
                liquidityProviders: subpoolLiquidityProviders[0],
                lpBalances: subpoolBalances[0],
                liquidity,
                bptSupply: bptSupplySubpool,
            });
        }

        let hasShareholderPool: boolean =
            subpoolLiquidityProviders[1].length > 0;
        if (hasShareholderPool) {
            const liquidity = originalPoolLiquidity.times(subpoolWeights[1]);
            const bptSupplySubpool = bptSupply.times(subpoolWeights[1]);
            pools.push({
                ...commonFactors,
                canReceiveBoost: false,
                liquidityProviders: subpoolLiquidityProviders[1],
                lpBalances: subpoolBalances[1],
                liquidity,
                bptSupply: bptSupplySubpool,
            });
        }

        return { pools };
    }
}

interface PoolVariantFactors {
    balAndRatioFactor: BigNumber;
    adjustedPoolLiquidity: BigNumber;
    wrapFactor: BigNumber;
}

// This is data that is not intrinsic to the pool but depends on
// a particular balMultiplier and tokenCapFactor
export function getPoolVariantData(
    poolData,
    balMultiplier,
    tokenCapFactors = {}
): PoolVariantFactors {
    const { liquidity, feeFactor, tokens, normWeights } = poolData;
    const tokenAddresses = tokens.map((t) => t.token);
    const balAndRatioFactor = getBalAndRatioFactor(
        tokenAddresses,
        normWeights,
        balMultiplier
    );

    const tokenCapFactorArray = tokenAddresses.map(
        (address) => tokenCapFactors[address] || bnum(1.0)
    );
    const tokenCapAdjustedWeights = normWeights.map((weight, idx) =>
        weight.times(tokenCapFactorArray[idx])
    );

    // We need to adjust pool liquidity by a factor that recognizes the new
    // weights after some token liquidity is capped
    const poolTokenCapsFactor = tokenCapAdjustedWeights.reduce(
        (aggregator, tcaw) => aggregator.plus(tcaw),
        bnum(0)
    );

    const wrapFactor = getWrapFactor(tokenAddresses, tokenCapAdjustedWeights);

    const adjustedPoolLiquidity = feeFactor
        .times(balAndRatioFactor)
        .times(wrapFactor)
        .times(poolTokenCapsFactor)
        .times(liquidity)
        .dp(18);

    return {
        balAndRatioFactor,
        adjustedPoolLiquidity,
        wrapFactor,
    };
}

export function poolLiquidity(tokenCapFactors, tokens): BigNumber {
    return tokens.reduce((aggregateAdjustedLiquidity, t) => {
        let tokenCapFactor = tokenCapFactors[t.token];
        let adjustedTokenLiquidity = t.origLiquidity
            .times(tokenCapFactor)
            .dp(18);
        return aggregateAdjustedLiquidity.plus(adjustedTokenLiquidity);
    }, bnum(0));
}
