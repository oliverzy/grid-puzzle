import { aStarPathSearch } from './a-star';

// key为Node的ID，用来排除重复节点
let KNOWN_NODES = {};

function createNodeFromBoard(board) {
  const value = []
  for (let i=0;i<board.length;++i) {
    for (let j=0;j<board.length;++j) {
      value.push(board[j][i].originalXIndex + board[j][i].originalYIndex*board.length)
    }
  }

  return createNodeFromValue(value);
}

function generateIDFromValue(value) {
  return value.join(',');
}

function createNodeFromValue(value) {
  const id = generateIDFromValue(value);
  if (KNOWN_NODES[id]) return KNOWN_NODES[id];

  const node = new Node(value, id);
  KNOWN_NODES[id] = node;
  return node;
}

function Node(value, id) {
  this.value = value;
  this.id = id;
}

Node.prototype.getChildren = function () {
  const value = this.value;
  const emptyIndex = value.findIndex(e => e === 15);
  function swap(v, i1, i2) {
    const tmp = v[i1];
    v[i1] = v[i2];
    v[i2] = tmp;
  }

  const children = [];
  if (![0,4,8,12].includes(emptyIndex)) {
    let newValue = value.slice();
    swap(newValue, emptyIndex, emptyIndex-1);
    children.push(createNodeFromValue(newValue));
  }
  if (![3,7,11,15].includes(emptyIndex)) {
    let newValue = value.slice();
    swap(newValue, emptyIndex, emptyIndex+1);
    children.push(createNodeFromValue(newValue));
  }
  if (![0,1,2,3].includes(emptyIndex)) {
    let newValue = value.slice();
    swap(newValue, emptyIndex, emptyIndex-4);
    children.push(createNodeFromValue(newValue));
  }
  if (![12,13,14,15].includes(emptyIndex)) {
    let newValue = value.slice();
    swap(newValue, emptyIndex, emptyIndex+4);
    children.push(createNodeFromValue(newValue));
  }

  return children;
};

function createFinalNode() {
  const value = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
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
  const emptyAIndex = aValue.findIndex(e => e === 15);
  const emptyAX = emptyAIndex%4;
  const emptyAY = Math.floor(emptyAIndex/4);

  const bValue = b.value;
  const emptyBIndex = bValue.findIndex(e => e === 15);
  const emptyBX = emptyBIndex%4;
  const emptyBY = Math.floor(emptyBIndex/4);

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
      for (let k=0;k<a.value.length;++k) {
        const ox = a.value[k]%4;
        const oy = Math.floor(a.value[k]/4);
        const x = k%4;
        const y = Math.floor(k/4);
        result += Math.abs(ox-x) + Math.abs(oy-y);
      }

      return result;
    }
  });
  const t1 = performance.now();
  console.log('搜索状态数量：', Object.keys(KNOWN_NODES).length);
  console.log(`搜索结果花费了：${t1 - t0}ms`);
  //console.log(path);
  const steps = [];
  for (let i=0;i<path.length-1;++i) {
    const step = findAction(path[i], path[i+1]);
    steps.push(step);
  }
  return steps;
}

