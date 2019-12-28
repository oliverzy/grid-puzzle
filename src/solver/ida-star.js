// https://algorithmsinsight.wordpress.com/graph-theory-2/ida-star-algorithm-in-general/

export function idaStarSearch(from, to, options) {
  options = options || {};

  let heuristic = options.heuristic;
  if (!heuristic) heuristic = function () { return 0; };

  let distance = options.distance;
  if (!distance) distance = function () { return 1; };

  let goalReached = options.goalReached;
  if (!goalReached) goalReached = function (searchNode, targetNode ) { return searchNode === targetNode; };

  let path;
  function dfs(node, g, threshold) {
    const f = g + heuristic(node, to);
    if (f > threshold)
      return f;
    if (goalReached(node, to))
      return path;

    let min = Number.MAX_VALUE;
    for (let child of node.getChildren()) {
      path.push(child);
      const t = dfs(child, g + distance(node, child), threshold);
      if (Array.isArray(t))
        return t;
      path.pop();
      if (t < min)
        min = t;
    }

    return min;
  }

  let threshold = heuristic(from, to);
  for(;;) {
    path = [from];
    let t = dfs(from, 0, threshold);
    if (t === Number.MAX_VALUE)
      return [];
    if (Array.isArray(t))
      return t;
    threshold = t;
    console.log('threshold:', threshold);
  }
}