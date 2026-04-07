document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const betButton = document.getElementById('bet-button');
    const minesCountSelect = document.getElementById('mines-count');
    const betAmountInput = document.getElementById('bet-amount');
    const halfBetBtn = document.getElementById('half-bet');
    const doubleBetBtn = document.getElementById('double-bet');
    const balanceDisplay = document.getElementById('balance');
    const currencyValDisplay = document.getElementById('currency-val');
    const gameInfoDiv = document.getElementById('game-info');
    const multiplierDisplay = document.getElementById('multiplier');
    const multiplierFill = document.getElementById('multiplier-fill');
    const profitDisplay = document.getElementById('profit');
    const cashoutButton = document.getElementById('cashout-button');
    const notificationDiv = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    const explosionEffect = document.getElementById('explosion-effect');

    // Game State
    let balance = 1000;
    let minesCount = 3;
    let betAmount = 10;
    let isGameActive = false;
    let minesPositions = [];
    let revealedTiles = 0;
    let tiles = [];
    let currentMultiplier = 1.0;
    let baseMultiplier = 1.0;

    // Multiplicadores por número de minas
    const multiplierTable = {
        1: { base: 1.1, increment: 0.11 },
        3: { base: 1.2, increment: 0.14 },
        5: { base: 1.35, increment: 0.18 },
        10: { base: 1.6, increment: 0.25 },
        24: { base: 2.4, increment: 0.4 }
    };

    // Initialize board
    function initBoard() {
        gameBoard.innerHTML = '';
        tiles = [];
        for (let i = 0; i < 25; i++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.dataset.index = i;
            tile.addEventListener('click', () => handleTileClick(i));
            gameBoard.appendChild(tile);
            tiles.push(tile);
        }
    }

    function updateBalance() {
        balanceDisplay.textContent = `$${balance.toFixed(2)}`;
    }

    function updateCurrencyVal() {
        currencyValDisplay.textContent = `$${betAmount.toFixed(2)}`;
    }

    function updateMultiplier() {
        currentMultiplier = baseMultiplier + (revealedTiles * multiplierTable[minesCount].increment);
        multiplierDisplay.textContent = currentMultiplier.toFixed(2) + 'x';
        
        // Atualizar barra de multiplicador (0 a 100%)
        const maxTiles = 25 - minesCount;
        const fillPercentage = (revealedTiles / maxTiles) * 100;
        multiplierFill.style.width = fillPercentage + '%';
        
        const profit = (betAmount * currentMultiplier) - betAmount;
        profitDisplay.textContent = `$${profit.toFixed(2)}`;
    }

    function showNotification(message, duration = 2000) {
        notificationText.textContent = message;
        notificationDiv.classList.remove('hidden');
        
        setTimeout(() => {
            notificationDiv.classList.add('hidden');
        }, duration);
    }

    function triggerExplosion() {
        explosionEffect.classList.remove('hidden');
        document.body.classList.add('shake');
        
        setTimeout(() => {
            explosionEffect.classList.add('hidden');
            document.body.classList.remove('shake');
        }, 800);
    }

    function startGame() {
        minesCount = parseInt(minesCountSelect.value);
        betAmount = parseFloat(betAmountInput.value);
        
        if (isNaN(betAmount) || betAmount <= 0) {
            showNotification('❌ Aposta inválida!', 2000);
            return;
        }

        if (betAmount > balance) {
            showNotification('❌ Saldo insuficiente!', 2000);
            return;
        }

        // Deduzir aposta do saldo
        balance -= betAmount;
        updateBalance();

        isGameActive = true;
        revealedTiles = 0;
        baseMultiplier = multiplierTable[minesCount].base;
        currentMultiplier = baseMultiplier;
        minesPositions = generateMines(minesCount);
        
        betButton.disabled = true;
        minesCountSelect.disabled = true;
        betAmountInput.disabled = true;
        gameInfoDiv.classList.remove('hidden');
        
        // Reset tiles
        tiles.forEach(tile => {
            tile.classList.remove('revealed', 'gem', 'mine');
            tile.innerHTML = '';
        });

        updateMultiplier();
        console.log('Jogo iniciado com', minesCount, 'minas');
    }

    function generateMines(count) {
        const positions = [];
        while (positions.length < count) {
            const pos = Math.floor(Math.random() * 25);
            if (!positions.includes(pos)) {
                positions.push(pos);
            }
        }
        return positions;
    }

    function handleTileClick(index) {
        if (!isGameActive) return;
        
        const tile = tiles[index];
        if (tile.classList.contains('revealed')) return;

        if (minesPositions.includes(index)) {
            revealMine(tile);
            gameOver(false);
        } else {
            revealGem(tile);
            revealedTiles++;
            updateMultiplier();
            
            if (revealedTiles === 25 - minesCount) {
                gameOver(true);
            }
        }
    }

    function revealGem(tile) {
        tile.classList.add('revealed', 'gem');
        const gem = document.createElement('div');
        gem.classList.add('gem-icon');
        tile.appendChild(gem);
    }

    function revealMine(tile) {
        tile.classList.add('revealed', 'mine');
        const mine = document.createElement('div');
        mine.classList.add('mine-icon');
        tile.appendChild(mine);
    }

    function gameOver(isWin) {
        isGameActive = false;
        
        // Reveal all mines
        minesPositions.forEach(pos => {
            const tile = tiles[pos];
            if (!tile.classList.contains('mine')) {
                tile.classList.add('revealed', 'mine');
                const mine = document.createElement('div');
                mine.classList.add('mine-icon');
                tile.appendChild(mine);
            }
        });

        if (isWin) {
            const winAmount = betAmount * currentMultiplier;
            balance += winAmount;
            updateBalance();
            showNotification(`🎉 VITÓRIA! +$${winAmount.toFixed(2)}`, 3000);
        } else {
            triggerExplosion();
            showNotification('💣 BOMBA! Você perdeu!', 3000);
        }

        setTimeout(() => {
            resetGame();
        }, 1500);
    }

    function cashout() {
        if (!isGameActive) return;

        const cashoutAmount = betAmount * currentMultiplier;
        balance += cashoutAmount;
        updateBalance();

        isGameActive = false;
        
        // Reveal all mines
        minesPositions.forEach(pos => {
            const tile = tiles[pos];
            tile.classList.add('revealed', 'mine');
            const mine = document.createElement('div');
            mine.classList.add('mine-icon');
            tile.appendChild(mine);
        });

        showNotification(`💰 SAQUE! +$${cashoutAmount.toFixed(2)}`, 3000);
        
        setTimeout(() => {
            resetGame();
        }, 1500);
    }

    function resetGame() {
        betButton.disabled = false;
        minesCountSelect.disabled = false;
        betAmountInput.disabled = false;
        gameInfoDiv.classList.add('hidden');
        
        // Reset tiles
        tiles.forEach(tile => {
            tile.classList.remove('revealed', 'gem', 'mine');
            tile.innerHTML = '';
        });
    }

    // Event Listeners
    halfBetBtn.addEventListener('click', () => {
        betAmount = betAmount / 2;
        updateCurrencyVal();
    });

    doubleBetBtn.addEventListener('click', () => {
        betAmount = betAmount * 2;
        updateCurrencyVal();
    });

    betAmountInput.addEventListener('input', () => {
        betAmount = parseFloat(betAmountInput.value) || 0;
        updateCurrencyVal();
    });

    betButton.addEventListener('click', startGame);
    cashoutButton.addEventListener('click', cashout);

    // Initialize
    initBoard();
    updateBalance();
    updateCurrencyVal();
});