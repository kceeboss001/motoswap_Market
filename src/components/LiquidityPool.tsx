import { useState } from 'react';
import { POOLS, formatNumber } from '../utils/tokens';
import './LiquidityPool.css';

interface PoolProps { walletAddress: string | null; }

export default function LiquidityPool({ walletAddress }: PoolProps) {
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [tab, setTab] = useState<'add' | 'remove'>('add');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');

  return (
    <div className="pool-layout">
      <div className="pool-header">
        <div>
          <h2 className="pool-title">Liquidity Pools</h2>
          <p className="pool-subtitle">Provide liquidity · Earn 0.3% of every swap · Farm MOTO rewards</p>
        </div>
        {walletAddress && (
          <button className="btn-primary create-pool-btn">
            + Create Pool
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="pool-stats-bar">
        <div className="pool-stat glass-card">
          <div className="pool-stat-label">Total Value Locked</div>
          <div className="pool-stat-value text-glow-orange">$23.4M</div>
        </div>
        <div className="pool-stat glass-card">
          <div className="pool-stat-label">24h Volume</div>
          <div className="pool-stat-value text-glow-cyan">$5.82M</div>
        </div>
        <div className="pool-stat glass-card">
          <div className="pool-stat-label">Active LPs</div>
          <div className="pool-stat-value">4,218</div>
        </div>
        <div className="pool-stat glass-card">
          <div className="pool-stat-label">Avg APR</div>
          <div className="pool-stat-value" style={{color:'#F7931A'}}>105.5%</div>
        </div>
      </div>

      {/* Pool table */}
      <div className="pool-table glass-card">
        <div className="pool-table-header">
          <span>Pool</span>
          <span>TVL</span>
          <span>Volume 24h</span>
          <span>APR</span>
          <span>Fee</span>
          <span></span>
        </div>
        {POOLS.map(pool => (
          <div
            key={pool.id}
            className={`pool-row ${selectedPool === pool.id ? 'expanded' : ''}`}
          >
            <div className="pool-row-main" onClick={() => setSelectedPool(selectedPool === pool.id ? null : pool.id)}>
              <div className="pool-pair">
                <div className="pool-icons">
                  <div className="pool-icon" style={{background: `${pool.token0.logoColor}20`, color: pool.token0.logoColor, border: `1px solid ${pool.token0.logoColor}30`}}>
                    {pool.token0.logoChar}
                  </div>
                  <div className="pool-icon second" style={{background: `${pool.token1.logoColor}20`, color: pool.token1.logoColor, border: `1px solid ${pool.token1.logoColor}30`}}>
                    {pool.token1.logoChar}
                  </div>
                </div>
                <div>
                  <div className="pool-name">{pool.token0.symbol}/{pool.token1.symbol}</div>
                  <div className="pool-fee-badge">{pool.fee}% Fee</div>
                </div>
              </div>
              <span className="pool-tvl">{formatNumber(pool.tvl)}</span>
              <span className="pool-vol">{formatNumber(pool.volume24h)}</span>
              <span className="pool-apr" style={{color: pool.apr > 100 ? '#F7931A' : 'var(--opnet-cyan)'}}>
                {pool.apr.toFixed(1)}%
              </span>
              <span className="pool-fee-col">{pool.fee}%</span>
              <button className="pool-action-btn btn-secondary">
                {selectedPool === pool.id ? '▲ Close' : '▼ Manage'}
              </button>
            </div>

            {selectedPool === pool.id && (
              <div className="pool-expand">
                <div className="pool-expand-tabs">
                  <button
                    className={`expand-tab ${tab === 'add' ? 'active' : ''}`}
                    onClick={() => setTab('add')}
                  >
                    + Add Liquidity
                  </button>
                  <button
                    className={`expand-tab ${tab === 'remove' ? 'active' : ''}`}
                    onClick={() => setTab('remove')}
                  >
                    − Remove Liquidity
                  </button>
                </div>

                {tab === 'add' && (
                  <div className="pool-add-form">
                    <div className="lp-input-group">
                      <div className="lp-input-label">
                        <div className="pool-icon sm" style={{background: `${pool.token0.logoColor}20`, color: pool.token0.logoColor}}>
                          {pool.token0.logoChar}
                        </div>
                        {pool.token0.symbol}
                      </div>
                      <input
                        type="number"
                        className="lp-input"
                        placeholder="0.00"
                        value={amountA}
                        onChange={e => setAmountA(e.target.value)}
                      />
                    </div>
                    <div className="lp-plus">+</div>
                    <div className="lp-input-group">
                      <div className="lp-input-label">
                        <div className="pool-icon sm" style={{background: `${pool.token1.logoColor}20`, color: pool.token1.logoColor}}>
                          {pool.token1.logoChar}
                        </div>
                        {pool.token1.symbol}
                      </div>
                      <input
                        type="number"
                        className="lp-input"
                        placeholder="0.00"
                        value={amountB}
                        onChange={e => setAmountB(e.target.value)}
                      />
                    </div>
                    <div className="lp-info">
                      <div className="lp-info-row">
                        <span>Share of Pool</span>
                        <span>{amountA ? '<0.01%' : '—'}</span>
                      </div>
                      <div className="lp-info-row">
                        <span>LP Tokens Received</span>
                        <span>{amountA ? (parseFloat(amountA) * 0.001).toFixed(6) : '—'}</span>
                      </div>
                    </div>
                    <button
                      className="btn-primary lp-submit-btn"
                      disabled={!walletAddress || !amountA}
                    >
                      {walletAddress ? '+ Add Liquidity' : 'Connect Wallet'}
                    </button>
                  </div>
                )}

                {tab === 'remove' && (
                  <div className="pool-add-form">
                    <div className="remove-slider-label">
                      <span>Remove Amount</span>
                      <span className="remove-pct">50%</span>
                    </div>
                    <input type="range" className="remove-slider" min={0} max={100} defaultValue={50} />
                    <div className="remove-amounts">
                      <span>{pool.token0.symbol}: {walletAddress ? '0.0021' : '—'}</span>
                      <span>{pool.token1.symbol}: {walletAddress ? '142.3' : '—'}</span>
                    </div>
                    <button className="btn-primary lp-submit-btn" disabled={!walletAddress}>
                      {walletAddress ? '− Remove Liquidity' : 'Connect Wallet'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
