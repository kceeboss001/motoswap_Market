import { useState, useEffect, useRef } from 'react';
import { connectWallet } from '../utils/opnet';
import './Shop.css';

const BTC_USD = 97_450;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  desc: string;
  baseUsd: number;
  stock: number;
  tag: string;
  sizes?: string[];
  limited?: boolean;
  accent: string;
}

interface CartItem {
  product: Product;
  qty: number;
  size?: string;
}

interface TxResult {
  txHash: string;
  item: string;
  usd: number;
  btc: number;
}

// ─── Products ─────────────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  {
    id: 'cap',
    name: 'MotoSwap Snapback',
    desc: 'Premium snapback with embroidered MotoSwap × OP_NET logo. Adjustable, structured brim. One size fits all.',
    baseUsd: 35,
    stock: 48,
    tag: 'Accessories',
    accent: '#F7931A',
  },
  {
    id: 'shirt',
    name: 'MotoSwap Classic Tee',
    desc: '100% organic cotton. Lightning logo on chest, Bitcoin block height on back. Unisex sizing.',
    baseUsd: 45,
    stock: 72,
    tag: 'Apparel',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    accent: '#00D4AA',
  },
  {
    id: 'bicycle',
    name: 'MotoSwap Fixie Bike',
    desc: 'Limited-edition fixed-gear bicycle. Full MotoSwap vinyl wrap in signature orange & black. Ships worldwide.',
    baseUsd: 299,
    stock: 7,
    tag: 'Sports',
    accent: '#FF4B6E',
    limited: true,
  },
];

// ─── Price simulation ─────────────────────────────────────────────────────────
function makePrices(base: number, n = 60): number[] {
  const arr: number[] = [base];
  for (let i = 1; i < n; i++) {
    const p = arr[i - 1];
    arr.push(Math.max(p + p * (Math.random() - 0.485) * 0.014, base * 0.88));
  }
  return arr;
}

function tickPrice(h: number[], base: number): number[] {
  const p = h[h.length - 1];
  const next = Math.min(
    Math.max(p + p * (Math.random() - 0.485) * 0.014, base * 0.86),
    base * 1.22
  );
  return [...h.slice(1), next];
}

// ─── Canvas chart drawing ─────────────────────────────────────────────────────
function drawChart(
  ctx: CanvasRenderingContext2D,
  prices: number[],
  color: string,
  W: number,
  H: number,
  labels: boolean
) {
  ctx.clearRect(0, 0, W, H);
  const pad = labels
    ? { t: 14, r: 8, b: 26, l: 48 }
    : { t: 5, r: 5, b: 5, l: 5 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const min = Math.min(...prices) * 0.998;
  const max = Math.max(...prices) * 1.002;
  const rng = max - min || 0.001;

  const px = (i: number) => pad.l + (i / (prices.length - 1)) * cw;
  const py = (v: number) => pad.t + ch - ((v - min) / rng) * ch;

  if (labels) {
    ctx.strokeStyle = '#ffffff10';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const gy = pad.t + (i / 4) * ch;
      ctx.beginPath();
      ctx.moveTo(pad.l, gy);
      ctx.lineTo(W - pad.r, gy);
      ctx.stroke();
      const val = max - (i / 4) * (max - min);
      ctx.fillStyle = '#ffffff55';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('$' + val.toFixed(val < 10 ? 2 : 0), pad.l - 4, gy + 4);
    }
    const xLabels = ['60s', '45s', '30s', '15s', 'now'];
    for (let i = 0; i <= 4; i++) {
      const gx = pad.l + (i / 4) * cw;
      ctx.fillStyle = '#ffffff45';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(xLabels[i], gx, H - 5);
    }
  }

  // Gradient fill
  const grd = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
  grd.addColorStop(0, color + '48');
  grd.addColorStop(1, color + '04');

  ctx.beginPath();
  ctx.moveTo(px(0), py(prices[0]));
  for (let i = 1; i < prices.length; i++) {
    const cpx = (px(i - 1) + px(i)) / 2;
    ctx.bezierCurveTo(cpx, py(prices[i - 1]), cpx, py(prices[i]), px(i), py(prices[i]));
  }
  ctx.lineTo(px(prices.length - 1), H - pad.b);
  ctx.lineTo(px(0), H - pad.b);
  ctx.closePath();
  ctx.fillStyle = grd;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = labels ? 2.5 : 2;
  ctx.lineJoin = 'round';
  ctx.moveTo(px(0), py(prices[0]));
  for (let i = 1; i < prices.length; i++) {
    const cpx = (px(i - 1) + px(i)) / 2;
    ctx.bezierCurveTo(cpx, py(prices[i - 1]), cpx, py(prices[i]), px(i), py(prices[i]));
  }
  ctx.stroke();

  // Live dot
  const lx = px(prices.length - 1);
  const ly = py(prices[prices.length - 1]);
  ctx.beginPath();
  ctx.arc(lx, ly, labels ? 4.5 : 3.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(lx, ly, labels ? 9 : 6, 0, Math.PI * 2);
  ctx.strokeStyle = color + '75';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function MiniChart({ prices, color }: { prices: number[]; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    drawChart(ctx, prices, color, c.width, c.height, false);
  }, [prices, color]);
  return <canvas ref={ref} width={268} height={72} className="mini-chart-canvas" />;
}

function BigChart({ prices, color }: { prices: number[]; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    drawChart(ctx, prices, color, c.width, c.height, true);
  }, [prices, color]);
  return <canvas ref={ref} width={560} height={200} className="big-chart-canvas" />;
}

