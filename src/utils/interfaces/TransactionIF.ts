export interface TransactionIF {
    base: string;
    baseDecimals: number;
    baseFlow: number;
    baseSymbol: string;
    baseName: string;
    baseTokenLogoURI: string;
    block: number;
    chainId: string;
    inBaseQty: boolean;
    isBuy: boolean;
    isBid: boolean;
    poolIdx: number;
    quote: string;
    quoteDecimals: number;
    quoteFlow: number;
    quoteSymbol: string;
    quoteName: string;
    quoteTokenLogoURI: string;
    entityType: string;
    changeType: string;
    positionType: string;
    txTime: number;
    txHash: string;
    user: string;
    limitPrice: number;
    bidTick: number;
    askTick: number;
    swapPrice: number;
    limitPriceDecimalCorrected: number;
    invLimitPriceDecimalCorrected: number;
    middlePriceDisplayNum: number;
    swapPriceDecimalCorrected: number;
    swapInvPriceDecimalCorrected: number;
    baseFlowDecimalCorrected: number;
    quoteFlowDecimalCorrected: number;
    bidTickPriceDecimalCorrected: number;
    bidTickInvPriceDecimalCorrected: number;
    askTickPriceDecimalCorrected: number;
    askTickInvPriceDecimalCorrected: number;
    totalValueUSD: number;
    ensResolution: string;
    txId: string;
}

export interface TransactionServerIF {
    block: number;
    chainId: string;
    inBaseQty: boolean;
    isBuy: boolean;
    poolIdx: number;
    base: string;
    quote: string;
    baseFlow: number;
    quoteFlow: number;
    entityType: string;
    changeType: string;
    positionType: string;
    txTime: number;
    txHash: string;
    user: string;
    limitPrice: number;
    bidTick: number;
    askTick: number;
    txId: string;
}
