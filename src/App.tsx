import { useState } from 'react';
import Navbar from './components/Navbar';
import SwapInterface from './components/SwapInterface';
import LiquidityPool from './components/LiquidityPool';
import FarmPanel from './components/FarmPanel';
import MarketTicker from './components/MarketTicker';
import BlockSwapGame from './components/BlockSwapGame';
import Shop from './components/Shop';
import './App.css';

type Page = 'swap' | 'pool' | 'farm' | 'game' | 'shop';

function App() {
  const [page, setPage] = useState<Page>('swap');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  return (
    <div className="app-root">
      <Navbar
        page={page}
        onNavigate={setPage}
        walletAddress={walletAddress}
        onWalletConnect={setWalletAddress}
      />
      <MarketTicker />
      <main className="app-main">
        {page === 'swap' && <SwapInterface walletAddress={walletAddress} />}
        {page === 'pool' && <LiquidityPool walletAddress={walletAddress} />}
        {page === 'farm' && <FarmPanel walletAddress={walletAddress} />}
        {page === 'game' && <BlockSwapGame />}
        {page === 'shop' && (
          <Shop walletAddress={walletAddress} onWalletConnect={setWalletAddress} />
        )}
      </main>
      <footer className="app-footer">
        <div className="footer-inner">
          <span className="footer-brand">
            <span className="text-glow-orange">Moto</span>
            <span className="text-glow-cyan">Swap</span>
          </span>
          <span className="footer-sep">×</span>
          <span className="footer-opnet">OP_NET Bitcoin L1</span>
          <div className="footer-links">
            <span>Docs</span>
            <span>GitHub</span>
            <span>Discord</span>
            <span>Audit</span>
          </div>
          <span className="footer-version">v1.0.0 — Block #878,420</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
