let compiler_opt;
export const clean_up = (brick) => {
    const do_clean_up = (b, prev, parent = undefined) => {
        if (compiler_opt.needs_ignore(b)) {
            return undefined;
        }
        if (compiler_opt.is_container(b)) {
            return do_clean_up(b.inputs[0], undefined, b.ui.parent);
        }
        const res = {
            id: b.id,
            breakable: compiler_opt.is_repeat(b),
            is_atomic: compiler_opt.is_atmoic(b),
            type: b.type,
            output: b.output,
            parts: b.parts ? b.parts.map(i => do_clean_up(i, undefined, b.id)).filter(i => i) : [],
            inputs: b.inputs ? b.inputs.map(i => do_clean_up(i, undefined, b.id)).filter(i => i) : [],
            next: b.next ? do_clean_up(b.next, b.id) : undefined,
            computed: b.ui && b.ui.value,
            is_procedure_call: compiler_opt.is_procedure_call(b),
            is_procedure_def: compiler_opt.is_procedure_def(b),
        };
        if (compiler_opt.is_procedure_call(b)) {
            res.procedure_name = b.inputs[0].ui.value;
        }
        return res;
    };
    const root_brick = do_clean_up(brick, undefined);
    return root_brick;
};
export default (root_bricks, opt = {
    is_procedure_def: (b) => b.type === 'procedure_def',
    is_atmoic: (b) => (b.type === 'atomic_boolean' ||
        b.type === 'atomic_dropdown' ||
        b.type === 'atomic_input_string' ||
        b.type === 'atomic_input_number'),
    needs_ignore: (b) => (b.type === 'atomic_button' ||
        b.type === 'atomic_text'),
    is_param: (b) => b.type === 'atomic_param',
    is_container: (b) => b.type === 'container',
    is_procedure_call: (b) => b.type === 'procedure' || b.type === 'procedure_with_output',
    is_repeat: (b) => b.type === 'control_repeat_n_times' || b.type === 'control_repeat_while',
}) => {
    compiler_opt = opt;
    const roots = root_bricks.filter(i => i.ui.show_hat).map(i => clean_up(i));
    return {
        procedures: roots.filter(i => opt.is_procedure_def(i)).map(i => {
            i.procedure_name = i.inputs[0].computed;
            i.params = i.inputs.filter(j => opt.is_param(j)).map(j => j.computed);
            return i;
        }).reduce((m, j) => {
            m[j.procedure_name] = j;
            return m;
        }, {}),
        root_bricks: roots.filter(i => !opt.is_procedure_def(i)),
    };
};
