const fs = require('fs');
const events = require('events');
const path = require('path');
import { toolbox, type_to_code } from '../example/toolbox';

import { compile, Interpreter } from 'froggy-interpreter';

import * as runtime_mgr from '../example/runtime_mgr';
import { symlinkSync } from 'fs';

const event_emitter = new events.EventEmitter();

const test_name_to_result = {
  test_condition_if: [1, 4, 5, 7, 10, 13, 15, 17],
  test_condition_repeat: [2, 3, 3, 3, 4, 4, 4, 5, 6, 8],
  test_procedure_params: [3, 3, 3, 3, 3, 3, 30],
  test_procedure_recursion: [125250, 15],
  test_procedure_recursion_perf: [1],
  test_data_variables: [1, 'string', 1, 3, 1, 'string', 1, 3, undefined],
};

let outputs = [];
global['document'] = {
  addEventListener: () => {},
  removeEventListener: () => {},
};

let done_flag = false;
global['Event'] = class Event {name; constructor(name) { this.name = name; }};
global['dispatchEvent'] = (e) => {
  if (e.name !== 'finished') {
    outputs.push(e.data);
  } else {
    done_flag = true;
  }
  event_emitter.emit(e.name);
};
global['requestAnimationFrame'] = (f) => setTimeout(f, 1);
global['cancelAnimationFrame'] = () => {};

const run_test = async () => {
  const tests = Object.keys(test_name_to_result);
  for (let index = 0; index < tests.length; ++index) {
    const name = tests[index];
    console.log(name);
    outputs = [];
    const res = JSON.parse(fs.readFileSync(`${name}.json`, {encoding: 'utf-8'}));
    const global_variables = {
      $runtime_mgr: runtime_mgr,
    };
    const compiled_bricks = compile(res, {
      global_variables,
      type_to_code,
    });

    console.time(name);
    done_flag = false;
    runtime_mgr.start(global_variables);
    if (!done_flag) {
      await new Promise((resolve) => {
        event_emitter.once('finished', () => {
          console.timeEnd(name);
          resolve();
        });
      });
    } else {
      console.timeEnd(name);
    }
    for (let i = 0; i < outputs.length; ++i) {
      if (outputs[i] !== test_name_to_result[name][i]) {
        if (outputs[i] === undefined && test_name_to_result[name][i] === undefined) {
        } else {
          console.log(outputs);
          throw Error(`fail: ${name}`);
        }
      }
    }
  }
  process.exit(0);
};

run_test();