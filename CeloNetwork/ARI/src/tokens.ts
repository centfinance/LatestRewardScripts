interface CapTiers {
    [address: string]: string;
}

const capTiers: CapTiers = require('../lib/whitelist');
import { BigNumber } from 'bignumber.js';
const { bnum } = require('./utils');
export const SYMM_TOKEN = '0x7c64aD5F9804458B8c9F93f7300c15D55956Ac2a';

export const uncappedTokens = Object.entries(capTiers)
    .filter(([address, capString]) => capString == 'uncapped')
    .map(([a, c]) => a);

const CAP_TIERS = {
    cap1: bnum(1000000),
    cap2: bnum(3000000),
    cap3: bnum(10000000),
    cap4: bnum(30000000),
    cap5: bnum(100000000),
};

interface TokenCaps {
    [address: string]: BigNumber;
}

export const tokenCaps: TokenCaps = Object.entries(capTiers).reduce(
    (aggregator, capTuple) => {
        const address = capTuple[0];
        const capString = capTuple[1];
        if (capString !== 'uncapped') {
            aggregator[address] = CAP_TIERS[capString];
        }
        return aggregator;
    },
    {}
);

export const equivalentSets = [
];

export const REP_TOKEN = '0x1985365e9f78359a9B6AD760e32412f4a445E862';
export const REP_TOKEN_V2 = '0x221657776846890989a759BA2973e427DfF5C9bB';
