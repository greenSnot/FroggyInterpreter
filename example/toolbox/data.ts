import { Brick, BrickOutput } from 'froggy';
import { Interpreter } from 'froggy-interpreter';
import * as runtime_mgr from '../runtime_mgr';

const bricks: {
  [type: string]: {
    brick_def: Brick,
    fn: Function,
  },
} = {
  atomic_boolean: {
    brick_def: {
      type: 'atomic_boolean',
      output: BrickOutput.boolean,
      is_root: true,
      ui: {
        value: true,
        dropdown: 'atomic_boolean_dropdown',
      },
    },
    fn: () => {},
  },
  atomic_input_number: {
    brick_def: {
      type: 'atomic_input_number',
      output: BrickOutput.number,
      is_root: true,
      ui: {
        value: 1,
      },
    },
    fn: () => {},
  },
  atomic_input_string: {
    brick_def: {
      type: 'atomic_input_string',
      is_root: true,
      output: BrickOutput.string,
      ui: {
        value: 'string',
      },
    },
    fn: () => { },
  },
  data_empty_array: {
    brick_def: {
      type: 'data_empty_array',
      output: BrickOutput.array,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'empty array',
        },
      }],
      is_root: true,
    },
    fn: () => ([]),
  },
  data_variable_get: {
    brick_def: {
      type: 'data_variable_get',
      output: BrickOutput.any,
      is_root: true,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'variable',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [name]) => {
      const local = i.get_local_variable(name);
      if (local !== undefined) {
        return local;
      }
      return runtime_mgr.get_global_variable(name);
    },
  },
  data_variable_set: {
    brick_def: {
      type: 'data_variable_set',
      next: null,
      is_root: true,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set variable',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'to',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [],
      }],
    },
    fn: (interpreter: Interpreter, [variable_name, value]) => {
      interpreter.set_local_variable(variable_name, value) || runtime_mgr.set_global_variable(variable_name, value);
    },
  },
  data_variable_append: {
    brick_def: {
      type: 'data_variable_append',
      next: null,
      is_root: true,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'append',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'to',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [thing, name]) => {
      let variable = i.get_local_variable(name);
      if (variable === undefined) {
        variable = runtime_mgr.get_global_variable(name);
      }
      variable.push(thing);
    },
  },
  data_variable_get_nth: {
    brick_def: {
      type: 'data_variable_get_nth',
      is_root: true,
      output: BrickOutput.any,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'get',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [{
          type: 'atomic_input_number',
          output: BrickOutput.number,
          ui: {
            value: 0,
          },
        }],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'th of',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [n, name]) => {
      let variable = i.get_local_variable(name);
      if (variable === undefined) {
        variable = runtime_mgr.get_global_variable(name);
      }
      return variable[n];
    },
  },
  data_variable_remove_nth: {
    brick_def: {
      type: 'data_variable_remove_nth',
      next: null,
      is_root: true,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'remove',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [{
          type: 'atomic_input_number',
          output: BrickOutput.number,
          ui: {
            value: 0,
          },
        }],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'th of',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [n, name]) => {
      let variable = i.get_local_variable(name);
      if (variable === undefined) {
        variable = runtime_mgr.get_global_variable(name);
      }
      variable.splice(n, 1);
    },
  },
  data_variable_set_nth: {
    brick_def: {
      type: 'data_variable_set_nth',
      next: null,
      is_root: true,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [{
          type: 'atomic_input_number',
          output: BrickOutput.number,
          ui: {
            value: 0,
          },
        }],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'th of',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'to',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [],
      }],
    },
    fn: (i: Interpreter, [n, name, thing]) => {
      let variable = i.get_local_variable(name);
      if (variable === undefined) {
        variable = runtime_mgr.get_global_variable(name);
      }
      variable[n] = thing;
    },
  },
  data_variable_length_of: {
    brick_def: {
      type: 'data_variable_length_of',
      is_root: true,
      output: BrickOutput.any,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'length of',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [name]) => {
      let variable = i.get_local_variable(name);
      if (variable === undefined) {
        variable = runtime_mgr.get_global_variable(name);
      }
      return variable.length;
    },
  },
  data_variable_pop: {
    brick_def: {
      type: 'data_variable_pop',
      is_root: true,
      output: BrickOutput.any,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'pop',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [name]) => {
      let variable = i.get_local_variable(name);
      if (variable === undefined) {
        variable = runtime_mgr.get_global_variable(name);
      }
      return variable.pop();
    },
  },
  data_variable_declare_local: {
    brick_def: {
      type: 'data_variable_declare_local',
      is_root: true,
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'declare local variable',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [name]) => {
      i.declare_local_variable(name);
    },
  },
};

const atomic_button_fns = {};
const atomic_dropdown_menu = {
  atomic_boolean_dropdown: {
    true: true,
    false: false,
  },
};
export default {
  bricks,
  atomic_dropdown_menu,
  atomic_button_fns,
};