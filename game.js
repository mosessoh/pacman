// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const EMPTY = 0;
const WALL = 1;
const DOT = 2;
const PACMAN = 3;
const GHOST = 4;
const TEMP_BARRIER = 5;
const CHERRY = 6;
const POWER_UP_DURATION = 10000; // 10 seconds in milliseconds 

// Game variables
let score = 0;
let gameBoard = [];
let pacman = { x: 10, y: 8, direction: 'right' }; // Start one row above the temporary barrier
let gameInterval = null;
let gameSpeed = 200; // milliseconds between moves
let gameStarted = false;
let gameMode = ''; // 'simple' or 'normal'
let powerUpActive = false;
let powerUpTimeout = null;
const cherryPositions = [
    { x: 1, y: 1 },
    { x: 1, y: 18 },
    { x: 18, y: 1 },
    { x: 18, y: 18 }
];

// Ghost variables
let ghosts = [];
let ghostColors = ['red', 'pink', 'cyan', 'orange'];
let ghostEnclosure = { minX: 8, maxX: 11, minY: 9, maxY: 11 }; // Ghost enclosure boundaries
let ghostsReleased = false; // Flag to track if ghosts have been released
const RELEASE_SCORE = 200; // Score threshold to release ghosts

// Ghost behavior types
const GHOST_BEHAVIOR = {
    CHASE: 0,       // Chase Pacman directly
    AMBUSH: 1,      // Try to get ahead of Pacman
    RANDOM: 2,      // Move randomly
    PATROL: 3       // Patrol between corners
};

// Sound effects
let audioContext = null;

// Initialize the game
function initGame() {
    // Set up mode selection
    document.getElementById('simple-mode').addEventListener('click', function () {
        selectGameMode('simple');
    });

    document.getElementById('normal-mode').addEventListener('click', function () {
        selectGameMode('normal');
    });

    // Hide the game board and score until a mode is selected
    document.getElementById('game-board').style.display = 'none';
    document.querySelector('.score-board').style.display = 'none';
    document.querySelector('.instructions').style.display = 'none';
}

// Function to select game mode
function selectGameMode(mode) {
    gameMode = mode;

    // Hide mode selection
    document.getElementById('mode-selection').style.display = 'none';

    // Show game elements
    document.getElementById('game-board').style.display = 'grid';
    document.querySelector('.score-board').style.display = 'block';
    document.querySelector('.instructions').style.display = 'block';

    // Initialize the game based on selected mode
    createGameBoard();
    document.addEventListener('keydown', handleKeyPress);
    updateGameBoard();

    // Display start game message
    showStartMessage();
}

// Create the game board with walls, dots, and Pacman
function createGameBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = ''; // Clear the board

    // Create the maze layout
    // 1 represents walls, 0 represents paths where dots can be placed, 2 represents empty space (no dots)
    const mazeLayout = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 0, 1, 1, 3, 3, 1, 1, 0, 1, 0, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 0, 1, 0, 1, 2, 2, 2, 2, 1, 0, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

    // Initialize the game board
    for (let y = 0; y < GRID_SIZE; y++) {
        gameBoard[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.id = `cell-${x}-${y}`;
            board.appendChild(cell);

            if (mazeLayout[y][x] === 1) {
                gameBoard[y][x] = WALL;
            } else if (x === pacman.x && y === pacman.y) {
                gameBoard[y][x] = PACMAN;
            } else if (mazeLayout[y][x] === 2) {
                gameBoard[y][x] = EMPTY;
            } else if (mazeLayout[y][x] === 3) {
                gameBoard[y][x] = TEMP_BARRIER;
            } else if (cherryPositions.some(pos => pos.x === x && pos.y === y)) {
                gameBoard[y][x] = CHERRY; // Place cherry if position matches
            } else {
                gameBoard[y][x] = DOT;
            }
        }
    }

    // Initialize ghosts if in normal mode
    if (gameMode === 'normal') {
        initializeGhosts();
    }
}

