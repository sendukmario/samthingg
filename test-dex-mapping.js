// Test script to verify DEX mapping is working correctly
const dexNameToBackendMap = {
  "Moonshot": "moonshot",
  "PumpFun": "pumpfun",
  "Dynamic Bonding Curve": "dynamic_bonding_curve",
  "Launch a Coin": "launch_a_coin",
  "Candle Tv": "candle_tv",
  "Bonk": "bonk",
  "LaunchLab": "launchlab",
  "Raydium AMM": "raydium_amm",
  "Raydium CPMM": "raydium_cpmm",
  "Raydium CLMM": "raydium_clmm",
  "Boop": "boop",
  "Orca": "orca",
  "Jupiter Studio": "jupiter_studio",
  "Bags": "bags",
  "Believe": "believe",
  "Moonit": "moonit",
  "Meteora AMM": "meteora_amm",
  "Meteora AMM V2": "meteora_amm_v2",
  "Meteora DLMM": "meteora_dlmm",
};

console.log("Testing DEX mapping:");
console.log("Dynamic Bonding Curve ->", dexNameToBackendMap["Dynamic Bonding Curve"]);
console.log("Raydium AMM ->", dexNameToBackendMap["Raydium AMM"]);
console.log("PumpFun ->", dexNameToBackendMap["PumpFun"]);

// Test the filter process
const mockCheckBoxes = {
  "Dynamic Bonding Curve": true,
  "Raydium AMM": true,
  "PumpFun": false,
  "dynamic_bonding_curve": true,
  "raydium_amm": true,
  "pumpfun": false,
};

const allwedDexes = [
  "Moonshot", "PumpFun", "Dynamic Bonding Curve", "Launch a Coin", "Candle Tv",
  "Bonk", "LaunchLab", "Raydium AMM", "Raydium CPMM", "Raydium CLMM",
  "Boop", "Orca", "Jupiter Studio", "Bags", "Believe", "Moonit",
  "Meteora AMM", "Meteora AMM V2", "Meteora DLMM",
];

const dexes = Object.entries(mockCheckBoxes)
  .filter(([key, value]) => value === true && allwedDexes.includes(key))
  .map(([key]) => dexNameToBackendMap[key] || key)
  .filter(Boolean);

console.log("Filtered DEXes for backend:", dexes);
console.log("Expected: ['dynamic_bonding_curve', 'raydium_amm']");
