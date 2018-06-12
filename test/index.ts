const fs = require('fs');
const path = require('path');
import { atomic_button_fns, atomic_dropdown_menu, bricks_fn, toolbox } from '../example/toolbox';

import { compile, Interpreter } from 'froggy-interpreter';

import * as runtime_mgr from '../example/runtime_mgr';

const test_name_to_result = {
  'test_condition_if': [1, 2, 3],
  'test_condition_repeat': [],
  'test_procedure_params': [],
  'test_procedure_recursion': [],
};
Object.keys(test_name_to_result).forEach(name => {
  const res = JSON.parse(fs.readFileSync(`${name}.json`, {encoding: 'utf-8'}));
});