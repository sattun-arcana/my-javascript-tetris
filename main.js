// テトリミノの形と色を定義する (ステップ13)
const tetrominos = [
    // I型（シアン）
    { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: 'cyan' },
    // O型（黄色）
    { shape: [[1, 1], [1, 1]], color: 'yellow' },
    // T型（紫）
    { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: 'purple' },
    // L型（オレンジ）
    { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: 'orange' },
    // J型（青）
    { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: 'blue' },
    // S型（緑）
    { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: 'lime' },
    // Z型（赤）
    { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: 'red' }
];

// レアブロックの形を定義 (ステップ14)
const rareTetromino = {
    shape: [
        [1, 1],
        [1, 1]
    ],
    color: 'deeppink', 
    scoreBonus: 500 
};

// 現在のブロックの形状と色を保持するオブジェクト
let currentTetromino = {shape: [], color: '', isRare: false}; 
let tetrominoX = 0;
let tetrominoY = 0;

let score = 0; // スコア
let level = 1; // レベル
let gameTimerId = null; // ゲームタイマーのID

// キャンバスの基本設定
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const blockSize = 20; // ブロックの大きさ

// ゲーム盤面のサイズ
const boardWidth = 10;
const boardHeight = 20;

// ボードを空（0:空, 1:通常固定ブロック, 2:レア固定ブロック）で初期化
const board = Array.from({ length: boardHeight }, () => Array(boardWidth).fill(0));

// drawBlock関数：単一のブロックを描画
function drawBlock(x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
}

// draw関数：画面全体を描画
function draw() {
    // 画面を一度クリアする
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // 固定されたブロックを描画する
    for (let y = 0; y < boardHeight; y++) {
        for (let x = 0; x < boardWidth; x++) {
            if (board[y][x] === 1) {
                drawBlock(x, y, 'gray'); // 通常の固定ブロック
            } else if (board[y][x] === 2) {
                drawBlock(x, y, 'white'); // レアブロック（白に変更）
            }
        }
    }

    // 動いているテトリミノを描画する
    for (let y = 0; y < currentTetromino.shape.length; y++) {
        for (let x = 0; x < currentTetromino.shape[y].length; x++) {
            if (currentTetromino.shape[y][x] === 1) {
                drawBlock(tetrominoX + x, tetrominoY + y, currentTetromino.color);
            }
        }
    }

    // スコアとレベルの描画
    context.fillStyle = 'white';
    context.font = '18px Arial';
    context.fillText(`Score: ${score}`, 10, 30); 
    context.fillText(`Level: ${level}`, 10, 55);
}

// テトリミノを回転させる関数
function rotate(tetromino) {
    const N = tetromino.length;
    const newTetromino = Array.from({ length: N }, () => Array(N).fill(0));
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            newTetromino[x][N - 1 - y] = tetromino[y][x];
        }
    }
    return newTetromino;
}

// ブロックの移動が有効かチェックする関数
function isValidMove(tetromino, x, y) {
    for (let ty = 0; ty < tetromino.length; ty++) {
        for (let tx = 0; tx < tetromino[ty].length; tx++) {
            if (tetromino[ty][tx] === 1) {
                const boardX = x + tx;
                const boardY = y + ty;
                
                // 盤面の外または他のブロックと重なっていないかチェック
                if (boardX < 0 || boardX >= boardWidth || boardY >= boardHeight || (boardY >= 0 && board[boardY][boardX] !== 0)) {
                    return false;
                }
            }
        }
    }
    return true;
}

// スピードを更新する関数
function updateSpeed() {
    const speed = 1000 - (level - 1) * 100; 
    clearInterval(gameTimerId); 
    gameTimerId = setInterval(gameLoop, speed > 100 ? speed : 100); 
}

