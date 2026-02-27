import { useState } from 'react';
import { POOLS, formatNumber } from '../utils/tokens';
import './FarmPanel.css';

interface FarmProps { walletAddress: string | null; }

export default function FarmPanel({ walletAddress }: FarmProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'finished'>('live');
  const [stakeAmounts, setStakeAmounts] = useState<Record<string, string>>({});

  const farms = POOLS.map((p, i) => ({
    ...p,
    motoPerBlock: (1.2 - i * 0.15).toFixed(2),
    multiplier: `${10 - i * 2}X`,
    earned: Math.random() * 50,
    staked: walletAddress ? Math.random() * 1000 : 0,
  }));

  return (
    <div className="farm-layout">
      <div className="farm-header">
        <div>
          <h2 className="farm-title">MotoChef Farms</h2>
          <p className="farm-subtitle">Stake LP tokens · Earn MOTO rewards · Inspired by SushiSwap MasterChef on Bitcoin</p>
        </div>
        <div className="farm-reward-summary glass-card">
          <div className="reward-icon">🏍</div>
          <div>
            <div className="reward-title">MOTO per Block</div>
            <div className="reward-val">40 MOTO</div>
          </div>
        </div>
      </div>

      {/* Harvest all */}
      {walletAddress && (
        <div className="harvest-all-bar glass-card">
          <div>
            <div className="harvest-label">MOTO Earned (all farms)</div>
            <div className="harvest-value">142.87 MOTO ≈ $2.03</div>
          </div>
          <button className="btn-primary harvest-btn">🌾 Harvest All</button>
        </div>
      )}

      <div className="farm-tabs">
        <button
          className={`farm-tab ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          🔥 Live Farms
        </button>
        <button
          className={`farm-tab ${activeTab === 'finished' ? 'active' : ''}`}
          onClick={() => setActiveTab('finished')}
        >
          Finished
        </button>
      </div>

      <div className="farm-grid">
        {farms.map(farm => (
          <div key={farm.id} className="farm-card glass-card">
            {/* Card header */}
            <div className="farm-card-header">
              <div className="farm-icons">
                <div className="pool-icon" style={{background: `${farm.token0.logoColor}20`, color: farm.token0.logoColor, border: `1px solid ${farm.token0.logoColor}30`, width: 42, height: 42, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 16, fontWeight: 800}}>
                  {farm.token0.logoChar}
                </div>
                <div className="pool-icon second" style={{background: `${farm.token1.logoColor}20`, color: farm.token1.logoColor, border: `1px solid ${farm.token1.logoColor}30`, width: 42, height: 42, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 16, fontWeight: 800, marginLeft: -14}}>
                  {farm.token1.logoChar}
                </div>
              </div>
              <div>
                <div className="farm-pair">{farm.token0.symbol}–{farm.token1.symbol}</div>
                <div className="farm-tags">
                  <span className="farm-tag orange">{farm.multiplier}</span>
                  <span className="farm-tag cyan">MotoChef</span>
                </div>
              </div>
            </div>

            {/* APR */}
            <div className="farm-apr-row">
              <div className="farm-metric">
                <div className="farm-metric-label">APR</div>
                <div className="farm-metric-value" style={{color: farm.apr > 100 ? '#F7931A' : 'var(--opnet-cyan)'}}>
                  {farm.apr.toFixed(1)}%
                </div>
              </div>
              <div className="farm-metric">
                <div className="farm-metric-label">TVL</div>
                <div className="farm-metric-value">{formatNumber(farm.tvl)}</div>
              </div>
              <div className="farm-metric">
                <div className="farm-metric-label">MOTO/Block</div>
                <div className="farm-metric-value" style={{color:'#FF4B6E'}}>{farm.motoPerBlock}</div>
              </div>
            </div>

            {/* MOTO earned */}
            <div className="farm-earn-box">
              <div>
                <div className="earn-label">🏍 MOTO Earned</div>
                <div className="earn-amount">{walletAddress ? farm.earned.toFixed(4) : '—'}</div>
              </div>
              <button
                className="btn-secondary harvest-farm-btn"
                disabled={!walletAddress || farm.earned === 0}
              >
                Harvest
              </button>
            </div>

            {/* LP Staked */}
            <div className="farm-stake-box">
              <div className="earn-label">{farm.token0.symbol}/{farm.token1.symbol} LP Staked</div>
              {walletAddress && farm.staked > 0 ? (
                <div>
                  <div className="earn-amount">{farm.staked.toFixed(4)} LP</div>
                  <div className="stake-actions">
                    <button className="stake-adj-btn">−</button>
                    <button className="stake-adj-btn">+</button>
                  </div>
                </div>
              ) : (
                <div>
                  {walletAddress ? (
                    <div className="stake-input-row">
                      <input
                        type="number"
                        className="stake-input"
                        placeholder="0.00 LP"
                        value={stakeAmounts[farm.id] || ''}
                        onChange={e => setStakeAmounts(prev => ({ ...prev, [farm.id]: e.target.value }))}
                      />
                      <button className="btn-primary stake-btn">Stake</button>
                    </div>
                  ) : (
                    <button className="btn-primary stake-btn full">Connect Wallet</button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
