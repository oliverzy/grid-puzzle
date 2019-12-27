import _ from 'lodash';
import { aStarPathSearch } from './a-star';

// key为Node的ID，用来排除重复节点
let KNOWN_NODES = {};

function createNodeFromBoard(board) {
  const value = [];
  for (let i=0;i<board.length;++i) {
    value[i] = [];
    for (let j=0;j<board.length;++j) {
      value[i][j] = {
        x: board[i][j].currentXIndex,
        y: board[i][j].currentYIndex,
        ox: board[i][j].originalXIndex,
        oy: board[i][j].originalYIndex,
        isEmptyPiece: board[i][j].isEmptyPiece
      };
    }
  }

  return createNodeFromValue(value);
}

function generateIDFromValue(value) {
  let id = [];
  for (let i=0;i<value.length;++i) {
    for (let j=0;j<value.length;++j) {
      id.push(value[i][j].ox + value[i][j].oy*value.length)
    }
  }

  return id.join(',');
}

function createNodeFromValue(value) {
  const id = generateIDFromValue(value);
  if (KNOWN_NODES[id]) return KNOWN_NODES[id];

  const node = new Node(value, id);
  KNOWN_NODES[id] = node;
  return node;
}

function swap(p1, p2) {
  const tmpOX = p2.ox;
  const tmpOY = p2.oy;
  const tmpIsEmptyPiece = p2.isEmptyPiece;
  p2.ox = p1.ox;
  p2.oy = p1.oy;
  p2.isEmptyPiece = p1.isEmptyPiece;
  p1.ox = tmpOX;
  p1.oy = tmpOY;
  p1.isEmptyPiece = tmpIsEmptyPiece;
}

function Node(value, id) {
  this.value = value;
  this.id = id;
}

Node.prototype.getChildren = function () {
  const value = this.value;
  let emptyX, emptyY;
  for (let i=0;i<value.length;++i) {
    for (let j=0;j<value.length;++j) {
      if (value[i][j].isEmptyPiece) {
        emptyX = value[i][j].x;
        emptyY = value[i][j].y;
        break;
      }
    }
  }

  const children = [];
  if (emptyX > 0) {
    const newValue = _.cloneDeep(value);
    const left = newValue[emptyX-1][emptyY];
    const empty = newValue[emptyX][emptyY];
    swap(left, empty);
    children.push(createNodeFromValue(newValue));
  }
  if (emptyX < value.length-1) {
    const newValue = _.cloneDeep(value);
    const right = newValue[emptyX+1][emptyY];
    const empty = newValue[emptyX][emptyY];
    swap(right, empty);
    children.push(createNodeFromValue(newValue));
  }
  if (emptyY > 0) {
    const newValue = _.cloneDeep(value);
    const up = newValue[emptyX][emptyY-1];
    const empty = newValue[emptyX][emptyY];
    swap(up, empty);
    children.push(createNodeFromValue(newValue));
  }
  if (emptyY < value.length-1) {
    const newValue = _.cloneDeep(value);
    const down = newValue[emptyX][emptyY+1];
    const empty = newValue[emptyX][emptyY];
    swap(down, empty);
    children.push(createNodeFromValue(newValue));
  }

  return children;
};

function createFinalNode() {
  const value = [];
  for (let i=0;i<4;++i) {
    value[i] = [];
    for (let j=0;j<4;++j) {
      value[i][j] = {
        x: i,
        y: j,
        ox: i,
        oy: j,
        isEmptyPiece: i === 3 && j === 3
      }
    }
  }

  return createNodeFromValue(value);
}

const DIRECTION = {
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right'
};

function findAction(a, b) {
  const aValue = a.value;
  let emptyAX, emptyAY;
  for (let i=0;i<aValue.length;++i) {
    for (let j=0;j<aValue.length;++j) {
      if (aValue[i][j].isEmptyPiece) {
        emptyAX = aValue[i][j].x;
        emptyAY = aValue[i][j].y;
        break;
      }
    }
  }

  const bValue = b.value;
  let emptyBX, emptyBY;
  for (let i=0;i<bValue.length;++i) {
    for (let j=0;j<bValue.length;++j) {
      if (bValue[i][j].isEmptyPiece) {
        emptyBX = bValue[i][j].x;
        emptyBY = bValue[i][j].y;
        break;
      }
    }
  }

  if (emptyAX === emptyBX+1)
    return DIRECTION.right;
  if (emptyAX+1 === emptyBX)
    return DIRECTION.left;
  if (emptyAY === emptyBY+1)
    return DIRECTION.down;
  return DIRECTION.up;
}

/**
 * 尝试A*方法进行搜索求解
 *
 * return {Array} 获得解的步骤
 */
export function solve(board) {
  const t0 = performance.now();
  KNOWN_NODES = {};
  const from = createNodeFromBoard(board);
  const to = createFinalNode();
  const path = aStarPathSearch(from, to, {
    heuristic: function (a) {
      let result = 0;
      for (let i=0;i<4;++i) {
        for (let j=0;j<4;++j) {
          const b = a.value[i][j];
          const dx = b.x - b.ox;
          const dy = b.y - b.oy;
          result += Math.abs(dx) + Math.abs(dy);
        }
      }

      return result;
    }
  });
  const t1 = performance.now();
  console.log(`搜索结果花费了：${t1 - t0}ms`);
  //console.log(path);
  const steps = [];
  for (let i=0;i<path.length-1;++i) {
    const step = findAction(path[i], path[i+1]);
    steps.push(step);
  }
  return steps;
}

