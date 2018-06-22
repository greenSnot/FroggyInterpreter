export enum ListenerStatus {
  idle,
  running,
}

export type Listener = {
  status: ListenerStatus,
  fn: Function,
};

export type Events = {
  [event_name: string]: Listener[],
};
