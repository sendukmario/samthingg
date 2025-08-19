import { Level } from "@/apis/rest/earn-new";

export const EARN_LEVELS: Level[] = [
  {
    "level": "Earth",
    "targetVolume": 5,
    "multiplier": 1.0,
    "cashback": 0.05
  },
  {
    "level": "Moon",
    "targetVolume": 25,
    "multiplier": 2.0,
    "cashback": 0.1
  },
  {
    "level": "Orbit",
    "targetVolume": 120,
    "multiplier": 2.5,
    "cashback": 0.125
  },
  {
    "level": "Sun",
    "targetVolume": 575,
    "multiplier": 3.0,
    "cashback": 0.15
  },
  {
    "level": "Supernova",
    "targetVolume": 1975,
    "multiplier": 3.5,
    "cashback": 0.175
  },
  {
    "level": "Galaxy",
    "targetVolume": 5000,
    "multiplier": 4.5,
    "cashback": 0.25
  },
  {
    "level": "Vortex",
    "isLast": true,
    "targetVolume": 5000,
    "multiplier": 5.5,
    "cashback": 0.275
  }
]
