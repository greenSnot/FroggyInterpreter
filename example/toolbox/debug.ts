import { Brick, BrickOutput } from 'froggy';

const bricks: {
  [type: string]: {
    brick_def: Brick,
    child_fns?: {[type: string]: Function},
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
    to_code: (brick, util) => `
      (($v) => {
        const $e = new Event('log');
        $e.data = $v;
        dispatchEvent($e);
        console.log($v);
      })(${util.brick_to_code(brick.inputs[0])});
      ${util.brick_to_code(brick.next)}`,
  },
  done: {
    brick_def: {
      type: 'done',
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'debug done',
          },
        },
      ],
      next: null,
    },
    to_code: (brick, util) => `
      (() => {
        const $e = new Event('finished');
        console.log('done');
        dispatchEvent($e);
      })();
      ${util.brick_to_code(brick.next)}`,
  },
};

const atomic_button_fns = {};
export default {
  bricks,
  atomic_button_fns,
};