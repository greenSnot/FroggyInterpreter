import { gen_id, AtomicBrickEnum, BrickId, BrickOutput } from 'froggy';
import { get_last_nth, set_last_nth } from './util';

enum Status {
  IDLE = 0,
  PENDING = 1,
}
export type Brick = {
  id: BrickId,
  parent: BrickId,
  type: string,
  is_atomic: boolean,
  output: BrickOutput,
  parts: Brick[],
  inputs: Brick[],
  breakable: boolean,
  next: Brick,
  computed: any,

  optimized_fn?: Function,
  params?: string[],
  procedure_name?: string,
  is_procedure_def?: boolean,
  is_procedure_call?: boolean,
  is_variable_name?: boolean,
};

type BrickRuntimeData = {
  evaluation_times: number,
  inputs_result: any[],
  [name: string]: any,
};
export class Interpreter {
  static SIGNAL = {
    pause: 'pause',
  };
  static get_initial_runtime_data = () => ({ evaluation_times: 0, inputs_result: [] } as BrickRuntimeData);
  private valid_time = 0;
  private status = Status.IDLE;
  private brick_runtime_data_stack: BrickRuntimeData[] = [];
  private param_stack: {[name: string]: any}[] = [];

  skip_on_end = false;
  procedure_result;
  root: Brick;
  self: Brick;
  call_stack: Brick[] = [];
  local_variable_stack: {[name: string]: any}[] = [];
  procedures: {[procedure_name: string]: Brick};
  fns = {};

  retriggerable = false;
  skip_inputs = false;

  constructor(fns, procedures, root_brick) {
    this.fns = fns;
    this.procedures = procedures;
    this.root = root_brick;
    this.reset();
  }
  private push_call_stack(b: Brick = this.self) {
    this.call_stack.push(b);
    this.local_variable_stack.push({});
    this.brick_runtime_data_stack.push(Interpreter.get_initial_runtime_data());
  }
  private pop_call_stack() {
    if (this.self.is_procedure_def) {
      this.param_stack.pop();
    }
    this.brick_runtime_data_stack.pop();
    this.local_variable_stack.pop();
    return this.call_stack.pop();
  }
  private pause() {
    throw Error(Interpreter.SIGNAL.pause);
  }
  private step_into_inputs() {
    const inputs = this.self.inputs;
    const runtime_data = this.get_brick_runtime_data();

    if (!inputs.length || this.self.is_procedure_def) {
      return;
    }
    if (this.skip_inputs) {
      this.skip_inputs = false;
      return;
    }

    const self = this.self;
    for (let i = runtime_data.inputs_result.length; i < inputs.length; ++i) {
      this.push_call_stack(self);
      this.self = inputs[i];
      this.do_step();
    }
  }
  private on_end(result) {
    if (this.self.output) {
      const res = this.self.is_procedure_call ? this.procedure_result : result;
      this.self = this.pop_call_stack();
      this.get_brick_runtime_data().inputs_result.push(res);
      return;
    }
    if (this.skip_on_end) {
      this.skip_on_end = false;
    } else {
      if (this.self.next) {
        set_last_nth(this.brick_runtime_data_stack, 1, Interpreter.get_initial_runtime_data());
        this.self = this.self.next;
      } else {
        this.self = this.pop_call_stack();
      }
    }
  }
  private do_step() {
    this.step_into_inputs();
    const result = (
      this.self.is_atomic ?
      this.self.computed :
      this.fns[this.self.type](this, this.get_brick_runtime_data().inputs_result)
    );
    this.on_end(result);
  }
  get_brick_runtime_data = () => get_last_nth(this.brick_runtime_data_stack, 1);
  get_parent_brick_runtime_data = () => get_last_nth(this.brick_runtime_data_stack, 2);
  step_into_procedure(procedure, inputs_result) {
    this.procedure_result = undefined;
    this.push_call_stack(this.self);
    this.param_stack.push(this.procedures[procedure].params.reduce(
      (m, i, index) => {
        m[i] = inputs_result[index];
        return m;
      },
      {},
    ));
    this.self = this.procedures[procedure];
    this.skip_on_end = true;
  }
  step_into_part(part_index) {
    this.push_call_stack(this.self);
    this.self = this.self.parts[part_index];
    this.skip_on_end = true;
  }
  step_into_parent() {
    this.self = this.pop_call_stack();
    this.skip_on_end = true;
  }
  step() {
    let just_wake_up = false;
    if (this.status === Status.PENDING) {
      if (this.valid_time > Date.now()) {
        return;
      } else {
        this.status = Status.IDLE;
        just_wake_up = true;
      }
    }
    try {
      if (just_wake_up) {
        this.on_end(undefined);
      }
      while (this.self) {
        this.do_step();
      }
      if (!this.call_stack.length && this.retriggerable) {
        this.reset();
      }
    } catch (e) {
      if (!Interpreter.SIGNAL[e.message]) {
        throw e;
      }
    }
  }
  get_params = () => get_last_nth(this.param_stack, 1);
  procedure_return(res) {
    while (!this.self.is_procedure_call) {
      this.step_into_parent();
    }
    this.procedure_result = res;
    this.skip_on_end = false;
  }
  reset() {
    this.call_stack = [];
    this.param_stack = [];
    this.local_variable_stack = [{}];
    this.status = Status.IDLE;
    this.self = this.root;
    this.brick_runtime_data_stack = [Interpreter.get_initial_runtime_data()];
  }
  break() {
    while (!this.self.breakable) {
      this.step_into_parent();
    }
    this.skip_on_end = false;
  }
  get_local_variable(name) {
    let r;
    for (let t = this.call_stack.length - 1; t >= 0; --t) {
      r = this.local_variable_stack[t + 1][name];
      if (r !== undefined) {
        return r;
      }
      if (this.call_stack[t].is_procedure_call) {
        return;
      }
    }
    return this.local_variable_stack[0][name];
  }
  declare_local_variable(name) {
    get_last_nth(this.local_variable_stack, 1)[name] = null;
  }
  set_local_variable(name, value) {
    let r;
    for (let t = this.call_stack.length - 1; t >= 0; --t) {
      r = this.local_variable_stack[t + 1][name];
      if (r !== undefined) {
        this.local_variable_stack[t + 1][name] = value;
        return true;
      }
      if (this.call_stack[t].is_procedure_call) {
        return false;
      }
    }
    if (this.local_variable_stack[0][name] !== undefined) {
      this.local_variable_stack[0][name] = value;
      return true;
    }
  }
  sleep(secs: number) {
    this.valid_time = Date.now() + secs * 1000;
    this.status = Status.PENDING;
    this.pause();
  }
}