// ラインをクリアする関数 (レアブロックのボーナス判定を含む)
function clearLines() {
    let linesCleared = 0; 
    let rareBlockFound = false; // レアブロックが消去されたかどうかのフラグ

    for (let y = boardHeight - 1; y >= 0; y--) {
        let isFull = true;
        for (let x = 0; x < boardWidth; x++) {
            if (board[y][x] === 0) {
                isFull = false;
                break;
            }
        }

        if (isFull) {
            linesCleared++; 
            
            // レアブロックのチェック
            for (let x = 0; x < boardWidth; x++) {
                if (board[y][x] === 2) { // レアブロック（値が 2）が含まれているか
                    rareBlockFound = true; 
                    break;
                }
            }

            // 行を削除し、上にずらす処理
            for (let i = y; i > 0; i--) {
                for (let x = 0; x < boardWidth; x++) {
                    board[i][x] = board[i - 1][x];
                }
            }
            for (let x = 0; x < boardWidth; x++) {
                board[0][x] = 0;
            }
            y++;
        }
    }
    
    // スコア加算とレベルアップ判定
    if (linesCleared > 0) {
        if (linesCleared === 1) score += 100;
        else if (linesCleared === 2) score += 300;
        else if (linesCleared === 3) score += 500;
        else if (linesCleared === 4) score += 800;
        
        // レアブロックボーナス加算
        if (rareBlockFound) {
            score += rareTetromino.scoreBonus; // 500点ボーナスを加算
        }
        
        const newLevel = Math.floor(score / 1000) + 1; 
        if (newLevel > level) {
            level = newLevel;
            updateSpeed();
        }
    }
}

// 新しいテトリミノを生成する関数
function createTetromino() {
    let tetrominoToUse;
    
    // 10%の確率でレアブロックを選ぶ
    if (Math.random() < 0.1) { 
        tetrominoToUse = {...rareTetromino, isRare: true}; // isRareフラグを追加
    } else {
        // 通常ブロックを選ぶ
        const randomTetrominoObject = tetrominos[Math.floor(Math.random() * tetrominos.length)];
        tetrominoToUse = {...randomTetrominoObject, isRare: false}; // isRareフラグを追加
    }

    currentTetromino = tetrominoToUse;
    
    tetrominoX = Math.floor((boardWidth - currentTetromino.shape[0].length) / 2);
    tetrominoY = 0;

    // ゲームオーバーの判定
    if (!isValidMove(currentTetromino.shape, tetrominoX, tetrominoY)) {
        alert("Game Over!");
        document.location.reload(); 
    }
    draw();
}

// キーボードの入力を受け付ける
document.addEventListener('keydown', (event) => {
    let newX = tetrominoX;
    let newY = tetrominoY;
    let newTetromino = currentTetromino;
    let isRotated = false; 

    if (event.key === 'ArrowLeft') {
        newX--;
    } else if (event.key === 'ArrowRight') {
        newX++;
    } else if (event.key === 'ArrowDown') {
        newY++;
    } else if (event.key === 'ArrowUp') { 
        const rotated = rotate(currentTetromino.shape);
        if (isValidMove(rotated, tetrominoX, tetrominoY)) {
            newTetromino = {...currentTetromino, shape: rotated}; // shapeのみ更新
            isRotated = true; 
        }
    }

    // 移動または回転が有効なら位置や形を更新
    if (isRotated) {
        currentTetromino = newTetromino; 
    } else if (isValidMove(currentTetromino.shape, newX, newY)) {
        tetrominoX = newX;
        tetrominoY = newY;
    }

    draw(); 
});

// ゲームループ：ブロックの自動落下と固定処理
function gameLoop() {
    if (isValidMove(currentTetromino.shape, tetrominoX, tetrominoY + 1)) {
        tetrominoY++;
    } else {
        // ブロックをボードに固定する (レアかどうかを記録)
        const blockValue = currentTetromino.isRare ? 2 : 1;
        
        for (let y = 0; y < currentTetromino.shape.length; y++) {
            for (let x = 0; x < currentTetromino.shape[y].length; x++) {
                if (currentTetromino.shape[y][x] === 1) {
                    board[tetrominoY + y][tetrominoX + x] = blockValue; 
                }
            }
        }
        
        clearLines();
        createTetromino();
    }
    draw();
}

// 最初の描画とタイマー開始
createTetromino();
gameTimerId = setInterval(gameLoop, 1000);