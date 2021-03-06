"use strict";

//import * as Loader from  './loader.js';

const VERSION_MAJOR = '0';
const VERSION_MINOR = '2';
const VERSION_MICRO = '0';
const VERSION = String(VERSION_MAJOR + "." + VERSION_MINOR + "." + VERSION_MICRO);

const CURSOR_START = "<span class=\"cursor\">";
const CURSOR_END = "</span>";
const CURSOR_END_CHAR = "&nbsp";

const FPS = 1000/30; // frames per second, update rate

const LOCAL_ADDR = "http://127.0.0.1:5000";  //80";
const LOCAL_ADDR_SSL = "https://127.0.0.1:443";
//const LOCALHOST = "http://localhost:5000";
//const LOCALHOST_SSL = "https://localhost:443";


// Enum for possible messages. (not yet used)
const MESSAGES = { NONE:0, UPDATE:1, CLS:2, LOADER_EXECUTE:3, LOADER_RESULT:4};
Object.freeze(MESSAGES);



class MyConsole extends Object
{
	constructor(_element = window)
	{
		super();

		this.lineCounter = 0; // current number of lines
		this.cursorPosition = 0; // line position of the cursor
		
		this.textNode = document.getElementById("text");
		this.cursorNode = document.getElementById("cursor");
		this.console = document.getElementById("console");

		this.consoleBuffer = ""; // content of the input line
		this.setIntervalId = 0;
		this.lastTimeStamp = performance.now();
		this.updateReqFlag = false; // is an update required?

		// Selection
		this.shiftKeyPressed = false;// Shift key is pressed? Needed for the arrow key handling functions.
		this.selectionStartPos = -1; // where the selection via shift + arrow key starts (cursor position)
		this.selectionEndPos = -1;   // where the selection via shift + arrow key ends (cursor position)
		this.selectionActive = false; // Indicates if there is currently a selected text active.
		this.currentSelection = ""; // contains the selected text

		// Node for selected chars, created once only.
		this.selectionNode = document.createElement("span");
		this.selectionNode.setAttribute("class", "selected-text");
		this.selectionNode.setAttribute("id", "selected-text");

		// The cursor node is created once only. / Cursor-Node nur einmal erzeugen.
		this.curNode = document.createElement("span");
		this.curNode.setAttribute("class", "cursor");
		this.curNode.setAttribute("id", "cursor");


		// Create the worker thread for the commands
		//let cmdWorker = 0;
		this.loader = '';


		// Working variables used in the "updateCursorLine" function. Just allocated once to reduce the GC and memory usage.
		this._normalText = "";
		this._coveredChar = "";
		this._selectedText = "";
		this._afterCurAndSelection = "";		
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
			_element.addEventListener("message", function(_e){ return self.handleInput(_e); } );
			_element.addEventListener("keyup", function(_e){ return self.handleInput(_e); } );

			// Register update function
			this.setIntervalId = setInterval(this.eventLoop.bind(this), FPS);
			//window.requestAnimationFrame(this.eventLoop2.bind(this)); --> dont use this!!
			
			//Refresh buffer and make cursor visible
			this._clearConsoleLineBuffer();

			console.log("Console Version: " + VERSION);

			// Worker thread test -- TODO
			//this.cmdWorker = new Worker("loader.js");
			//this.cmdWorker.postMessage();
			//console.log("Worker thread: " + this.cmdWorker);
			this.loader = new Loader([LOCAL_ADDR, LOCAL_ADDR_SSL]); //LOCALHOST, LOCALHOST_SSL]);
			this.loader.init();

			//console.log(window);

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
		if(t > FPS && this.updateReqFlag === true) // Game loop :-)
		{
			// ---|DEBUG|---
			//console.log("Eventloop1...");
			//console.log("TextNode: " + this.textNode);
			//console.log("Console Buffer: " + this.consoleBuffer);
			//console.log("Cursor Position: " + this.cursorPosition);
			this.updateCursorLine2(this.textNode, this.consoleBuffer, this.cursorPosition);
		}

		this.lastTimeStamp = timeStamp;		
	}


