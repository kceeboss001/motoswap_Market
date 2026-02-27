import { useEffect, useRef, useState, useCallback } from 'react';
import './BlockSwapGame.css';

// ─── Token definitions ───────────────────────────────────────────────────────
const GAME_TOKENS = [
  { symbol: 'BTC',  color: '#F7931A', glow: 'rgba(247,147,26,0.8)',  char: '₿',  pts: 15, speed: 1.8, size: 46, hp: 3 },
  { symbol: 'MOTO', color: '#FF4B6E', glow: 'rgba(255,75,110,0.8)',  char: '🏍', pts: 8,  speed: 2.2, size: 40, hp: 2 },
  { symbol: 'PILL', color: '#00D4AA', glow: 'rgba(0,212,170,0.8)',   char: '💊', pts: 5,  speed: 2.8, size: 36, hp: 1 },
  { symbol: 'WBTC', color: '#F09242', glow: 'rgba(240,146,66,0.8)',  char: 'W',  pts: 10, speed: 2.0, size: 42, hp: 2 },
  { symbol: 'RUNE', color: '#E74C3C', glow: 'rgba(231,76,60,0.8)',   char: 'ᚱ',  pts: 6,  speed: 3.2, size: 34, hp: 1 },
  { symbol: 'ORDI', color: '#1ABC9C', glow: 'rgba(26,188,156,0.8)',  char: 'O',  pts: 12, speed: 1.5, size: 44, hp: 3 },
  { symbol: 'SATS', color: '#F39C12', glow: 'rgba(243,156,18,0.8)',  char: 'S',  pts: 3,  speed: 3.8, size: 28, hp: 1 },
  { symbol: 'OP20', color: '#9B59B6', glow: 'rgba(155,89,182,0.8)',  char: '⚡', pts: 7,  speed: 2.6, size: 38, hp: 2 },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface Bullet {
  id: number; x: number; y: number; vx: number; vy: number;
  isPower?: boolean; trail: {x:number;y:number}[];
}
interface Enemy {
  id: number; x: number; y: number; vx: number; vy: number;
  token: typeof GAME_TOKENS[0]; hp: number; angle: number; wobble: number; hit: number;
}
interface Particle {
  id: number; x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number; char?: string;
}
interface PowerUp {
  id: number; x: number; y: number; vy: number;
  type: 'triple'|'moonshot'|'diamond'|'speed'; label: string; color: string; emoji: string;
}

const GAME_DURATION = 600; // 10 minutes
const CANVAS_W = 800;
const CANVAS_H = 560;

let idCounter = 0;
const uid = () => ++idCounter;

export default function BlockSwapGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    powerUps: [] as PowerUp[],
    player: { x: CANVAS_W / 2, y: CANVAS_H - 70, targetX: CANVAS_W / 2 },
    keys: new Set<string>(),
    mouse: { x: CANVAS_W / 2 },
    lastFired: 0,
    tripleEnd: 0,
    speedEnd: 0,
    diamondEnd: 0,
    spawnTimer: 0,
    powerSpawnTimer: 0,
    bgStars: [] as {x:number;y:number;size:number;speed:number;opacity:number}[],
    bgBlocks: [] as {x:number;y:number;size:number;speed:number;opacity:number;color:string}[],
  });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('btc-blaster-hs') || '0'));
  const [phase, setPhase] = useState<'menu'|'playing'|'paused'|'gameover'>('menu');
  const [activeBoosts, setActiveBoosts] = useState<string[]>([]);
  const [comboHint, setComboHint] = useState('');
  const [level, setLevel] = useState(1);

  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const comboRef = useRef(1);
  const comboTimeoutRef = useRef<number>(0);
  const phaseRef = useRef<'menu'|'playing'|'paused'|'gameover'>('menu');
  const rafRef = useRef<number>(0);
  const timerRef = useRef<number>(0);
  const timeRef = useRef(GAME_DURATION);
  const levelRef = useRef(1);

  // ── Helpers ──
  const addParticles = (x: number, y: number, color: string, count: number, char?: string) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      s.particles.push({
        id: uid(), x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60 + Math.random() * 40,
        maxLife: 100,
        color,
        size: 2 + Math.random() * 4,
        char: Math.random() < 0.15 ? char : undefined,
      });
    }
  };

  const screenShake = useRef({ x: 0, y: 0, intensity: 0 });

  // ── Init background ──
  useEffect(() => {
    const s = stateRef.current;
    s.bgStars = Array.from({length: 120}, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      size: Math.random() * 1.5 + 0.3,
      speed: 0.2 + Math.random() * 0.5,
      opacity: 0.2 + Math.random() * 0.6,
    }));
    s.bgBlocks = Array.from({length: 20}, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      size: 10 + Math.random() * 20,
      speed: 0.3 + Math.random() * 0.6,
      opacity: 0.04 + Math.random() * 0.06,
      color: ['#F7931A','#00D4AA','#FF4B6E','#9B59B6'][Math.floor(Math.random()*4)],
    }));
  }, []);

  // ── Start game ──
  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.bullets = []; s.enemies = []; s.particles = []; s.powerUps = [];
    s.player = { x: CANVAS_W / 2, y: CANVAS_H - 70, targetX: CANVAS_W / 2 };
    s.lastFired = 0; s.tripleEnd = 0; s.speedEnd = 0; s.diamondEnd = 0;
    s.spawnTimer = 0; s.powerSpawnTimer = 0;
    scoreRef.current = 0; livesRef.current = 3; comboRef.current = 1;
    timeRef.current = GAME_DURATION; levelRef.current = 1;
    setScore(0); setLives(3); setCombo(1); setMaxCombo(1);
    setTimeLeft(GAME_DURATION); setLevel(1); setActiveBoosts([]);
    phaseRef.current = 'playing';
    setPhase('playing');
  }, []);

  // ── Main game loop ──
  useEffect(() => {
    if (phase !== 'playing') {
      cancelAnimationFrame(rafRef.current);
      clearInterval(timerRef.current);
      return;
    }

    // Timer
    timerRef.current = window.setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      levelRef.current = Math.floor((GAME_DURATION - timeRef.current) / 60) + 1;
      setLevel(levelRef.current);
      if (timeRef.current <= 0) {
        phaseRef.current = 'gameover';
        setPhase('gameover');
        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
          localStorage.setItem('btc-blaster-hs', String(scoreRef.current));
        }
      }
    }, 1000);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let lastTime = 0;

    const FIRE_RATE = 180; // ms
    const ENEMY_SPEED_MULT = () => 1 + (levelRef.current - 1) * 0.12;

    const loop = (now: number) => {
      if (phaseRef.current !== 'playing') return;
      const dt = Math.min((now - lastTime) / 16, 3);
      lastTime = now;

      const s = stateRef.current;
      const p = s.player;
      const shake = screenShake.current;

      // ── Update ──
      // Player movement
      const speed = (s.speedEnd > now ? 6 : 4) * dt;
      if (s.keys.has('ArrowLeft') || s.keys.has('a')) p.targetX = Math.max(30, p.x - speed * 4);
      if (s.keys.has('ArrowRight') || s.keys.has('d')) p.targetX = Math.min(CANVAS_W - 30, p.x + speed * 4);
      p.x += (p.targetX - p.x) * 0.15 * dt;
      p.x = Math.max(30, Math.min(CANVAS_W - 30, p.x));

      // Firing
      const autoFire = s.keys.has(' ') || s.keys.has('z');
      const fireRate = s.speedEnd > now ? FIRE_RATE * 0.5 : FIRE_RATE;
      if (autoFire && now - s.lastFired > fireRate) {
        s.lastFired = now;
        const triple = s.tripleEnd > now;
        const bx = p.x;
        const by = p.y - 20;
        s.bullets.push({ id: uid(), x: bx, y: by, vx: 0, vy: -12, trail: [] });
        if (triple) {
          s.bullets.push({ id: uid(), x: bx, y: by, vx: -3, vy: -11, trail: [] });
          s.bullets.push({ id: uid(), x: bx, y: by, vx: 3, vy: -11, trail: [] });
        }
      }

      // Bullets
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        b.trail.unshift({x: b.x, y: b.y});
        if (b.trail.length > 8) b.trail.pop();
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y < -10 || b.x < -10 || b.x > CANVAS_W + 10) {
          s.bullets.splice(i, 1);
        }
      }

      // Spawn enemies
      const spawnRate = Math.max(30, 80 - levelRef.current * 4);
      s.spawnTimer += dt;
      if (s.spawnTimer >= spawnRate) {
        s.spawnTimer = 0;
        const token = GAME_TOKENS[Math.floor(Math.random() * GAME_TOKENS.length)];
        const xPos = token.size / 2 + Math.random() * (CANVAS_W - token.size);
        s.enemies.push({
          id: uid(),
          x: xPos, y: -token.size,
          vx: (Math.random() - 0.5) * 2 * ENEMY_SPEED_MULT(),
          vy: (token.speed + Math.random() * 0.5) * ENEMY_SPEED_MULT(),
          token,
          hp: token.hp + Math.floor(levelRef.current / 3),
          angle: Math.random() * Math.PI * 2,
          wobble: Math.random() * 0.05 + 0.02,
          hit: 0,
        });
      }

      // Spawn power-ups
      s.powerSpawnTimer += dt;
      if (s.powerSpawnTimer >= 600) {
        s.powerSpawnTimer = 0;
        const types = [
          { type: 'triple' as const, label: 'TRIPLE SHOT', color: '#F7931A', emoji: '🔱' },
          { type: 'moonshot' as const, label: 'MOON SHOT!', color: '#00D4AA', emoji: '🌕' },
          { type: 'diamond' as const, label: 'DIAMOND HANDS', color: '#9B59B6', emoji: '💎' },
          { type: 'speed' as const, label: 'SPEED BOOST', color: '#FF4B6E', emoji: '⚡' },
        ];
        const t = types[Math.floor(Math.random() * types.length)];
        s.powerUps.push({
          id: uid(),
          x: 40 + Math.random() * (CANVAS_W - 80),
          y: -30, vy: 1.5, ...t,
        });
      }

      // Enemies move
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const e = s.enemies[i];
        e.angle += e.wobble * dt;
        e.x += (e.vx + Math.sin(e.angle) * 0.8) * dt;
        e.y += e.vy * dt;
        if (e.x < e.token.size / 2 || e.x > CANVAS_W - e.token.size / 2) e.vx *= -1;
        e.hit = Math.max(0, e.hit - 0.1 * dt);

        // Enemy reached bottom
        if (e.y > CANVAS_H + e.token.size) {
          s.enemies.splice(i, 1);
          if (s.diamondEnd < now) {
            livesRef.current = Math.max(0, livesRef.current - 1);
            setLives(livesRef.current);
            shake.intensity = 12;
            addParticles(p.x, p.y, '#FF4B6E', 20);
            if (livesRef.current <= 0) {
              phaseRef.current = 'gameover';
              setPhase('gameover');
              if (scoreRef.current > highScore) {
                setHighScore(scoreRef.current);
                localStorage.setItem('btc-blaster-hs', String(scoreRef.current));
              }
            }
          }
          comboRef.current = 1;
          setCombo(1);
          continue;
        }

        // Bullet hit
        for (let j = s.bullets.length - 1; j >= 0; j--) {
          const b = s.bullets[j];
          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < e.token.size / 2 + 6) {
            e.hp--;
            e.hit = 1;
            s.bullets.splice(j, 1);
            addParticles(b.x, b.y, e.token.color, 8, e.token.char);
            if (e.hp <= 0) {
              // Destroyed!
              const pts = e.token.pts * comboRef.current;
              scoreRef.current += pts;
              setScore(scoreRef.current);
              comboRef.current = Math.min(comboRef.current + 1, 10);
              setCombo(comboRef.current);
              if (comboRef.current > maxCombo) setMaxCombo(comboRef.current);
              clearTimeout(comboTimeoutRef.current);
              comboTimeoutRef.current = window.setTimeout(() => {
                comboRef.current = 1;
                setCombo(1);
              }, 2500);
              addParticles(e.x, e.y, e.token.color, 30, e.token.char);
              shake.intensity = Math.min(6, shake.intensity + 2);
              // Score popup particle
              s.particles.push({
                id: uid(), x: e.x, y: e.y,
                vx: 0, vy: -2,
                life: 60, maxLife: 60,
                color: e.token.color, size: 14,
                char: `+${pts}`,
              });
              s.enemies.splice(i, 1);
            }
            break;
          }
        }
      }

      // Power-ups
      for (let i = s.powerUps.length - 1; i >= 0; i--) {
        const pu = s.powerUps[i];
        pu.y += pu.vy * dt;
        if (pu.y > CANVAS_H + 30) { s.powerUps.splice(i, 1); continue; }
        const dist = Math.hypot(pu.x - p.x, pu.y - p.y);
        if (dist < 40) {
          s.powerUps.splice(i, 1);
          const duration = 8000;
          if (pu.type === 'triple') { s.tripleEnd = now + duration; setActiveBoosts(b => [...b.filter(x=>x!=='triple'), 'triple 🔱']); setTimeout(()=>setActiveBoosts(b=>b.filter(x=>!x.includes('triple'))),duration); }
          if (pu.type === 'speed') { s.speedEnd = now + duration; setActiveBoosts(b => [...b.filter(x=>x!=='speed'), 'speed ⚡']); setTimeout(()=>setActiveBoosts(b=>b.filter(x=>!x.includes('speed'))),duration); }
          if (pu.type === 'diamond') { s.diamondEnd = now + duration; setActiveBoosts(b => [...b.filter(x=>x!=='diamond'), 'invincible 💎']); setTimeout(()=>setActiveBoosts(b=>b.filter(x=>!x.includes('invincible'))),duration); }
          if (pu.type === 'moonshot') {
            // Screen clear
            s.enemies.forEach(e => {
              scoreRef.current += e.token.pts * comboRef.current;
              addParticles(e.x, e.y, e.token.color, 20, e.token.char);
            });
            setScore(scoreRef.current);
            s.enemies = [];
            shake.intensity = 20;
            setComboHint('🌕 MOON SHOT! SCREEN CLEAR!');
            setTimeout(()=>setComboHint(''),2000);
          }
          addParticles(pu.x, pu.y, pu.color, 25);
        }
      }

      // Particles update
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        pt.vy += 0.08 * dt;
        pt.life -= dt;
        if (pt.life <= 0) s.particles.splice(i, 1);
      }

      // Screen shake decay
      shake.intensity *= Math.pow(0.85, dt);
      shake.x = (Math.random() - 0.5) * shake.intensity;
      shake.y = (Math.random() - 0.5) * shake.intensity;

      // ── Draw ──
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // BG
      ctx.fillStyle = '#08080f';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid
      ctx.strokeStyle = 'rgba(247,147,26,0.04)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < CANVAS_W; gx += 50) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, CANVAS_H); ctx.stroke();
      }
      for (let gy = 0; gy < CANVAS_H; gy += 50) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(CANVAS_W, gy); ctx.stroke();
      }

      // BG blocks (blockchain aesthetic)
      s.bgBlocks.forEach(bl => {
        bl.y += bl.speed * dt;
        if (bl.y > CANVAS_H + 20) bl.y = -20;
        ctx.fillStyle = bl.color;
        ctx.globalAlpha = bl.opacity;
        ctx.beginPath();
        ctx.roundRect(bl.x, bl.y, bl.size, bl.size, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Stars
      s.bgStars.forEach(st => {
        st.y += st.speed * dt;
        if (st.y > CANVAS_H) st.y = 0;
        ctx.fillStyle = `rgba(255,255,255,${st.opacity})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Power-ups
      s.powerUps.forEach(pu => {
        const pulse = 0.8 + Math.sin(now / 300) * 0.2;
        ctx.save();
        ctx.translate(pu.x, pu.y);
        ctx.shadowColor = pu.color;
        ctx.shadowBlur = 20 * pulse;
        ctx.fillStyle = `${pu.color}30`;
        ctx.strokeStyle = pu.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-20, -20, 40, 40, 8);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.emoji, 0, 0);
        ctx.restore();
      });

      // Enemies
      s.enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle * 0.3);
        const r = e.token.size / 2;
        // Glow
        ctx.shadowColor = e.hit > 0 ? '#fff' : e.token.color;
        ctx.shadowBlur = e.hit > 0 ? 30 : 16;
        // Circle body
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, e.token.color + 'cc');
        grad.addColorStop(1, e.token.color + '44');
        ctx.fillStyle = grad;
        ctx.strokeStyle = e.hit > 0 ? '#fff' : e.token.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        // Token char
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${e.token.size * 0.42}px "Space Grotesk", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.token.char, 0, 0);
        // HP bar
        if (e.token.hp > 1) {
          const bw = r * 2;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(-r, r + 4, bw, 4);
          ctx.fillStyle = e.token.color;
          ctx.fillRect(-r, r + 4, bw * (e.hp / (e.token.hp + Math.floor(levelRef.current / 3))), 4);
        }
        ctx.restore();
      });

      // Bullets
      s.bullets.forEach(b => {
        ctx.save();
        // Trail
        b.trail.forEach((pt, idx) => {
          const a = (1 - idx / b.trail.length) * 0.6;
          ctx.fillStyle = `rgba(247,147,26,${a})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4 - idx * 0.4, 0, Math.PI * 2);
          ctx.fill();
        });
        // Bullet
        ctx.shadowColor = '#F7931A';
        ctx.shadowBlur = 20;
        const bgrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 7);
        bgrad.addColorStop(0, '#fff');
        bgrad.addColorStop(0.4, '#F7931A');
        bgrad.addColorStop(1, 'rgba(247,147,26,0)');
        ctx.fillStyle = bgrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Player (Bitcoin spaceship)
      ctx.save();
      ctx.translate(p.x, p.y);
      const isInvincible = s.diamondEnd > now;
      const isSpeed = s.speedEnd > now;

      if (isInvincible) {
        ctx.shadowColor = '#9B59B6';
        ctx.shadowBlur = 30 + Math.sin(now / 200) * 10;
      }

      // Engine trail
      for (let t = 0; t < 8; t++) {
        const alpha = (1 - t / 8) * 0.6;
        const size = (8 - t) * (isSpeed ? 2.5 : 1.8);
        ctx.fillStyle = `rgba(${isSpeed ? '255,75,110' : '247,147,26'},${alpha})`;
        ctx.beginPath();
        ctx.arc(-14 + (Math.random() - 0.5) * 8, 14 + t * 3, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(14 + (Math.random() - 0.5) * 8, 14 + t * 3, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ship body
      ctx.strokeStyle = '#F7931A';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#0d1a00';
      // Main hull
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(22, 20);
      ctx.lineTo(10, 14);
      ctx.lineTo(0, 18);
      ctx.lineTo(-10, 14);
      ctx.lineTo(-22, 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Cockpit
      ctx.fillStyle = 'rgba(247,147,26,0.5)';
      ctx.beginPath();
      ctx.arc(0, -4, 8, 0, Math.PI * 2);
      ctx.fill();
      // Bitcoin symbol on ship
      ctx.fillStyle = '#F7931A';
      ctx.font = 'bold 11px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₿', 0, -4);
      // Wings
      ctx.fillStyle = 'rgba(247,147,26,0.15)';
      ctx.strokeStyle = '#F7931A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(-28, 20); ctx.lineTo(-10, 14);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, 0); ctx.lineTo(28, 20); ctx.lineTo(10, 14);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();

      // Particles
      s.particles.forEach(pt => {
        const alpha = pt.life / pt.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        if (pt.char && pt.char.startsWith('+')) {
          ctx.font = `bold ${pt.size}px "Space Grotesk", sans-serif`;
          ctx.fillStyle = pt.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 10;
          ctx.fillText(pt.char, pt.x, pt.y);
        } else if (pt.char) {
          ctx.font = `${pt.size * 2}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pt.char, pt.x, pt.y);
        } else {
          ctx.fillStyle = pt.color;
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      ctx.restore(); // undo shake

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(timerRef.current);
    };
  }, [phase, highScore]);

  // ── Input ──
  useEffect(() => {
    const s = stateRef.current;
    const kd = (e: KeyboardEvent) => {
      s.keys.add(e.key);
      if (e.key === 'Escape') {
        if (phaseRef.current === 'playing') { phaseRef.current = 'paused'; setPhase('paused'); }
        else if (phaseRef.current === 'paused') { phaseRef.current = 'playing'; setPhase('playing'); }
      }
    };
    const ku = (e: KeyboardEvent) => s.keys.delete(e.key);
    const mm = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      s.player.targetX = (e.clientX - rect.left) * scaleX;
      s.mouse.x = s.player.targetX;
    };
    const mc = (e: MouseEvent) => {
      if (phaseRef.current !== 'playing') return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scaleX = CANVAS_W / rect.width;
      const x = (e.clientX - rect.left) * scaleX;
      stateRef.current.bullets.push({
        id: uid(), x: stateRef.current.player.x, y: stateRef.current.player.y - 20,
        vx: (x - stateRef.current.player.x) * 0.05,
        vy: -12, trail: [],
      });
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    canvasRef.current?.addEventListener('mousemove', mm);
    canvasRef.current?.addEventListener('click', mc);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      canvasRef.current?.removeEventListener('mousemove', mm);
      canvasRef.current?.removeEventListener('click', mc);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2,'0')}`;
  };

  const urgentTime = timeLeft <= 30;
  const danger = lives <= 1;

  return (
    <div className="game-wrapper">
      {/* HUD */}
      <div className="game-hud">
        <div className="hud-left">
          <div className="hud-score">
            <span className="hud-label">SCORE</span>
            <span className="hud-value text-glow-orange">{score.toLocaleString()}</span>
          </div>
          <div className="hud-combo" style={{opacity: combo > 1 ? 1 : 0.3}}>
            <span className="hud-label">COMBO</span>
            <span className="hud-value" style={{color: combo > 5 ? '#FF4B6E' : combo > 2 ? '#F7931A' : 'var(--opnet-cyan)'}}>
              x{combo}
            </span>
          </div>
          <div className="hud-level">
            <span className="hud-label">LEVEL</span>
            <span className="hud-value" style={{color:'var(--opnet-cyan)'}}>{level}</span>
          </div>
        </div>
        <div className="hud-center">
          <div className={`hud-timer ${urgentTime ? 'urgent' : ''}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="hud-timer-label">BLOCK BLAST • 10 MIN</div>
        </div>
        <div className="hud-right">
          <div className="hud-lives">
            <span className="hud-label">LIVES</span>
            <div className="lives-dots">
              {Array.from({length:3},(_,i)=>(
                <span key={i} className={`life-dot ${i < lives ? 'active' : ''} ${danger && i < lives ? 'danger' : ''}`}>₿</span>
              ))}
            </div>
          </div>
          <div className="hud-hs">
            <span className="hud-label">BEST</span>
            <span className="hud-value" style={{color:'var(--text-secondary)'}}>{highScore.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Boosts */}
      {activeBoosts.length > 0 && (
        <div className="boosts-bar">
          {activeBoosts.map(b => (
            <span key={b} className="boost-chip">{b}</span>
          ))}
        </div>
      )}

      {/* Combo hint */}
      {comboHint && (
        <div className="combo-hint">{comboHint}</div>
      )}

      {/* Canvas */}
      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="game-canvas"
        />

        {/* Overlays */}
        {phase === 'menu' && (
          <div className="game-overlay">
            <div className="overlay-content">
              <div className="game-logo-btc">₿</div>
              <h1 className="game-title">BLOCK BLAST</h1>
              <p className="game-subtitle">Bitcoin Token Shooter · 10 Min Challenge</p>
              <div className="game-desc">
                <p>Shoot BTC, MOTO, PILL and all OP-20 tokens with your <span style={{color:'#F7931A'}}>Bitcoin-powered gun!</span></p>
                <p>Collect power-ups · Build combos · Reach the moon</p>
              </div>
              <div className="controls-grid">
                <div className="ctrl"><kbd>←→</kbd> or <kbd>A D</kbd><span>Move</span></div>
                <div className="ctrl"><kbd>SPACE</kbd> or <kbd>Z</kbd><span>Auto-fire</span></div>
                <div className="ctrl"><span style={{color:'#F7931A'}}>🖱️ Mouse</span><span>Aim & Click shoot</span></div>
                <div className="ctrl"><kbd>ESC</kbd><span>Pause</span></div>
              </div>
              <div className="powerup-legend">
                <span className="pu-item" style={{color:'#F7931A'}}>🔱 Triple Shot</span>
                <span className="pu-item" style={{color:'#00D4AA'}}>🌕 Moon Shot</span>
                <span className="pu-item" style={{color:'#9B59B6'}}>💎 Invincible</span>
                <span className="pu-item" style={{color:'#FF4B6E'}}>⚡ Speed</span>
              </div>
              {highScore > 0 && <p className="best-score-display">Best Score: <span>{highScore.toLocaleString()}</span></p>}
              <button className="start-btn btn-primary" onClick={startGame}>
                ⚡ START BLASTING
              </button>
            </div>
          </div>
        )}

        {phase === 'paused' && (
          <div className="game-overlay semi">
            <div className="overlay-content small">
              <h2 className="pause-title">⏸ PAUSED</h2>
              <p style={{color:'var(--text-secondary)',marginBottom:24}}>Score: <strong style={{color:'#F7931A'}}>{score.toLocaleString()}</strong></p>
              <button className="start-btn btn-primary" onClick={() => { phaseRef.current='playing'; setPhase('playing'); }}>
                ▶ Resume
              </button>
              <button className="quit-btn btn-secondary" onClick={() => { phaseRef.current='menu'; setPhase('menu'); }}>
                ✕ Quit to Menu
              </button>
            </div>
          </div>
        )}

        {phase === 'gameover' && (
          <div className="game-overlay">
            <div className="overlay-content">
              <div className="gameover-icon">{lives === 0 ? '💀' : '🏆'}</div>
              <h2 className="gameover-title">{lives === 0 ? 'REKT!' : 'TIME\'S UP!'}</h2>
              <div className="final-stats">
                <div className="final-stat">
                  <span>Final Score</span>
                  <span className="final-stat-val text-glow-orange">{score.toLocaleString()}</span>
                </div>
                <div className="final-stat">
                  <span>Max Combo</span>
                  <span className="final-stat-val" style={{color:'#FF4B6E'}}>x{maxCombo}</span>
                </div>
                <div className="final-stat">
                  <span>Level Reached</span>
                  <span className="final-stat-val" style={{color:'var(--opnet-cyan)'}}>{level}</span>
                </div>
                <div className="final-stat">
                  <span>High Score</span>
                  <span className="final-stat-val" style={{color:'#F7931A'}}>{highScore.toLocaleString()}</span>
                </div>
                {score >= highScore && score > 0 && (
                  <div className="new-hs">🎉 NEW HIGH SCORE!</div>
                )}
              </div>
              <div className="gameover-actions">
                <button className="start-btn btn-primary" onClick={startGame}>
                  🔄 Play Again
                </button>
                <button className="quit-btn btn-secondary" onClick={() => { phaseRef.current='menu'; setPhase('menu'); }}>
                  ← Main Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Token guide */}
      <div className="token-guide">
        {GAME_TOKENS.map(t => (
          <div key={t.symbol} className="tg-item" title={`${t.symbol}: ${t.pts} pts`}>
            <span style={{color: t.color}}>{t.char}</span>
            <span className="tg-sym">{t.symbol}</span>
            <span className="tg-pts">{t.pts}pt</span>
          </div>
        ))}
      </div>
    </div>
  );
}
