"use strict";

const VERSION_MAJOR = '0';
const VERSION_MINOR = '0';
const VERSION_MICRO = '2';
const VERSION = String(VERSION_MAJOR + "." + VERSION_MINOR + "." + VERSION_MICRO);

const CURSOR_START = "<span class=\"cursor\">";
const CURSOR_END = "</span>";

const FPS = 1000/30; // frames per second, update rate


class MyConsole extends Object
{
	constructor(_element = window)
	{
		super();

		this.counter = 0; // number of keys pressed
		this.cursorPosition = 0; // line position of the cursor
		this.lineLength = 0; // current length of line in pixel
		this.textNode = document.getElementById("text");
		this.cursorNode = document.getElementById("cursor");
		this.consoleBuffer = String(""); // content of the input line
		this.setIntervalId = 0;
		this.lastTimeStamp = performance.now();
		this.updateReqFlag = false; // is an update required?

		
		//this._init(_element); // set up the key handler and event loop

		console.log("Console Version: " + VERSION);


		//Cursor-Node nur einmal erzeugen
		this.curNode = document.createElement("span");
		this.curNode.setAttribute("class", "cursor");
		this.curNode.setAttribute("id", "cursor");
	}


	//
	// Hooks up the console object to an element of choice.
	//
	// Parameter: the target element (DOM)
	//
	init(_element = window)
	{
		if(typeof(_element) != undefined)
		{
			// Register input handler
			const self = this; // needed to keep the reference of this to our console class object
			_element.addEventListener("keydown", function(_e){ return self.handleInput(_e); } );

			// Register update function --TODO--
			this.setIntervalId = setInterval(this.eventLoop.bind(this), FPS);
		}
	}


	//
	//	Event loop handler, all update goes here...
	//
	eventLoop()
	{
		let timeStamp = performance.now();
		let t = timeStamp - this.lastTimeStamp;

		// only update if needed
		if(t > FPS && this.updateReqFlag === true)
		{
			console.log("Eventloop...");
			console.log("TextNode: " + this.textNode);
			console.log("Console Buffer: " + this.consoleBuffer);
			console.log("Cursor Position: " + this.cursorPosition);
			this.updateCursorLine(this.textNode, this.consoleBuffer, this.cursorPosition);
		}

		this.lastTimeStamp = timeStamp;		
	}


	//
	// Updates the cursor position and input line.
	//
	// Parameter:
	//				_textNode		-> The Node to insert the text (object)
	//				_buffer			-> The console buffer as string. (String)
	//				_cursorPosition	-> The current position of the cursor. (current row, Int)
	//
	updateCursorLine(_textNode, _buffer, _cursorPosition)
	{
		const lenBuf = _buffer.length;
		//console.log("Länge des Buffer: " + lenBuf);
		const offsetEnd = lenBuf - _cursorPosition;
		//console.log("Offset: " + offsetEnd);

		switch(offsetEnd)
		{
			case 0:
				{
					//Cursor is at the end
					//this.textNode.innerHTML = _buffer + CURSOR_START + CURSOR_END;
					this.textNode.innerHTML = _buffer;
					this.textNode.appendChild(this.curNode);
					//this.curNode.innerHTML = "";
					break;
				}
			default:
				{
					// Cursor is somewhere in between the text
					const beforeCur = _buffer.slice(0, _cursorPosition);
					const coveredChar = _buffer.slice(_cursorPosition, _cursorPosition+1);
					const afterCur = _buffer.slice(_cursorPosition+1, lenBuf);
					console.log("Vor Cursor: " + beforeCur);
					console.log("Nach Cursor: " + afterCur);
					//this.textNode.innerHTML = beforeCur + CURSOR_START + CURSOR_END + afterCur;
					//this.textNode.innerHTML = beforeCur + CURSOR_START + coveredChar + CURSOR_END + afterCur;
					this.textNode.innerHTML = beforeCur;
					this.textNode.appendChild(this.curNode);
					this.curNode.innerHTML = coveredChar;
					this.curNode.insertAdjacentHTML('afterend', afterCur);
					//console.log("Cursor line nach verschieben: " + this.textNode.innerHTML);
				}
		}

		this.updateReqFlag = false;
		return this.textNode.innerHTML;
	}


	//
	// Update Buffer, preserving the current buffer content!
	//
	// Parameter:
	//				_chars			-> new content for the buffer (String)
	//				_cursorPosition	-> current cursor position (int)
	//
	updateBuffer(_chars, _cursorPosition)
	{
		if(_chars.length > 0)
		{
			// New char inserted before the current cursor position.
			let beforeCur = this.consoleBuffer.slice(0, _cursorPosition);
			let afterCur = this.consoleBuffer.slice(_cursorPosition, this.consoleBuffer.length);
			this.consoleBuffer = beforeCur + _chars + afterCur;
			this.cursorPosition += _chars.length;
		}

		this.updateReqFlag = true;
		return this.consoleBuffer;
	}
	
