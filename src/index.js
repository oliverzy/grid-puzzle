/* TODO:
 * 1）能够支持基于任意图片上传或者图片URL生成游戏，长方形图片自动基于长边裁剪
 */

import _ from 'lodash';
import * as PIXI from 'pixi.js';
import TWEEN from "@tweenjs/tween.js";
import './main.scss';
import christmas from './christmas.png';
import newyear from './newyear.jpeg';
import tokyo from './tokyo.jpeg';
import { solve } from './solver';


let board = []; // 两维数组，代表整个棋盘, 第一维是列，第二维是行
let SIZE = parseInt(document.getElementById('size').value, 10); // 棋盘行列数
const PW = { 3: 277, 4: 208 }; // 每块的大小
let isReplay = false; // 是否在自动完成状态
let app; // 全局PIXI.js Application对象
let stepText;
let stepCount = 0;


function initApp() {
  app = new PIXI.Application({
    width: 900, height: 900, backgroundColor: 0x1099bb, resolution: window.devicePixelRatio || 1,
    view: document.getElementById('board')
  });
  app.ticker.add((delta) => {
    TWEEN.update();
  });
  app.loader
      .add('christmas', christmas)
      .add('newyear', newyear)
      .add('tokyo', tokyo)
      .load((loader, resources) => {
        newGame();
      });
  document.getElementById('solve').addEventListener('click', e => {
    const steps = solve(board);
    replay(steps);
  });
  document.getElementById('size').addEventListener('change', e => {
    SIZE = parseInt(document.getElementById('size').value, 10);
    newGame();
  });
  document.getElementById('new').addEventListener('click', e => {
    newGame();
  });
}

/**
 * 初始化游戏
 */
function newGame() {
  board = [];
  app.stage.removeChildren();
  stepCount = 0;
  stepText = new PIXI.Text('已走步数：0',{fontFamily : 'Arial', fontSize: 18, fill : 0xffffff});
  stepText.anchor.x = 1;
  stepText.x = 900 - 26.5;
  stepText.y = 2;
  app.stage.addChild(stepText);
  const container = new PIXI.Container();
  container.sortableChildren = true;
  container.x = 26.5;
  container.y = 26.5;
  app.stage.addChild(container);

  function createPiece(i, j, texture) {
    const piece = new PIXI.Sprite(texture);
    piece.x = i*PW[SIZE] + i*5;
    piece.y = j*PW[SIZE] + j*5;
    piece.width = PW[SIZE];
    piece.height = PW[SIZE];
    piece.originalXIndex = i;
    piece.originalYIndex = j;
    piece.currentXIndex = i;
    piece.currentYIndex = j;
    return piece;
  }

  const builtInImages = Object.keys(app.loader.resources);
  const baseTexture = app.loader.resources[builtInImages[_.random(0, builtInImages.length-1)]].texture;
  for (let i=0;i<SIZE;++i) {
    board[i] = [];
    for (let j=0;j<SIZE;++j) {
      if (i === SIZE-1 && j === SIZE-1) { // 右下角一块特殊处理
        const rect = new PIXI.Graphics();
        rect.beginFill(0x1099bb);
        rect.drawRect(0, 0, PW[SIZE], PW[SIZE]);
        rect.endFill();
        const texture = app.renderer.generateTexture(rect,PIXI.SCALE_MODES.NEAREST, window.devicePixelRatio || 1);
        const piece = createPiece(i, j, texture);
        piece.isEmptyPiece = true;
        piece.zIndex = -1;
        container.addChild(piece);
        board[i][j] = piece;
      } else {
        const textureSize = baseTexture.width/SIZE;
        const texture = new PIXI.Texture(baseTexture,
            new PIXI.Rectangle(i*textureSize,j*textureSize, textureSize, textureSize));
        const piece = createPiece(i, j, texture);
        piece.interactive = true;
        piece.buttonMode = true;
        piece.on('pointerdown', handleClick);
        container.addChild(piece);
        board[i][j] = piece;
      }
    }
  }

  randomPieces();
}

/**
 * 打乱图形
 */
