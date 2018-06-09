import { BrickId, BrickOutput } from 'froggy';

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
  root: Brick;
  self: Brick;
  status = Status.IDLE;
  stack: Brick[] = [];
  value_stack: any[] = [];
  computed = {};
  fns = {};

  retriggerable = false;
  valid_time = 0;
  procedures: {[procedure_name: string]: Brick};

  skip_next_and_parent = false;
  constructor(fns, computed, procedures, root_brick) {
    this.fns = fns;
    this.computed = computed;
    this.procedures = procedures;
    this.root = root_brick;
    this.stack.push(this.root);
    this.value_stack.push(undefined);
  }
  pop() {
    if (!this.stack.length && this.retriggerable) {
      this.reset();
    } else {
      this.value_stack.pop();
      return this.stack.pop();
    }
  }
  step_into_procedure(procedure) {
    // TODO
    this.stack.push(this.self);
    this.value_stack.push(undefined);
    this.self = this.procedures[procedure];
    this.skip_next_and_parent = true;
  }
  step_into_part(part_index) {
    this.stack.push(this.self);
    this.value_stack.push(undefined);
    this.self = this.self.parts[part_index];
    this.skip_next_and_parent = true;
  }
  step_into_parent() {
    this.self = this.pop();
    this.skip_next_and_parent = true;
  }
  on_end() {
    if (this.skip_next_and_parent) {
      this.skip_next_and_parent = false;
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
    const id = this.self.id;
    this.computed[id] = this.self.computed !== undefined ? this.self.computed : this.fns[this.self.type](this, inputs.map(i => this.computed[i.id]));
    this.on_end();
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
        console.log(e);
      }
    }
  }
  reset() {
    this.stack = [this.root];
    this.status = Status.IDLE;
    this.value_stack = [undefined];
  }
  break() {
    // TODO
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