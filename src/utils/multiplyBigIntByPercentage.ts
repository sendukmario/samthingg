export function multiplyBigIntByPercentage(value: bigint, percentage: number, decimals: number): bigint {
    // if ((percentage < 0 || percentage > 1) && isNaN(percentage)) {
    //     throw new Error("Percentage must be between 0 and 1");
    // }
    const scale = BigInt(Math.pow(10, isNaN(Number(decimals)) ? 6 : decimals));
    return (value * BigInt(Math.round(percentage * Number(scale)))) / scale;
}