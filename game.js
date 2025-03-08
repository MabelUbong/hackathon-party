class Example extends Phaser.Scene {
    constructor() {
        super();
        this.pacman = null;
        this.cursors = null;
        this.speed = 160;
        this.currentDirection = null;
        this.nextDirection = null;
        this.map = null;
        this.tileSize = null;
        this.ghosts = [];
        this.powerUps = []; // Array to store power-up objects
        this.powerUpSound = null; // Sound effect for power-up collection
        this.eatGhostSound = null; // Sound effect for eating a ghost
        this.vulnerabilityTimer = null; // Timer for ghost vulnerability
        this.vulnerabilityDuration = 10000; // 10 seconds in milliseconds
        this.ghostRespawnTime = 3000; // 3 seconds in milliseconds
        this.wordList = ['blue', 'black', 'cloud', 'clap', 'flag', 'fly', 'glad', 'glue',
            'play', 'plum', 'slow', 'slide', 'broom', 'bread', 'crab', 'cry',
            'drum', 'drop', 'frog', 'fruit', 'green', 'grass', 'pray', 'proud',
            'tree', 'truck', 'scar', 'school'
        ];
        this.currentWord = '';
        this.wordText = null;
        this.dots = [];
        this.score = 0;
        this.scoreText = null;
        this.dotEatSound = null;
        this.lives = 3;
        this.livesText = null;
        this.deathSound = null;
        this.gameOver = false;
        this.gameOverText = null;
        this.watermelon = null;
        this.level = 1;
        this.levelText = null;
        this.levelCompleteText = null;
        this.stations = []; // Array to store station objects
    }

    preload() {
        this.load.image('block', 'assets/block.webp');
        this.load.image('pacman', 'assets/pacman.webp');
        this.load.image('blinky', 'assets/blinky.webp');
        this.load.image('clyde', 'assets/clyde.webp');
        this.load.image('inky', 'assets/inky.webp');
        this.load.image('pinky', 'assets/pinky.webp');
        this.load.image('blue_ghost', 'assets/blue_ghost.webp');
        this.load.image('strawberry', 'assets/strawberry');
        this.load.image('apple', 'assets/apple.webp');
        this.load.audio('powerUpSound', 'assets/ghosteating sound.wav?h6lI');
        this.load.audio('eatGhostSound', 'assets/ghosteating sound.wav?h6lI');
        this.load.image('dot', 'assets/hot pink circle.png?qdRE');
        this.load.audio('dotEatSound', 'assets/pacman_chomp.wav?5S8r');
        this.load.audio('deathSound', 'assets/pacman_death.wav?T6t9');
        this.load.image('watermelon', 'assets/slice-watermelon-pixel-art-white-background_69210-42-removebg-preview.webp');
        // Reuse existing fruit assets for stations
        this.stationAssets = {
            'Social Media': 'apple',
            'Meet Recruiters': 'strawberry',
            'Success Stories': 'watermelon',
            'Incentive Pages': 'apple',
            'Meet Buddy': 'strawberry'
        };
    }

    create() {
        this.map = [
            '############################',
            '#.....    ....    .........#',
            '#.###      ##      ####.###.',
            '#....#    ####    #........#',
            '#.##.######..######.##.....#',
            '#..........................#',
            '#.####.##.########.##.####.#',
            '#.####.##.########.##.####.#',
            '#......##....##....##......#',
            '######.##### ## #####.######',
            '     #.....# ## #.....#     ',
            '     #.###    P   ###.#     ',
            '     #...  ######  ...#     ',
            '######.##          ##.######',
            '      .    ######    .      ',
            '######.##          ##.######',
            '     #...  ######  ...#     ',
            '     #.###        ###.#     ',
            '     #..... #### .....#     ',
            '######.##.########.##.######',
            '#..........................',
            '#.###      ##      ###.###.#',
            '#....#    ####    #........#',
            '#.##.######..######.##.....#',
            '#......##....##....##......#',
            '#.####.##.########.##.####.#',
            '#....    ....##....    ....#',
            '#.###      ##      ####.###.',
            '#....#    ####    #........#',
            '#..........................#',
            '############################'
        ];

        this.tileSize = Math.min(this.sys.game.config.width / this.map[0].length, this.sys.game.config.height / this.map.length);
        this.createMaze(this.map);
        this.placeDots(this.map);
        this.placePowerUps(this.map);
        this.placePacman(this.map);
        this.placeGhosts(this.map);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.powerUpSound = this.sound.add('powerUpSound');
        this.eatGhostSound = this.sound.add('eatGhostSound');
        this.dotEatSound = this.sound.add('dotEatSound');
        this.watermelonEatSound = this.sound.add('eatGhostSound');
        // Set up the watermelon slice and word display
        this.watermelon = this.add.image(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 20, // Move 20 pixels up
            'watermelon'
        ).setOrigin(0.5);

        // Scale the watermelon to fit nicely in the center
        const scale = Math.min(
            this.sys.game.config.width / this.watermelon.width * 0.15, // Reduced by half (0.3 / 2 = 0.15)
            this.sys.game.config.height / this.watermelon.height * 0.15 // Reduced by half (0.3 / 2 = 0.15)
        );
        this.watermelon.setScale(scale);
        this.wordText = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 20, // Align with the watermelon's center
            '', {
                fontSize: '32px',
                fill: '#ffff00', // Changed to yellow
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        // Choose and display initial word
        this.chooseAndDisplayRandomWord();
        // Set up timer to change word every 10 seconds
        this.time.addEvent({
            delay: 10000,
            callback: this.chooseAndDisplayRandomWord,
            callbackScope: this,
            loop: true
        });
        // Add score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#fff'
        });
        // Add lives text
        this.livesText = this.add.text(16, 56, 'Lives: ' + this.lives, {
            fontSize: '32px',
            fill: '#fff'
        });
        // Add death sound
        this.deathSound = this.sound.add('deathSound');
        // Add level text
        this.levelText = this.add.text(16, 96, 'Level: ' + this.level, {
            fontSize: '32px',
            fill: '#ffffff'
        });
        // Add stations
        const stationPositions = [{
            x: 4,
            y: 2,
            name: 'Social Media'
        }, {
            x: 24,
            y: 2,
            name: 'Meet Recruiters'
        }, {
            x: 4,
            y: 27,
            name: 'Success Stories'
        }, {
            x: 24,
            y: 27,
            name: 'Incentive Pages'
        }, {
            x: 14,
            y: 14,
            name: 'Meet Buddy'
        }];
        stationPositions.forEach(station => {
            const sprite = this.add.image(
                station.x * this.tileSize + this.tileSize / 2,
                station.y * this.tileSize + this.tileSize / 2,
                this.stationAssets[station.name]
            ).setDisplaySize(this.tileSize * 1.5, this.tileSize * 1.5);
            const text = this.add.text(
                station.x * this.tileSize + this.tileSize / 2,
                (station.y + 1) * this.tileSize,
                station.name, {
                    fontSize: '16px',
                    fill: '#FFD700',
                    align: 'center'
                }
            ).setOrigin(0.5);
            this.stations.push({
                sprite: sprite,
                text: text,
                name: station.name
            });
        });
    }

    update() {
        if (!this.gameOver) {
            this.handleInput();
            this.movePacman();
            this.updatePacmanOrientation();
            this.moveGhosts();
            this.checkPowerUpCollision();
            this.checkGhostCollision();
            this.checkDotCollision();
            this.checkWatermelonCollision();
        }
    }

    createMaze(map) {
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                if (map[y][x] === '#') {
                    const block = this.add.image(x * this.tileSize + this.tileSize / 2, y * this.tileSize + this.tileSize / 2, 'block')
                        .setDisplaySize(this.tileSize, this.tileSize);
                }
            }
        }
    }

    placePacman(map) {
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                if (map[y][x] === 'P') {
                    this.pacman = this.add.image(x * this.tileSize + this.tileSize / 2, y * this.tileSize + this.tileSize / 2, 'pacman')
                        .setDisplaySize(this.tileSize, this.tileSize);
                    return;
                }
            }
        }
    }

    placeGhosts(map) {
        const ghostTypes = ['blinky', 'clyde', 'inky', 'pinky'];
        let ghostIndex = 0;

        for (let y = map.length - 1; y >= 0 && ghostIndex < ghostTypes.length; y--) {
            for (let x = map[y].length - 1; x >= 0 && ghostIndex < ghostTypes.length; x--) {
                if (map[y][x] === '.') {
                    const ghost = this.add.image(x * this.tileSize + this.tileSize / 2, y * this.tileSize + this.tileSize / 2, ghostTypes[ghostIndex])
                        .setDisplaySize(this.tileSize, this.tileSize);
                    this.ghosts.push({
                        sprite: ghost,
                        currentDirection: null,
                        vulnerable: false,
                        originalTexture: ghostTypes[ghostIndex],
                        startX: x * this.tileSize + this.tileSize / 2,
                        startY: y * this.tileSize + this.tileSize / 2
                    });
                    ghostIndex++;
                }
            }
        }
    }

    placePowerUps(map) {
        const powerUpPositions = [{
            x: 1,
            y: 3
        }, {
            x: 26,
            y: 3
        }, {
            x: 1,
            y: 23
        }, {
            x: 26,
            y: 23
        }];

        const powerUpTypes = ['strawberry', 'apple'];

        powerUpPositions.forEach((pos, index) => {
            if (map[pos.y][pos.x] === '.') {
                const powerUpType = powerUpTypes[index % powerUpTypes.length];
                const powerUp = this.add.image(pos.x * this.tileSize + this.tileSize / 2, pos.y * this.tileSize + this.tileSize / 2, powerUpType)
                    .setDisplaySize(this.tileSize, this.tileSize);
                this.powerUps.push(powerUp);
            }
        });
    }
    placeDots(map) {
        const dotColors = [0xff69b4, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]; // Pink, Green, Blue, Yellow, Magenta
        const dotColor = dotColors[(this.level - 1) % dotColors.length];
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                if (map[y][x] === '.') {
                    const dot = this.add.circle(
                        x * this.tileSize + this.tileSize / 2,
                        y * this.tileSize + this.tileSize / 2,
                        this.tileSize / 4 * 3 / 2, // Maintain the same size as before
                        dotColor
                    );
                    this.dots.push(dot);
                }
            }
        }
    }
    handleInput() {
        if (this.cursors.left.isDown) {
            this.nextDirection = 'left';
        } else if (this.cursors.right.isDown) {
            this.nextDirection = 'right';
        } else if (this.cursors.up.isDown) {
            this.nextDirection = 'up';
        } else if (this.cursors.down.isDown) {
            this.nextDirection = 'down';
        }
    }

    movePacman() {
        const {
            x,
            y
        } = this.getTileCoordinates(this.pacman.x, this.pacman.y);

        if (this.hasReachedTileCenter(this.pacman.x, this.pacman.y)) {
            this.alignToGrid(this.pacman);

            if (this.nextDirection && this.canMove(this.nextDirection, x, y)) {
                this.currentDirection = this.nextDirection;
                this.nextDirection = null;
            }

            if (!this.canMove(this.currentDirection, x, y)) {
                this.currentDirection = null;
            }
        }

        if (this.currentDirection) {
            switch (this.currentDirection) {
                case 'left':
                    this.pacman.x -= this.speed * this.sys.game.loop.delta / 1000;
                    break;
                case 'right':
                    this.pacman.x += this.speed * this.sys.game.loop.delta / 1000;
                    break;
                case 'up':
                    this.pacman.y -= this.speed * this.sys.game.loop.delta / 1000;
                    break;
                case 'down':
                    this.pacman.y += this.speed * this.sys.game.loop.delta / 1000;
                    break;
            }
        }
    }

    moveGhosts() {
        this.ghosts.forEach(ghost => {
            if (ghost.sprite.active) {
                const {
                    x,
                    y
                } = this.getTileCoordinates(ghost.sprite.x, ghost.sprite.y);

                if (this.hasReachedTileCenter(ghost.sprite.x, ghost.sprite.y)) {
                    this.alignToGrid(ghost.sprite);

                    if (!ghost.currentDirection || !this.canMove(ghost.currentDirection, x, y)) {
                        ghost.currentDirection = this.getRandomDirection(x, y);
                    }
                }

                if (ghost.currentDirection) {
                    switch (ghost.currentDirection) {
                        case 'left':
                            ghost.sprite.x -= this.speed * this.sys.game.loop.delta / 1000;
                            break;
                        case 'right':
                            ghost.sprite.x += this.speed * this.sys.game.loop.delta / 1000;
                            break;
                        case 'up':
                            ghost.sprite.y -= this.speed * this.sys.game.loop.delta / 1000;
                            break;
                        case 'down':
                            ghost.sprite.y += this.speed * this.sys.game.loop.delta / 1000;
                            break;
                    }
                }
            }
        });
    }

    getRandomDirection(x, y) {
        const directions = ['left', 'right', 'up', 'down'];
        const availableDirections = directions.filter(dir => this.canMove(dir, x, y));
        return availableDirections[Math.floor(Math.random() * availableDirections.length)];
    }

    updatePacmanOrientation() {
        if (this.currentDirection) {
            switch (this.currentDirection) {
                case 'left':
                    this.pacman.setFlipX(true);
                    this.pacman.setAngle(0);
                    break;
                case 'right':
                    this.pacman.setFlipX(false);
                    this.pacman.setAngle(0);
                    break;
                case 'up':
                    this.pacman.setFlipX(false);
                    this.pacman.setAngle(-90);
                    break;
                case 'down':
                    this.pacman.setFlipX(false);
                    this.pacman.setAngle(90);
                    break;
            }
        }
    }

    canMove(direction, tileX, tileY) {
        if (tileX < 0 || tileX >= this.map[0].length || tileY < 0 || tileY >= this.map.length) {
            return false;
        }
        switch (direction) {
            case 'left':
                return tileX > 0 && this.map[tileY][tileX - 1] !== '#';
            case 'right':
                return tileX < this.map[0].length - 1 && this.map[tileY][tileX + 1] !== '#';
            case 'up':
                return tileY > 0 && this.map[tileY - 1][tileX] !== '#';
            case 'down':
                return tileY < this.map.length - 1 && this.map[tileY + 1][tileX] !== '#';
        }
        return false;
    }

    getTileCoordinates(x, y) {
        let tileX = Math.floor(x / this.tileSize);
        let tileY = Math.floor(y / this.tileSize);

        // Ensure the coordinates are within the map boundaries
        tileX = Math.max(0, Math.min(tileX, this.map[0].length - 1));
        tileY = Math.max(0, Math.min(tileY, this.map.length - 1));

        return {
            x: tileX,
            y: tileY
        };
    }

    hasReachedTileCenter(x, y) {
        const {
            x: tileX,
            y: tileY
        } = this.getTileCoordinates(x, y);
        const centerX = (tileX + 0.5) * this.tileSize;
        const centerY = (tileY + 0.5) * this.tileSize;
        const distance = Phaser.Math.Distance.Between(x, y, centerX, centerY);
        return distance < 1;
    }

    alignToGrid(sprite) {
        const {
            x: tileX,
            y: tileY
        } = this.getTileCoordinates(sprite.x, sprite.y);
        sprite.x = (tileX + 0.5) * this.tileSize;
        sprite.y = (tileY + 0.5) * this.tileSize;
    }

    checkPowerUpCollision() {
        this.powerUps.forEach((powerUp, index) => {
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.pacman.getBounds(), powerUp.getBounds())) {
                this.collectPowerUp(powerUp, index);
            }
        });
    }

    collectPowerUp(powerUp, index) {
        this.powerUpSound.play();
        powerUp.destroy();
        this.powerUps.splice(index, 1);
        this.makeGhostsVulnerable();
    }

    makeGhostsVulnerable() {
        this.ghosts.forEach(ghost => {
            ghost.vulnerable = true;
            ghost.sprite.setTexture('blue_ghost');
        });

        if (this.vulnerabilityTimer) {
            this.vulnerabilityTimer.remove();
        }

        this.vulnerabilityTimer = this.time.delayedCall(this.vulnerabilityDuration, () => {
            this.ghosts.forEach(ghost => {
                ghost.vulnerable = false;
                ghost.sprite.setTexture(ghost.originalTexture);
            });
        }, [], this);
    }

    checkGhostCollision() {
        this.ghosts.forEach((ghost, index) => {
            if (ghost.sprite.active && Phaser.Geom.Intersects.RectangleToRectangle(this.pacman.getBounds(), ghost.sprite.getBounds())) {
                if (ghost.vulnerable) {
                    this.eatGhost(ghost, index);
                } else {
                    this.loseLife();
                }
            }
        });
    }
    loseLife() {
        this.lives--;
        this.livesText.setText('Lives: ' + this.lives);
        this.deathSound.play();
        if (this.lives > 0) {
            this.resetPacmanPosition();
        } else {
            this.gameOver = true;
            this.displayGameOver();
        }
    }
    resetPacmanPosition() {
        // Find Pacman's starting position
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 'P') {
                    this.pacman.x = x * this.tileSize + this.tileSize / 2;
                    this.pacman.y = y * this.tileSize + this.tileSize / 2;
                    this.currentDirection = null;
                    this.nextDirection = null;
                    return;
                }
            }
        }
    }

    eatGhost(ghost, index) {
        this.eatGhostSound.play();
        ghost.sprite.setActive(false).setVisible(false);

        this.time.delayedCall(this.ghostRespawnTime, () => {
            ghost.sprite.setActive(true).setVisible(true);
            ghost.sprite.x = ghost.startX;
            ghost.sprite.y = ghost.startY;
            ghost.vulnerable = false;
            ghost.sprite.setTexture(ghost.originalTexture);
        });
    }
    chooseAndDisplayRandomWord() {
        this.currentWord = Phaser.Utils.Array.GetRandom(this.wordList);
        if (this.wordText) {
            this.wordText.setText(this.currentWord);
            this.wordText.setPosition(this.watermelon.x, this.watermelon.y);
        }
    }
    checkDotCollision() {
        this.dots.forEach((dot, index) => {
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.pacman.getBounds(), dot.getBounds())) {
                this.collectDot(dot, index);
            }
        });
        if (this.dots.length === 0) {
            this.level++; // Increment level
            this.resetMaze();
        }
    }
    collectDot(dot, index) {
        dot.destroy();
        this.dots.splice(index, 1);
        this.score += 1;
        this.scoreText.setText('Score: ' + this.score);
        this.dotEatSound.play();
    }
    displayGameOver() {
        this.gameOverText = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            'GAME OVER\nScore: ' + this.score, {
                fontSize: '64px',
                fill: '#ff0000',
                align: 'center'
            }
        ).setOrigin(0.5);
        // Add View Leaderboard button
        const leaderboardButton = this.add.text(
                this.sys.game.config.width / 2,
                this.sys.game.config.height / 2 + 100,
                'View Leaderboard', {
                    fontSize: '32px',
                    fill: '#FFD700',
                    backgroundColor: '#000000',
                    padding: {
                        x: 20,
                        y: 10
                    }
                }
            ).setOrigin(0.5)
            .setInteractive();
        leaderboardButton.on('pointerup', () => {
            this.scene.start('LeaderboardScene');
        });
        leaderboardButton.on('pointerover', () => {
            leaderboardButton.setStyle({
                fill: '#FFFFFF'
            });
        });
        leaderboardButton.on('pointerout', () => {
            leaderboardButton.setStyle({
                fill: '#FFD700'
            });
        });
    }
    checkWatermelonCollision() {
        if (this.watermelon.visible && Phaser.Geom.Intersects.RectangleToRectangle(this.pacman.getBounds(), this.watermelon.getBounds())) {
            this.score += 20;
            this.scoreText.setText('Score: ' + this.score);
            this.watermelonEatSound.play();
            this.hideWatermelon();
            this.time.delayedCall(10000, this.showWatermelon, [], this);
        }
    }
    hideWatermelon() {
        this.watermelon.setVisible(false);
        this.wordText.setVisible(false);
    }
    showWatermelon() {
        this.watermelon.setVisible(true);
        this.watermelon.setPosition(this.sys.game.config.width / 2, this.sys.game.config.height / 2 - 20);
        this.chooseAndDisplayRandomWord();
        this.wordText.setVisible(true);
    }
    resetMaze() {
        // Preserve stations when resetting the maze
        const stationSprites = this.stations.map(station => station.sprite);
        const stationTexts = this.stations.map(station => station.text);
        // Remove existing dots and power-ups
        this.dots.forEach(dot => dot.destroy());
        this.dots = [];
        this.powerUps.forEach(powerUp => powerUp.destroy());
        this.powerUps = [];
        // Place new dots and power-ups
        this.placeDots(this.map);
        this.placePowerUps(this.map);
        // Reset Pacman and ghosts positions
        this.resetPacmanPosition();
        this.ghosts.forEach(ghost => {
            ghost.sprite.x = ghost.startX;
            ghost.sprite.y = ghost.startY;
            ghost.vulnerable = false;
            ghost.sprite.setTexture(ghost.originalTexture);
        });
        // Update level text
        if (this.levelText) {
            this.levelText.setText('Level: ' + this.level);
        } else {
            this.levelText = this.add.text(16, 96, 'Level: ' + this.level, {
                fontSize: '32px',
                fill: '#ffffff'
            });
        }
        console.log('Starting Level:', this.level); // Add this line for debugging
    }
}
class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'LeaderboardScene'
        });
    }
    create() {
        // Add title
        this.add.text(
            this.sys.game.config.width / 2,
            50,
            'LEADERBOARD', {
                fontSize: '48px',
                fill: '#FFD700',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        // Add some sample scores (you can replace these with real scores later)
        const sampleScores = [{
            name: 'Player 1',
            score: 1000
        }, {
            name: 'Player 2',
            score: 800
        }, {
            name: 'Player 3',
            score: 600
        }, {
            name: 'Player 4',
            score: 400
        }, {
            name: 'Player 5',
            score: 200
        }];
        // Display scores
        sampleScores.forEach((scoreData, index) => {
            this.add.text(
                this.sys.game.config.width / 2,
                150 + (index * 60),
                `${index + 1}. ${scoreData.name}: ${scoreData.score}`, {
                    fontSize: '32px',
                    fill: '#FFFFFF'
                }
            ).setOrigin(0.5);
        });
        // Add back button
        const backButton = this.add.text(
                this.sys.game.config.width / 2,
                this.sys.game.config.height - 100,
                'Back to Game', {
                    fontSize: '32px',
                    fill: '#FFD700',
                    backgroundColor: '#000000',
                    padding: {
                        x: 20,
                        y: 10
                    }
                }
            ).setOrigin(0.5)
            .setInteractive();
        backButton.on('pointerup', () => {
            this.scene.start('Example');
        });
        backButton.on('pointerover', () => {
            backButton.setStyle({
                fill: '#FFFFFF'
            });
        });
        backButton.on('pointerout', () => {
            backButton.setStyle({
                fill: '#FFD700'
            });
        });
    }
}
const config = {
    type: Phaser.AUTO,
    parent: 'renderDiv',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    width: 896,
    height: 992,
    scene: [Example, LeaderboardScene]
};

window.phaserGame = new Phaser.Game(config);
