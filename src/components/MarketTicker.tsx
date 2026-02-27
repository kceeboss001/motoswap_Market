import { TOKENS, formatPrice } from '../utils/tokens';
import './MarketTicker.css';

export default function MarketTicker() {
  const items = [...TOKENS, ...TOKENS]; // duplicate for seamless loop

  return (
    <div className="ticker-wrapper">
      <div className="ticker-label">LIVE</div>
      <div className="ticker-track">
        <div className="ticker-content">
          {items.map((token, i) => (
            <span className="ticker-item" key={`${token.symbol}-${i}`}>
              <span className="ticker-icon" style={{ color: token.logoColor }}>
                {token.logoChar}
              </span>
              <span className="ticker-symbol">{token.symbol}</span>
              <span className="ticker-price">{formatPrice(token.price)}</span>
              <span className={`ticker-change ${token.change24h >= 0 ? 'up' : 'down'}`}>
                {token.change24h >= 0 ? '▲' : '▼'} {Math.abs(token.change24h).toFixed(2)}%
              </span>
              <span className="ticker-sep">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
