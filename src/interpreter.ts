import { gen_id, AtomicBrickEnum, BrickId, BrickOutput } from 'froggy';
import { deep_clone, get_last_nth, set_last_nth } from './util';

enum Status {
  IDLE = 0,
  PENDING = 1,
}
export type Brick = {
  id: BrickId,
  type: string,
  is_atomic: boolean,
  root: BrickId,
  output: BrickOutput,
  parts: Brick[],
  inputs: Brick[],
  breakable: boolean,
  prev: BrickId,
  parent: BrickId,
  next: Brick,
  computed: any,

  params?: string[],
  procedure_name?: string,
  is_procedure_def?: boolean,
  is_procedure_call?: boolean,
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
  private skip_on_end = false;
  private brick_runtime_data_stack: BrickRuntimeData[] = [];
  private param_stack: {[name: string]: any}[] = [];

  procedure_result;
  root: Brick;
  self: Brick;
  stack: Brick[] = [];
  local_variable_stack: {[name: string]: any}[] = [];
  procedures: {[procedure_name: string]: Brick};
  fns = {};

  retriggerable = false;
  skip_inputs = false;

  constructor(fns, procedures, root_brick) {
    this.fns = fns;
    this.procedures = procedures;
    this.root = root_brick;
    this.push(this.root);
  }
  private push(b: Brick = this.self) {
    this.stack.push(b);
    this.brick_runtime_data_stack.push(Interpreter.get_initial_runtime_data());
  }
  private pop() {
    if (!this.stack.length && this.retriggerable) {
      this.reset();
    } else {
      if (this.self.is_procedure_def) {
        this.param_stack.pop();
      }
      this.brick_runtime_data_stack.pop();
      return this.stack.pop();
    }
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
      this.push(self);
      this.self = inputs[i];
      this.do_step();
    }
  }
  private on_end(result) {
    if (this.self.output) {
      const res = this.self.is_procedure_call ? this.procedure_result : result;
      this.self = this.stack.pop();
      this.brick_runtime_data_stack.pop();
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
        this.self = this.pop();
      }
    }
    this.self && this.do_step();
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
    this.push(this.self);
    this.param_stack.push(this.procedures[procedure].params.reduce(
      (m, i, index) => {
        m[i] = deep_clone(inputs_result[index]);
        return m;
      },
      {},
    ));
    this.self = this.procedures[procedure];
    this.skip_on_end = true;
  }
  step_into_part(part_index) {
    this.push(this.self);
    this.self = this.self.parts[part_index];
    this.skip_on_end = true;
  }
  step_into_parent() {
    this.self = this.pop();
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
    if (!this.self) {
      this.self = this.stack.pop();
    }
    try {
      if (just_wake_up) {
        this.on_end(undefined);
        while (this.self && this.self.output) {
          this.do_step();
        }
      } else {
        this.self && this.do_step();
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
    this.stack = [];
    this.param_stack = [];
    this.status = Status.IDLE;
    this.brick_runtime_data_stack = [];
    this.push(this.root);
  }
  break() {
    while (!this.self.breakable) {
      this.step_into_parent();
    }
    this.skip_on_end = false;
  }
  sleep(secs: number) {
    this.valid_time = Date.now() + secs * 1000;
    this.status = Status.PENDING;
    this.pause();
  }
}