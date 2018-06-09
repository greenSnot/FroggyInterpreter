import { Brick as UIBrick } from 'froggy';
import { Brick } from './interpreter';

/*
atomic_text = 1,
atomic_boolean,
atomic_dropdown,
atomic_input_string,
atomic_input_number,
atomic_param,
atomic_button,
*/
export const clean_up = (brick: UIBrick) => {
  const is_container = (b) => b.type === 'container';
  const needs_ignore = {
    atomic_button: true,
    atomic_text: true,
  };
  const do_clean_up = (b: UIBrick, prev: string, parent = undefined) => {
    if (needs_ignore[b.type]) {
      return undefined;
    }
    if (is_container(b)) {
      return do_clean_up(b.inputs[0], undefined, b.ui.parent);
    }
    const res = {
      id: b.id,
      type: b.type,
      root: b.root,
      output: b.output,
      parts: b.parts ? b.parts.map(i => do_clean_up(i, undefined, b.id)).filter(i => i) : [],
      inputs: b.inputs ? b.inputs.map(i => do_clean_up(i, undefined, b.id)).filter(i => i) : [],
      prev: b.output ? undefined : prev,
      parent,
      next: b.next ? do_clean_up(b.next, b.id) : undefined,
      computed: b.ui && b.ui.value,
    } as Brick;
    return res;
  };
  const root_brick = do_clean_up(brick, undefined);
  return root_brick;
};

export default (root_bricks: UIBrick[]) => {
  const is_procedure_def = (b) => b.type === 'procedure_def';
  const roots = root_bricks.filter(i => i.ui.show_hat).map(i => clean_up(i));
  return {
    procedures: roots.filter(i => is_procedure_def(i)),
    root_bricks: roots.filter(i => !is_procedure_def(i)),
  };
};