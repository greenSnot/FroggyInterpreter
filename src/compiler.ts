import { Brick as RuntimeBrick } from './interpreter';

import { get_last_nth } from './util';

type CompilerOpt = {
  is_procedure_def: (i) => boolean,
  is_declare_local_variable: (i) => boolean,
  is_blocking_brick: (i) => boolean,
  is_atmoic: (i) => boolean,
  needs_ignore: (i) => boolean,
  is_param: (i) => boolean,
  is_container: (i) => boolean,
  is_procedure_call: (i) => boolean,
  is_repeat: (i) => boolean,
};

let compiler_opt;
let util;
export const clean_up = (brick) => {
  const do_clean_up = (b, prev: string, parent = undefined) => {
    if (compiler_opt.needs_ignore(b)) {
      return undefined;
    }
    if (compiler_opt.is_container(b)) {
      return do_clean_up(b.inputs[0], undefined, b.ui.parent);
    }
    const res: RuntimeBrick = {
      id: b.id,
      breakable: compiler_opt.is_repeat(b),
      is_atomic: compiler_opt.is_atmoic(b),
      type: b.type,
      output: b.output,
      parts: b.parts ? b.parts.map(i => do_clean_up(i, undefined, b.id)).filter(i => i) : [],
      inputs: b.inputs ? b.inputs.map(i => do_clean_up(i, undefined, b.id)).filter(i => i) : [],
      next: b.next ? do_clean_up(b.next, b.id) : undefined,
      computed: b.ui && b.ui.value,
      parent,
      is_variable_name: b.is_variable_name,
      is_procedure_call: compiler_opt.is_procedure_call(b),
      is_procedure_def: compiler_opt.is_procedure_def(b),
    };
    if (compiler_opt.is_procedure_call(b)) {
      res.procedure_name = b.inputs[0].ui.value;
    }
    return res;
  };
  const root_brick = do_clean_up(brick, undefined);
  return root_brick;
};

export const compile = ({procedures, events}) => {
  const compute_global_variables = (brick, func?) => {
    const visited = {};
    const local_variable_stack = [[{}]];
    const do_for_each = (b, fn) => {
      if (visited[b.id]) {
        return;
      }
      visited[b.id] = true;
      fn && fn(b);
      if (compiler_opt.is_declare_local_variable(b)) {
        const stack = get_last_nth(local_variable_stack, 1);
        get_last_nth(stack, 1)[b.inputs[0].computed] = true;
        b.next && do_for_each(b.next, fn);
        return;
      }
      if (b.is_variable_name) {
        const stack = get_last_nth(local_variable_stack, 1);
        if (get_last_nth(stack, 1)[b.computed] === undefined) {
          util.is_global_variable[b.parent] = true;
        }
      }
      b.inputs.forEach(i => do_for_each(i, fn));
      b.parts.forEach(i => {
        const stack = get_last_nth(local_variable_stack, 1);
        stack.push({...get_last_nth(stack, 1)});
        do_for_each(i, fn);
        stack.pop();
      });
      b.next && do_for_each(b.next, fn);
      if (compiler_opt.is_procedure_call(b)) {
        local_variable_stack.push([{}]);
        do_for_each(procedures[b.procedure_name], fn);
        local_variable_stack.pop();
      }
    };
    do_for_each(brick, func);
  };

  Object.keys(procedures).forEach(i => {
    const brick = procedures[i];
    compute_global_variables(brick, (b) => {
      if (compiler_opt.is_blocking_brick(b)) {
        util.has_blocking_brick[i] = true;
      }
    });
    (new Function('global', `${util.brick_to_code(brick)}`))(util.global_variables);
    // console.log(util.global_variables[`$procedure_${brick.procedure_name}`]);
  });

  events.forEach((i) => {
    compute_global_variables(i, (b) => {
      if (compiler_opt.is_blocking_brick(b)) {
        util.has_blocking_brick[i] = true;
      }
    });
    (new Function('global', `${util.brick_to_code(i)}`))(util.global_variables);
  });
  return {
    procedures,
    events,
  };
};

export default (
  root_bricks,
  u = {
    global_variables: {},
    type_to_code: {},
  },
  compiler_options: CompilerOpt = {
    is_procedure_def: (b) => b.type === 'procedure_def',
    is_declare_local_variable: (b) => b.type === 'data_variable_declare_local',
    is_blocking_brick: (b) => b.type === 'control_wait',
    is_atmoic: (b) => (
      b.type === 'atomic_boolean' ||
      b.type === 'atomic_dropdown' ||
      b.type === 'atomic_input_string' ||
      b.type === 'atomic_input_number'),
    needs_ignore: (b) => (
      b.type === 'atomic_button' ||
      b.type === 'atomic_text'
    ),
    is_param: (b) => b.type === 'atomic_param',
    is_container: (b) => b.type === 'container',
    is_procedure_call: (b) => b.type === 'procedure' || b.type === 'procedure_with_output',
    is_repeat: (b) => b.type === 'control_repeat_n_times' || b.type === 'control_repeat_while',
  },
) => {
  util = {
    ...u,
    has_blocking_brick: {},
    brick_to_code: (b) => b ? util.type_to_code[b.type](b, util) : '',
    is_global_variable: {},
  };
  compiler_opt = compiler_options;
  const roots: RuntimeBrick[] = root_bricks.filter(i => i.ui.show_hat).map(i => clean_up(i));
  const procedures = roots.filter(i => compiler_options.is_procedure_def(i)).map(i => {
    i.procedure_name = i.inputs[0].computed;
    i.params = i.inputs.filter(j => compiler_options.is_param(j)).map(j => j.computed);
    return i;
  }).reduce(
    (m, j) => {
      m[j.procedure_name] = j;
      return m;
    },
    {},
  );
  const events = roots.filter(i => !compiler_options.is_procedure_def(i));
  return compile({
    procedures,
    events,
  });
};