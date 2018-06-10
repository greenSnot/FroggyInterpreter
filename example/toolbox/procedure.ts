import { gen_id, Brick, BrickOutput } from 'froggy';
import { atomicButtonAdd, atomicButtonRemove } from './styles/button.less';

import { Interpreter } from 'froggy-interpreter';

const bricks: {
  [type: string]: {
    brick_def: Brick,
    child_fns?: {[type: string]: Function},
    fn: Function,
  },
} = {
  procedure_def: {
    brick_def: {
      type: 'procedure_def',
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'procedure def',
          },
        },
        {
          type: 'container',
          output: BrickOutput.string,
          is_static: true,
          inputs: [{
            type: 'atomic_input_string',
            output: BrickOutput.string,
            is_static: true,
            ui: {
              value: 'boost',
            },
          }],
        },
        {
          type: 'atomic_button',
          is_static: true,
          ui: {
            className: atomicButtonAdd,
            value: 'procedure_add_param',
          },
        },
        {
          type: 'atomic_button',
          is_static: true,
          ui: {
            className: atomicButtonRemove,
            value: 'procedure_remove_param',
          },
        },
      ],
      next: null,
      ui: {
        show_hat: true,
      },
    },
    fn: (interpreter: Interpreter) => {
      const params = interpreter.get_params();
      if (interpreter.get_brick_status() === Interpreter.BRICK_STATUS.first_evaluation) {
        interpreter.set_brick_status(Interpreter.BRICK_STATUS.done_evaluation);
      } else {
        interpreter.step_into_parent();
      }
    },
    child_fns: {
      procedure: (interpreter: Interpreter) => {
        if (interpreter.get_brick_status() === Interpreter.BRICK_STATUS.first_evaluation) {
          interpreter.set_brick_status(Interpreter.BRICK_STATUS.done_evaluation);
          interpreter.step_into_procedure(interpreter.self.procedure_name);
        } else {
          return interpreter.procedure_result;
        }
      },
      procedure_with_output: (interpreter: Interpreter) => {
        if (interpreter.get_brick_status() === Interpreter.BRICK_STATUS.first_evaluation) {
          interpreter.set_brick_status(Interpreter.BRICK_STATUS.done_evaluation);
          interpreter.step_into_procedure(interpreter.self.procedure_name);
        } else {
          return interpreter.procedure_result;
        }
      },
      atomic_param: (interpreter: Interpreter, [name]) => {
        return interpreter.get_params()[name];
      },
    },
  },
  procedure_return: {
    brick_def: {
      type: 'procedure_return',
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'return',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [],
      }],
    },
    fn: (interpreter: Interpreter, [res]) => {
      interpreter.procedure_return(res);
    },
  },
};

const atomic_button_fns = {
  procedure_remove_param: (brick_data, brick, update) => {
    const parent = brick_data[brick.ui.parent];
    if (parent.inputs.length === 4) {
      return;
    }
    parent.inputs.splice(parent.inputs.length - 3, 1);
    if (parent.inputs.length === 5) {
      parent.inputs.splice(parent.inputs.length - 3, 1);
    }
    update();
  },
  procedure_add_param: (brick_data, brick, update) => {
    const parent = brick_data[brick.ui.parent];
    if (parent.inputs.length === 4) {
      parent.inputs.splice(parent.inputs.length - 2, 0, {
        id: gen_id(),
        type: 'atomic_text',
        ui: {
          value: 'params:',
          is_toolbox_brick: parent.ui.is_toolbox_brick,
        },
      });
    }
    const param_name = prompt(`param's name`);
    const id = gen_id();
    parent.inputs.splice(parent.inputs.length - 2, 0, {
      id,
      type: 'container',
      output: BrickOutput.any,
      root: parent.root,
      is_static: true,
      inputs: [{
        id: gen_id(),
        type: 'atomic_param',
        output: BrickOutput.any,
        ui: {
          parent: id,
          is_toolbox_brick: parent.ui.is_toolbox_brick,
          value: param_name,
        },
      }],
      is_decoration: true,
      ui: {
        copier: true,
        is_toolbox_brick: parent.ui.is_toolbox_brick,
        parent: parent.id,
      },
    } as Brick);
    update();
  },
};
export default {
  bricks,
  atomic_button_fns,
};