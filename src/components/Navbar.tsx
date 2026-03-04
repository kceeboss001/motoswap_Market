import { useState } from 'react';
import { connectWallet } from '../utils/opnet';
import './Navbar.css';

type Page = 'swap' | 'pool' | 'farm' | 'game' | 'shop';

interface NavbarProps {
  page: Page;
  onNavigate: (p: Page) => void;
  walletAddress: string | null;
  onWalletConnect: (addr: string) => void;
}

export default function Navbar({ page, onNavigate, walletAddress, onWalletConnect }: NavbarProps) {
  const [connecting, setConnecting] = useState(false);
  const [networkDropdown, setNetworkDropdown] = useState(false);
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet');

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await connectWallet();
      if (result) onWalletConnect(result.address);
    } finally {
      setConnecting(false);
    }
  };

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 8)}…${walletAddress.slice(-4)}`
    : null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => onNavigate('swap')}>
          <div className="logo-icon">
            <span className="logo-btc">₿</span>
          </div>
          <div className="logo-text">
            <span className="logo-moto">Moto</span>
            <span className="logo-swap">Verse</span>
          </div>
          <div className="logo-badge">OP_NET</div>
        </div>

        {/* Nav links */}
        <div className="navbar-links">
          {(['swap', 'pool', 'farm', 'shop', 'game'] as Page[]).map(p => (
            <button
              key={p}
              className={`nav-link ${page === p ? 'active' : ''}`}
              onClick={() => onNavigate(p)}
            >
              {p === 'swap' && '⇄ Swap'}
              {p === 'pool' && '◉ Pools'}
              {p === 'farm' && '🌾 Farm'}
              {p === 'shop' && '🛍️ Shop'}
              {p === 'game' && '🎮 Block Blast'}
              {page === p && <span className="nav-active-dot" />}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {/* Network selector */}
          <div className="network-selector" onClick={() => setNetworkDropdown(!networkDropdown)}>
            <div className={`network-dot ${network}`} />
            <span>{network === 'mainnet' ? 'Bitcoin Mainnet' : 'Testnet'}</span>
            <span className="dropdown-arrow">{networkDropdown ? '▲' : '▼'}</span>
            {networkDropdown && (
              <div className="network-dropdown">
                <div className="network-option" onClick={() => { setNetwork('mainnet'); setNetworkDropdown(false); }}>
                  <div className="network-dot mainnet" /> Bitcoin Mainnet
                </div>
                <div className="network-option" onClick={() => { setNetwork('testnet'); setNetworkDropdown(false); }}>
                  <div className="network-dot testnet" /> Testnet4
                </div>
              </div>
            )}
          </div>

          {/* Gas indicator */}
          <div className="gas-badge">
            <span className="gas-icon">⛽</span>
            <span className="gas-value">12 sat/vB</span>
          </div>

          {/* Wallet button */}
          {walletAddress ? (
            <div className="wallet-connected">
              <div className="wallet-avatar">
                {shortAddr?.slice(4, 6).toUpperCase()}
              </div>
              <span className="wallet-addr">{shortAddr}</span>
            </div>
          ) : (
            <button
              className="connect-btn btn-primary"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <span className="btn-loading">
                  <span className="spinner" /> Connecting…
                </span>
              ) : (
                '⚡ Connect Wallet'
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
