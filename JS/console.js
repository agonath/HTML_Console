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


		console.log("Console Version: " + VERSION);


		//Cursor-Node nur einmal erzeugen
		this.curNode = document.createElement("span");
		this.curNode.setAttribute("class", "cursor");
		this.curNode.setAttribute("id", "cursor");


		//Test-Object
		this.handlerArray = new Array(256);
		
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

			// Register update function
			this.setIntervalId = setInterval(this.eventLoop.bind(this), FPS);
			
			//Refresh buffer and make cursor visible
			this._clearConsoleLineBuffer();

			// Test for new input handler
			/*for(let i=0; i<256; i++)
			{
				this.handlerArray[i] = (_e, _textNode) => { return this._handleChars(_e, _textNode);}; // default, handle every input as normal char
			}
			// Set function pointers, for special keys
			this.handlerArray[8] = (_e, _textNode) => { return this._handleBackspace(_e, _textNode);}; // Backspace key is pressed
			this.handlerArray[13] = (_e, _textNode) => { return this._handleEnter(_e, _textNode);}; // if Return/Enter key is pressed
			this.handlerArray[37] = (_e, _textNode) => { return this._handleArrowKeys(_e, _textNode);}; // arrow key is pressed
			this.handlerArray[38] = (_e, _textNode) => { return this._handleArrowKeys(_e, _textNode);};
			this.handlerArray[39] = (_e, _textNode) => { return this._handleArrowKeys(_e, _textNode);};
			this.handlerArray[40] = (_e, _textNode) => { return this._handleArrowKeys(_e, _textNode);};
			this.handlerArray[46] = (_e, _textNode) => { return this._handleDeleteKey(_e, _textNode);}; // delete key is pressed

			// ---|Debug|---
			for(let i=0; i<256; i++)
			{
				console.log("Element " + i + " Wert: " + this.handlerArray[i]);
			}
			*/
			
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
					this.curNode.innerHTML = "&nbsp"; // --> Space else Cursor would not be visible at the end of line
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
			// New char inserted before current cursor position.
			let beforeCur = this.consoleBuffer.slice(0, _cursorPosition);
			let afterCur = this.consoleBuffer.slice(_cursorPosition, this.consoleBuffer.length);
			this.consoleBuffer = beforeCur + _chars + afterCur;
			this.cursorPosition += _chars.length;
		}

		this.updateReqFlag = true;
		return this.consoleBuffer;
	}


	//
	// Delete chars in Buffer at current cursor position.
	//
	// Parameter:	_numChars - Number of chars to be removed.
	//				_position - before or after cursor position (true=after | false=before (default))
	//
	_removeCharsFromBuffer(_numChars=1, _position=false)
	{
		switch(_position)
		{
			case true:
			{
				if((this.cursorPosition + _numChars) <= this.consoleBuffer.length)
				{
					// preserve the chars before current cursor position.
					let beforeCur = this.consoleBuffer.slice(0, this.cursorPosition);
					// remove the chars directly after current cursor position 
					let afterCur = this.consoleBuffer.slice((this.cursorPosition + _numChars), this.consoleBuffer.length);

					this.consoleBuffer = beforeCur + afterCur;
				}
				break;
			}
			
			case false:
			{
				if((this.cursorPosition - _numChars) >= 0 )
				{
					// remove the chars before current cursor position.
					let beforeCur = this.consoleBuffer.slice(0, (this.cursorPosition - _numChars));
					//preserve the chars after current cursor position 
					let afterCur = this.consoleBuffer.slice(this.cursorPosition, this.consoleBuffer.length);

					this.consoleBuffer = beforeCur + afterCur;
					this.cursorPosition -= _numChars;
				}
				break;
			}
		}
		return this.consoleBuffer;
	}

	
	//
	// Input Handler
	//
	handleInput(e)
	{
		e.preventDefault();

		switch(e.type)
		{
			case 'keydown':
			case 'keypressed':
			{
				e.stopPropagation();
				
				//---|Debug|---
				//console.log(e);
				//console.log("Länge: " + e.key.length);

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
					{
						this._handleLeftArrowKey(e, this.textNode);
						break;
					}

					case 38: // Arrow Up
					{
						_handleArrowKeysDummy(e, this.textNode);
						break;
					}
					
					case 39: // Arrow Right
					{
						this._handleRightArrowKey(e, this.textNode);
						break;
					}

					case 40: // Arrow Down
					{
						this._handleArrowKeysDummy(e, this.textNode);
						break;
					}

					case 46: // Delete key
					{
						this._handleDeleteKey(e, this.textNode);
						break;
					}
				
					default:
					{
						this._handleChars(e, this.textNode);
						break;
					}	
						
					//---|Debug|--- - Key counter
					//this.counter +=1;
					//console.log(this.counter);
					
					//OLD Stuff
					// Real buffer length, because key value might be some like "Enter" or "Backspace"
					//const i = window.getComputedStyle(this.textNode);
					//this.lineLength = (parseInt(i.getPropertyValue("font-size")) * (String(this.textNode.innerHTML).length));
						
					//---|Debug|---
					//console.log("Length in PX: " + this.lineLength);
					//console.log((String(this.textNode.innerHTML)));
					//---|Debug|---
					//console.log("Cursor position: " + this.cursorPosition);
				}// switch keycode
			}

			default: // No key pressed...
			{ break; }
		}
	}// end handle input


	//
	// New Input Handler - Test --> Slower than the "old" Version. Array look up semms to be slower than switch/case statement.
	//
	handleInput2(e)
	{
		e.preventDefault();

		switch(e.type)
		{
			case 'keydown':
			case 'keypressed':
			{
				e.stopPropagation();
				
				//---|Debug|---
				console.log(e);
				//console.log("Länge: " + e.key.length);
				console.log("keyCode: " + e.keyCode);
				//console.log("KeyCode Typ: " + typeof(e.keyCode));

				this.handlerArray[e.keyCode](e, this.textNode);
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
		switch(_e.key.length)
		{
			case 1: // no special keys, every printable keys length equals to 1 is accepted (stupid, but working)
			{
				console.log(String.fromCharCode(_e.keyCode));
				let t = this.updateBuffer(_e.key, this.cursorPosition);
				console.log("Updated buffer: " + t);
				break;
			}
			default:
			{	return; } //leave handler function
		}
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
	// Handles Backspace to delete the previous entered char.
	//
	_handleBackspace(_e, _textNode)
	{
		this._removeCharsFromBuffer();
		console.log("Textzeile nach Backspace: " + this.consoleBuffer);
		// Update
		this.updateReqFlag = true;

		console.log("Backspace Key Code: " + String.fromCharCode(_e.keyCode));
	}


	// 
	// Handle delete key. Remove chars after current cursor position.
	//
	_handleDeleteKey(_e, _textNode)
	{
		this._removeCharsFromBuffer(1, true);
		console.log("Textzeile nach Entf: " + this.consoleBuffer);
		// Update
		this.updateReqFlag = true;
	}


	//
	// Move cursor, history etc...not finished
	// 
	// Seperated the arrow key function, this saves us a switch/case statement. The functions now directly called in the input handler function.
	//
	_handleLeftArrowKey(_e, _textNode)
	{	
		// Handle left arrow key, should move the cursor to the left
		if(this.cursorPosition > 0)
		{
			console.log("Cursor position: " + this.cursorPosition);
			this.cursorPosition -= 1;
			this.updateReqFlag = true;
		}
	}


	//
	// Move cursor to the right
	//
	_handleRightArrowKey(_e, _textNode)
	{
		// Handle right arrow key, should move the cursor to the right
		if(this.cursorPosition < this.consoleBuffer.length)
		{
			console.log("Cursor position: " + this.cursorPosition);
			this.cursorPosition += 1;
			this.updateReqFlag = true;
		} 
	}


	//
	// Dummy function does nothing
 	//
	 _handleArrowKeysDummy(_e, _textNode)
	 {	return; }
	
	
}// end class