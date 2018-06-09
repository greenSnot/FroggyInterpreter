import { BrickId, BrickOutput } from 'froggy';
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
  prev: BrickId,
  parent: BrickId,
  next: Brick,
  computed: any,

  params?: string[],
  procedure_name?: string,
};

export class Interpreter {
  private valid_time = 0;
  private status = Status.IDLE;
  private skip_on_end = false;
  private info_stack: any[] = [];

  root: Brick;
  self: Brick;
  stack: Brick[] = [];
  local_variable_stack: {[name: string]: any}[] = [];
  param_stack: {[name: string]: any}[] = [];
  computed = {};
  procedures: {[procedure_name: string]: Brick};
  fns = {};

  retriggerable = false;

  constructor(fns, computed, procedures, root_brick) {
    this.fns = fns;
    this.computed = computed;
    this.procedures = procedures;
    this.root = root_brick;
    this.stack.push(this.root);
    this.info_stack.push(undefined);
  }
  private pop() {
    if (!this.stack.length && this.retriggerable) {
      this.reset();
    } else {
      this.info_stack.pop();
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
    throw Error('pause');
  }
  private do_step() {
    const inputs = this.self.inputs;
    const parts = this.self.parts;
    if (inputs.length) {
      this.stack.push(this.self);
      this.info_stack.push(undefined);
      for (const i in inputs) {
        this.self = inputs[i];
        this.do_step();
      }
      this.self = this.stack.pop();
      this.info_stack.pop();
    }
    // TODO
    const id = this.self.id;
    this.computed[id] = (
      this.self.computed !== undefined ?
      this.self.computed :
      this.fns[this.self.type](this, inputs.map(i => this.computed[i.id]))
    );
    this.on_end();
  }
  set_stack_info(v) {
    this.info_stack[this.info_stack.length - 1] = v;
  }
  set_parent_stack_info(v) {
    this.info_stack[this.info_stack.length - 2] = v;
  }
  get_stack_info() {
    return this.info_stack[this.info_stack.length - 1];
  }
  get_parent_stack_info() {
    return this.info_stack[this.info_stack.length - 2];
  }
  step_into_procedure(procedure) {
    this.stack.push(this.self);
    this.info_stack.push(undefined);
    this.param_stack.push(this.procedures[procedure].params.reduce(
      (m, i, index) => {
        m[i] = deep_clone(this.computed[this.self.inputs[index].id]);
        return m;
      },
      {},
    ));
    this.self = this.procedures[procedure];
    this.skip_on_end = true;
  }
  step_into_part(part_index) {
    this.stack.push(this.self);
    this.info_stack.push(undefined);
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
      if (e.message !== 'pause') {
        throw e;
      }
    }
  }
  reset() {
    this.stack = [this.root];
    this.param_stack = [];
    this.status = Status.IDLE;
    this.info_stack = [undefined];
  }
  break() {
    // TODO
  }
  sleep(secs: number) {
    this.valid_time = Date.now() + secs * 1000;
    this.status = Status.PENDING;
    this.pause();
  }
}