// ─── SVG Product Art ──────────────────────────────────────────────────────────
function CapSvg() {
  return (
    <svg viewBox="0 0 200 145" className="product-svg">
      <defs>
        <radialGradient id="capGlow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#F7931A" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#F7931A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="128" rx="82" ry="14" fill="url(#capGlow)" />
      {/* Cap crown */}
      <path d="M32 102 Q100 28 168 102" fill="#0f1624" stroke="#F7931A" strokeWidth="2.5" />
      <ellipse cx="100" cy="102" rx="68" ry="20" fill="#0f1624" stroke="#F7931A" strokeWidth="2" />
      {/* Brim */}
      <path d="M32 102 Q6 112 20 122 Q58 134 100 132" fill="#08101e" stroke="#F7931A" strokeWidth="1.5" />
      {/* Seam */}
      <line x1="100" y1="32" x2="100" y2="82" stroke="#F7931A" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
      {/* Button */}
      <circle cx="100" cy="32" r="6" fill="#08101e" stroke="#F7931A" strokeWidth="2" />
      <circle cx="100" cy="32" r="2.5" fill="#F7931A" />
      {/* Logo patch */}
      <rect x="73" y="80" width="54" height="30" rx="5" fill="#F7931A" fillOpacity="0.1" stroke="#F7931A" strokeWidth="1.5" />
      <text x="100" y="92" textAnchor="middle" fill="#F7931A" fontSize="9" fontWeight="bold" fontFamily="monospace">MOTO</text>
      <text x="100" y="104" textAnchor="middle" fill="#00D4AA" fontSize="9" fontWeight="bold" fontFamily="monospace">SWAP</text>
      {/* Vent holes */}
      <circle cx="63" cy="68" r="2.5" fill="none" stroke="#F7931A" strokeWidth="1.2" opacity="0.5" />
      <circle cx="137" cy="68" r="2.5" fill="none" stroke="#F7931A" strokeWidth="1.2" opacity="0.5" />
      <circle cx="80" cy="52" r="2" fill="none" stroke="#F7931A" strokeWidth="1" opacity="0.35" />
      <circle cx="120" cy="52" r="2" fill="none" stroke="#F7931A" strokeWidth="1" opacity="0.35" />
    </svg>
  );
}

function ShirtSvg() {
  return (
    <svg viewBox="0 0 220 200" className="product-svg">
      <defs>
        <radialGradient id="shirtGlow" cx="50%" cy="65%" r="55%">
          <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="110" cy="178" rx="82" ry="14" fill="url(#shirtGlow)" />
      {/* Body */}
      <path d="M66 48 L18 80 L40 93 L43 172 L177 172 L180 93 L202 80 L154 48 Q134 20 110 32 Q86 20 66 48 Z"
        fill="#0d1520" stroke="#00D4AA" strokeWidth="2" />
      {/* Collar */}
      <path d="M86 48 Q110 65 134 48" fill="none" stroke="#00D4AA" strokeWidth="2.5" />
      {/* Left sleeve */}
      <path d="M66 48 L18 80 L40 93 L58 62 Z" fill="#0a1018" stroke="#00D4AA" strokeWidth="1.5" />
      {/* Right sleeve */}
      <path d="M154 48 L202 80 L180 93 L162 62 Z" fill="#0a1018" stroke="#00D4AA" strokeWidth="1.5" />
      {/* Bottom hem */}
      <line x1="43" y1="172" x2="177" y2="172" stroke="#00D4AA" strokeWidth="1" opacity="0.4" />
      {/* Logo ring */}
      <circle cx="110" cy="120" r="27" fill="#00D4AA" fillOpacity="0.08" stroke="#00D4AA" strokeWidth="1.5" />
      {/* Lightning bolt */}
      <path d="M113 98 L104 121 L111 121 L105 143 L119 117 L112 117 Z" fill="#F7931A" opacity="0.95" />
      <text x="110" y="155" textAnchor="middle" fill="#00D4AA" fontSize="8" fontWeight="bold" fontFamily="monospace">MOTOSWAP</text>
    </svg>
  );
}

