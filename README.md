### TODO
local variables
test:
  if
    [true],[false], wait(0.1) in condition, wait(0.1) in child
  if_else
    [true],[false]
  if_else_if_else
    [true, true], [false, false], [true, false], [false, true]
  repeat_n_times
    [0], [1], [3], [100, break], wait(0.1) in condition, wait(0.1) in child
  repeat_while
    [x = 3; --x > 0], [true, break], wait(0.1) in condition, wait(0.1) in child
  procedure
    recursive
      fibonaaci(10), fibonaaci(5) + wait(0.1)
    params
      max(a, b, c)