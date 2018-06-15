import { Brick, BrickOutput } from 'froggy';

const bricks: {
  [type: string]: {
    brick_def: Brick,
    child_fns?: {[type: string]: Function},
    fn: Function,
    to_code: Function,
  },
} = {
  log: {
    brick_def: {
      type: 'log',
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'log',
          },
        },
        {
          type: 'container',
          output: BrickOutput.any,
          inputs: [],
        },
      ],
      next: null,
    },
    fn: (i, [v]) => {
      const e = new Event('log');
      e['data'] = v;
      dispatchEvent(e);
      console.log(v);
    },
    to_code: (brick, o) => `
      (($v) => {
        const $e = new Event('log');
        $e.data = $v;
        dispatchEvent($e);
        console.log($v);
      })(${o.brick_to_code(brick.inputs[0])});
      ${o.brick_to_code(brick.next)}`,
  },
};

const atomic_button_fns = {};
export default {
  bricks,
  atomic_button_fns,
};