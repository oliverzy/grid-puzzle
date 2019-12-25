import * as PIXI from 'pixi.js';
import TWEEN from "@tweenjs/tween.js";
import './main.scss';
import christmas from './christmas.png';


const app = new PIXI.Application({
  width: 900, height: 900, backgroundColor: 0x1099bb, resolution: window.devicePixelRatio || 1,
});
document.body.appendChild(app.view);
app.ticker.add((delta) => {
  TWEEN.update();
});

const board = []; // 两位数组，代表整个棋盘, 第一维是列，第二维是行
/**
 * 初始化游戏
 */
function initGame() {
  const container = new PIXI.Container();
  container.sortableChildren = true;
  container.x = 26.5;
  container.y = 26.5;
  app.stage.addChild(container);

  const baseTexture = PIXI.BaseTexture.from(christmas);
  for (let i=0;i<4;++i) {
    board[i] = [];
    for (let j=0;j<4;++j) {
      if (i === 3 && j === 3) { // 右下角一块特殊处理
        const rect = new PIXI.Graphics();
        rect.beginFill(0x1099bb);
        rect.drawRect(0, 0, 208, 208);
        rect.endFill();
        rect.isEmptyPiece = true;
        const texture = app.renderer.generateTexture(rect,PIXI.SCALE_MODES.NEAREST, window.devicePixelRatio || 1);
        const piece = new PIXI.Sprite(texture);
        piece.x = i*208 + i*5;
        piece.y = j*208 + j*5;
        piece.isEmptyPiece = true;
        piece.zIndex = -1;
        container.addChild(piece);
        board[i][j] = piece;
      } else {
        const texture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(i*208,j*208, 208, 208));
        const piece = new PIXI.Sprite(texture);
        piece.x = i*208 + i*5;
        piece.y = j*208 + j*5;
        piece.originalXIndex = i;
        piece.originalYIndex = j;
        piece.currentXIndex = i;
        piece.currentYIndex = j;
        piece.interactive = true;
        piece.buttonMode = true;
        piece.on('pointerdown', handleClick);
        container.addChild(piece);
        board[i][j] = piece;
      }
    }
  }
}

/**
 * 处理点击事件
 * @param target 被点击的对象
 */
function handleClick({target}) {
  const DIRECTION = {
    none: 'none',
    up: 'up',
    down: 'down',
    left: 'left',
    right: 'right'
  };

  function whereToMove() {
    let cx = target.currentXIndex;
    let cy = target.currentYIndex;

    if (cx > 0 && board[cx-1][cy].isEmptyPiece)
      return DIRECTION.left;
    if (cx < board.length-1 && board[cx+1][cy].isEmptyPiece)
      return DIRECTION.right;
    if (cy > 0 && board[cx][cy-1].isEmptyPiece)
      return DIRECTION.up;
    if (cy < board.length-1 && board[cx][cy+1].isEmptyPiece)
      return DIRECTION.down;
    return DIRECTION.none;
  }

  function move(direction) {
    console.log('can move:', direction);
    if (direction === DIRECTION.none)
      return;

    let cx = target.currentXIndex;
    let cy = target.currentYIndex;
    let nx, ny;
    if (direction === DIRECTION.left) {
      nx = cx -1;
      ny = cy;
    } else if (direction === DIRECTION.right) {
      nx = cx + 1;
      ny = cy;
    } else if (direction === DIRECTION.up) {
      nx = cx;
      ny = cy - 1;
    } else {
      nx = cx;
      ny = cy + 1;
    }

    target.currentXIndex = nx;
    target.currentYIndex = ny;
    //target.x = nx*208 + nx*5;
    //target.y = ny*208 + ny*5;
    const tween = new TWEEN.Tween(target);
    tween.to({x: nx*208 + nx*5, y: ny*208 + ny*5}, 300).easing(TWEEN.Easing.Quadratic.Out);
    tween.start();

    const empty = board[nx][ny];
    empty.currentXIndex = cx;
    empty.currentYIndex = cy;
    empty.x = cx*208 + cx*5;
    empty.y = cy*208 + cy*5;

    board[nx][ny] = target;
    board[cx][cy] = empty;
  }

  const direction =  whereToMove();
  move(direction);
}

/**
 * 打乱图形，检查逆序数，必须是偶数才有解
 * http://tieba.baidu.com/p/3115361000
 */
function randomPieces() {
  // 移动empty piece到原位，随机打乱剩余的piece，检查随机序列逆序数是否为偶数

}

/**
 * 自动求解
 *
 * return {Array} 获得解的步骤
 */
function autoSolve() {
  // 使用A*方法进行广度优先遍历
}

initGame();
