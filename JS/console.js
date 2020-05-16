"use strict";

const VERSION_MAJOR = '0';
const VERSION_MINOR = '1';
const VERSION_MICRO = '0';
const VERSION = String(VERSION_MAJOR + "." + VERSION_MINOR + "." + VERSION_MICRO);

const CURSOR_START = "<span class=\"cursor\">";
const CURSOR_END = "</span>";

const FPS = 1000/30; // frames per second, update rate


// Enum for possible messages. (not yet used)
const MESSAGES = { NONE:0, UPDATE:1, CLS:2 };
Object.freeze(MESSAGES);



class MyConsole extends Object
{
	constructor(_element = window)
	{
		super();

		//this.counter = 0; // number of keys pressed
		//this.lineLength = 0; // current length of line in pixel
		this.lineCounter = 0; // current number of lines
		this.cursorPosition = 0; // line position of the cursor
		
		this.textNode = document.getElementById("text");
		this.cursorNode = document.getElementById("cursor");
		this.console = document.getElementById("console");

		this.consoleBuffer = ""; // content of the input line
		this.setIntervalId = 0;
		this.lastTimeStamp = performance.now();
		this.updateReqFlag = false; // is an update required?

		// TODO: not yet finished -- Selection
		this.shiftKeyPressed = false;// Shift key is pressed? Needed for the arrow key handling functions.
		this.selectionStartPos = -1; // where the selection via shift + arrow key starts (cursor position)
		this.selectionEndPos = -1;   // where the selection via shift + arrow key ends (cursor position)
		this.selectionActive = false; // Indicates if there is currently a selected text active.
		this.selectedPositions = []; // Array of cursor positions (numbers) wich have been selected via shift key and arrow left/right

		//Node for selected chars, created once only.
		this.selectionNode = document.createElement("span");
		this.selectionNode.setAttribute("class", "selected-text");
		this.selectionNode.setAttribute("id", "selected-text");


		console.log("Console Version: " + VERSION);


		//The cursor node is created once only. / Cursor-Node nur einmal erzeugen.
		this.curNode = document.createElement("span");
		this.curNode.setAttribute("class", "cursor");
		this.curNode.setAttribute("id", "cursor");


		//Test of new input handler, but array lookup is a lot slower than the normal "switch/case" statement.
		//this.handlerArray = new Array(256);
		
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
			//_element.addEventListener("message", function(_e){ return self.handleInput(_e); } ); --> second fastest method
			_element.addEventListener("keyup", function(_e){ return self.handleInput(_e); });

			// Register update function
			this.setIntervalId = setInterval(this.eventLoop.bind(this), FPS);
			//window.requestAnimationFrame(this.eventLoop2.bind(this)); --> dont use this!!
			
			//Refresh buffer and make cursor visible
			this._clearConsoleLineBuffer();

			// Test for new input handler, but seems a lot slower than the normal "switch/case" statement.
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
	//	Event loop handler, all update goes here...compared to "window.requestAnimationFrame" ultra fast!!!
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


	// Test new event via "window.requestAnimationFrame" loop - This is stupid slow extrem slow!!!!
	/*eventLoop2(_time)
	{
		//console.log("start eventloop 2, Zeit in Millisekunden: " + _time);

		//let timeStamp = performance.now();
		//let t = timeStamp - this.lastTimeStamp;
		let t = _time - this.lastTimeStamp;

		// only update if needed
		//if(t > FPS)// && this.updateReqFlag === true)

		if(t > FPS && this.updateReqFlag === true)
		{
			console.log("Zeit > FPS (" + FPS + "): " + (t>FPS) + " Wert: " + t);

			this.updateCursorLine(this.textNode, this.consoleBuffer, this.cursorPosition);

			//window.requestAnimationFrame(this.eventLoop2.bind(this));
		}

		//this.lastTimeStamp = timeStamp;
		this.lastTimeStamp = _time;


		window.requestAnimationFrame(this.eventLoop2.bind(this));
	}
*/

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



	// TODO: Not finished, cursor position == selection start is missing.
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
					const normalText = _buffer.slice(0, this.cursorPosition);

					// Get the char covered by the cursor. Overlapping with the first selected char here.
					const coveredChar = _buffer.slice(this.cursorPosition, this.cursorPosition+1);

					// Get the selected text.					
					// +1 to the end, because end of slicing is excluding the end value.
					// If the selection begins somewhere at the line, then "cursor position = start position of selection".
					const selectedText = _buffer.slice(this.cursorPosition+1, this.selectionStartPos+1);
										 

					//Now get the text after the current selection.
					const afterCurAndSelection = _buffer.slice(this.selectionStartPos+1, lenBuf); // TODO: seems to start one char to soon
						
						
					//-----------------------------
					// Now build the input line
					//-----------------------------

					// First the text in front of the cursor.
					this.textNode.innerHTML = normalText;
					
					// Second set up the content covered by the cursor
					this.cursorNode.innerHTML = coveredChar;
					
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
						this.cursorNode.insertAdjacentHTML('afterend', selectedText);
					}
					else // Cursor not at the begin
					{	
						// Add the cursor node
						this.textNode.appendChild(this.cursorNode);
						// Add the selection node after the cursor node.
						this.textNode.appendChild(this.selectionNode);
						// Set up the content of the selection node.
						this.selectionNode.innerHTML = selectedText;
					}

