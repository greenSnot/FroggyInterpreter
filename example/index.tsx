import React from 'react';
import ReactDOM from 'react-dom';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import { Brick, Workspace } from 'froggy';
import { compile, Interpreter } from 'froggy-interpreter';

import { atomic_button_fns, atomic_dropdown_menu, bricks_fn, toolbox } from './toolbox';

import * as runtime_mgr from './runtime_mgr';

import './styles/index.less';
import { btnRun, btnStop, demoSelect } from './styles/index.less';

const storage_key = 'root_bricks';
const save_to_localstorage = (bricks: Brick[]) => {
  localStorage.setItem(storage_key, JSON.stringify(bricks));
};
const localstorage_root_bricks = JSON.parse(localStorage.getItem(storage_key) || '[]');
console.log(toolbox);

type Props = {
  root_bricks: any,
  atomic_button_fns: any,
  atomic_dropdown_menu: any,
  toolbox: any,
};
type State = Props & {
  running: boolean,
  workspace_version: number,
};
class Demo extends React.Component<Props, State> {
  state = {} as State;
  constructor(p) {
    super(p);
    this.state.root_bricks = p.root_bricks;
    this.state.atomic_button_fns = p.atomic_button_fns;
    this.state.atomic_dropdown_menu = p.atomic_dropdown_menu;
    this.state.toolbox = p.toolbox;
    this.state.workspace_version = 0;
  }
  render() {
    return (<React.Fragment>
      <Workspace
        id="test"
        key={this.state.workspace_version}
        root_bricks={this.state.root_bricks}
        atomic_button_fns={this.state.atomic_button_fns}
        atomic_dropdown_menu={this.state.atomic_dropdown_menu}
        toolbox={this.state.toolbox}
        workspace_on_change={(bricks: Brick[]) => save_to_localstorage(bricks)}
      />
      <div
        className={this.state.running ? btnStop : btnRun}
        onClick={() => {
          const running = !this.state.running;
          if (running) {
            const compiled_bricks = compile(this.state.root_bricks);
            console.log(compiled_bricks);

            runtime_mgr.init(bricks_fn, compiled_bricks.procedures, compiled_bricks.root_bricks);
            runtime_mgr.start();
          } else {
            runtime_mgr.stop();
          }
          this.setState({ running });
        }}
      />
      <select
        className={demoSelect}
        onChange={(e) => {
          const name = e.target.value;
          import(`../test/${name}.json`).then(res => {
            console.log(res);
            this.setState({ root_bricks: res.default, workspace_version: this.state.workspace_version + 1 });
          });
        }}
      >
        {[
          '----load demo----',
          'test_condition_if',
          'test_condition_repeat',
          'test_procedure_params',
          'test_procedure_recursive',
        ].map(i => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
    </React.Fragment>);
  }
}

ReactDOM.render(
  <Demo
    root_bricks={localstorage_root_bricks}
    atomic_button_fns={atomic_button_fns}
    atomic_dropdown_menu={atomic_dropdown_menu}
    toolbox={toolbox}
  />,
  document.getElementById('main'),
);