import BN from "bn.js";

import { NovaInstructionParamsSchema, SwapRequest, Token } from "../types";

import { getMethod } from "../helpers";

const MoonItMethod = 5;

export const createNovaIx = (
    token: Token,
    request: SwapRequest,
): Buffer => {
    const data = Buffer.alloc(NovaInstructionParamsSchema.span);

    const dexMethod = getMethod(token.dex);

    // Validate and clamp slippage without mutating the original request
    let slippage = request.Slippage;
    if (dexMethod === MoonItMethod) {
        slippage = Math.min(slippage, 99);
    }

    NovaInstructionParamsSchema.encode({
        method: dexMethod,
        amountIn: new BN(request.Amount.toString()),
        minAmountOut: new BN(0),
        slippage: new BN(slippage),
        novaFee: 0,
        isSell: !request.IsBuy,
        isUsd: token.is_usdc,
    }, data);

    return data;
}