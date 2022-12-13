# HTML_Console

About
----------
Small HTML based terminal like experiment....
An web app which behaves like an terminal, but runs inside the browser.
The current "backend" is an flask app written in python an just responds the status and "Hello World".
The console itself uses only DIV and SPAN elements.

Behaviour
-----------
  - [Enter] - send/end a command
  - [Arrow key left/right] - cursor movement
  - [Arrow key up/down - command history
  - [Pos1] - move cursor to first position in line
  - [Del] - move cursor to last position in line
  - [Shift] + [Arrow left/right] - used to select text in line
  - <code>cls</code> - clear screen

Missing/ Todos
-----------------
[CTRL+C] - is working 
[Crtl+V] - is not fully working.... (need to work around)
- Some sort of web token based security must be added. (Json web token / JWT)
- multi input handling
- internal shell commands do not work (change directory...)

Preconditions
--------------
- python
- flask

Running
---------
Open an command line and type <code>python flask-test.py</code> to run it.

Then open an browser and navigate to <code>127.0.0.1:5000</code>.
