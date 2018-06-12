export const deep_clone = (a) => {
  if (typeof a !== 'object') {
    return a;
  }
  if (a instanceof Array) {
    return a.map(i => deep_clone(i));
  } else {
    return Object.keys(a).reduce(
      (m, i) => {
        m[i] = deep_clone(a[i]);
        return m;
      },
      {},
    );
  }
};

export const get_last_nth = (arr: any[], index: number) => arr[arr.length - index];
export const set_last_nth = (arr: any[], index: number, value) => arr[arr.length - index] = value;