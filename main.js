import './style.css';
import { CHIPS, renderChips } from './src/chips.js';
import { PAYLINES } from './src/paylines.js';
import { SYMBOLS } from './src/symbols.js';

class SlotMachine {
  constructor() {
    this.SYMBOLS = SYMBOLS;

    this.PAYLINES = PAYLINES;

    this.CHIPS = CHIPS;

    this.bet = 20;
    this.balance = 1000;
    this.reels = [
      [this.SYMBOLS[0], this.SYMBOLS[1], this.SYMBOLS[2]],
      [this.SYMBOLS[1], this.SYMBOLS[2], this.SYMBOLS[3]],
      [this.SYMBOLS[2], this.SYMBOLS[3], this.SYMBOLS[4]],
    ];
    this.lastWin = 0;

    this.initGame();
  }

  initGame() {
    this.renderReels();
    this.renderPaytable();
    renderChips(this.CHIPS, (value) => {
      this.bet = value;
      this.updateStats();
      document.querySelectorAll('.chip').forEach((chip) => chip.classList.remove('active'));
      document.querySelector(`.chip[data-value="${value}"]`).classList.add('active');
    });
    this.updateStats();
    document.getElementById('spinButton').addEventListener('click', () => this.handleSpin());
  }

  renderReels() {
    const reelsContainer = document.getElementById('reels');
    reelsContainer.innerHTML = '';

    this.reels.forEach((reel, reelIndex) => {
      const reelElement = document.createElement('div');
      reelElement.className = 'reel';

      reel.forEach((symbol, symbolIndex) => {
        const symbolElement = document.createElement('div');
        symbolElement.className = 'symbol';
        symbolElement.textContent = symbol.char;
        symbolElement.dataset.reelIndex = reelIndex;
        symbolElement.dataset.symbolIndex = symbolIndex;
        reelElement.appendChild(symbolElement);
      });

      reelsContainer.appendChild(reelElement);
    });
  }

  renderPaytable() {
    const paytable = document.getElementById('paytable');
    this.SYMBOLS.forEach((symbol) => {
      const item = document.createElement('div');
      item.className = 'paytable-item';
      item.innerHTML = `
                <span>${symbol.char}</span>
                <span>x${symbol.payout}</span>
            `;
      paytable.appendChild(item);
    });
  }

  updateStats() {
    document.getElementById('balance-value').textContent = `$${this.balance}`;
    document.getElementById('lastWin-value').textContent = `$${this.lastWin}`;
    document.getElementById('bet-value').textContent = `$${this.bet}`;
  }

  getRandomSymbol() {
    const totalWeight = this.SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0);
    let random = Math.random() * totalWeight;

    for (const symbol of this.SYMBOLS) {
      random -= symbol.weight;
      if (random <= 0) return symbol;
    }
    return this.SYMBOLS[0];
  }

  evaluateWin(reelState) {
    let totalWin = 0;
    const winLines = [];

    this.PAYLINES.forEach((line, index) => {
      const symbols = line.map(([x, y]) => reelState[x][y]);
      const firstSymbol = symbols[0];

      if (symbols.every((s) => s.id === firstSymbol.id)) {
        totalWin += firstSymbol.payout * this.bet;
        winLines.push(index);
      }
    });

    return { win: totalWin, lines: winLines };
  }

  highlightWinningLines(lines) {
    document.querySelectorAll('.symbol').forEach((symbol) => {
      symbol.classList.remove('winning');
    });

    lines.forEach((lineIndex) => {
      this.PAYLINES[lineIndex].forEach(([x, y]) => {
        const symbol = document.querySelector(`.symbol[data-reel-index="${x}"][data-symbol-index="${y}"]`);
        if (symbol) symbol.classList.add('winning');
      });
    });
  }

  async handleSpin() {
    this.balance -= this.bet;
    this.lastWin = 0;
    this.updateStats();

    document.querySelectorAll('.reel').forEach((reel, index) => {
      reel.classList.add(`staggered-${index + 1}`);
    });
    document.querySelector('.reels').classList.add('spinning');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.reels = Array(3)
      .fill()
      .map(() =>
        Array(3)
          .fill()
          .map(() => this.getRandomSymbol())
      );

    document.querySelector('.reels').classList.remove('spinning');
    document.querySelectorAll('.reel').forEach((reel, index) => {
      reel.classList.remove(`staggered-${index + 1}`);
    });

    this.renderReels();

    const { win, lines } = this.evaluateWin(this.reels);
    this.lastWin = win;
    this.balance += win;

    this.highlightWinningLines(lines);
    this.updateStats();
  }
}

new SlotMachine();
