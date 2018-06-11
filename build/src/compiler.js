import { AtomicBrickEnum } from 'froggy';
const is_procedure_def = (b) => b.type === 'procedure_def';
export const clean_up = (brick) => {
    const is_container = (b) => b.type === 'container';
    const is_procedure_call = (b) => b.type === 'procedure' || b.type === 'procedure_with_output';
    const is_repeat = (b) => b.type === 'control_repeat_n_times' || b.type === 'control_repeat_while';
    const is_atmoic = (b) => AtomicBrickEnum[b.type] && AtomicBrickEnum[b.type] !== AtomicBrickEnum.atomic_param;
    const needs_ignore = (b) => AtomicBrickEnum[b.type] === AtomicBrickEnum.atomic_button || AtomicBrickEnum[b.type] === AtomicBrickEnum.atomic_text;
    const do_clean_up = (b, prev, parent = undefined) => {
        if (needs_ignore(b)) {
            return undefined;
        }
        if (is_container(b)) {
            return do_clean_up(b.inputs[0], undefined, b.ui.parent);
        }
        const res = {
            id: b.id,
            breakable: is_repeat(b),
            is_atomic: is_atmoic(b),
            type: b.type,
            output: b.output,
            parts: b.parts ? b.parts.map(i => do_clean_up(i, undefined, b.id)).filter(i => i) : [],
            inputs: b.inputs ? b.inputs.map(i => do_clean_up(i, undefined, b.id)).filter(i => i) : [],
            next: b.next ? do_clean_up(b.next, b.id) : undefined,
            computed: b.ui && b.ui.value,
            is_procedure_call: is_procedure_call(b),
            is_procedure_def: is_procedure_def(b),
        };
        if (is_procedure_call(b)) {
            res.procedure_name = b.inputs[0].ui.value;
        }
        return res;
    };
    const root_brick = do_clean_up(brick, undefined);
    return root_brick;
};
export default (root_bricks) => {
    const is_param = (b) => b.type === 'atomic_param';
    const roots = root_bricks.filter(i => i.ui.show_hat).map(i => clean_up(i));
    return {
        procedures: roots.filter(i => is_procedure_def(i)).map(i => {
            i.procedure_name = i.inputs[0].computed;
            i.params = i.inputs.filter(j => is_param(j)).map(j => j.computed);
            return i;
        }).reduce((m, j) => {
            m[j.procedure_name] = j;
            return m;
        }, {}),
        root_bricks: roots.filter(i => !is_procedure_def(i)),
    };
};
