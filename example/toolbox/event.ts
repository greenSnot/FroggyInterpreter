import { Brick, BrickOutput } from 'froggy';
import { Interpreter } from 'froggy-interpreter';
import * as runtime_mgr from '../runtime_mgr';

import { MOUSE_STATUS } from '../runtime_data';
import { atomicButtonRun } from './styles/button.less';

const bricks: {
  [type: string]: {
    brick_def: Brick,
    fn: Function,
  },
} = {
  event_run_on_click: {
    brick_def: {
      id: 'event_run_on_click',
      type: 'event_run_on_click',
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'when',
          },
        },
        {
          type: 'atomic_button',
          ui: {
            className: atomicButtonRun,
          },
        },
        {
          type: 'atomic_text',
          ui: {
            value: 'clicked',
          },
        },
      ],
      ui: {
        show_hat: true,
      },
      next: null,
    },
    fn: () => {},
  },
  sensor_mouse: {
    brick_def: {
      type: 'sensor_mouse',
      output: BrickOutput.boolean,
      inputs: [{
        type: 'container',
        output: BrickOutput.number,
        is_static: true,
        inputs: [{
          type: 'atomic_dropdown',
          output: BrickOutput.number,
          is_static: true,
          ui: {
            value: 2,
            dropdown: 'sensor_mouse_kinds_dropdown',
          },
        }],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'mouse',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        is_static: true,
        inputs: [{
          type: 'atomic_dropdown',
          output: BrickOutput.number,
          is_static: true,
          ui: {
            value: 2,
            dropdown: 'sensor_mouse_status_dropdown',
          },
        }],
      }],
      is_root: true,
    },
    fn: (interpreter: Interpreter, [mouse, status]) => {
      const mouse_status = runtime_mgr.get_mouse_status();
      return mouse_status[mouse === 1 ? 'left' : 'right'] as any === (status === 1 ? MOUSE_STATUS.down : MOUSE_STATUS.up);
    },
  },
  sensor_key: {
    brick_def: {
      type: 'sensor_key',
      is_root: true,
      output: BrickOutput.boolean,
      inputs: [
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [
            {
              type: 'atomic_dropdown',
              is_static: true,
              output: BrickOutput.number,
              ui: {
                value: 1,
                dropdown: 'sensor_key_dropdown',
              },
            },
          ],
        },
        {
          type: 'atomic_text',
          ui: {
            value: 'is',
          },
        },
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [
            {
              type: 'atomic_dropdown',
              output: BrickOutput.number,
              is_static: true,
              ui: {
                value: 2,
                dropdown: 'sensor_key_status_dropdown',
              },
            },
          ],
        },
      ],
    },
    fn: () => {},
  },
  event_mouse: {
    brick_def: {
      type: 'event_mouse',
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'when',
          },
        },
        {
          type: 'container',
          output: BrickOutput.any,
          is_static: true,
          inputs: [
            {
              type: 'atomic_dropdown',
              output: BrickOutput.number,
              is_static: true,
              ui: {
                value: 2,
                dropdown: 'sensor_mouse_all_status_dropdown',
              },
            },
          ],
        },
      ],
      ui: {
        show_hat: true,
      },
      next: null,
    },
    fn: (interpreter: Interpreter, [mouse_status]) => {
      interpreter.retriggerable = true;
      const status = runtime_mgr.get_mouse_status();
      let res;
      if (mouse_status === 1) {
        res = status.left === MOUSE_STATUS.up;
      } else if (mouse_status === 2) {
        res = status.left === MOUSE_STATUS.down;
      } else if (mouse_status === 3) {
        res = status.right === MOUSE_STATUS.up;
      } else if (mouse_status === 4) {
        res = status.right === MOUSE_STATUS.down;
      }
      if (!res) {
        interpreter.needs_pop = true;
      }
    },
  },
  event_key: {
    brick_def: {
      type: 'event_key',
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'when',
          },
        },
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [
            {
              type: 'atomic_dropdown',
              output: BrickOutput.number,
              is_static: true,
              ui: {
                value: 1,
                dropdown: 'sensor_key_status_dropdown',
              },
            },
          ],
        },
        {
          type: 'atomic_text',
          ui: {
            value: 'is',
          },
        },
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [{
            is_static: true,
            type: 'atomic_dropdown',
            output: BrickOutput.number,
            ui: {
              value: 2,
              dropdown: 'sensor_key_status_dropdown',
            },
          }],
        },
      ],
      ui: {
        show_hat: true,
      },
      next: null,
    },
    fn: () => {},
  },
};

const atomic_button_fns = {
  undefined: () => {},
};
const atomic_dropdown_menu = {
  sensor_mouse_kinds_dropdown: {
    left: 1,
    right: 2,
  },
  sensor_mouse_status_dropdown: {
    'up': 1,
    'down': 2,
  },
  sensor_key_status_dropdown: {
    'pressed': 1,
    'released': 2,
  },
  sensor_key_dropdown: {
    'a': 1,
    // TODO
  },
  sensor_mouse_all_status_dropdown: {
    'left mouse up': 1,
    'left mouse down': 2,
    'right mouse up': 3,
    'right mouse down': 4,
  },
};
export default {
  bricks,
  atomic_button_fns,
  atomic_dropdown_menu,
};