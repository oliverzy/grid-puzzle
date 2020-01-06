import _ from 'lodash';
import * as PIXI from 'pixi.js';
import TWEEN from "@tweenjs/tween.js";
import EXIF from 'exif-js';
import './main.scss';
import christmas from './assets/christmas.png';
import newyear from './assets/newyear.jpeg';
import tokyo from './assets/tokyo.jpeg';
import { solve } from './solver';
import { makeFireworks } from './fireworks';


let board = []; // 两维数组，代表整个棋盘, 第一维是列，第二维是行
let SIZE = parseInt(document.getElementById('size').value, 10); // 棋盘行列数
const PW = { 3: 277, 4: 208 }; // 每块的大小
let isReplay = false; // 是否在自动完成状态
let app; // PIXI.js Application对象
let container; // 棋盘容器
let stepText; // 移动步数精灵
let stepCount = 0; // 移动步数
let customImg; // 用户选择的图片
let fireworks; // 烟火效果

/**
 * 初始化游戏，只会调用一次
 */
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
        enableButtons();
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
  document.getElementById('custom').addEventListener('change', e => {
    const img = new Image();
    const objectURL = window.URL.createObjectURL(e.target.files[0]);
    img.src = objectURL;
    img.onload = function() {
      handleImageOrientation(img, outputImg => {
        if (outputImg) {
          customImg = outputImg;
          newGame();
        } else
          alert('不支持的图片转向！');
        window.URL.revokeObjectURL(objectURL);
      });
    };
  });

  fireworks = makeFireworks(app);
}

/**
 * 处理手机相机拍摄导致的图片转向问题
 * https://segmentfault.com/a/1190000009990033
 *
 * @param img Image对象
 * @param cb
 */
function handleImageOrientation(img, cb) {
  EXIF.getData(img, function () {
    const orientation = EXIF.getTag(this, 'Orientation');
    if (orientation === undefined || orientation === 1 || orientation === 0)
      return cb(PIXI.BaseTexture.from(img));

    // 1. 等比缩放
    let spriteWidth, spriteHeight;
    const ratio = img.width / img.height;
    if(img.width > img.height && img.width > 900) {
      spriteWidth = 900;
      spriteHeight = Math.ceil(900 / ratio);
    } else if(img.width < img.height && img.height > 900) {
      spriteWidth = Math.ceil(900 * ratio);
      spriteHeight = 900;
    } else {
      spriteWidth = spriteHeight = 900;
    }
    // 2. 旋转
    const sprite = PIXI.Sprite.from(img);
    sprite.width = spriteWidth;
    sprite.height = spriteHeight;
    if (orientation === 6) {
      sprite.angle = 90;
      sprite.x = sprite.height;
    } else if (orientation === 8) {
      sprite.angle = -90;
      sprite.y = sprite.width;
    } else if (orientation === 3) {
      sprite.angle = 180;
      sprite.x = sprite.width;
      sprite.y = sprite.height;
    } else {
      console.error('不支持的图片转向！');
      return cb(null);
    }
    // 3. 渲染到RenderTexture
    const renderTexture = PIXI.RenderTexture.create({
      width: orientation === 6 || orientation === 8 ? spriteHeight : spriteWidth,
      height: orientation === 6 || orientation === 8 ? spriteWidth : spriteHeight,
      resolution: window.devicePixelRatio || 1});
    app.renderer.render(sprite, renderTexture);
    return cb(renderTexture);
    //const newSprite = PIXI.Sprite.from(renderTexture);
    //app.stage.addChild(newSprite);
  });
}

/**
 * 开始新游戏，会多次调用
 */
function newGame() {
  board = [];
  if (stepText)
    stepText.destroy();
  stepCount = 0;
  stepText = new PIXI.Text('已走步数：0',{fontFamily : 'Arial', fontSize: 18, fill : 0xffffff});
  stepText.anchor.x = 1;
  stepText.x = 900 - 26.5;
  stepText.y = 2;
  app.stage.addChild(stepText);
  if (container)
    container.destroy({children: true, texture: true, baseTexture: false});
  container = new PIXI.Container();
  container.sortableChildren = true;
  container.x = 26.5;
  container.y = 26.5;
  app.stage.addChild(container);

  const builtInImages = Object.keys(app.loader.resources);
  const baseTexture = customImg ? customImg
      : app.loader.resources[builtInImages[_.random(0, builtInImages.length-1)]].texture;

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

  function calculateFrame(i, j) {
    const imgWidth = baseTexture.width;
    const imgHeight = baseTexture.height;
    let x, y, width, height;
    if (imgWidth > imgHeight) {
      x = (imgWidth - imgHeight)/2;
      y = 0;
      width = imgHeight;
      height = imgHeight;
    } else if (imgWidth < imgHeight) {
      x = 0;
      y = (imgHeight - imgWidth)/2;
      width = imgWidth;
      height = imgWidth;
    } else {
      x = 0;
      y = 0;
      width = imgWidth;
      height = imgHeight;
    }

    return new PIXI.Rectangle(x+i*width/SIZE, y+j*height/SIZE, width/SIZE, height/SIZE);
  }

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
        const texture = new PIXI.Texture(baseTexture, calculateFrame(i, j));
        const piece = createPiece(i, j, texture);
        piece.interactive = true;
        piece.buttonMode = true;
        piece.on('pointertap', handleClick);
        container.addChild(piece);
        board[i][j] = piece;
      }
    }
  }

  randomPieces();
  fireworks.stop();
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

/**
 * 移动一格图片
 */
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

/**
 * 是否已完成拼图
 */
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
    document.getElementById('result').innerText = '恭喜你，拼图已经还原！';
    fireworks.play();
  } else {
    document.getElementById('result').innerText = '';
  }
}

function disableButtons() {
  document.getElementById('solve').setAttribute('disabled', 'disabled');
  document.getElementById('size').setAttribute('disabled', 'disabled');
  document.getElementById('new').setAttribute('disabled', 'disabled');
  document.getElementById('custom').setAttribute('disabled', 'disabled');
}

function enableButtons() {
  document.getElementById('solve').removeAttribute('disabled');
  document.getElementById('size').removeAttribute('disabled');
  document.getElementById('new').removeAttribute('disabled');
  document.getElementById('custom').removeAttribute('disabled');
}
/**
 * 自动完成拼图
 */
function replay(steps) {
  console.log('移动步骤：', steps);
  isReplay = true;
  disableButtons();
  function play(index) {
    if (index === steps.length) {
      isReplay = false;
      enableButtons();
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
