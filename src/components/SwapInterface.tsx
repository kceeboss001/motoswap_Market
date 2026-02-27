import { useState, useEffect, useCallback } from 'react';
import { TOKENS, formatPrice } from '../utils/tokens';
import { quoteSwap } from '../utils/opnet';
import { Token } from '../types';
import TokenModal from './TokenModal';
import './SwapInterface.css';

interface SwapProps { walletAddress: string | null; }

export default function SwapInterface({ walletAddress }: SwapProps) {
  const [tokenIn, setTokenIn] = useState<Token>(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS[1]);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [priceImpact, setPriceImpact] = useState(0);
  const [fee, setFee] = useState(0);
  const [slippage, setSlippage] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTokenInModal, setShowTokenInModal] = useState(false);
  const [showTokenOutModal, setShowTokenOutModal] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');

  const getQuote = useCallback(async (val: string) => {
    const num = parseFloat(val);
    if (!num || num <= 0) { setAmountOut(''); setPriceImpact(0); setFee(0); return; }
    setLoading(true);
    try {
      const result = await quoteSwap(tokenIn.address, tokenOut.address, num);
      setAmountOut(result.amountOut.toFixed(6));
      setPriceImpact(result.priceImpact);
      setFee(result.fee);
    } finally {
      setLoading(false);
    }
  }, [tokenIn, tokenOut]);

  useEffect(() => {
    const timer = setTimeout(() => getQuote(amountIn), 400);
    return () => clearTimeout(timer);
  }, [amountIn, getQuote]);

  const handleFlip = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  const handleSwap = async () => {
    if (!walletAddress) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    const hash = '0x' + Array.from({length: 64}, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
    setTxHash(hash);
    setSwapSuccess(true);
    setLoading(false);
    setTimeout(() => setSwapSuccess(false), 5000);
  };

  const rate = amountIn && amountOut
    ? `1 ${tokenIn.symbol} = ${(parseFloat(amountOut)/parseFloat(amountIn)).toFixed(6)} ${tokenOut.symbol}`
    : null;

  const impactColor = priceImpact < 1 ? 'var(--opnet-cyan)' : priceImpact < 3 ? '#F7931A' : '#FF4B6E';

  return (
    <div className="swap-layout">
      <div className="swap-center">
        {/* Header */}
        <div className="swap-header">
          <div>
            <h2 className="swap-title">Swap Tokens</h2>
            <p className="swap-subtitle">Trade OP-20 tokens directly on Bitcoin L1</p>
          </div>
          <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
            ⚙
          </button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="settings-panel glass-card">
            <div className="settings-row">
              <span>Slippage Tolerance</span>
              <div className="slippage-options">
                {[0.1, 0.5, 1.0].map(v => (
                  <button
                    key={v}
                    className={`slippage-btn ${slippage === v ? 'active' : ''}`}
                    onClick={() => setSlippage(v)}
                  >
                    {v}%
                  </button>
                ))}
                <input
                  type="number"
                  className="slippage-input"
                  value={slippage}
                  onChange={e => setSlippage(parseFloat(e.target.value) || 0.5)}
                  min={0.01} max={50} step={0.1}
                />
                <span className="slippage-pct">%</span>
              </div>
            </div>
            <div className="settings-row">
              <span>Transaction Deadline</span>
              <div className="deadline-input-wrap">
                <input type="number" className="slippage-input" defaultValue={20} min={1} max={60} />
                <span>minutes</span>
              </div>
            </div>
          </div>
        )}

        {/* Swap card */}
        <div className="swap-card glass-card">
          {/* Token In */}
          <div className="token-input-section">
            <div className="input-label-row">
              <span className="input-label">You Pay</span>
              <span className="input-balance">Balance: {walletAddress ? '4.2069' : '—'}</span>
            </div>
            <div className="token-input-row">
              <div className="token-select-btn" onClick={() => setShowTokenInModal(true)}>
                <div className="token-badge" style={{
                  background: `${tokenIn.logoColor}20`,
                  color: tokenIn.logoColor,
                  border: `1px solid ${tokenIn.logoColor}40`,
                }}>
                  {tokenIn.logoChar}
                </div>
                <div className="token-select-info">
                  <span className="token-select-symbol">{tokenIn.symbol}</span>
                  <span className="token-select-name">{tokenIn.name}</span>
                </div>
                <span className="chevron">▾</span>
              </div>
              <div className="amount-input-wrap">
                <input
                  type="number"
                  className="amount-input"
                  placeholder="0.00"
                  value={amountIn}
                  onChange={e => setAmountIn(e.target.value)}
                />
                <span className="amount-usd">
                  {amountIn && parseFloat(amountIn) > 0
                    ? `≈ ${formatPrice(parseFloat(amountIn) * tokenIn.price)}`
                    : '\u00a0'}
                </span>
              </div>
            </div>
            {walletAddress && (
              <div className="quick-amounts">
                {['25%', '50%', '75%', 'MAX'].map(pct => (
                  <button key={pct} className="quick-btn" onClick={() => {
                    const pctNum = pct === 'MAX' ? 1 : parseFloat(pct) / 100;
                    setAmountIn((4.2069 * pctNum).toFixed(6));
                  }}>
                    {pct}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Flip button */}
          <div className="flip-row">
            <button className="flip-btn" onClick={handleFlip}>
              <span className="flip-icon">⇅</span>
            </button>
            {rate && <span className="rate-display">{rate}</span>}
          </div>

          {/* Token Out */}
          <div className="token-input-section output">
            <div className="input-label-row">
              <span className="input-label">You Receive</span>
              <span className="input-balance">Balance: {walletAddress ? '1,337.00' : '—'}</span>
            </div>
            <div className="token-input-row">
              <div className="token-select-btn" onClick={() => setShowTokenOutModal(true)}>
                <div className="token-badge" style={{
                  background: `${tokenOut.logoColor}20`,
                  color: tokenOut.logoColor,
                  border: `1px solid ${tokenOut.logoColor}40`,
                }}>
                  {tokenOut.logoChar}
                </div>
                <div className="token-select-info">
                  <span className="token-select-symbol">{tokenOut.symbol}</span>
                  <span className="token-select-name">{tokenOut.name}</span>
                </div>
                <span className="chevron">▾</span>
              </div>
              <div className="amount-input-wrap">
                {loading ? (
                  <div className="amount-loading">
                    <div className="skeleton" style={{width: '120px', height: '36px'}} />
                  </div>
                ) : (
                  <input
                    type="number"
                    className="amount-input output-amount"
                    placeholder="0.00"
                    value={amountOut}
                    readOnly
                  />
                )}
                <span className="amount-usd">
                  {amountOut && parseFloat(amountOut) > 0
                    ? `≈ ${formatPrice(parseFloat(amountOut) * tokenOut.price)}`
                    : '\u00a0'}
                </span>
              </div>
            </div>
          </div>

          {/* Swap details */}
          {amountIn && parseFloat(amountIn) > 0 && amountOut && (
            <div className="swap-details">
              <div className="detail-row">
                <span>Price Impact</span>
                <span style={{ color: impactColor }}>{priceImpact.toFixed(3)}%</span>
              </div>
              <div className="detail-row">
                <span>LP Fee (0.3%)</span>
                <span>{fee.toFixed(8)} {tokenIn.symbol}</span>
              </div>
              <div className="detail-row">
                <span>Slippage</span>
                <span>{slippage}%</span>
              </div>
              <div className="detail-row">
                <span>Min. Received</span>
                <span>{(parseFloat(amountOut) * (1 - slippage / 100)).toFixed(6)} {tokenOut.symbol}</span>
              </div>
              <div className="detail-row">
                <span>Route</span>
                <span className="route">
                  {tokenIn.symbol} → {tokenOut.symbol}
                  <span className="route-badge">OPNet AMM</span>
                </span>
              </div>
            </div>
          )}

          {/* Action button */}
          {!walletAddress ? (
            <button className="swap-action-btn btn-primary" disabled>
              Connect Wallet to Swap
            </button>
          ) : !amountIn || parseFloat(amountIn) <= 0 ? (
            <button className="swap-action-btn btn-primary" disabled>
              Enter an Amount
            </button>
          ) : (
            <button
              className="swap-action-btn btn-primary"
              onClick={handleSwap}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" /> Swapping…
                </span>
              ) : (
                <>⚡ Swap {tokenIn.symbol} → {tokenOut.symbol}</>
              )}
            </button>
          )}

          {/* Success toast */}
          {swapSuccess && (
            <div className="swap-success">
              <span className="success-icon">✓</span>
              <div>
                <div className="success-title">Swap Confirmed!</div>
                <div className="success-hash">TX: {txHash.slice(0, 20)}…</div>
              </div>
            </div>
          )}
        </div>

        {/* OPNet info */}
        <div className="opnet-info">
          <span className="opnet-badge">🔗 Powered by OP_NET</span>
          <span>·</span>
          <span>Non-custodial · Bitcoin L1 · No Bridges</span>
        </div>
      </div>

      {/* Side stats */}
      <div className="swap-sidebar">
        <div className="sidebar-card glass-card">
          <div className="sidebar-title">Market Stats</div>
          {TOKENS.slice(0, 5).map(t => (
            <div className="market-row" key={t.symbol}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="token-badge" style={{
                  width: 28, height: 28, fontSize: 11,
                  background: `${t.logoColor}18`,
                  color: t.logoColor,
                  border: `1px solid ${t.logoColor}30`,
                }}>
                  {t.logoChar}
                </div>
                <span className="market-symbol">{t.symbol}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="market-price">{formatPrice(t.price)}</div>
                <div className={`market-change ${t.change24h >= 0 ? 'up' : 'down'}`}>
                  {t.change24h >= 0 ? '+' : ''}{t.change24h.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-card glass-card">
          <div className="sidebar-title">Protocol Stats</div>
          <div className="proto-row">
            <span>Total Volume (24h)</span>
            <span className="proto-val text-glow-orange">$5.82M</span>
          </div>
          <div className="proto-row">
            <span>Total TVL</span>
            <span className="proto-val text-glow-cyan">$23.4M</span>
          </div>
          <div className="proto-row">
            <span>Active Pools</span>
            <span className="proto-val">42</span>
          </div>
          <div className="proto-row">
            <span>Unique Traders (24h)</span>
            <span className="proto-val">1,337</span>
          </div>
          <div className="proto-row">
            <span>Bitcoin Block</span>
            <span className="proto-val" style={{ fontFamily: 'var(--font-mono)', color: 'var(--opnet-cyan)' }}>#878,420</span>
          </div>
        </div>
      </div>

      {/* Token modals */}
      {showTokenInModal && (
        <TokenModal
          selected={tokenIn}
          onSelect={t => { setTokenIn(t); setShowTokenInModal(false); }}
          onClose={() => setShowTokenInModal(false)}
          exclude={tokenOut.symbol}
        />
      )}
      {showTokenOutModal && (
        <TokenModal
          selected={tokenOut}
          onSelect={t => { setTokenOut(t); setShowTokenOutModal(false); }}
          onClose={() => setShowTokenOutModal(false)}
          exclude={tokenIn.symbol}
        />
      )}
    </div>
  );
}
