const fs = require('fs');
const path = require('path');
import * as s from '../example/toolbox';
console.log(s.atomic_button_fns);
const test_name_to_result = {
  'test_condition_if': [1, 2, 3],
  'test_condition_repeat': [],
  'test_procedure_params': [],
  'test_procedure_recursion': [],
};
Object.keys(test_name_to_result).forEach(name => {
  const res = JSON.parse(fs.readFileSync(`${__dirname}/${name}.json`, {encoding: 'utf-8'}));
});