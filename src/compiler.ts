import { AtomicBrickEnum, Brick as UIBrick } from 'froggy';

/*
atomic_text = 1,
atomic_boolean,
atomic_dropdown,
atomic_input_string,
atomic_input_number,
atomic_param,
atomic_button,
*/
export const clone = (brick: UIBrick) => {
  const is_container = (b) => b.type === 'container';
  const filter = (bricks) => bricks.filter(
    b => AtomicBrickEnum[b.type] as any !== AtomicBrickEnum.atomic_text &&
      AtomicBrickEnum[b.type] as any !== AtomicBrickEnum.atomic_button,
  );
  const do_clone = (b: UIBrick, prev: string, parent = undefined) => {
    const res = {
      id: b.id,
      type: b.type,
      root: b.root,
      output: b.output,
      parts: b.parts ? filter(b.parts).map(i => do_clone(i, undefined, b.id)) : [],
      inputs: b.inputs ? filter(b.inputs).map(i => do_clone(i, undefined, b.id)) : [],
      prev: b.output ? undefined : prev,
      parent,
      next: b.next ? do_clone(b.next, b.id) : undefined,
    };
    return res;
  };
  const root_brick = do_clone(brick, undefined);
  return root_brick;
};

export default (root_bricks: UIBrick[]) => {
  return root_bricks.map(i => clone(i));
};