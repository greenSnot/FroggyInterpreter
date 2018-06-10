import { gen_id, AtomicBrickEnum, BrickId, BrickOutput } from 'froggy';
import { deep_clone } from './util';

enum Status {
  IDLE = 0,
  PENDING = 1,
}
export type Brick = {
  id: BrickId,
  type: string,
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
  is_procedure_def?: string,
  is_procedure_call?: string,
};

export class Interpreter {
  static SIGNAL = {
    pause: 'pause',
  };
  static BRICK_STATUS = {
    first_evaluation: {},
    done_evaluation: {},
  };
  private valid_time = 0;
  private status = Status.IDLE;
  private skip_on_end = false;
  private brick_status_stack: any[] = [];
  private param_stack: {[name: string]: any}[] = [];
  private computed = [];

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
    this.stack.push(this.root);
    this.brick_status_stack.push(Interpreter.BRICK_STATUS.first_evaluation);
  }
  private pop() {
    if (!this.stack.length && this.retriggerable) {
      this.reset();
    } else {
      if (this.self.is_procedure_def) {
        this.param_stack.pop();
      }
      this.brick_status_stack.pop();
      return this.stack.pop();
    }
  }
  private on_end() {
    if (this.skip_on_end) {
      this.skip_on_end = false;
    } else {
      if (this.self.output) {
        return;
      }
      if (this.self.next) {
        this.self = this.self.next;
      } else {
        this.self = this.pop();
      }
    }
    this.self && this.do_step();
  }
  private pause() {
    throw Error(Interpreter.SIGNAL.pause);
  }
  private do_step() {
    const inputs = this.self.inputs;
    if (inputs.length) {
      if (this.skip_inputs) {
        this.skip_inputs = false;
      } else {
        if (!this.self.output) {
          this.computed = [];
        }
        this.stack.push(this.self);
        this.brick_status_stack.push(Interpreter.BRICK_STATUS.first_evaluation);
        for (const i in inputs) {
          this.self = inputs[i];
          this.do_step();
        }
        this.self = this.stack.pop();
        this.brick_status_stack.pop();
      }
    }
    const value = (
      AtomicBrickEnum[this.self.type] ?
      this.self.computed :
      this.fns[this.self.type](this, this.computed)
    );
    if (this.self.output) {
      this.computed.push(value);
    }
    this.on_end();
  }
  set_brick_status = (v) => this.brick_status_stack[this.brick_status_stack.length - 1] = v;
  set_parent_brick_status = (v) => this.brick_status_stack[this.brick_status_stack.length - 2] = v;
  get_brick_status = () => this.brick_status_stack[this.brick_status_stack.length - 1];
  get_parent_brick_status = () => this.brick_status_stack[this.brick_status_stack.length - 2];
  step_into_procedure(procedure) {
    this.stack.push(this.self);
    this.brick_status_stack.push(Interpreter.BRICK_STATUS.first_evaluation);
    this.param_stack.push(this.procedures[procedure].params.reduce(
      (m, i, index) => {
        m[i] = deep_clone(this.computed[index]);
        return m;
      },
      {},
    ));
    this.self = this.procedures[procedure];
    this.skip_on_end = true;
  }
  step_into_part(part_index) {
    this.stack.push(this.self);
    this.brick_status_stack.push(Interpreter.BRICK_STATUS.first_evaluation);
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
        this.on_end();
      } else {
        this.self && this.do_step();
      }
    } catch (e) {
      if (!Interpreter.SIGNAL[e.message]) {
        throw e;
      }
    }
  }
  get_params = () => this.param_stack[this.param_stack.length - 1];
  reset() {
    this.stack = [this.root];
    this.param_stack = [];
    this.status = Status.IDLE;
    this.brick_status_stack = [Interpreter.BRICK_STATUS.first_evaluation];
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