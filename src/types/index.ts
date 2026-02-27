export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoColor: string;
  logoChar: string;
  price: number;
  change24h: number;
  liquidity: number;
  volume24h: number;
}

export interface Pool {
  id: string;
  token0: Token;
  token1: Token;
  tvl: number;
  apr: number;
  volume24h: number;
  fee: number;
}

export interface SwapState {
  tokenIn: Token | null;
  tokenOut: Token | null;
  amountIn: string;
  amountOut: string;
  slippage: number;
  priceImpact: number;
}

export interface GameState {
  score: number;
  timeLeft: number;
  lives: number;
  level: number;
  combo: number;
  maxCombo: number;
  isRunning: boolean;
  isGameOver: boolean;
  highScore: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: 'bullet' | 'power';
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  token: Token;
  health: number;
  maxHealth: number;
  points: number;
  angle: number;
  wobble: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  char?: string;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  vy: number;
  type: 'triple' | 'moonshot' | 'diamond' | 'speed';
  label: string;
  color: string;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  fireRate: number;
  lastFired: number;
  tripleShot: boolean;
  tripleShotEnd: number;
  invincible: boolean;
  invincibleEnd: number;
}