	//
	// Input Handler
	//
	handleInput(e)
	{
		//let self = this;

		e.preventDefault();

		switch(e.type)
		{
			case 'keydown':
			case 'keypressed':
			{
				e.stopPropagation();

				console.log(e);
				console.log("Länge: " + e.key.length);

				switch(e.keyCode)
				{
					case 13: // Return / Enter
					{	
						this._handleEnter(e, this.textNode); 
						break;
					}
							
					case 8: // Backspace
					{	
						this._handleBackspace(e, this.textNode);
						break;
					}

					case 37: // Arrow Left
					case 38: // Arrow Up
					case 39: // Arrow Right
					case 40: // Arrow Down
					{
						this._handleArrowKeys(e, this.textNode);
						break;
					}
				
					default:
					{
						switch(e.key.length)
						{
							case 1: // no special keys, every printable keys length equals to 1 is accepted (stupid, but working)
							{ 
								this._handleChars(e, this.textNode);
								break;
							}
						
							default:
							{	return; } // leave handler function, important!!							}
						}
					}	
						
					// Key counter
					this.counter +=1;
					console.log(this.counter);
						
					// Real buffer length, because key value might be some like "Enter" or "Backspace"
					//const i = window.getComputedStyle(this.textNode);
					//this.lineLength = (parseInt(i.getPropertyValue("font-size")) * (String(this.textNode.innerHTML).length));
						
					// Debug
					//console.log("Length in PX: " + this.lineLength);
					//console.log((String(this.textNode.innerHTML)));
					console.log("Cursor position: " + this.cursorPosition);
					
					break;
				}// switch keycode
			}

			default: // No key pressed...
			{ break; }
		}
	}// end handle input


	//
	// Handle normal chars without special meaning.
	// 
	_handleChars(_e, _textNode)
	{
		//_textNode.innerHTML += _e.key;				
					
		console.log(String.fromCharCode(_e.keyCode));
		let t = this.updateBuffer(_e.key, this.cursorPosition);
		console.log("Updated buffer: " + t);
	}


	//
	// Clears the console line and buffer and reset cursor position to 0.
	//
	_clearConsoleLineBuffer()
	{
		this.curNode.innerHTML = "";
		this.consoleBuffer = String("");
		this.cursorPosition = 0;
		// direct update the prevent ghost images
		this.updateCursorLine(this.textNode, this.consoleBuffer, this.cursorPosition);
	}


	//
	// Delete chars in front of the current cursor position.
	//
	// Parameter: _numChars - Number of chars to be removed.
	//
	_removeCharsBeforeCursor(_numChars)
	{
		// Delete char before the current cursor position.
		let lenCharsAvailable = (this.cursorPosition - 1) - _numchars;

		if(lenCharsAvailable >= 0)
		{	
			// remove the chars before the cursor first, save the remaining
			let beforeCur = this.consoleBuffer.slice(0, (this.cursorPosition - _numChars));
			// get the chars after the cursor
			let afterCur = this.consoleBuffer.slice(_cursorPosition, this.consoleBuffer.length);
			// update the buffer
			this.consoleBuffer = beforeCur + afterCur;
			// adjust the cursor position
			this.cursorPosition = this.cursorPosition - _numChars;

			// Update
			this.updateReqFlag = true;
			return this.consoleBuffer;
		}
	}

	

	//
	// Handle the "Enter" key.
	//
	_handleEnter(_e, _textNode)
	{
		let beforeCur = _textNode.innerHTML.slice(0, this.cursorPosition);
		console.log("Zeile vor Enter: " + beforeCur);
		

		// Set up new line content
		let line = document.createElement("DIV");
		line.innerHTML = beforeCur;
		// Insert new line before the input line.
		document.getElementById("console").insertBefore(line, _textNode);
	
		//Clear the input line buffer
		this._clearConsoleLineBuffer();

		console.log(String.fromCharCode(_e.keyCode));
	}
	

	//
	// Handles Backspace to delete the previous entered char. TODO: Anpassen auf neue Version!!!!
	//
	_handleBackspace(_e, _textNode)
	{
		if(_textNode.innerHTML != null && _textNode.innerHTML.length > 0)
		{
			//let b = String(_textNode.innerHTML);
			//_textNode.innerHTML = b.slice(0, b.length-1);
			let temp =  this.consoleBuffer.slice(0, (this.consoleBuffer.length-1))
			this.cursorPosition -= 1;
			this.updateBuffer(temp, this.cursorPosition);

			this.updateReqFlag = true;

			console.log("Textzeile nach Backspace: " + this.consoleBuffer);
		}
			
		console.log("Backspace Key Code: " + String.fromCharCode(_e.keyCode));
	}


	//
	// Move cursor, history etc...not finished
	//
	_handleArrowKeys(_e, _textNode)
	{	
		switch(_e.keyCode)
		{
			case 37: // Left arrow key
			{
				// Handle left arrow key, should move the cursor to the left
				if(_textNode.innerHTML != null && this.cursorPosition > 0)
				{
					console.log(this.cursorPosition);
					this.cursorPosition -= 1;
					this.updateReqFlag = true;
				}
				break;
			}
		} 
	}
			
	
	
}// end class