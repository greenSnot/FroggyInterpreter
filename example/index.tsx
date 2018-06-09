import React from 'react';
import ReactDOM from 'react-dom';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import { Brick, Workspace } from 'froggy';
import { compile, Interpreter } from 'froggy-interpreter';

import { atomic_button_fns, atomic_dropdown_menu, bricks_fn, toolbox } from './toolbox';

import * as runtime_mgr from './runtime_mgr';

import './styles/index.less';

const storage_key = 'root_bricks';
const save = (bricks: Brick[]) => {
  localStorage.setItem(storage_key, JSON.stringify(bricks));
};
const load = () => JSON.parse(localStorage.getItem(storage_key) || '[]');
const root_bricks = load();
console.log(toolbox);
console.log(root_bricks);
ReactDOM.render(
  <Workspace
    id="a"
    root_bricks={root_bricks}
    atomic_button_fns={atomic_button_fns}
    atomic_dropdown_menu={atomic_dropdown_menu}
    toolbox={toolbox}
    workspace_on_change={(bricks: Brick[]) => save(bricks)}
  />,
  document.getElementById('main'));

const compiled_bricks = compile(root_bricks);
console.log(compiled_bricks);

runtime_mgr.init(bricks_fn, compiled_bricks.procedures, compiled_bricks.root_bricks);
runtime_mgr.start();