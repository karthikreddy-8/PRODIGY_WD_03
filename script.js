document.addEventListener('DOMContentLoaded', () => {
    // Config State
    let config = {
        gameMode: 'pvp', // 'pvp' or 'pvc'
        difficulty: 'medium', // 'easy', 'medium', 'hard'
        gridSize: 3,
        player1Name: 'Player X',
        player2Name: 'Player O'
    };

    // Game State
    let board = [];
    let currentPlayer = 'X';
    let gameActive = false;
    let scores = { X: 0, O: 0, Draws: 0, Robot: 0 };
    let gameHistory = [];
    let moveHistory = []; // Stack for undo
    let soundEnabled = true;
    
    // Timer & Stats State
    let elapsedTime = 0;
    let timerInterval = null;
    let movesCount = 0;
    let isPaused = false;
    let isRobotThinking = false;

    // DOM Elements
    const boardEl = document.getElementById('board');
    const playerIndicator = document.getElementById('current-player');
    const thinkingIndicator = document.getElementById('thinking-indicator');
    const resultModal = document.getElementById('result-modal');
    const resultMessage = document.getElementById('result-message');
    const modalNewGameBtn = document.getElementById('modal-new-game-btn');
    
    // Stats & Header
    const timerEl = document.getElementById('game-timer');
    const moveCounterEl = document.getElementById('move-counter');
    const pauseOverlay = document.getElementById('pause-overlay');
    const labelPlayerX = document.getElementById('label-player-x');
    const labelPlayerO = document.getElementById('label-player-o');
    
    // Buttons
    const newGameBtn = document.getElementById('new-game-btn');
    const restartBtn = document.getElementById('restart-btn');
    const resetScoreBtn = document.getElementById('reset-score-btn');
    const undoBtn = document.getElementById('undo-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const historyBtn = document.getElementById('history-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const fullscreenToggleBtn = document.getElementById('fullscreen-toggle');
    const soundToggleBtn = document.getElementById('sound-btn');

    // Score DOM
    const scoreXEl = document.getElementById('score-x');
    const scoreOEl = document.getElementById('score-o');
    const scoreDrawsEl = document.getElementById('score-draws');

    // Modals
    const confirmModal = document.getElementById('confirm-modal');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    
    const settingsModal = document.getElementById('settings-modal');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    
    const historyModal = document.getElementById('history-modal');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const historyTbody = document.getElementById('history-tbody');

    // Inputs
    const inputGameMode = document.getElementById('setting-game-mode');
    const inputDifficulty = document.getElementById('setting-difficulty');
    const inputGridSize = document.getElementById('setting-board-size');
    const inputP1Name = document.getElementById('setting-player1-name');
    const inputP2Name = document.getElementById('setting-player2-name');
    const diffGroup = document.getElementById('difficulty-group');
    const p2Group = document.getElementById('p2-name-group');

    // Audio Context Setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playTone(frequency, type, duration) {
        if (!soundEnabled) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    }
    const sounds = {
        click: () => playTone(600, 'sine', 0.1),
        moveX: () => playTone(800, 'sine', 0.15),
        moveO: () => playTone(400, 'sine', 0.15),
        undo: () => playTone(300, 'sine', 0.1),
        win: () => { playTone(523.25, 'triangle', 0.2); setTimeout(() => playTone(659.25, 'triangle', 0.2), 200); setTimeout(() => playTone(783.99, 'triangle', 0.4), 400); },
        draw: () => { playTone(300, 'sawtooth', 0.3); setTimeout(() => playTone(250, 'sawtooth', 0.4), 300); }
    };

    // Initialization
    function init() {
        loadData();
        updateScoreBoard();
        applyConfig();
        initGame();
        
        // Event Listeners
        newGameBtn.addEventListener('click', () => { sounds.click(); initGame(); });
        restartBtn.addEventListener('click', () => { sounds.click(); initGame(); });
        modalNewGameBtn.addEventListener('click', () => { sounds.click(); closeModal(resultModal); initGame(); });
        undoBtn.addEventListener('click', () => { sounds.undo(); undoMove(); });
        pauseBtn.addEventListener('click', () => { sounds.click(); togglePause(); });
        resumeBtn.addEventListener('click', () => { sounds.click(); togglePause(); });
        
        resetScoreBtn.addEventListener('click', () => { sounds.click(); openModal(confirmModal); });
        confirmResetBtn.addEventListener('click', () => { sounds.click(); resetScores(); closeModal(confirmModal); });
        cancelResetBtn.addEventListener('click', () => { sounds.click(); closeModal(confirmModal); });

        // Settings Form Togglers
        inputGameMode.addEventListener('change', (e) => {
            if (e.target.value === 'pvc') {
                diffGroup.style.display = 'block';
                p2Group.style.display = 'none';
            } else {
                diffGroup.style.display = 'none';
                p2Group.style.display = 'block';
            }
        });

        settingsBtn.addEventListener('click', () => { 
            sounds.click(); 
            inputGameMode.value = config.gameMode;
            inputDifficulty.value = config.difficulty;
            inputGridSize.value = config.gridSize;
            inputP1Name.value = config.player1Name;
            inputP2Name.value = config.player2Name;
            inputGameMode.dispatchEvent(new Event('change'));
            openModal(settingsModal); 
        });
        closeSettingsBtn.addEventListener('click', () => { sounds.click(); closeModal(settingsModal); });
        saveSettingsBtn.addEventListener('click', () => { sounds.click(); saveConfig(); });

        historyBtn.addEventListener('click', () => { sounds.click(); renderHistory(); openModal(historyModal); });
        closeHistoryBtn.addEventListener('click', () => { sounds.click(); closeModal(historyModal); });
        clearHistoryBtn.addEventListener('click', () => { sounds.click(); clearHistory(); });

        themeToggleBtn.addEventListener('click', () => { sounds.click(); toggleTheme(); });
        fullscreenToggleBtn.addEventListener('click', () => { sounds.click(); toggleFullscreen(); });
        soundToggleBtn.addEventListener('click', toggleSound);

        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('mouseenter', () => { if(soundEnabled) playTone(1000, 'sine', 0.05); });
        });
    }

    function applyConfig() {
        document.documentElement.style.setProperty('--grid-size', config.gridSize);
        labelPlayerX.innerText = config.player1Name;
        labelPlayerO.innerText = config.gameMode === 'pvc' ? `Robot (${config.difficulty})` : config.player2Name;
    }

    function saveConfig() {
        const newSize = parseInt(inputGridSize.value);
        config.gameMode = inputGameMode.value;
        config.difficulty = inputDifficulty.value;
        config.player1Name = inputP1Name.value || 'Player X';
        config.player2Name = inputP2Name.value || 'Player O';
        
        let needReset = false;
        if(config.gridSize !== newSize) {
            config.gridSize = newSize;
            needReset = true;
        }

        saveData();
        applyConfig();
        closeModal(settingsModal);
        
        if(needReset) initGame();
        else updateTurnIndicator(); 
    }

    // Timer & Stats Logic
    function startTimer() {
        if(timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if(!isPaused && gameActive) {
                elapsedTime++;
                updateTimerDisplay();
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        const m = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const s = (elapsedTime % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${s}`;
    }

    function togglePause() {
        if(!gameActive) return;
        isPaused = !isPaused;
        pauseOverlay.style.display = isPaused ? 'flex' : 'none';
        pauseBtn.innerText = isPaused ? 'Resume Game' : 'Pause Game';
    }

    function updateMoveCounter() {
        moveCounterEl.innerText = movesCount;
    }

    function initGame() {
        const size = config.gridSize;
        board = Array(size * size).fill('');
        currentPlayer = 'X';
        gameActive = true;
        isPaused = false;
        isRobotThinking = false;
        pauseOverlay.style.display = 'none';
        pauseBtn.innerText = 'Pause Game';
        
        moveHistory = [];
        undoBtn.disabled = true;
        
        elapsedTime = 0;
        updateTimerDisplay();
        startTimer();
        
        movesCount = 0;
        updateMoveCounter();
        
        renderBoardUI();
        updateTurnIndicator();
    }

    function renderBoardUI() {
        boardEl.innerHTML = '';
        const size = config.gridSize;
        
        let fontSize = 3;
        if (size >= 5) fontSize = 2;
        if (size >= 7) fontSize = 1.5;
        if (size >= 9) fontSize = 1.2;

        for (let i = 0; i < size * size; i++) {
            const btn = document.createElement('button');
            btn.classList.add('cell');
            btn.setAttribute('data-index', i);
            btn.style.fontSize = `${fontSize}rem`;
            btn.addEventListener('click', (e) => handleCellClick(e.target));
            boardEl.appendChild(btn);
        }
    }

    function handleCellClick(cell) {
        if (isPaused || isRobotThinking || !gameActive) return;
        
        const index = parseInt(cell.getAttribute('data-index'));
        if (board[index] !== '') return;

        makeMove(index, currentPlayer);

        if (gameActive && config.gameMode === 'pvc' && currentPlayer === 'O') {
            triggerRobotMove();
        }
    }

    function makeMove(index, player) {
        board[index] = player;
        const cell = boardEl.children[index];
        cell.innerText = player;
        cell.classList.add(player.toLowerCase());
        
        moveHistory.push(index);
        undoBtn.disabled = false;
        
        movesCount++;
        updateMoveCounter();

        if (player === 'X') sounds.moveX();
        else sounds.moveO();

        const winResult = checkWinAlgorithm(index, player, board, config.gridSize);
        
        if (winResult) {
            handleWin(winResult);
        } else if (!board.includes('')) {
            handleDraw();
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateTurnIndicator();
        }
    }

    function undoMove() {
        if(moveHistory.length === 0 || !gameActive || isPaused || isRobotThinking) return;
        
        // If PvC, undo 2 moves (robot + player)
        let movesToUndo = (config.gameMode === 'pvc' && currentPlayer === 'X') ? 2 : 1;
        
        while(movesToUndo > 0 && moveHistory.length > 0) {
            const lastIndex = moveHistory.pop();
            board[lastIndex] = '';
            const cell = boardEl.children[lastIndex];
            cell.innerText = '';
            cell.classList.remove('x', 'o');
            movesCount--;
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            movesToUndo--;
        }
        
        updateMoveCounter();
        updateTurnIndicator();
        if(moveHistory.length === 0) undoBtn.disabled = true;
    }

    // AI Logic
    function triggerRobotMove() {
        isRobotThinking = true;
        thinkingIndicator.style.display = 'block';
        playerIndicator.style.display = 'none'; // hide O name while thinking
        
        // Delay to simulate thinking and allow UI update
        setTimeout(() => {
            if(!gameActive || isPaused) {
                isRobotThinking = false;
                return;
            }
            
            let moveIndex = -1;
            const size = config.gridSize;

            if (config.difficulty === 'easy') {
                moveIndex = getRandomMove();
            } 
            else if (config.difficulty === 'medium') {
                moveIndex = getMediumMove(size);
            } 
            else if (config.difficulty === 'hard') {
                if (size === 3) {
                    moveIndex = getMinimaxMove();
                } else {
                    moveIndex = getHeuristicMove(size);
                }
            }
            
            isRobotThinking = false;
            thinkingIndicator.style.display = 'none';
            playerIndicator.style.display = 'inline';
            if (moveIndex !== -1) makeMove(moveIndex, 'O');
            
        }, Math.random() * 500 + 400); // 400-900ms delay
    }

    function getRandomMove() {
        const available = [];
        board.forEach((val, i) => { if (val === '') available.push(i); });
        return available[Math.floor(Math.random() * available.length)];
    }

    function getMediumMove(size) {
        // Try to win
        let move = findWinningMove('O', size);
        if (move !== -1) return move;
        // Block player
        move = findWinningMove('X', size);
        if (move !== -1) return move;
        // Else random
        return getRandomMove();
    }

    function findWinningMove(player, size) {
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = player;
                if (checkWinAlgorithm(i, player, board, size)) {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }
        return -1;
    }

    // Minimax for 3x3 Hard
    function getMinimaxMove() {
        let bestScore = -Infinity;
        let move = -1;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, 0, false);
                board[i] = '';
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move;
    }

    function minimax(tempBoard, depth, isMaximizing) {
        // Check terminal states
        let xWins = false, oWins = false;
        for(let i=0; i<9; i++) {
            if(tempBoard[i] === 'X' && checkWinAlgorithm(i, 'X', tempBoard, 3)) xWins = true;
            if(tempBoard[i] === 'O' && checkWinAlgorithm(i, 'O', tempBoard, 3)) oWins = true;
        }
        
        if (oWins) return 10 - depth;
        if (xWins) return depth - 10;
        if (!tempBoard.includes('')) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (tempBoard[i] === '') {
                    tempBoard[i] = 'O';
                    let score = minimax(tempBoard, depth + 1, false);
                    tempBoard[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (tempBoard[i] === '') {
                    tempBoard[i] = 'X';
                    let score = minimax(tempBoard, depth + 1, true);
                    tempBoard[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    // Heuristic for >3x3 Hard (blocks threats and builds lines)
    function getHeuristicMove(size) {
        // 1. Win if possible
        let move = findWinningMove('O', size);
        if (move !== -1) return move;
        
        // 2. Block if player about to win
        move = findWinningMove('X', size);
        if (move !== -1) return move;

        // 3. Score all empty cells and pick the best one
        let bestScore = -Infinity;
        let bestMoves = [];

        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                let score = evaluateCellScore(i, size);
                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [i];
                } else if (score === bestScore) {
                    bestMoves.push(i);
                }
            }
        }
        
        // Return random from best equivalent moves
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    function evaluateCellScore(index, size) {
        let score = 0;
        const row = Math.floor(index / size);
        const col = index % size;

        const countLine = (rStep, cStep, player) => {
            let count = 0;
            // forward
            let r = row + rStep, c = col + cStep;
            while (r >= 0 && r < size && c >= 0 && c < size && board[r * size + c] === player) { count++; r += rStep; c += cStep; }
            // backward
            r = row - rStep; c = col - cStep;
            while (r >= 0 && r < size && c >= 0 && c < size && board[r * size + c] === player) { count++; r -= rStep; c -= cStep; }
            return count;
        };

        const dirs = [[0,1], [1,0], [1,1], [1,-1]];
        dirs.forEach(([rs, cs]) => {
            const myCount = countLine(rs, cs, 'O');
            const opCount = countLine(rs, cs, 'X');
            
            // heavily reward extending our lines
            score += Math.pow(10, myCount);
            // heavily reward blocking opponent lines
            score += Math.pow(9, opCount);
        });
        
        // favor center
        const center = Math.floor(size/2);
        const dist = Math.abs(row - center) + Math.abs(col - center);
        score -= dist;

        return score;
    }

    // Generic NxN Win Checker
    function checkWinAlgorithm(lastIndex, player, boardState, size) {
        const row = Math.floor(lastIndex / size);
        const col = lastIndex % size;

        const checkLine = (rStep, cStep) => {
            let cells = [[row, col]];
            let r = row + rStep, c = col + cStep;
            while (r >= 0 && r < size && c >= 0 && c < size && boardState[r * size + c] === player) {
                cells.push([r, c]);
                r += rStep; c += cStep;
            }
            r = row - rStep; c = col - cStep;
            while (r >= 0 && r < size && c >= 0 && c < size && boardState[r * size + c] === player) {
                cells.push([r, c]);
                r -= rStep; c -= cStep;
            }
            return cells.length >= size ? cells : null;
        };

        return checkLine(0, 1) || checkLine(1, 0) || checkLine(1, 1) || checkLine(1, -1);
    }

    function handleWin(winningCells) {
        gameActive = false;
        undoBtn.disabled = true;
        clearInterval(timerInterval);
        
        const domCells = document.querySelectorAll('.cell');
        winningCells.forEach(([r, c]) => { domCells[r * config.gridSize + c].classList.add('win'); });

        let winnerName;
        if (currentPlayer === 'X') {
            scores.X++;
            winnerName = config.player1Name;
        } else {
            if(config.gameMode === 'pvc') {
                scores.Robot++;
                winnerName = `Robot (${config.difficulty})`;
            } else {
                scores.O++;
                winnerName = config.player2Name;
            }
        }
        
        logGame(winnerName);
        saveData();
        updateScoreBoard();
        sounds.win();
        triggerConfetti();
        
        setTimeout(() => {
            resultMessage.innerText = `🎉 ${winnerName} Wins!`;
            resultMessage.className = currentPlayer === 'X' ? 'neon-pink' : 'neon-cyan';
            openModal(resultModal);
        }, 1000);
    }

    function handleDraw() {
        gameActive = false;
        undoBtn.disabled = true;
        clearInterval(timerInterval);
        scores.Draws++;
        
        logGame('Draw');
        saveData();
        updateScoreBoard();
        sounds.draw();
        
        setTimeout(() => {
            resultMessage.innerText = `🤝 It's a Draw!`;
            resultMessage.className = 'neon-purple';
            openModal(resultModal);
        }, 500);
    }

    function logGame(winner) {
        gameHistory.unshift({
            id: gameHistory.length + 1,
            winner: winner,
            mode: config.gameMode.toUpperCase(),
            size: `${config.gridSize}×${config.gridSize}`,
            duration: timerEl.innerText,
            date: new Date().toLocaleString()
        });
    }

    function updateTurnIndicator() {
        const pName = currentPlayer === 'X' ? config.player1Name : 
            (config.gameMode === 'pvc' ? `Robot (${config.difficulty})` : config.player2Name);
        playerIndicator.innerText = pName;
        playerIndicator.className = '';
        playerIndicator.classList.add(currentPlayer === 'X' ? 'player-x-glow' : 'player-o-glow');
    }

    // Modals
    function openModal(modal) { modal.setAttribute('aria-hidden', 'false'); }
    function closeModal(modal) { modal.setAttribute('aria-hidden', 'true'); }

    // History View
    function renderHistory() {
        historyTbody.innerHTML = '';
        if(gameHistory.length === 0) {
            historyTbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No games played yet.</td></tr>';
            return;
        }
        gameHistory.forEach(game => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${game.id}</td><td>${game.winner}</td><td>${game.mode}</td><td>${game.size}</td><td>${game.duration}</td><td>${game.date}</td>`;
            historyTbody.appendChild(tr);
        });
    }

    function clearHistory() {
        gameHistory = [];
        saveData();
        renderHistory();
    }

    // Storage
    function loadData() {
        try {
            const savedConfig = localStorage.getItem('ttt_config');
            if(savedConfig) Object.assign(config, JSON.parse(savedConfig));
            const savedScores = localStorage.getItem('ttt_scores');
            if(savedScores) Object.assign(scores, JSON.parse(savedScores));
            // Backwards compatibility for old scores object without Robot
            if(scores.Robot === undefined) scores.Robot = 0; 
            const savedHistory = localStorage.getItem('ttt_history');
            if(savedHistory) gameHistory = JSON.parse(savedHistory);
        } catch(e) { console.error(e); }
    }

    function saveData() {
        localStorage.setItem('ttt_config', JSON.stringify(config));
        localStorage.setItem('ttt_scores', JSON.stringify(scores));
        localStorage.setItem('ttt_history', JSON.stringify(gameHistory));
    }

    function updateScoreBoard() {
        scoreXEl.innerText = scores.X;
        // Dynamically show Robot score or Player 2 score
        if(config.gameMode === 'pvc') {
            labelPlayerO.innerText = 'Robot';
            scoreOEl.innerText = scores.Robot || 0;
        } else {
            labelPlayerO.innerText = 'Player O';
            scoreOEl.innerText = scores.O;
        }
        scoreDrawsEl.innerText = scores.Draws;
    }

    function resetScores() {
        scores = { X: 0, O: 0, Draws: 0, Robot: 0 };
        saveData();
        updateScoreBoard();
    }

    function triggerConfetti() {
        if (typeof confetti !== 'undefined') {
            const colors = currentPlayer === 'X' ? ['#ff007f', '#b800ff'] : ['#00f3ff', '#0077ff'];
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: colors });
        }
    }

    function toggleTheme() {
        const html = document.documentElement;
        const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        document.querySelector('.sun-icon').style.display = newTheme === 'light' ? 'none' : 'block';
        document.querySelector('.moon-icon').style.display = newTheme === 'light' ? 'block' : 'none';
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(err => {});
        else if (document.exitFullscreen) document.exitFullscreen();
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        document.querySelector('.sound-on').style.display = soundEnabled ? 'block' : 'none';
        document.querySelector('.sound-off').style.display = soundEnabled ? 'none' : 'block';
        if (soundEnabled) sounds.click();
    }

    init();
});
