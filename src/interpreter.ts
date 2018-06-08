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
  computed = {};
  fns = {};

  needs_skip = false;
  needs_abort = false;
  step_into_part = undefined;
  constructor(fns, computed, procedures, root_brick) {
    this.fns = fns;
    this.computed = computed;
    this.root = root_brick;
    this.stack.push(this.root);
  }
  doStep() {
    const inputs = this.self.inputs;
    const parts = this.self.parts;
    if (inputs.length) {
      this.stack.push(this.self);
      for (const i in inputs) {
        this.self = inputs[i];
        this.doStep();
      }
      this.self = this.stack.pop();
    }
    this.computed[this.self.id] = this.self.computed || this.fns[this.self.type](this, inputs.map(i => this.computed[i.id]));

    if (this.needs_skip) {
      this.needs_skip = false;
      this.self = this.stack.pop();
    } else if (this.self.next) {
      this.self = this.self.next;
    } else if (this.step_into_part >= 0) {
      this.stack.push(this.self);
      this.self = this.self.parts[this.step_into_part];
      this.step_into_part = undefined;
    } else if (this.self.output) {
      return;
    } else {
      this.self = this.stack.pop();
    }
    this.self && this.doStep();
  }
  step() {
    this.self = this.stack.pop();
    this.self && this.doStep();
  }
}