/**
 * 从https://github.com/anvaka/ngraph.path项目修改而来
 * Performs a uni-directional A Star search on graph.
 *
 * We will try to minimize f(n) = g(n) + h(n), where
 * g(n) is actual distance from source node to `n`, and
 * h(n) is heuristic distance from `n` to target node.
 */
import { NodeHeap } from './node-heap';
import { makeSearchStatePool } from './search-state';
const NO_PATH = [];

export function aStarPathSearch(from, to, options) {
  options = options || {};

  let heuristic = options.heuristic;
  if (!heuristic) heuristic = function () { return 0; };

  let distance = options.distance;
  if (!distance) distance = function () { return 1; };

  let goalReached = options.goalReached;
  if (!goalReached) goalReached = function (searchNode, targetNode ) { return searchNode === targetNode; };
  const pool = makeSearchStatePool();
  pool.reset();

  // Maps nodeId to NodeSearchState.
  const nodeState = new Map();

  // the nodes that we still need to evaluate
  const openSet = new NodeHeap({
    compare: function compareFScore(a, b) {
      const result = a.fScore - b.fScore;
      return result;
    },
    setNodeId: function setHeapIndex(nodeSearchState, heapIndex) {
      nodeSearchState.heapIndex = heapIndex;
    }
  });

  const startNode = pool.createNewState(from);
  nodeState.set(from.id, startNode);

  // For the first node, fScore is completely heuristic.
  startNode.fScore = heuristic(from, to);

  // The cost of going from start to start is zero.
  startNode.distanceToSource = 0;
  openSet.push(startNode);
  startNode.open = 1;

  let cameFrom;

  while (openSet.length > 0) {
    cameFrom = openSet.pop();
    if (goalReached(cameFrom.node, to)) return reconstructPath(cameFrom);

    // no need to visit this node anymore
    cameFrom.closed = true;
    //graph.forEachLinkedNode(cameFrom.node.id, visitNeighbour, oriented);
    const childNodes = cameFrom.node.getChildren();
    childNodes.forEach(child => {
      visitNeighbour(child);
    });
  }

  // If we got here, then there is no path.
  return NO_PATH;

  function visitNeighbour(otherNode) {
    let otherSearchState = nodeState.get(otherNode.id);
    if (!otherSearchState) {
      otherSearchState = pool.createNewState(otherNode);
      nodeState.set(otherNode.id, otherSearchState);
    }

    if (otherSearchState.closed) {
      // Already processed this node.
      return;
    }
    if (otherSearchState.open === 0) {
      // Remember this node.
      openSet.push(otherSearchState);
      otherSearchState.open = 1;
    }

    const tentativeDistance = cameFrom.distanceToSource + distance(otherNode, cameFrom.node);
    if (tentativeDistance >= otherSearchState.distanceToSource) {
      // This would only make our path longer. Ignore this route.
      return;
    }

    // bingo! we found shorter path:
    otherSearchState.parent = cameFrom;
    otherSearchState.distanceToSource = tentativeDistance;
    otherSearchState.fScore = tentativeDistance + heuristic(otherSearchState.node, to);

    openSet.updateItem(otherSearchState.heapIndex);
  }
}

function reconstructPath(searchState) {
  const path = [searchState.node];
  let parent = searchState.parent;

  while (parent) {
    path.push(parent.node);
    parent = parent.parent;
  }

  return path.reverse();
}