// Update the game board display
function updateGameBoard() {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.getElementById(`cell-${x}-${y}`);
            cell.className = '';

            switch (gameBoard[y][x]) {
                case WALL:
                    cell.classList.add('wall');
                    break;
                case DOT:
                    cell.classList.add('dot');
                    break;
                case PACMAN:
                    cell.classList.add('pacman');
                    // Add direction class based on Pacman's current direction
                    cell.classList.add(pacman.direction);
                    break;
                case GHOST:
                    const ghost = ghosts.find(g => g.x === x && g.y === y);
                    if (ghost) {
                        cell.classList.add('ghost');
                        cell.classList.add(ghost.color);
                        if (powerUpActive) {
                            cell.classList.add('vulnerable');
                        }
                    }
                    break;
                case TEMP_BARRIER:
                    cell.classList.add('temp-barrier');
                    break;
                case CHERRY:
                    cell.classList.add('cherry');
                    break;
            }
        }
    }
}

// Handle keyboard input for Pacman movement
function handleKeyPress(event) {
    // Store the current direction before changing it
    const previousDirection = pacman.direction;

    // Update the direction based on key press
    switch (event.key) {
        case 'ArrowUp':
            pacman.direction = 'up';
            break;
        case 'ArrowDown':
            pacman.direction = 'down';
            break;
        case 'ArrowLeft':
            pacman.direction = 'left';
            break;
        case 'ArrowRight':
            pacman.direction = 'right';
            break;
        default:
            return; // Ignore other keys
    }

    // Start the game if it hasn't started yet
    if (!gameStarted) {
        startGame();
        return; // No need to check direction validity on game start
    }

    // Check if the new direction is valid (not hitting a wall)
    let newX = pacman.x;
    let newY = pacman.y;

    // Calculate new position based on the new direction
    switch (pacman.direction) {
        case 'up':
            newY--;
            break;
        case 'down':
            newY++;
            break;
        case 'left':
            newX--;
            break;
        case 'right':
            newX++;
            break;
    }

    // If the new direction would hit a wall, revert to the previous direction
    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE || gameBoard[newY][newX] === WALL) {
        pacman.direction = previousDirection;
    }
}

// Check if all dots are eaten
function checkWinCondition() {
    let dotsRemaining = false;

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (gameBoard[y][x] === DOT || gameBoard[y][x] === CHERRY) {
                dotsRemaining = true;
                break;
            }
        }
        if (dotsRemaining) break;
    }

    if (!dotsRemaining) {
        alert('Congratulations! You won!');
        resetGame();
    }
}

// Reset the game
function resetGame() {
    clearInterval(gameInterval);
    gameInterval = null;
    score = 0;
    document.getElementById('score').textContent = score;
    pacman = { x: 10, y: 8, direction: 'right' };
    gameStarted = false;
    powerUpActive = false; // Added
    if (powerUpTimeout) {  // Added
        clearTimeout(powerUpTimeout);
        powerUpTimeout = null;
    }
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    createGameBoard();
    updateGameBoard();
    showStartMessage();
}

