import _ from 'lodash';

function swap(p1, p2) {
  const tmp = _.pick(p2, ['x', 'y', 'currentXIndex', 'currentYIndex']);
  Object.assign(p2, p1);
  Object.assign(p1, tmp);
}


/**
 * 标准深度优先算法求解
 *
 * return {Array} 获得解的步骤
 */
export function dfsSolve(board) {

}

/**
 * 尝试A*方法进行搜索求解
 *
 * return {Array} 获得解的步骤
 */
export function aStarSolve(board) {
  //
}
