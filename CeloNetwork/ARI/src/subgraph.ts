import fetch from 'isomorphic-fetch';
const SUBGRAPH_URL =
    process.env.SUBGRAPH_URL ||
    'https://api.thegraph.com/subgraphs/name/centfinance/cent-swap-celo';

interface User {
    id: string;
}

interface Share {
    userAddress: User;
}

interface PoolResult {
    shareHolders?: any[];
    shares: Share[];
    controller: string;
    id?: string;
}

interface PoolTotalSharesResult {
    shares: Share[];
}

export const fetchAllPools = async function (web3Utils, block) {
    let poolResults: PoolResult[] = [];
    let skip: number = 0;
    let paginatePools: boolean = true;
    while (paginatePools) {
        let query = `
            {
                pools (where: { id_in: ["0xaebcc13799ecdc83a5a743bb400c60ad9a08e3c6"]},
                    first: 1000, skip: ${skip}, block: { number: ${block} } ) {
                    id
                    publicSwap
                    swapFee
                    controller
                    createTime
                    tokensList
                    totalShares
                    shares (first: 1000) {
                        userAddress {
                            id
                        }
                    }
                }
            }
        `;

        let response = await fetch(SUBGRAPH_URL, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
            }),
        });
        let { data } = await response.json();

        poolResults = poolResults.concat(data.pools);
        if (data.pools.length < 1000) {
            paginatePools = false;
        } else {
            skip += 1000;
            continue;
        }
    }

    let finalResults: PoolResult[] = [];

    for (let pool of poolResults) {
        pool.shareHolders = pool.shares.map((a) =>
            web3Utils.toChecksumAddress(a.userAddress.id)
        );
        if (pool.shareHolders.length == 1000) {
            let paginateShares = true;
            let shareSkip = 0;
            let shareResults = [];

            while (paginateShares) {
                let query = `
                    {
                        pools (where: { id: "${pool.id}"}, block: { number: ${block} }) {
                            shares (first: 1000, skip: ${shareSkip}) {
                                userAddress {
                                    id
                                }
                            }
                        }
                    }
                `;

                let response = await fetch(SUBGRAPH_URL, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query,
                    }),
                });

                let { data } = await response.json();

                let newShareHolders = data.pools[0].shares.map((a) =>
                    web3Utils.toChecksumAddress(a.userAddress.id)
                );

                shareResults = shareResults.concat(newShareHolders);

                if (newShareHolders.length < 1000) {
                    paginateShares = false;
                } else {
                    shareSkip += 1000;
                    continue;
                }
            }

            pool.shareHolders = shareResults;
            pool.controller = web3Utils.toChecksumAddress(pool.controller);
            delete pool.shares;

            finalResults.push(pool);
        } else {
            delete pool.shares;
            pool.controller = web3Utils.toChecksumAddress(pool.controller);
            finalResults.push(pool);
        }
    }

    return finalResults;
};

export const fetchTotalSupply = async function (web3Utils, block) {
    let poolResults: PoolTotalSharesResult[] = [];
    let query = `
            {
                pools (where: { id_in: ["0xaebcc13799ecdc83a5a743bb400c60ad9a08e3c6"]},
                    first: 1000, block: { number: ${block} } ) {
                    totalShares
                }
            }
        `;

    let response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
        }),
    });
    let { data } = await response.json();
    return data.pools[0].totalShares;
};

export const fetchBalanceOf = async function (web3Utils, block, lp, poolAddress) {
    let poolResults: PoolResult[] = [];
        let query = `
            {
            poolShares(first: 1000, block: { number: ${block} }, where: {userAddress: "${lp.toLowerCase()}", poolId: "${poolAddress.toLowerCase()}"})
            {
              id
              userAddress {
                id
              }
              balance
            }
          }
          `;
        let response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
        }),
    });
    let { data } = await response.json();
    let returnVal = 0;
    if (data.poolShares.length > 0)
    {
        returnVal = data.poolShares[0].balance;
    }
    return returnVal;
};

export const fetchTokenBalanceOf = async function (block, poolAddress, tokenAddress) {
    let poolResults: PoolResult[] = [];
        let query = `
        {
            poolTokens(first: 1, block: { number: ${block.number} }, where: {address: "${tokenAddress.toLowerCase()}", poolId: "${poolAddress.toLowerCase()}" }) {
              id
              symbol
              poolId {
                id
              }
              address
              balance
              denormWeight
            }
            }
        `;
        let response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
        }),
    });
    
    let { data } = await response.json();
    return data.poolTokens[0].balance;
};

export const fetchTokenDenormWeight = async function (block, poolAddress, tokenAddress) {
    let poolResults: PoolResult[] = [];
        let query = `
        {
            poolTokens(first: 1, block: { number: ${block.number} }, where: {address: "${tokenAddress.toLowerCase()}", poolId: "${poolAddress.toLowerCase()}" }) {
              id
              symbol
              poolId {
                id
              }
              address
              balance
              denormWeight
            }
            }
        `;

        let response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
        }),
    });
    
    let { data } = await response.json();
    return data.poolTokens[0].denormWeight;
};
