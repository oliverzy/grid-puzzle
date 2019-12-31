import { aStarPathSearch } from './a-star';
//import { idaStarSearch } from './ida-star'; // 算法实现简单，但是效率太差

// key为Node的ID，用来排除重复节点
let KNOWN_NODES = new Map();

function createNodeFromBoard(board) {
  const value = [];
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
  if (KNOWN_NODES.has(id)) return KNOWN_NODES.get(id);

  const node = new Node(value, id);
  KNOWN_NODES.set(id, node);
  return node;
}

function Node(value, id) {
  this.value = value;
  this.id = id;
}

Node.prototype.getChildren = function () {
  const value = this.value;
  const size = Math.sqrt(value.length);
  const emptyIndex = value.findIndex(e => e === size*size-1);
  function swap(v, i1, i2) {
    const tmp = v[i1];
    v[i1] = v[i2];
    v[i2] = tmp;
  }

  const children = [];
  let edge = size === 3 ? [0,3,6] : [0,4,8,12];
  if (!edge.includes(emptyIndex)) { // right
    let newValue = value.slice();
    swap(newValue, emptyIndex, emptyIndex-1);
    children.push(createNodeFromValue(newValue));
  }
  edge = size === 3 ? [2,5,8] : [3,7,11,15];
  if (!edge.includes(emptyIndex)) { // left
    let newValue = value.slice();
    swap(newValue, emptyIndex, emptyIndex+1);
    children.push(createNodeFromValue(newValue));
  }
  edge = size === 3 ? [0,1,2] : [0,1,2,3];
  if (!edge.includes(emptyIndex)) { // up
    let newValue = value.slice();
    swap(newValue, emptyIndex, emptyIndex-size);
    children.push(createNodeFromValue(newValue));
  }
  edge = size === 3 ? [6,7,8] : [12,13,14,15];
  if (!edge.includes(emptyIndex)) { // down
    let newValue = value.slice();
    swap(newValue, emptyIndex, emptyIndex+size);
    children.push(createNodeFromValue(newValue));
  }

  return children;
};

function createFinalNode(size) {
  const value = size === 3 ? [0,1,2,3,4,5,6,7,8] : [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
  return createNodeFromValue(value);
}

const DIRECTION = {
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right'
};

function findAction(a, b) {
  const size = Math.sqrt(a.value.length);
  const aValue = a.value;
  const emptyAIndex = aValue.findIndex(e => e === size*size-1);
  const emptyAX = emptyAIndex%size;
  const emptyAY = Math.floor(emptyAIndex/size);

  const bValue = b.value;
  const emptyBIndex = bValue.findIndex(e => e === size*size-1);
  const emptyBX = emptyBIndex%size;
  const emptyBY = Math.floor(emptyBIndex/size);

  if (emptyAX === emptyBX+1)
    return DIRECTION.right;
  if (emptyAX+1 === emptyBX)
    return DIRECTION.left;
  if (emptyAY === emptyBY+1)
    return DIRECTION.down;
  return DIRECTION.up;
}

/**
 * 使用A*方法进行搜索求解
 *
 * 对于九宫格，可以一次用算法获得全局最优解也就是最少移动步数
 * 但是对于十六空格，想一次获得全局最优解耗时过长，不可行
 * 所以我们通过每次获得部分最优解，最后获得解的策略，这种方式可以快速得到解，但是解不一定是全局最优的
 *
 * return {Array} 获得解的步骤
 */
export function solve(board) {
  const t0 = performance.now();
  KNOWN_NODES.clear();
  let from = createNodeFromBoard(board);
  const to = createFinalNode(board.length);
  const startIndex = board.length === 3 ? 9 : 1;
  let totalPath = [];
  for (let limit=startIndex;limit<=board.length*board.length;++limit) {
    console.log('搜索数量限制：', limit);

    const path = aStarPathSearch(from, to, {
      heuristic: function (a) {
        let result = 0;
        const size = board.length;
        for (let k=0;k<a.value.length;++k) {
          const ox = a.value[k]%size;
          const oy = Math.floor(a.value[k]/size);
          const x = k%size;
          const y = Math.floor(k/size);
          result += Math.abs(ox-x) + Math.abs(oy-y);
        }

        return result;
      },
      goalReached: function (searchNode, targetNode) {
        for (let i=0;i<limit;++i) {
          if (searchNode.value[i] !== targetNode.value[i])
            return false;
        }
        from = searchNode;
        return true;
      }
    }, 3000);

    const t1 = performance.now();
    console.log('搜索状态数量：', KNOWN_NODES.size);
    console.log(`搜索结果花费了：${t1 - t0}ms`);
    if (totalPath.length > 0)
      path.shift();
    totalPath = totalPath.concat(path);
  }

  const steps = [];
  for (let i=0;i<totalPath.length-1;++i) {
    const step = findAction(totalPath[i], totalPath[i+1]);
    steps.push(step);
  }
  return steps;
}