					// Now add the rest of the normal text at the end.
					this.selectionNode.insertAdjacentHTML('afterend', afterCurAndSelection);
				}

				// --> occurs if you change the direction during selection process
				else if(this.cursorPosition === this.selectionStartPos)
				{
					//First get the normal text in front of the cursor.
					const normalText = _buffer.slice(0, this.cursorPosition);

					// Get the char covered by the cursor. Overlapping with the first selected char here.
					let coveredChar="";
					if(offsetEnd === 0)
					{	coveredChar = "&nbsp"; } // Cursor is at the end, insert a space to make it visible.
					else
					{	coveredChar = _buffer.slice(this.cursorPosition, this.cursorPosition+1); }

					//Now get the text after the current selection.
					const afterCurAndSelection = _buffer.slice(this.cursorPosition+1, lenBuf);


					//-----------------------------
					// Now build the input line
					//-----------------------------

					// First the text in front of the cursor.
					this.textNode.innerHTML = normalText;
					
					// Set the content of cursor node.
					this.curNode.innerHTML = coveredChar;
					
					// Add the selection node.
					this.textNode.appendChild(this.selectionNode);
					// Delete the content of the selection node. Needed, else we have previous selected text content inside the node which is not valid anymore.
					this.selectionNode.innerHTML = "";
					// Set up the content of the selection node. The cursor and the selection are the same, so stack it thogether.
					this.selectionNode.appendChild(this.curNode);
					// Now add the rest of the normal text to the end.
					this.selectionNode.insertAdjacentHTML('afterend', afterCurAndSelection);
				}

				else
				{
					// The selected text is always in front of the cursor position. (left side of the cursor)
					//First get the normal text in front of the selected text.
					const normalText = _buffer.slice(0, this.selectionStartPos);

					//Now get the selected text, the last char is also covered by the cursor. So skip this one, else it would appear twice on screen.
					const selectedText = _buffer.slice(this.selectionStartPos, this.cursorPosition);

					// Get the char covered by the cursor. Overlapping with the first selected char here.
					let coveredChar="";
					if(offsetEnd === 0)
					{	coveredChar = "&nbsp"; } // the cursor is at the end, insert a space the make it visible.
					else
					{	coveredChar = _buffer.slice(this.cursorPosition, this.cursorPosition+1); }

					//Now get the text after the cursor.
					const afterCurAndSelection = _buffer.slice(this.cursorPosition+1, lenBuf);
						
						
					//-----------------------------
					// Now build the input line
					//-----------------------------

					// First the text in front of the cursor.
					this.textNode.innerHTML = normalText;
					// Second add the selection node after the normal text.
					this.textNode.appendChild(this.selectionNode);
					// Set up the content of the selection node.
					this.selectionNode.innerHTML = selectedText;
					// Now the cursor node
					this.textNode.appendChild(this.curNode);

					// Set up the content covered by the cursor
					this.curNode.innerHTML = coveredChar;

					// Now add the rest of the normal text to the end.
					this.curNode.insertAdjacentHTML('afterend', afterCurAndSelection);
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
				const beforeCur = _buffer.slice(0, _cursorPosition);

				// Content covered by the cursor
				let coveredChar="";
				if(offsetEnd === 0 ) // Check if the cursor is at the end of line. This saves us a string slice function call.
				{	coveredChar = "&nbsp"; } // Cursor is at the end, insert a space to make it visible.
				else
				{	coveredChar = _buffer.slice(_cursorPosition, _cursorPosition+1); }

				// Content after cursor
				const afterCur = _buffer.slice(_cursorPosition+1, lenBuf);

				//---|DEBUG|---
				console.log("Vor Cursor: " + beforeCur);
				console.log("Nach Cursor: " + afterCur);
						
						
				//-----------------------------
				// Now build the input line
				//-----------------------------
					
				this.textNode.innerHTML = beforeCur;
				this.textNode.appendChild(this.curNode);
				this.curNode.innerHTML = coveredChar;
				this.curNode.insertAdjacentHTML('afterend', afterCur);
				break;
			}
		}

		/*
		switch(offsetEnd)
		{
			case 0: //Cursor is at the end
			{
				//check if there is an text selection active
				switch(this.selectionActive)
				{
					case true: // color up the text :-)
					{
						// TODO: Check this!!!
						//
						// Cursor is at the end, means selection start position mut be smaller than the cursor position.
						// The selection is made by using the right arrow key.
						// And the cursor is always at the end. (see first switch condition)
						let text = _buffer.slice(0, this.selectionStartPos); //the normal, not selected text
						let selection = _buffer.slice(this.selectionStartPos, this.cursorPosition); // the selected text

						// Debug
						console.log("Inhalt des Buffers: " + _buffer);

						//Update the content of the input line
						// first the normal text
						this.textNode.innerHTML = text;
						// now add the <span> element node
						this.textNode.append(this.selectionNode);
						// update the content of this node with the currently selected text
						this.selectionNode.innerHTML = selection;


						//finally the cursor node
						this.textNode.appendChild(this.curNode);
						this.curNode.innerHTML = "&nbsp"; // --> Space else Cursor would not be visible at the end of line
						break;
					}

					default: // standard behaviour, no text selection
					{
						this.textNode.innerHTML = _buffer;
						this.textNode.appendChild(this.curNode);
						this.curNode.innerHTML = "&nbsp"; // --> Space else Cursor would not be visible at the end of line
						break;
					}
				}// switch(this.selectionActive)
				break;
			}

			default:
			{
				//check if there is an text selection active
				switch(this.selectionActive)
				{
					case true: // color up the text :-)
					{
						// TODO
						
						//-----------------------------
						// Collect the text elements
						//-----------------------------

						// The cursor is somewhere at the line. (see first switch condition) Every selection is made by using the left arrow key.
						if(this.cursorPosition < this.selectionStartPos)
						{
							// The selected text is always behind the cursor position. (right side of the cursor)
						
							//First get the normal text in front of the cursor.
							const normalText = _buffer.slice(0, this.cursorPosition);

							// Get the char covered by the cursor. Overlapping with the first selected char here.
							const coveredChar = _buffer.slice(this.cursorPosition, this.cursorPosition+1);

							//Now get the selected text, the first char is also covered by the cursor. So skip this one, else it would appear twice on screen.
							//+1 to the end, because end of slicing is excluding the end value.
							// If the selection begins somewhere at the line, then "cursor position = start position of selection".
							const selectedText = _buffer.slice(this.cursorPosition+1, this.selectionStartPos+1); 

							//Now get the text after the current selection.
							const afterCurAndSelection = _buffer.slice(this.selectionStartPos+1, lenBuf); // TODO: seems to start one char to soon
						
						
							//-----------------------------
							// Now build the input line
							//-----------------------------

							// First the text in front of the cursor.
							this.textNode.innerHTML = normalText;
							// Second the cursor node
							this.textNode.appendChild(this.curNode);
							// Set up the content covered by the cursor
							this.curNode.innerHTML = coveredChar;
							// Add the selection node after the cursor node.
							this.textNode.appendChild(this.selectionNode);
							// Set up the content of the selection node.
							this.selectionNode.innerHTML = selectedText;
							// Now add the rest of the normal text to the end.
							this.selectionNode.insertAdjacentHTML('afterend', afterCurAndSelection);
						}
						else
						{
							// The selected text is always in front of the cursor position. (left side of the cursor)
							//First get the normal text in front of the selected text.
							const normalText = _buffer.slice(0, this.selectionStartPos);

							//Now get the selected text, the last char is also covered by the cursor. So skip this one, else it would appear twice on screen.
							const selectedText = _buffer.slice(this.selectionStartPos, this.cursorPosition);

							// Get the char covered by the cursor. Overlapping with the first selected char here.
							const coveredChar = _buffer.slice(this.cursorPosition, this.cursorPosition+1);

							//Now get the text after the cursor.
							const afterCurAndSelection = _buffer.slice(this.cursorPosition+1, lenBuf);
						
						
							//-----------------------------
							// Now build the input line
							//-----------------------------

							// First the text in front of the cursor.
							this.textNode.innerHTML = normalText;
							// Second add the selection node after the normal text.
							this.textNode.appendChild(this.selectionNode);
							// Set up the content of the selection node.
							this.selectionNode.innerHTML = selectedText;
							// Now the cursor node
							this.textNode.appendChild(this.curNode);
							// Set up the content covered by the cursor
							this.curNode.innerHTML = coveredChar;
							// Now add the rest of the normal text to the end.
							this.curNode.insertAdjacentHTML('afterend', afterCurAndSelection);
						}

						break;
					}

					default: // standard behaviour, no selection
					{
						//-----------------------------
						// Collect the text elements
						//-----------------------------

						const beforeCur = _buffer.slice(0, _cursorPosition);
						const coveredChar = _buffer.slice(_cursorPosition, _cursorPosition+1);
						const afterCur = _buffer.slice(_cursorPosition+1, lenBuf);

						//---|DEBUG|---
						console.log("Vor Cursor: " + beforeCur);
						console.log("Nach Cursor: " + afterCur);
						
						
						//-----------------------------
						// Now build the input line
						//-----------------------------
						
						this.textNode.innerHTML = beforeCur;
						this.textNode.appendChild(this.curNode);
						this.curNode.innerHTML = coveredChar;
						this.curNode.insertAdjacentHTML('afterend', afterCur);
						break;
					}
				}//switch(this.selectionActive)
				break;
			}

		}//switch(offsetEnd)
		*/

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
	printLine(_text)
	{
		// Set up new line content
		let line = document.createElement("DIV");
		line.innerHTML = _text;

		//update line counter
		this.lineCounter += 1;

		//set up line id as reference
		line.id = this.lineCounter;

		// Insert new line before the input line.
		this.console.insertBefore(line, this.textNode);
		//document.getElementById("console").insertBefore(line, this.textNode);
	}


	
	//
	// Input Handler
	//
	handleInput(e)
	{
		e.preventDefault();
		
		// ---|Debug|---
		//console.log(e.type);

		switch(e.type)
		{
			case 'message':
			{
				switch(e.data) // TODO: Check source of message first for the sake of security!
				{
					case MESSAGES.UPDATE: // TODO: Plugins via worker threads need to update the console buffer this way.
					{
						//console.log("Meldung erhalten: " + e.data);
						//this.updateCursorLine(this.textNode, this.consoleBuffer, this.cursorPosition);
						this.updateReqFlag = true; // better, faster and none blocking
						break;
					}

					case MESSAGES.CLS:
					{
						this._clearConsoleLineBuffer;
						break;
					}
				}
				break;
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
				console.log(e);
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
						this.shiftKeyPressed = e.shiftKey;
						console.log("Shiftkey: " + this.shiftKeyPressed);
						//this._handleLeftArrowKey(e, this.textNode);
						this._handleLeftArrowKey2(e, this.textNode);
						break;
					}

					case 38: // Arrow Up
					{
						this._handleArrowKeysDummy(e, this.textNode);
						break;
					}
					
					case 39: // Arrow Right + check for shift key
					{
						this.shiftKeyPressed = e.shiftKey;
						console.log("Shiftkey: " + this.shiftKeyPressed);
						//this._handleRightArrowKey(e, this.textNode);
						this._handleRightArrowKey2(e, this.textNode);
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
						console.log("Event: " + e.keyCode);
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

			default: // Nothing...
			{ break; }
		}
	}// end handle input


	//
	// New Input Handler - Test --> Slower than the "old" Version. Array look up seems to be slower than switch/case statement.
	// 
	// Not used.
	//
	/*handleInput2(e)
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
*/


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
		this.consoleBuffer = "";
		this.cursorPosition = 0;

		// cancel an active selection of text
		this.selectionActive = false;

		// force direct update the prevent ghost images
		this.updateCursorLine(this.textNode, this.consoleBuffer, this.cursorPosition);
	}

	

	//
	// Handle the "Enter" key. (Future: call worker thread with input results)
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
					console.log("Zeile vor Enter: " + beforeCur);

					// Print the line to console and update the line counter accordingly.
					this.printLine(beforeCur);
	
					//Clear the input line buffer and cancle an active text selection
					this._clearConsoleLineBuffer();

					console.log(String.fromCharCode(_e.keyCode));
					
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
		console.log("Textzeile nach Backspace: " + this.consoleBuffer);
		
		// cancel an active selection of text
		this.selectionActive = false;

		// Update
		this.updateReqFlag = true;
		//window.postMessage("update");

		console.log("Backspace Key Code: " + String.fromCharCode(_e.keyCode));
	}


	// 
	// Handle delete key. Remove chars after current cursor position.
	//
	_handleDeleteKey(_e, _textNode)
	{
		this._removeCharsFromBuffer(1, true);
		console.log("Textzeile nach Entf: " + this.consoleBuffer);

		// cancel an active selection of text
		this.selectionActive = false;

		// Update
		this.updateReqFlag = true;
		//window.postMessage("update");
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
			//update cursor position
			this.cursorPosition -= 1;
			this.updateReqFlag = true;
			//window.postMessage("update");
		}
	}


	_handleLeftArrowKey2(_e, _textNode)
	{	
		// Handle left arrow key, should move the cursor to the left
		if(this.cursorPosition > 0)
		{
			console.log("Am Anfang --> Cursor position: " + this.cursorPosition);

			switch(this.shiftKeyPressed)
			{
				case true:
				{
					// Check if we need to set the selection flag
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
			//window.postMessage("update");
		} 
	}

	// same as above, but with text selection
	_handleRightArrowKey2(_e, _textNode)
	{
		
		// Handle right arrow key, should move the cursor to the right
		if(this.cursorPosition < this.consoleBuffer.length)
		{
			console.log("Am Anfang --> Cursor position: " + this.cursorPosition);

			switch(this.shiftKeyPressed)
			{
				case true:
				{
					// Check if we need to set the selection flag
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
		 // cancel an active selection of text
		 this.selectionActive = false;
		 
		 this.cursorPosition = 0;
		 this.updateReqFlag = true;
		 //window.postMessage("update");
	 }



	 //
	 // End key, set cursor to the end of line.
	 //
	 _handleEndKey(_e, _textNode)
	 {
		 // cancel an active selection of text
		 this.selectionActive = false;
		 
		 this.cursorPosition = this.consoleBuffer.length;
		 this.updateReqFlag = true;
		 //window.postMessage("update");
	 }
	
	
}// end class