	//	
	// Updates the cursor position and input line.
	//
	// Parameter:
	//				_textNode		-> The Node to insert the text (object)
	//				_buffer			-> The console buffer as string. (String)
	//				_cursorPosition	-> The current position of the cursor. (current column, Int)
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
					this.curNode.innerHTML = CURSOR_END_CHAR; // --> Space else Cursor would not be visible at the end of line
					break;
				}
			default:
				{
					// Cursor is somewhere in between the text
					const beforeCur = _buffer.slice(0, _cursorPosition);
					const coveredChar = _buffer.slice(_cursorPosition, _cursorPosition+1);
					const afterCur = _buffer.slice(_cursorPosition+1, lenBuf);
					//console.log("Vor Cursor: " + beforeCur);
					//console.log("Nach Cursor: " + afterCur);
					
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
	// Updates the cursor position and input line.
	//
	// Parameter:
	//				_textNode		-> The Node to insert the text (object)
	//				_buffer			-> The console buffer as string. (String)
	//				_cursorPosition	-> The current position of the cursor. (current column, Int)
	//
	// New version, with text selection via keys.
	//
	updateCursorLine2(_textNode, _buffer, _cursorPosition)
	{
		const lenBuf = _buffer.length;
		//console.log("Länge des Buffer: " + lenBuf);
		const offsetEnd = lenBuf - _cursorPosition;
		//console.log("Offset: " + offsetEnd);

		//
		// New version tests needed....
		switch(this.selectionActive)
		{
			// Highlight the text
			case true:
			{
				//-----------------------------
				// Collect the text elements
				//-----------------------------

				// The cursor is somewhere at the line. (see first switch condition) Every selection is made by using the left arrow key.
				if(this.cursorPosition < this.selectionStartPos)
				{
					// The selected text is always behind the cursor position. (right side of the cursor)
				
					//First get the normal text in front of the cursor.
					this._normalText = _buffer.slice(0, this.cursorPosition);

					// Get the char covered by the cursor. Overlapping with the first selected char here.
					this._coveredChar = _buffer.slice(this.cursorPosition, this.cursorPosition+1);

					// Get the selected text.					
					// +1 to the end, because end of slicing is excluding the end value.
					// If the selection begins somewhere at the line, then "cursor position = start position of selection".
					this._selectedText = _buffer.slice(this.cursorPosition+1, this.selectionStartPos+1);
										 

					//Now get the text after the current selection.
					this._afterCurAndSelection = _buffer.slice(this.selectionStartPos+1, lenBuf);
						
						
					//-----------------------------
					// Now build the input line
					//-----------------------------

					// First the text in front of the cursor.
					this.textNode.innerHTML = this._normalText;
					
					// Second set up the content covered by the cursor
					this.cursorNode.innerHTML = this._coveredChar;
					
					// Now the cursor node, we need to include the cursor to the selected text, if it is at the start of line.
					if(this.cursorPosition === 0 ) // Cursor is at the begining of the text line
					{
						//Add the selection Node
						this.textNode.appendChild(this.selectionNode);
						// Delete the content of the selection node. Needed, else we have previous selected text content inside the node which is not valid anymore.
						this.selectionNode.innerHTML = "";
						//Now add the cursor node as part of the current selected text.
						this.selectionNode.appendChild(this.cursorNode);
						//Add the rest of the selected text to the selection node
						this.cursorNode.insertAdjacentHTML('afterend', this._selectedText);
					}
					else // Cursor not at the begin
					{	
						// Add the cursor node
						this.textNode.appendChild(this.cursorNode);
						// Add the selection node after the cursor node.
						this.textNode.appendChild(this.selectionNode);
						// Set up the content of the selection node.
						this.selectionNode.innerHTML = this._selectedText;
					}

					// Now add the rest of the normal text at the end.
					this.selectionNode.insertAdjacentHTML('afterend', this._afterCurAndSelection);
				}


				// --> occurs if you change the direction during selection process
				else if(this.cursorPosition === this.selectionStartPos)
				{
					//First get the normal text in front of the cursor.
					this._normalText = _buffer.slice(0, this.cursorPosition);

					// Get the char covered by the cursor. Overlapping with the first selected char here.
					//let coveredChar="";
					if(offsetEnd === 0)
					{	this._coveredChar = CURSOR_END_CHAR; } // Cursor is at the end, insert a space to make it visible.
					else
					{	this._coveredChar = _buffer.slice(this.cursorPosition, this.cursorPosition+1); }

					//Now get the text after the current selection.
					this._afterCurAndSelection = _buffer.slice(this.cursorPosition+1, lenBuf);


					//-----------------------------
					// Now build the input line
					//-----------------------------

					// First the text in front of the cursor.
					this.textNode.innerHTML = this._normalText;
					
					// Set the content of cursor node.
					this.curNode.innerHTML = this._coveredChar;
					
					// Add the selection node.
					this.textNode.appendChild(this.selectionNode);
					// Delete the content of the selection node. Needed, else we have previous selected text content inside the node which is not valid anymore.
					this.selectionNode.innerHTML = "";
					// Set up the content of the selection node. The cursor and the selection are the same, so stack it thogether.
					this.selectionNode.appendChild(this.curNode);
					// Now add the rest of the normal text to the end.
					this.selectionNode.insertAdjacentHTML('afterend', this._afterCurAndSelection);
				}

				else
				{
					// The selected text is always in front of the cursor position. (left side of the cursor)
					//First get the normal text in front of the selected text.
					this._normalText = _buffer.slice(0, this.selectionStartPos);

					//Now get the selected text, the last char is also covered by the cursor. So skip this one, else it would appear twice on screen.
					this._selectedText = _buffer.slice(this.selectionStartPos, this.cursorPosition);

					// Get the char covered by the cursor. Overlapping with the first selected char here.
					//let coveredChar="";
					if(offsetEnd === 0)
					{	this._coveredChar = CURSOR_END_CHAR; } // the cursor is at the end, insert a space the make it visible.
					else
					{	this._coveredChar = _buffer.slice(this.cursorPosition, this.cursorPosition+1); }

					//Now get the text after the cursor.
					this._afterCurAndSelection = _buffer.slice(this.cursorPosition+1, lenBuf);
						
						
					//-----------------------------
					// Now build the input line
					//-----------------------------

					// First the text in front of the cursor.
					this.textNode.innerHTML = this._normalText;
					// Second add the selection node after the normal text.
					this.textNode.appendChild(this.selectionNode);
					// Set up the content of the selection node.
					this.selectionNode.innerHTML = this._selectedText;
					// Now the cursor node
					this.textNode.appendChild(this.curNode);

					// Set up the content covered by the cursor
					this.curNode.innerHTML = this._coveredChar;

					// Now add the rest of the normal text to the end.
					this.curNode.insertAdjacentHTML('afterend', this._afterCurAndSelection);
				}
				break;
			}
			
			default:
			{
				// No text selection...
				//
				//-----------------------------
				// Collect the text elements
				//-----------------------------

				// Content before cursor.
				this._normalText = _buffer.slice(0, _cursorPosition);

				// Content covered by the cursor
				//let coveredChar="";
				if(offsetEnd === 0 ) // Check if the cursor is at the end of line. This saves us a string slice function call.
				{	this._coveredChar = CURSOR_END_CHAR; } // Cursor is at the end, insert a space to make it visible.
				else
				{	this._coveredChar = _buffer.slice(_cursorPosition, _cursorPosition+1); }

				// Content after cursor
				this._afterCurAndSelection = _buffer.slice(_cursorPosition+1, lenBuf);

				//---|DEBUG|---
				//console.log("Vor Cursor: " + beforeCur);
				//console.log("Nach Cursor: " + afterCur);
						
						
				//-----------------------------
				// Now build the input line
				//-----------------------------
					
				this.textNode.innerHTML = this._normalText;
				this.textNode.appendChild(this.curNode);
				this.curNode.innerHTML = this._coveredChar;
				this.curNode.insertAdjacentHTML('afterend', this._afterCurAndSelection);
				break;
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
		//window.postMessage("update");
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
	// Print line to console, updates the line counter
	//
	// Parameter:	_text -> Text to be printed. (HTML possible, but can lead to unexpected results. (not tested))
	//				
	//
	printLine(_text, _cssClassName="")
	{
		// Set up new line content
		let line = document.createElement("DIV");
		line.innerHTML = _text;
		line.setAttribute("class", _cssClassName);

		//update line counter
		this.lineCounter += 1;

		//set up line id as reference
		line.id = this.lineCounter;

		// Insert new line before the input line.
		this.console.insertBefore(line, this.textNode);
	}


	
	//
	// Input Handler
	//
	handleInput(e)
	{
		//e.preventDefault();
		
		// ---|Debug|---
		//console.log("Handele input -> origin: " + e.origin);

		switch(e.type)
		{
			case 'message': // Tests needed....
			{
				console.log("Nachricht: " + e.data.type);
				switch(e.origin)
				{
					case LOCAL_ADDR:
					case LOCAL_ADDR_SSL:
					//case LOCALHOST:
					//case LOCALHOST_SSL:
					{
						switch(e.data.type)
						{
							case MESSAGES.UPDATE: // TODO: Plugins via worker threads need to trigger the update this way.
							{
								//console.log("Meldung erhalten: " + e.data);
								//this.updateCursorLine(this.textNode, this.consoleBuffer, this.cursorPosition);
								this.updateReqFlag = true; // better, faster and none blocking
								break;
							}

							case MESSAGES.CLS:
							{
								this._clearConsoleLineBuffer();
								break;
							}

							case MESSAGES.LOADER_RESULT:
							{
								this.printLine(e.data.data, "text info");
								break;
							}

							case MESSAGES.LOADER_EXECUTE:
                            {
                                console.log("Message received: " + e.data.type + " " + e.data.data);
                                // Execute the input
                                this.loader.sendData(e.origin, e.data.data);
								break;
							}
						}
						break;
					}

					default:
					{	break; }

				}// switch e.origin
			}

			case 'keyup':
			{
				switch(e.keyCode)
				{
					case 16: //Shift-key
					{
						// update key state
						this.shiftKeyPressed = e.shiftKey;

						switch(this.selectionActive)
						{
							case true:
							{
								//there is an active selection, save the end position wich equals to the current cursor position
								this.selectionEndPos = this.cursorPosition;
								
								// save the selected text
								if(this.selectionStartPos > this.selectionEndPos)
								{	this.currentSelection = this.consoleBuffer.slice(this.selectionEndPos, this.selectionStartPos + 1); } // +1 to get the end of text, selection is behind the cursor
								else
								{	this.currentSelection = this.consoleBuffer.slice(this.selectionStartPos, this.selectionEndPos); } // +1 not necessary because selection is in front of cursor

								//console.log("Selektierter Text: " + this.currentSelection);
								break;
							}

							default: // No selection active, nothing needs to be done here.
							{ break; }
						}// switch(this.selectionActive)

						break;
					}
					
					default: // No more keys handled here...
					{ break; }

				} // switch(e.keyCode)

				break; //keyup
			}


			case 'keydown':
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

					case 16: // Shift key (left & right)
					{
						this.shiftKeyPressed = e.shiftKey;
						console.log("Shiftkey: " + this.shiftKeyPressed);
						break;
					}

					case 36: // Pos1 key
					{
						this._handlePos1Key(e, this.textNode);
						break;
					}

					case 35: // End key
					{
						this._handleEndKey(e, this.textNode);
						break;
					}

					case 37: // Arrow Left + check for shift key
					{
						//this.shiftKeyPressed = e.shiftKey;
						//console.log("Shiftkey: " + this.shiftKeyPressed);
						this._handleLeftArrowKey(e, this.textNode);
						break;
					}

					case 38: // Arrow Up
					{
						this._handleArrowKeysDummy(e, this.textNode);
						break;
					}
					
					case 39: // Arrow Right + check for shift key
					{
						//this.shiftKeyPressed = e.shiftKey;
						//console.log("Shiftkey: " + this.shiftKeyPressed);
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

					case 67: // 'c' key
					{
						switch(e.ctrlKey)
						{
							case true:
							{
								// stupid method for copy to clipboard.....but doesn't work because of browser limitations/restrictions :-(
								let frag = document.createDocumentFragment();
								let node = document.createElement("input");
								frag.appendChild(node);

								node.setAttribute("type", "text");
								node.textContent = this.currentSelection;
								node.style.display = "none";
								node.select();
								document.body.appendChild(node);
								console.log("Rückgabewert: " + document.execCommand("copy"));
								document.body.removeChild(node);
								break;
							}

							default:
							{
								this._handleChars(e, this.textNode); // ctrl not pressed, handle as char
								break;
							}
						}
						break;
					}

					// TODO: Doesn't work because of browser restrictions......
					case 86: // 'v' key
					{
						switch(e.ctrlKey)
						{
							case true:
							{
								// Copy last selected text to clipboard
							//	document.execCommand("paste", false, this.currentSelection);
								var clipboardText = document.execCommand("paste");
								console.log("Text im Clipboard: " + clipboardText);
								break;
							}

							default:
							{
								this._handleChars(e, this.textNode); // ctrl not pressed, handle as char
								break;
							}
						}
						break;
					}
				
					default:
					{
						console.log("Event: " + e.keyCode);
						this._handleChars(e, this.textNode);
						break;
					}	
						
					//---|Debug|--- - Key counter
					//this.counter +=1;
					//console.log(this.counter);
				}// switch keycode
			}

			default: // Nothing...
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
				// cancel an active selection of text
				this.selectionActive = false;

				//console.log(String.fromCharCode(_e.keyCode));
				let t = this.updateBuffer(_e.key, this.cursorPosition);
				//console.log("Updated buffer: " + t);
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
		this.consoleBuffer = "";
		this.cursorPosition = 0;

		// cancel an active selection of text
		this.selectionActive = false;

		// force direct update the prevent ghost images
		this.updateCursorLine(this.textNode, this.consoleBuffer, this.cursorPosition);
	}

	

	//
	// Handle the "Enter" key. (Future todo: call worker thread with input results)
	//
	_handleEnter(_e, _textNode)
	{
		switch(this.consoleBuffer.length)
		{
			case 0:
				{	return; }
			
			default:
				{
					let beforeCur = _textNode.innerHTML.slice(0, this.cursorPosition);
					//console.log("Zeile vor Enter: " + beforeCur);

					// Print the line to console and update the line counter accordingly.
					this.printLine(beforeCur, "text");

					let msg = String('{"type":' + MESSAGES.LOADER_EXECUTE + ',"data":"' + beforeCur + '"}');
					let jsonMsg = JSON.parse(msg);

					// send the input to loader class
					window.postMessage(jsonMsg);
	
					//Clear the input line buffer and cancle an active text selection
					this._clearConsoleLineBuffer();

					//console.log(String.fromCharCode(_e.keyCode));
					
					return beforeCur; // return the input, text only
				}
		}		
	}
	

	//
	// Handles Backspace to delete the previous entered char.
	//
	_handleBackspace(_e, _textNode)
	{
		this._removeCharsFromBuffer();
		//console.log("Textzeile nach Backspace: " + this.consoleBuffer);
		
		// cancel an active selection of text
		this.selectionActive = false;

		// Update
		this.updateReqFlag = true;
		//window.postMessage("update");

		//console.log("Backspace Key Code: " + String.fromCharCode(_e.keyCode));
	}


	// 
	// Handle delete key. Remove chars after current cursor position.
	//
	_handleDeleteKey(_e, _textNode)
	{
		this._removeCharsFromBuffer(1, true);
		//console.log("Textzeile nach Entf: " + this.consoleBuffer);

		// cancel an active selection of text
		this.selectionActive = false;

		// Update
		this.updateReqFlag = true;
		//window.postMessage("update");
	}


	//
	// Move cursor, history etc...not finished
	// 
	// Move the cursor left, take care of an active selection if needed.
	//
	_handleLeftArrowKey(_e, _textNode)
	{	
		// Handle left arrow key, should move the cursor to the left
		if(this.cursorPosition > 0)
		{
			//console.log("Am Anfang --> Cursor position: " + this.cursorPosition);

			switch(this.shiftKeyPressed)
			{
				case true:
				{
					// Check if we need to set the selection flag to start an selection
					switch(this.selectionActive)
					{
						case false:
						{
							// No selection is currently active, activate it
							this.selectionActive = true;
							// save the start position of the selection
							this.selectionStartPos = this.cursorPosition;
						}

						default:
						{ break; } // Selection already active, nothing more needs to be done here.

					}// switch(this.selectionActive)

					break;
				}// case true

				default:
				{
					// arrow key pressed without shift key, cancle an active text selection
					this.selectionActive = false
					break; 
				}

			} // switch(this.shiftKeyPressed)

			// finally update cursor position
			this.cursorPosition -= 1;
			this.updateReqFlag = true;
			return;
			//window.postMessage("update");
		}//if

		else // --> Check if an active selection needs to be canceled.
		{
			//Do nothing but cancel an possible active selection, if shift is not pressed anymore.
			switch(this.shiftKeyPressed) // --> faster than if condition
			{
				case false:
					{
						this.selectionActive = false;
						this.updateReqFlag = true;
						return;
					}

				default: { return; }
			}
		}
	}


	//
	// Move cursor to the right, take care of an active selection if needed.
	//
	_handleRightArrowKey(_e, _textNode)
	{
		
		// Handle right arrow key, should move the cursor to the right
		if(this.cursorPosition < this.consoleBuffer.length)
		{
			//console.log("Am Anfang --> Cursor position: " + this.cursorPosition);

			switch(this.shiftKeyPressed)
			{
				case true:
				{
					//Check if we need to set the selection flag to start an selection
					switch(this.selectionActive)
					{
						case false:
						{
							// No selection is currently active, activate it
							this.selectionActive = true;
							// save the start position of the selection
							this.selectionStartPos = this.cursorPosition;
						}

						default:
						{ break; } // Selection already active, nothing more needs to be done here.

					}// switch(this.selectionActive)

					break;
				}// case true

				default:
				{
					// arrow key pressed without shift key, cancle an active text selection
					this.selectionActive = false; 
					break; 
				}

			} // switch(this.shiftKeyPressed)

			this.cursorPosition += 1;
			this.updateReqFlag = true;
			//window.postMessage("update");
			return;
		}// if

		else // --> Check if an active selection needs to be canceled.
		{
			//Do nothing but cancel an possible active selection, if shift is not pressed anymore.
			switch(this.shiftKeyPressed) // --> faster than if condition
			{
				case false:
					{
						this.selectionActive = false;
						this.updateReqFlag = true;
						return;
					}

				default: { return; }
			}
		}
	}


	//
	// Dummy function does nothing
 	//
	 _handleArrowKeysDummy(_e, _textNode)
	 {	return; }


	 //
	 // Pos1 key, set cursor to the begin of the line.
	 //
	 _handlePos1Key(_e, _textNode)
	 {
		 switch(this.shiftKeyPressed)
		 {
			case true:
			{
				// Update the selection start position, everything in front of the cursor is selected. 
				this.selectionStartPos = this.cursorPosition;
				this.selectionEndPos = 0;
				this.selectionActive = true;
				break;
			}

			default:
			{
				// cancel an active selection of text
				this.selectionActive = false;
				break;
			}
		 }
		 
		 this.cursorPosition = 0;
		 this.updateReqFlag = true;
		 //window.postMessage("update");
	 }



	 //
	 // End key, set cursor to the end of line.
	 //
	 _handleEndKey(_e, _textNode)
	 {
		 switch(this.shiftKeyPressed)
		 {
			case true:
			{
				// Update the selection start position, everything behind the cursor is selected.
				this.selectionStartPos = this.cursorPosition;
				this.selectionEndPos = this.consoleBuffer.length;
				this.selectionActive = true;
				break;
			}

			default:
			{
				// cancel an active selection of text
				this.selectionActive = false;
				break;
			}
		 }
		 
		 this.cursorPosition = this.consoleBuffer.length;
		 this.updateReqFlag = true;
		 //window.postMessage("update");
	 }
	
	
}// end class