function randomPieces() {
  // 检查逆序数，必须是偶数才有解
  // https://blog.csdn.net/weixin_42438777/article/details/84723308
  function isSolvable(order) {
    let count = 0;
    for (let i=0;i<order.length;++i) {
      for (let j=i+1;j<order.length;++j) {
        if (order[i] > order[j])
          count++;
      }
    }

    console.log('排列：', order, count);
    return count % 2 === 0;
  }

  const newOrder = SIZE === 3 ? _.shuffle([0,1,2,3,4,5,6,7]) :
      _.shuffle([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]);
  //[0,1,2,3,4,5,6,7,8,9,10,12,11,14,13];
  if (!isSolvable(newOrder))
    return randomPieces();

  newOrder.push(SIZE*SIZE-1);
  const newBoard = [];
  for (let i=0;i<board.length;++i)
    newBoard.push([]);
  let newi = 0;
  let newj = 0;
  for (let k=0;k<newOrder.length;++k) {
    const i = newOrder[k]%SIZE;
    const j = Math.floor(newOrder[k]/SIZE);
    const piece = board[i][j];
    piece.x = newi*PW[SIZE] + newi*5;
    piece.y = newj*PW[SIZE] + newj*5;
    piece.currentXIndex = newi;
    piece.currentYIndex = newj;
    newBoard[newi][newj] = piece;
    newi++;
    if (newi === SIZE) {
      newi = 0;
      newj++;
    }
  }
  board = newBoard;
}

const DIRECTION = {
  none: 'none',
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right'
};

/**
 * 处理点击事件
 * @param target 被点击的对象
 */
function handleClick({target}) {
  if (isReplay) return;
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

  const direction =  whereToMove();
  move(direction);
}

function move(direction, cb) {
  //console.log('can move:', direction);
  if (direction === DIRECTION.none)
    return;

  function findEmptyPiece() {
    let emptyX, emptyY;
    for (let i=0;i<board.length;++i) {
      for (let j=0;j<board.length;++j) {
        if (board[i][j].isEmptyPiece) {
          emptyX = i;
          emptyY = j;
          return {emptyX, emptyY};
        }
      }
    }
  }
  const {emptyX, emptyY} = findEmptyPiece();

  let target;
  if (direction === DIRECTION.left)
    target = board[emptyX+1][emptyY];
  else if (direction === DIRECTION.right)
    target = board[emptyX-1][emptyY];
  else if (direction === DIRECTION.up)
    target = board[emptyX][emptyY+1];
  else
    target = board[emptyX][emptyY-1];

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
  const tween = new TWEEN.Tween(target);
  tween.to({x: nx*PW[SIZE] + nx*5, y: ny*PW[SIZE] + ny*5}, 300).easing(TWEEN.Easing.Quadratic.Out)
    .onComplete(() => {
      stepCount++;
      stepText.text = `已走步数：${stepCount}`;
      checkFinish();
      if (cb) cb();
    });
  tween.start();

  const empty = board[nx][ny];
  empty.currentXIndex = cx;
  empty.currentYIndex = cy;
  empty.x = cx*PW[SIZE] + cx*5;
  empty.y = cy*PW[SIZE] + cy*5;

  board[nx][ny] = target;
  board[cx][cy] = empty;
}

function checkFinish() {
  function isFinish() {
    for (let i=0;i<board.length;++i) {
      for (let j=0;j<board.length;++j) {
        if ((board[i][j].originalXIndex !== board[i][j].currentXIndex) ||
            (board[i][j].originalYIndex !== board[i][j].currentYIndex)) {
          return false;
        }
      }
    }

    return true;
  }

  if (isFinish()) {
    document.getElementById('result').innerText = '恭喜你，拼图已经还原！'
  } else {
    document.getElementById('result').innerText = '';
  }
}

function replay(steps) {
  console.log('移动步骤：', steps);
  isReplay = true;
  document.getElementById('solve').setAttribute('disabled', 'disabled');
  document.getElementById('size').setAttribute('disabled', 'disabled');
  document.getElementById('new').setAttribute('disabled', 'disabled');
  function play(index) {
    if (index === steps.length) {
      isReplay = false;
      document.getElementById('solve').removeAttribute('disabled');
      document.getElementById('size').removeAttribute('disabled');
      document.getElementById('new').removeAttribute('disabled');
      return;
    }
    move(steps[index], () => {
      setTimeout(() => {
        play(index+1);
      }, 300);
    });
  }
  play(0);
}

initApp();