// Function to continuously move Pacman in the current direction
function movePacman() {
    let newX = pacman.x;
    let newY = pacman.y;
    let pacmanMoved = false;

    // Determine new position based on current direction
    switch (pacman.direction) {
        case 'up':
            newY--;
            break;
        case 'down':
            newY++;
            break;
        case 'left':
            newX--;
            break;
        case 'right':
            newX++;
            break;
    }

    if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE &&
        gameBoard[newY][newX] !== WALL && gameBoard[newY][newX] !== TEMP_BARRIER) {
        if (gameBoard[newY][newX] === DOT) {
            score += 10;
            document.getElementById('score').textContent = score;
            if (gameMode === 'normal' && !ghostsReleased && score >= RELEASE_SCORE) {
                releaseGhosts();
            }
            playDotEatSound();
        } else if (gameBoard[newY][newX] === CHERRY) {
            score += 50; // Bonus points for cherry
            document.getElementById('score').textContent = score;
            if (powerUpTimeout) {
                clearTimeout(powerUpTimeout); // Reset timer if active
            }
            powerUpActive = true;
            powerUpTimeout = setTimeout(() => {
                powerUpActive = false;
                powerUpTimeout = null;
            }, POWER_UP_DURATION);
        }

        if (gameMode === 'normal' && gameBoard[newY][newX] === GHOST) {
            if (powerUpActive) {
                const ghost = ghosts.find(g => g.x === newX && g.y === newY);
                if (ghost) {
                    eatGhost(ghost);
                }
            } else {
                handleGhostCollision();
                return;
            }
        }

        gameBoard[pacman.y][pacman.x] = EMPTY;
        pacman.x = newX;
        pacman.y = newY;
        gameBoard[pacman.y][pacman.x] = PACMAN;
        pacmanMoved = true;
    }

    // Move ghosts if in normal mode - do this regardless of whether Pacman moved
    if (gameMode === 'normal') {
        moveGhosts();
    }

    // Update the game board
    updateGameBoard();

    // Check if all dots are eaten
    if (pacmanMoved) {
        checkWinCondition();
    }
}

// Function to show the start game message
function showStartMessage() {
    // Create message element if it doesn't exist
    if (!document.getElementById('start-message')) {
        const messageContainer = document.createElement('div');
        messageContainer.id = 'start-message';
        messageContainer.className = 'start-message';
        messageContainer.innerHTML = '<h2>Pacman Game</h2><p>Press any arrow key to start!</p>';
        document.querySelector('.game-container').prepend(messageContainer);
    }
}

// Function to start the game
function startGame() {
    gameStarted = true;

    // Remove the start message if it exists
    const startMessage = document.getElementById('start-message');
    if (startMessage) {
        startMessage.remove();
    }

    // Start the game loop
    if (gameInterval === null) {
        gameInterval = setInterval(movePacman, gameSpeed);
    }

    // No need for the setTimeout here as ghosts will be released when score reaches 200
    // Reset the ghostsReleased flag
    ghostsReleased = false;
}

// Function to release ghosts by removing the temporary barrier
function releaseGhosts() {
    ghostsReleased = true;

    // Find and remove all temporary barriers
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (gameBoard[y][x] === TEMP_BARRIER) {
                gameBoard[y][x] = EMPTY;

                // Update the visual representation
                const cell = document.getElementById(`cell-${x}-${y}`);
                if (cell) {
                    cell.className = 'empty';
                }
            }
        }
    }
}

// Initialize ghosts for normal mode
function initializeGhosts() {
    ghosts = [];

    // Define ghost starting positions (in the ghost enclosure)
    const ghostPositions = [
        { x: 9, y: 10 },
        { x: 10, y: 10 },
        { x: 9, y: 11 },
        { x: 10, y: 11 }
    ];

    // Create 4 ghosts with different colors and behaviors
    for (let i = 0; i < 4; i++) {
        const ghost = {
            x: ghostPositions[i].x,
            y: ghostPositions[i].y,
            color: ghostColors[i],
            direction: getRandomDirection(),
            behavior: i,
            targetX: 0,
            targetY: 0,
            scatterMode: false,
            scatterCounter: 0,
            patrolPoint: 0,
            patrolPoints: [
                { x: 1, y: 1 },
                { x: GRID_SIZE - 2, y: 1 },
                { x: GRID_SIZE - 2, y: GRID_SIZE - 2 },
                { x: 1, y: GRID_SIZE - 2 }
            ]
        };
        ghost.initialX = ghost.x; // Store initial position
        ghost.initialY = ghost.y;
        ghosts.push(ghost);
        gameBoard[ghost.y][ghost.x] = GHOST;
    }
}