function BicycleSvg() {
  const spokes = (cx: number, cy: number, r: number) =>
    [0, 40, 80, 120, 160].map(a => (
      <g key={a}>
        <line
          x1={cx} y1={cy}
          x2={cx + r * Math.cos((a * Math.PI) / 180)}
          y2={cy + r * Math.sin((a * Math.PI) / 180)}
          stroke="#F7931A" strokeWidth="1" opacity="0.45"
        />
        <line
          x1={cx} y1={cy}
          x2={cx - r * Math.cos((a * Math.PI) / 180)}
          y2={cy - r * Math.sin((a * Math.PI) / 180)}
          stroke="#F7931A" strokeWidth="1" opacity="0.45"
        />
      </g>
    ));

  return (
    <svg viewBox="0 0 265 168" className="product-svg">
      <defs>
        <radialGradient id="bikeGlow" cx="50%" cy="75%" r="55%">
          <stop offset="0%" stopColor="#FF4B6E" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FF4B6E" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="132" cy="150" rx="105" ry="16" fill="url(#bikeGlow)" />
      {/* Rear wheel */}
      <circle cx="68" cy="114" r="44" fill="none" stroke="#F7931A" strokeWidth="2.5" />
      <circle cx="68" cy="114" r="5" fill="#F7931A" />
      {spokes(68, 114, 39)}
      {/* Front wheel */}
      <circle cx="196" cy="114" r="44" fill="none" stroke="#F7931A" strokeWidth="2.5" />
      <circle cx="196" cy="114" r="5" fill="#F7931A" />
      {spokes(196, 114, 39)}
      {/* Frame — seat tube */}
      <line x1="112" y1="114" x2="118" y2="60" stroke="#99AACC" strokeWidth="2" />
      {/* Frame — top tube */}
      <line x1="118" y1="60" x2="132" y2="58" stroke="#FF4B6E" strokeWidth="2.5" />
      {/* Frame — down tube */}
      <line x1="132" y1="58" x2="112" y2="114" stroke="#FF4B6E" strokeWidth="3" />
      {/* Frame — chain stay */}
      <line x1="112" y1="114" x2="68" y2="114" stroke="#FF4B6E" strokeWidth="2.5" />
      {/* Frame — seat stay */}
      <line x1="68" y1="114" x2="118" y2="60" stroke="#FF4B6E" strokeWidth="2" />
      {/* Fork */}
      <line x1="132" y1="58" x2="196" y2="114" stroke="#FF4B6E" strokeWidth="3" />
      {/* Head tube */}
      <rect x="129" y="52" width="6" height="22" rx="3" fill="#888" />
      {/* Handlebar stem */}
      <line x1="132" y1="52" x2="132" y2="38" stroke="#999" strokeWidth="2" />
      {/* Handlebars */}
      <line x1="120" y1="38" x2="144" y2="38" stroke="#aaa" strokeWidth="3" strokeLinecap="round" />
      {/* Seat post */}
      <line x1="118" y1="60" x2="118" y2="48" stroke="#999" strokeWidth="2" />
      {/* Seat */}
      <ellipse cx="118" cy="46" rx="14" ry="4" fill="#333" stroke="#888" strokeWidth="1.5" />
      {/* Chainring */}
      <circle cx="112" cy="114" r="18" fill="none" stroke="#777" strokeWidth="1.5" />
      <circle cx="112" cy="114" r="5" fill="#777" />
      {/* Logo on frame */}
      <text x="150" y="96" fill="#F7931A" fontSize="9" fontWeight="bold" fontFamily="monospace"
        transform="rotate(-33, 150, 96)">MOTO</text>
      <text x="155" y="108" fill="#00D4AA" fontSize="8" fontFamily="monospace"
        transform="rotate(-33, 155, 108)">SWAP</text>
    </svg>
  );
}

// ─── Main Shop Component ──────────────────────────────────────────────────────
interface ShopProps {
  walletAddress: string | null;
  onWalletConnect: (addr: string) => void;
}

export default function Shop({ walletAddress, onWalletConnect }: ShopProps) {
  const [histories, setHistories] = useState<Record<string, number[]>>(() => ({
    cap: makePrices(35),
    shirt: makePrices(45),
    bicycle: makePrices(299),
  }));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [sizes, setSizes] = useState<Record<string, string>>({ shirt: 'M' });
  const [focused, setFocused] = useState<string>('bicycle');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<TxResult | null>(null);
  const [connectingFor, setConnectingFor] = useState<string | null>(null);

  // Live price tick every 1.2s
  useEffect(() => {
    const id = setInterval(() => {
      setHistories(prev => ({
        cap: tickPrice(prev.cap, 35),
        shirt: tickPrice(prev.shirt, 45),
        bicycle: tickPrice(prev.bicycle, 299),
      }));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const curPrice = (id: string) => histories[id][histories[id].length - 1];
  const pctChange = (id: string) => {
    const h = histories[id];
    return ((h[h.length - 1] - h[0]) / h[0]) * 100;
  };

  const addCart = (p: Product) => {
    const sz = p.sizes ? sizes[p.id] ?? 'M' : undefined;
    setCart(prev => {
      const idx = prev.findIndex(i => i.product.id === p.id && i.size === sz);
      if (idx >= 0)
        return prev.map((i, j) => (j === idx ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { product: p, qty: 1, size: sz }];
    });
    setCartOpen(true);
  };

  const removeCart = (pid: string, sz?: string) =>
    setCart(prev => prev.filter(i => !(i.product.id === pid && i.size === sz)));

  const cartTotal = cart.reduce((s, i) => s + curPrice(i.product.id) * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const ensureWallet = async (key: string): Promise<string | null> => {
    if (walletAddress) return walletAddress;
    setConnectingFor(key);
    try {
      const result = await connectWallet();
      if (result) {
        onWalletConnect(result.address);
        return result.address;
      }
    } finally {
      setConnectingFor(null);
    }
    return null;
  };

  const handleBuy = async (p: Product) => {
    const addr = await ensureWallet(p.id);
    if (!addr) return;
    setPurchasing(p.id);
    await new Promise(r => setTimeout(r, 1600));
    const txHash =
      '0x' +
      Array.from({ length: 64 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');
    setTxResult({
      txHash,
      item: p.name,
      usd: curPrice(p.id),
      btc: curPrice(p.id) / BTC_USD,
    });
    setPurchasing(null);
  };

  const handleCheckout = async () => {
    const addr = await ensureWallet('checkout');
    if (!addr) return;
    setPurchasing('checkout');
    await new Promise(r => setTimeout(r, 2000));
    const txHash =
      '0x' +
      Array.from({ length: 64 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');
    setTxResult({
      txHash,
      item: `${cartCount} item${cartCount > 1 ? 's' : ''}`,
      usd: cartTotal,
      btc: cartTotal / BTC_USD,
    });
    setCart([]);
    setCartOpen(false);
    setPurchasing(null);
  };

  const focusedProd = PRODUCTS.find(p => p.id === focused)!;
  const focusedChange = pctChange(focused);

  return (
    <div className="shop">
      {/* ── Hero ── */}
      <section className="shop-hero">
        <div className="shop-hero-left">
          <div className="shop-badge">
            <span className="badge-live-dot" />
            OP_NET × MotoSwap Official Store
          </div>
          <h1 className="shop-title">
            <span className="glow-orange">Moto</span>
            <span className="glow-cyan">Swap</span>
            <span className="shop-title-merch"> Merch</span>
          </h1>
          <p className="shop-subtitle">
            Rep the protocol. Pay with BTC via OP_NET smart contract.
            <br />
            All item prices are live and on-chain.
          </p>
          <div className="shop-stats">
            <div className="stat-pill">
              <span className="stat-label">Items Sold</span>
              <span className="stat-val glow-orange">1,247</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">BTC Volume</span>
              <span className="stat-val glow-cyan">4.82 BTC</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Holders</span>
              <span className="stat-val">893</span>
            </div>
          </div>
          {!walletAddress && (
            <div className="hero-wallet-prompt">
              <span className="prompt-icon">⚡</span>
              Connect your OPNet wallet to purchase with Bitcoin
            </div>
          )}
        </div>

        {/* Big live chart */}
        <div className="shop-hero-chart">
          <div className="chart-header">
            <div className="chart-tabs">
              {PRODUCTS.map(p => (
                <button
                  key={p.id}
                  className={`chart-tab ${focused === p.id ? 'active' : ''}`}
                  style={
                    focused === p.id
                      ? { borderColor: p.accent, color: p.accent, background: p.accent + '18' }
                      : {}
                  }
                  onClick={() => setFocused(p.id)}
                >
                  {p.id === 'cap' ? '🧢' : p.id === 'shirt' ? '👕' : '🚲'}{' '}
                  {p.tag}
                </button>
              ))}
            </div>
            <div className="chart-price-info">
              <span className="chart-current" style={{ color: focusedProd.accent }}>
                ${curPrice(focused).toFixed(2)}
              </span>
              <span className={`chart-change ${focusedChange >= 0 ? 'up' : 'down'}`}>
                {focusedChange >= 0 ? '▲' : '▼'} {Math.abs(focusedChange).toFixed(2)}%
              </span>
              <span className="live-badge">● LIVE</span>
            </div>
          </div>
          <BigChart prices={histories[focused]} color={focusedProd.accent} />
          <div className="chart-footer">
            <span className="chart-meta">Last 60 data points · updates every 1.2s</span>
            <span className="chart-btc">
              {(curPrice(focused) / BTC_USD).toFixed(6)} BTC
            </span>
          </div>
        </div>
      </section>

      {/* ── Products ── */}
      <section className="shop-products">
        <div className="section-head">
          <div>
            <h2 className="section-title">Shop Collection</h2>
            <p className="section-sub">3 exclusive drops · limited quantities</p>
          </div>
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            🛒 Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>

        <div className="product-grid">
          {PRODUCTS.map(p => {
            const price = curPrice(p.id);
            const chg = pctChange(p.id);
            const isLoading = purchasing === p.id;
            const isConnecting = connectingFor === p.id;

            return (
              <div
                key={p.id}
                className={`product-card ${p.limited ? 'limited' : ''}`}
                style={{ '--accent': p.accent } as React.CSSProperties}
              >
                {p.limited && (
                  <div className="limited-banner" style={{ background: p.accent }}>
                    ★ LIMITED EDITION — {p.stock} LEFT
                  </div>
                )}

                {/* Art */}
                <div
                  className="product-art"
                  onClick={() => setFocused(p.id)}
                  title="View price chart"
                >
                  {p.id === 'cap' && <CapSvg />}
                  {p.id === 'shirt' && <ShirtSvg />}
                  {p.id === 'bicycle' && <BicycleSvg />}
                  <div className="art-hover-tip">📈 View Chart</div>
                </div>

                {/* Info */}
                <div className="product-info">
                  <div className="product-tag" style={{ color: p.accent }}>
                    {p.tag}
                  </div>
                  <h3 className="product-name">{p.name}</h3>
                  <p className="product-desc">{p.desc}</p>

                  {/* Price */}
                  <div className="price-row">
                    <div>
                      <div className="price-usd">${price.toFixed(2)}</div>
                      <div className="price-btc">
                        {(price / BTC_USD).toFixed(6)} BTC
                      </div>
                    </div>
                    <span className={`price-change ${chg >= 0 ? 'up' : 'down'}`}>
                      {chg >= 0 ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
                    </span>
                  </div>

                  {/* Mini chart */}
                  <div className="mini-chart-wrap">
                    <MiniChart prices={histories[p.id]} color={p.accent} />
                  </div>

                  {/* Size selector */}
                  {p.sizes && (
                    <div className="size-row">
                      <span className="size-label">Size</span>
                      <div className="sizes">
                        {p.sizes.map(s => (
                          <button
                            key={s}
                            className={`size-btn ${sizes[p.id] === s ? 'active' : ''}`}
                            style={
                              sizes[p.id] === s
                                ? {
                                    borderColor: p.accent,
                                    color: p.accent,
                                    background: p.accent + '20',
                                  }
                                : {}
                            }
                            onClick={() =>
                              setSizes(prev => ({ ...prev, [p.id]: s }))
                            }
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock bar */}
                  <div className="stock-row">
                    <div className="stock-bar">
                      <div
                        className="stock-fill"
                        style={{
                          width: `${Math.min((p.stock / 80) * 100, 100)}%`,
                          background:
                            p.stock <= 10 ? '#FF4B6E' : p.accent,
                        }}
                      />
                    </div>
                    <span className={`stock-label ${p.stock <= 10 ? 'low' : ''}`}>
                      {p.stock <= 10
                        ? `⚠ Only ${p.stock} left!`
                        : `${p.stock} in stock`}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="product-actions">
                    <button className="btn-add-cart" onClick={() => addCart(p)}>
                      + Cart
                    </button>
                    <button
                      className="btn-buy-now"
                      disabled={isLoading || isConnecting}
                      style={{
                        background: `linear-gradient(135deg, ${p.accent}, ${p.accent}bb)`,
                        boxShadow: `0 4px 20px ${p.accent}40`,
                      }}
                      onClick={() => handleBuy(p)}
                    >
                      {isLoading ? (
                        <span className="btn-spin">
                          <span className="spinner" /> Buying…
                        </span>
                      ) : isConnecting ? (
                        <span className="btn-spin">
                          <span className="spinner" /> Connecting…
                        </span>
                      ) : (
                        '⚡ Buy Now'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Cart Panel ── */}
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-panel" onClick={e => e.stopPropagation()}>
            <div className="cart-panel-header">
              <span className="cart-panel-title">🛒 Cart ({cartCount})</span>
              <button className="cart-close" onClick={() => setCartOpen(false)}>
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">🛒</div>
                <p>Your cart is empty</p>
                <span>Add some MotoSwap merch!</span>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item, idx) => (
                    <div key={idx} className="cart-item">
                      <div className="cart-item-emoji">
                        {item.product.id === 'cap'
                          ? '🧢'
                          : item.product.id === 'shirt'
                          ? '👕'
                          : '🚲'}
                      </div>
                      <div className="cart-item-info">
                        <span className="cart-item-name">{item.product.name}</span>
                        {item.size && (
                          <span className="cart-item-size">Size: {item.size}</span>
                        )}
                        <span className="cart-item-price">
                          ${(curPrice(item.product.id) * item.qty).toFixed(2)}
                          <span className="cart-item-qty"> ×{item.qty}</span>
                        </span>
                      </div>
                      <button
                        className="cart-remove"
                        onClick={() => removeCart(item.product.id, item.size)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-total-row">
                    <span className="cart-total-label">Total</span>
                    <div className="cart-total-amounts">
                      <span className="cart-total-usd">${cartTotal.toFixed(2)}</span>
                      <span className="cart-total-btc">
                        {(cartTotal / BTC_USD).toFixed(6)} BTC
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn-checkout"
                    onClick={handleCheckout}
                    disabled={purchasing === 'checkout' || connectingFor === 'checkout'}
                  >
                    {purchasing === 'checkout' ? (
                      <span className="btn-spin">
                        <span className="spinner" /> Processing on OP_NET…
                      </span>
                    ) : connectingFor === 'checkout' ? (
                      <span className="btn-spin">
                        <span className="spinner" /> Connecting wallet…
                      </span>
                    ) : walletAddress ? (
                      '⚡ Checkout with BTC'
                    ) : (
                      '⚡ Connect & Checkout'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TX Success Modal ── */}
      {txResult && (
        <div className="modal-overlay" onClick={() => setTxResult(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-check">✓</div>
            <h3 className="modal-title">Order Confirmed!</h3>
            <p className="modal-sub">Your MotoSwap merch is being processed on OP_NET.</p>
            <div className="modal-details">
              <div className="modal-row">
                <span>Item</span>
                <span>{txResult.item}</span>
              </div>
              <div className="modal-row">
                <span>Amount</span>
                <span>
                  ${txResult.usd.toFixed(2)}{' '}
                  <span className="modal-btc-amount">
                    ({txResult.btc.toFixed(6)} BTC)
                  </span>
                </span>
              </div>
              <div className="modal-row">
                <span>TX Hash</span>
                <span className="modal-hash">{txResult.txHash.slice(0, 22)}…</span>
              </div>
              <div className="modal-row">
                <span>Network</span>
                <span className="glow-orange">OP_NET Bitcoin L1</span>
              </div>
              <div className="modal-row">
                <span>Status</span>
                <span className="modal-status-confirmed">Confirmed ✓</span>
              </div>
            </div>
            <button className="modal-close-btn" onClick={() => setTxResult(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
