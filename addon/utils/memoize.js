export default function memoize(func) {
  let cache = {};
  return async function() {
    let args = JSON.stringify(arguments);
    cache[args] = cache[args] || func.apply(this, arguments);
    return cache[args];
  };
}