// Move all ghosts with intelligent behavior
function moveGhosts() {
    for (let i = 0; i < ghosts.length; i++) {
        const ghost = ghosts[i];

        // Clear current ghost position
        if (gameBoard[ghost.y][ghost.x] === GHOST) {
            gameBoard[ghost.y][ghost.x] = EMPTY;
        }

        // Occasionally switch between chase and scatter modes (except for random ghost)
        if (ghost.behavior !== GHOST_BEHAVIOR.RANDOM && Math.random() < 0.005) {
            ghost.scatterMode = !ghost.scatterMode;
        }

        // Update ghost target based on behavior
        updateGhostTarget(ghost);

        // Determine best direction to reach target
        let bestDirection = calculateBestDirection(ghost);
        ghost.direction = bestDirection;

        // Try to move in the chosen direction
        let newX = ghost.x;
        let newY = ghost.y;

        switch (ghost.direction) {
            case 'up':
                newY--;
                break;
            case 'down':
                newY++;
                break;
            case 'left':
                newX--;
                break;
            case 'right':
                newX++;
                break;
        }

        // Check if the new position is valid
        if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE && gameBoard[newY][newX] !== WALL && gameBoard[newY][newX] !== TEMP_BARRIER) {
            // Handle case where ghost moves onto Pacman's position
            if (newX === pacman.x && newY === pacman.y) {
                if (powerUpActive) {
                    eatGhost(ghost);
                    // Ensure Pacman's position remains PACMAN
                    gameBoard[pacman.y][pacman.x] = PACMAN;
                } else {
                    handleGhostCollision();
                    return;
                }
            } else {
                // Make sure ghosts stay in their enclosure at the start
                if (!gameStarted || ghostsReleased || (gameStarted && !(newX >= ghostEnclosure.minX && newX <= ghostEnclosure.maxX && newY >= ghostEnclosure.minY && newY <= ghostEnclosure.maxY))) {
                    ghost.x = newX;
                    ghost.y = newY;
                    gameBoard[ghost.y][ghost.x] = GHOST;
                } else {
                    ghost.direction = getRandomDirection();
                }
            }
        } else {
            ghost.direction = getRandomDirection();
        }
    }
}

// Update ghost target based on its behavior
function updateGhostTarget(ghost) {
    // If in scatter mode, target a corner
    if (ghost.scatterMode) {
        const cornerIndex = ghost.behavior % 4;
        ghost.targetX = ghost.patrolPoints[cornerIndex].x;
        ghost.targetY = ghost.patrolPoints[cornerIndex].y;
        return;
    }

    // Different targeting strategies based on ghost behavior
    switch (ghost.behavior) {
        case GHOST_BEHAVIOR.CHASE: // Red ghost - direct chase
            ghost.targetX = pacman.x;
            ghost.targetY = pacman.y;
            break;

        case GHOST_BEHAVIOR.AMBUSH: // Pink ghost - ambush ahead of Pacman
            // Target 4 spaces ahead of Pacman
            ghost.targetX = pacman.x;
            ghost.targetY = pacman.y;
            switch (pacman.direction) {
                case 'up':
                    ghost.targetY -= 4;
                    break;
                case 'down':
                    ghost.targetY += 4;
                    break;
                case 'left':
                    ghost.targetX -= 4;
                    break;
                case 'right':
                    ghost.targetX += 4;
                    break;
            }
            // Keep target within bounds
            ghost.targetX = Math.max(0, Math.min(GRID_SIZE - 1, ghost.targetX));
            ghost.targetY = Math.max(0, Math.min(GRID_SIZE - 1, ghost.targetY));
            break;

        case GHOST_BEHAVIOR.RANDOM: // Cyan ghost - random movement
            // Random ghost just uses random direction, no target needed
            if (Math.random() < 0.1) { // 10% chance to change direction randomly
                ghost.direction = getRandomDirection();
            }
            break;

        case GHOST_BEHAVIOR.PATROL: // Orange ghost - patrol between corners
            // Increment patrol counter when close to target
            if (Math.abs(ghost.x - ghost.patrolPoints[ghost.patrolPoint].x) <= 1 &&
                Math.abs(ghost.y - ghost.patrolPoints[ghost.patrolPoint].y) <= 1) {
                ghost.patrolPoint = (ghost.patrolPoint + 1) % ghost.patrolPoints.length;
            }
            ghost.targetX = ghost.patrolPoints[ghost.patrolPoint].x;
            ghost.targetY = ghost.patrolPoints[ghost.patrolPoint].y;
            break;
    }
}

