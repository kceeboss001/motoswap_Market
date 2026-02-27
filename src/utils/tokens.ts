import { Token, Pool } from '../types';

export const TOKENS: Token[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    address: 'bc1qnative000000000000000000000000000000000',
    decimals: 8,
    logoColor: '#F7931A',
    logoChar: '₿',
    price: 97450.00,
    change24h: 2.34,
    liquidity: 12500000,
    volume24h: 3400000,
  },
  {
    symbol: 'MOTO',
    name: 'MotoSwap',
    address: 'bc1qmoto000000000000000000000000000000001',
    decimals: 18,
    logoColor: '#FF4B6E',
    logoChar: '🏍',
    price: 0.0142,
    change24h: 8.91,
    liquidity: 890000,
    volume24h: 240000,
  },
  {
    symbol: 'PILL',
    name: 'PILL Token',
    address: 'bc1qpill000000000000000000000000000000002',
    decimals: 18,
    logoColor: '#00D4AA',
    logoChar: '💊',
    price: 0.00089,
    change24h: -3.12,
    liquidity: 450000,
    volume24h: 98000,
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: 'bc1qwbtc000000000000000000000000000000003',
    decimals: 8,
    logoColor: '#F09242',
    logoChar: 'W',
    price: 97380.00,
    change24h: 2.29,
    liquidity: 5600000,
    volume24h: 1200000,
  },
  {
    symbol: 'OP20',
    name: 'OP-20 Index',
    address: 'bc1qop20000000000000000000000000000000004',
    decimals: 18,
    logoColor: '#9B59B6',
    logoChar: 'OP',
    price: 0.00034,
    change24h: 15.67,
    liquidity: 230000,
    volume24h: 67000,
  },
  {
    symbol: 'RUNE',
    name: 'Bitcoin Rune',
    address: 'bc1qrune000000000000000000000000000000005',
    decimals: 18,
    logoColor: '#E74C3C',
    logoChar: 'ᚱ',
    price: 0.00156,
    change24h: -1.45,
    liquidity: 320000,
    volume24h: 89000,
  },
  {
    symbol: 'SATS',
    name: 'Satoshi Token',
    address: 'bc1qsats000000000000000000000000000000006',
    decimals: 18,
    logoColor: '#F39C12',
    logoChar: 'S',
    price: 0.0000001,
    change24h: 5.22,
    liquidity: 1200000,
    volume24h: 450000,
  },
  {
    symbol: 'ORDI',
    name: 'Ordinals',
    address: 'bc1qordi000000000000000000000000000000007',
    decimals: 18,
    logoColor: '#1ABC9C',
    logoChar: 'O',
    price: 23.45,
    change24h: -0.87,
    liquidity: 780000,
    volume24h: 340000,
  },
];

export const POOLS: Pool[] = [
  {
    id: 'btc-moto',
    token0: TOKENS[0],
    token1: TOKENS[1],
    tvl: 2340000,
    apr: 142.5,
    volume24h: 890000,
    fee: 0.3,
  },
  {
    id: 'btc-pill',
    token0: TOKENS[0],
    token1: TOKENS[2],
    tvl: 980000,
    apr: 89.2,
    volume24h: 340000,
    fee: 0.3,
  },
  {
    id: 'moto-pill',
    token0: TOKENS[1],
    token1: TOKENS[2],
    tvl: 450000,
    apr: 215.8,
    volume24h: 120000,
    fee: 1.0,
  },
  {
    id: 'btc-wbtc',
    token0: TOKENS[0],
    token1: TOKENS[3],
    tvl: 8900000,
    apr: 12.3,
    volume24h: 3400000,
    fee: 0.05,
  },
  {
    id: 'btc-ordi',
    token0: TOKENS[0],
    token1: TOKENS[7],
    tvl: 1200000,
    apr: 67.4,
    volume24h: 450000,
    fee: 0.3,
  },
];

export const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
};

export const formatPrice = (p: number): string => {
  if (p >= 1) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  if (p >= 0.0001) return `$${p.toFixed(6)}`;
  return `$${p.toFixed(10)}`;
};
