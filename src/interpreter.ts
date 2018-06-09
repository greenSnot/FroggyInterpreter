import { BrickId, BrickOutput } from 'froggy';

enum Status {
  IDLE = 0,
  PENDING = 1,
}
export type Brick = {
  id: BrickId,
  type: string,
  root: BrickId,
  is_root: boolean,
  output: BrickOutput,
  parts: Brick[],
  inputs: Brick[],
  prev: BrickId,
  parent: BrickId,
  next: Brick,
  computed: any,
};

export class Interpreter {
  root: Brick;
  self: Brick;
  status = Status.IDLE;
  stack: Brick[] = [];
  value_stack: any[] = [];
  computed = {};
  fns = {};

  needs_skip = false;
  needs_abort = false;
  step_into_part = undefined;

  valid_time = 0;
  constructor(fns, computed, procedures, root_brick) {
    this.fns = fns;
    this.computed = computed;
    this.root = root_brick;
    this.stack.push(this.root);
    this.value_stack.push(undefined);
  }
  do_next() {
    if (this.needs_skip) {
      this.needs_skip = false;
      this.self = this.stack.pop();
      this.value_stack.pop();
    } else if (this.step_into_part >= 0) {
      this.stack.push(this.self);
      this.value_stack.push(undefined);
      this.self = this.self.parts[this.step_into_part];
      this.step_into_part = undefined;
    } else if (this.self.next) {
      this.self = this.self.next;
    } else if (this.self.output) {
      return;
    } else {
      this.self = this.stack.pop();
      this.value_stack.pop();
    }
    this.self && this.do_step();
  }
  do_step() {
    const inputs = this.self.inputs;
    const parts = this.self.parts;
    if (inputs.length) {
      this.stack.push(this.self);
      this.value_stack.push(undefined);
      for (const i in inputs) {
        this.self = inputs[i];
        this.do_step();
      }
      this.self = this.stack.pop();
      this.value_stack.pop();
    }
    // TODO
    this.computed[this.self.id] = this.self.computed || this.fns[this.self.type](this, inputs.map(i => this.computed[i.id]));
    this.do_next();
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
        this.do_next();
      } else {
        this.self && this.do_step();
      }
    } catch (e) {
      if (e.message === 'pause') {
        console.log('pause');
      }
    }
  }
  sleep(secs: number) {
    this.valid_time = Date.now() + secs * 1000;
    this.status = Status.PENDING;
    this.pause();
  }
  pause() {
    throw Error('pause');
  }
}