// Calculate the best direction for a ghost to reach its target
function calculateBestDirection(ghost) {
    // Random ghost just moves randomly
    if (ghost.behavior === GHOST_BEHAVIOR.RANDOM) {
        return ghost.direction; // Keep current direction or random new one
    }

    // For other ghosts, calculate distances in each direction
    const directions = ['up', 'down', 'left', 'right'];
    let bestDirection = ghost.direction;
    let bestDistance = Infinity;

    // Don't allow 180-degree turns (returning the way they came)
    const oppositeDirections = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
    };

    for (const direction of directions) {
        // Skip the opposite of current direction to prevent back-and-forth movement
        if (direction === oppositeDirections[ghost.direction]) {
            continue;
        }

        // Calculate new position in this direction
        let newX = ghost.x;
        let newY = ghost.y;

        switch (direction) {
            case 'up':
                newY--;
                break;
            case 'down':
                newY++;
                break;
            case 'left':
                newX--;
                break;
            case 'right':
                newX++;
                break;
        }

        // Check if this move is valid
        if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE &&
            gameBoard[newY][newX] !== WALL && gameBoard[newY][newX] !== TEMP_BARRIER) {

            // Calculate distance to target using Manhattan distance
            const distance = Math.abs(newX - ghost.targetX) + Math.abs(newY - ghost.targetY);

            // If this is better than our current best, update best direction
            if (distance < bestDistance) {
                bestDistance = distance;
                bestDirection = direction;
            }
        }
    }

    return bestDirection;
}

// Get a random direction for ghost movement
function getRandomDirection() {
    const directions = ['up', 'down', 'left', 'right'];
    return directions[Math.floor(Math.random() * directions.length)];
}

// Handle collision with a ghost
function handleGhostCollision() {
    // Stop the game
    clearInterval(gameInterval);
    gameInterval = null;

    // Show game over message
    const gameOverMessage = document.createElement('div');
    gameOverMessage.id = 'game-over-message';
    gameOverMessage.className = 'start-message';
    gameOverMessage.innerHTML = `<h2>Game Over!</h2><p>Your score: ${score}</p><button id="restart-button">Play Again</button>`;
    document.querySelector('.game-container').appendChild(gameOverMessage);

    // Add event listener to restart button
    document.getElementById('restart-button').addEventListener('click', function () {
        // Remove game over message
        gameOverMessage.remove();

        // Reset the game
        resetGame();
    });
}

function eatGhost(ghost) {
    score += 200;
    document.getElementById('score').textContent = score;

    // Find an empty position in the enclosure
    let placed = false;
    for (let y = ghostEnclosure.minY; y <= ghostEnclosure.maxY && !placed; y++) {
        for (let x = ghostEnclosure.minX; x <= ghostEnclosure.maxX && !placed; x++) {
            if (gameBoard[y][x] === EMPTY) {
                ghost.x = x;
                ghost.y = y;
                gameBoard[y][x] = GHOST;
                placed = true;
            }
        }
    }
    if (!placed) {
        // Fallback to initial position if no empty spot is found
        ghost.x = ghost.initialX;
        ghost.y = ghost.initialY;
        // Only set to GHOST if Pacman isn't there
        if (gameBoard[ghost.y][ghost.x] !== PACMAN) {
            gameBoard[ghost.y][ghost.x] = GHOST;
        }
    }
}

// Function to play the dot eating sound
function playDotEatSound() {
    try {
        // Initialize audio context if it doesn't exist
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Create oscillator for a simple "doink" sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Connect oscillator to gain node and gain node to destination
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Set oscillator properties for a cute "doink" sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime); // Start at 600Hz
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1); // Slide down to 300Hz

        // Set volume envelope
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Start at 30% volume
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1); // Fade out

        // Start and stop the oscillator
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Audio playback error:', error);
    }
}

// Start the game when the page loads
window.onload = initGame;
