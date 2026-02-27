import { useState } from 'react';
import { TOKENS, formatPrice } from '../utils/tokens';
import { Token } from '../types';
import './TokenModal.css';

interface TokenModalProps {
  selected: Token;
  onSelect: (t: Token) => void;
  onClose: () => void;
  exclude?: string;
}

export default function TokenModal({ selected, onSelect, onClose, exclude }: TokenModalProps) {
  const [search, setSearch] = useState('');

  const filtered = TOKENS.filter(t =>
    t.symbol !== exclude &&
    (search === '' ||
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="token-modal glass-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Select Token</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-search">
          <span className="search-icon">⌕</span>
          <input
            autoFocus
            type="text"
            placeholder="Search token name or symbol…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Popular */}
        <div className="popular-tokens">
          {TOKENS.slice(0, 4).filter(t => t.symbol !== exclude).map(t => (
            <div
              key={t.symbol}
              className={`popular-token-chip ${selected.symbol === t.symbol ? 'active' : ''}`}
              onClick={() => onSelect(t)}
            >
              <span style={{ color: t.logoColor }}>{t.logoChar}</span>
              <span>{t.symbol}</span>
            </div>
          ))}
        </div>

        <div className="modal-list-header">
          <span>Token</span>
          <span>Price</span>
        </div>

        <div className="token-list">
          {filtered.map(t => (
            <div
              key={t.symbol}
              className={`token-list-item ${selected.symbol === t.symbol ? 'selected' : ''}`}
              onClick={() => onSelect(t)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="token-badge" style={{
                  width: 40, height: 40, fontSize: 16,
                  background: `${t.logoColor}18`,
                  color: t.logoColor,
                  border: `1px solid ${t.logoColor}30`,
                }}>
                  {t.logoChar}
                </div>
                <div>
                  <div className="tli-symbol">{t.symbol}</div>
                  <div className="tli-name">{t.name}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="tli-price">{formatPrice(t.price)}</div>
                <div className={`tli-change ${t.change24h >= 0 ? 'up' : 'down'}`}>
                  {t.change24h >= 0 ? '+' : ''}{t.change24h.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <span className="modal-footer-text">🔗 OP-20 Tokens on Bitcoin Mainnet</span>
        </div>
      </div>
    </div>
  );
}
