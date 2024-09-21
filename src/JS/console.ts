"use strict";

import { Loader, MESSAGES } from "./loader";

const VERSION_MAJOR = '0';
const VERSION_MINOR = '3';
const VERSION_MICRO = '1';
const VERSION = String(VERSION_MAJOR + "." + VERSION_MINOR + "." + VERSION_MICRO);

const CURSOR_START = "<span class=\"cursor\">";
const CURSOR_END = "</span>";
const CURSOR_END_CHAR = "&nbsp";

const FPS = 1000/30; // frames per second, update rate

const LOCAL_ADDR = "http://127.0.0.1:5000";  //80";
const LOCAL_ADDR_SSL = "https://127.0.0.1:5443";
//const LOCALHOST = "http://localhost:5000";
//const LOCALHOST_SSL = "https://localhost:5443";



export default class MyConsole extends Object
{
	lineCounter: number;
	cursorPosition: number;
	history: string[];
	currentlyActiveHistoryLine: number;
	firstTimeHistoryUsedFlag: boolean;
	textNode: HTMLElement;
	console: HTMLElement;
	cursorNode: HTMLElement;
	consoleBuffer: string;
	setIntervalId: number;
	lastTimeStamp: DOMHighResTimeStamp;
	updateReqFlag: boolean;
	shiftKeyPressed: boolean;
	selectionStartPos: number;
	selectionEndPos: number;
	selectionActive: boolean;
	currentSelection: string;
	selectionNode: HTMLSpanElement;
	curNode: HTMLSpanElement;
	
	private _normalText: string;
	private _coveredChar: string;
	private _selectedText: string;
	private _afterCurAndSelection: string;

	loader: Loader;

	constructor(_element = window)
	{
		super();

		this.lineCounter = 0; // current number of lines
		this.cursorPosition = 0; // line position of the cursor

		// Command history
		this.history = []; // save the inputs made before
		this.currentlyActiveHistoryLine = (this.history.length - 1); // Position counter by default points to the end of history
		this.firstTimeHistoryUsedFlag = true; // Status flag for first time history usage, important for navigation through history
		
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
			_element.addEventListener("message", function(_e){ return self.handleMessage(_e); } );
			_element.addEventListener("keyup", function(_e){ return self.handleInput(_e); } );

			// Register update function
			//this.setIntervalId = setInterval(this.eventLoop.bind(this), FPS);
                        
            // New Version using "requestAnimationFrame". Initial call must be done manually.
            this.eventLoop2();
		
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
	//	Event loop handler, all update goes here...
    //  New Version, trying to use "requestAnimationFrame"...
    //      
	//
	eventLoop2()
	{
		
		const self = this;

        let timeStamp = performance.now();
		let elapsed = timeStamp - this.lastTimeStamp;
        //console.log(`Elapsed time: ${elapsed}`);
		//console.log(`TimeStamp time: ${timeStamp}`);
		//console.log(`Last Timestamp ${this.lastTimeStamp}`)

		// only update if needed
		if(elapsed > FPS && this.updateReqFlag === true) //
		{
			this.updateCursorLine2(this.textNode, this.consoleBuffer, this.cursorPosition);
			this.lastTimeStamp = (elapsed % FPS); //timeStamp;
			//console.log(`Drawing.... new last timestamp: ${this.lastTimeStamp}`);
		}		
		// Next Frame
		window.requestAnimationFrame(self.eventLoop2.bind(this));
	}



	//	
	// Updates the cursor position and input line. (old version)
	//
	// Parameter:
	//				_textNode        -> The Node to insert the text"" (object)
	//				_buffer          -> The console buffer as string. (String)
	//				_cursorPosition	 -> The current position of the cursor. (current column, Int)
	//
	updateCursorLine(_textNode :HTMLElement, _buffer :string, _cursorPosition :number): string
	{
		const lenBuf :number = _buffer.length;
		//console.log("Länge des Buffer: " + lenBuf);
		const offsetEnd :number = lenBuf - _cursorPosition;
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
	updateCursorLine2(_textNode :HTMLElement, _buffer :string, _cursorPosition :number): string
	{
		const lenBuf :number = _buffer.length;
		//console.log("Länge des Buffer: " + lenBuf);
		const offsetEnd :number = lenBuf - _cursorPosition;
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
	updateBuffer(_chars :string, _cursorPosition :number): string
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
	//				_position - before or after cursor position (true=after (Delete-Key behaviour) | false=before (default) Backspace behaviour)
	//
	_removeCharsFromBuffer(_numChars :number=1, _position :boolean=false): string
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
	printLine(_text :string, _cssClassName :string="")
	{
		// Set up new line content
		let line :HTMLElement = document.createElement("DIV");
		line.innerHTML = _text;
		line.setAttribute("class", _cssClassName);

		//update line counter
		this.lineCounter += 1;

		//set up line id as reference
		line.id = this.lineCounter.toString();

		// Insert new line before the input line.
		this.console.insertBefore(line, this.textNode);
		this.textNode.scrollIntoView({block: "end"});
	}



	/*
		Print JSON data to console, update the line counter. --> TODO
	*/
	printJsonData(_jsonData :any, _cssClassName :string="")
	{
		console.log("In \"printJsonData\" --> Tabelle:");
		console.table(_jsonData); // debug
		
		// Array
		if(_jsonData.length && Array.isArray(_jsonData))
		{	_jsonData.forEach(element => this.printLine(element, _cssClassName)); }
		
		// Dict
		else if(_jsonData.length && typeof(_jsonData) === "object")
		{	_jsonData.keys().forEach((key: string | number) => this.printLine(_jsonData[key], _cssClassName)); }
	}



	//
	// Input Handler Message
	//
	handleMessage(e: MessageEvent<any>)
	{
		//e.preventDefault(); // Dadurch aber keine Browser Tastatur Shortcuts möglich

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
								this.updateReqFlag = true; // better, faster and none blocking
								break;
							}

							case MESSAGES.CLS:
							{
								this._clearConsoleComplete();
								break;
							}

							case MESSAGES.RECEIVE:
							{
								console.log("Received message from backend --> Origin: " + e.origin + " Type: " + e.data.type + " Data: " + e.data.data);
								this.printJsonData(e.data.data, "text info");
								this.printJsonData(e.data.data.error, "text error");
								break;
							}

							case MESSAGES.SEND:
                            {
                                console.log("Got message, send to backend : " + e.origin + " " + e.data.type + " " + e.data.data);
                                // Execute the input
                                this.loader.sendData(URL.parse(e.origin), e.data.data);
								break;
							}
						}
						break;
					}

					default:
					{	break; }

				}// switch e.origin
			}
			default:
			{	break; }
		} // switch e.type
	}

	
	//
	// Input Handler Keyboard
	//
	async handleInput(e: KeyboardEvent)
	{
		//e.preventDefault(); // Dadurch aber keine Browser Tastatur Shortcuts möglich

		switch(e.type)
		{
			case 'keyup':
			{
				e.stopPropagation();

				switch(e.key)
				{
					case "Unidentified": // unknown key
					case "Dead":
					{ break; }

					case "Shift": //Shift-key keyCode 16
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

				switch(e.key)
				{
					case "Unidentified": // unknown key
					case "Dead":
					{ break; }

					case "Enter": // Return / Enter keyCode 13
					{	
						this._handleEnter(e, this.textNode); 
						break;
					}
							
					case "Backspace": // Backspace keyCode 8
					{	
						this._handleBackspace(e, this.textNode);
						break;
					}

					case "Shift": // Shift key (left & right) keyCode 16
					{
						this.shiftKeyPressed = e.shiftKey;
						console.log("Shiftkey: " + this.shiftKeyPressed);
						break;
					}

					case "Home": // Pos1 key keyCode 36
					{
						this._handlePos1Key(e, this.textNode);
						break;
					}

					case "End": // End key keyCode 35
					{
						this._handleEndKey(e, this.textNode);
						break;
					}

					case "ArrowLeft": // Arrow Left keyCode 37
					{
						e.preventDefault();
						//this.shiftKeyPressed = e.shiftKey;
						//console.log("Shiftkey: " + this.shiftKeyPressed);
						this._handleLeftArrowKey(e, this.textNode);
						break;
					}

					case "ArrowUp": // Arrow Up keyCode 38
					{
						e.preventDefault();
						this._handleArrowKeysUpDown(e, true);
						break;
					}
					
					case "ArrowRight": // Arrow Right keyCode 39
					{
						e.preventDefault();
						//this.shiftKeyPressed = e.shiftKey;
						//console.log("Shiftkey: " + this.shiftKeyPressed);
						this._handleRightArrowKey(e, this.textNode);
						break;
					}

					case "ArrowDown": // Arrow Down keyCode 40
					{
						e.preventDefault();
						this._handleArrowKeysUpDown(e, false);
						break;
					}

					case "Delete": // Delete key keyCode 46
					{
						this._handleDeleteKey(e, this.textNode);
						break;
					}

					// TODO Test it
					case "c": // 'c' key keyCode 67
					{
						switch(e.ctrlKey)
						{
							case true:
							{
								// Clipboard write is automatically  granted for active browser tabs.
								navigator.clipboard.writeText(this.currentSelection);
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

					// TODO: Doesn't work in Firefox
					case "v": // 'v' key keyCode 86
					{
						switch(e.ctrlKey)
						{
							case true:
							{
								// Chrome only
								this.updateBuffer(await navigator.clipboard.readText(), this.cursorPosition);
								this.updateReqFlag = true; 

								/*navigator.permissions.query({name:'clipboard-read'}).then((result) => {
									if (result.state === 'granted') 
									{
										this.updateBuffer(clipText, this.cursorPosition);
										this.updateReqFlag = true;
									}
									
									else if (result.state === 'prompt')
									{
										console.log("Clipboard-Read --> Prompt");
										clipboard.permissions.request().then((permission)=>{
											if('granted' === permission)
											{
												this.updateBuffer(clipText, this.cursorPosition);
												this.updateReqFlag = true;
											}
										});
									}
								});

							/*	if('granted' ===)
								{
									Clipboard.readText().then((clipText) => (this.updateBuffer(clipText, this.cursorPosition)));
									this.updateReqFlag = true;
									break;
								}
								else if('denied' !== Clipboard.permission) // status unknown, ask user
								{
									Clipboard.requestPermission().then((permission) => {
										// If the user accepts, lets paste it
										if (permission === "granted")
										{
											Clipboard.readText().then((clipText) => (this.updateBuffer(clipText, this.cursorPosition)));
											this.updateReqFlag = true;
										}
									});
								}
							*/	
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
	_handleChars(_e: KeyboardEvent, _textNode: HTMLElement)
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
		this.updateCursorLine2(this.textNode, this.consoleBuffer, this.cursorPosition);
	}


	//
	// Clear everything written so far. (clear screen)
	//
	_clearConsoleComplete()
	{
		this._clearConsoleLineBuffer();
		
		let lines :NodeListOf<Element> = document.querySelectorAll('.text:not(#text)'); // select all Elements with class = "text" and id != "text"
		
		for(let i=0; i<lines.length; i++)
		{	this.console.firstElementChild.remove(); } // Later todo, find a better way to do this.

		this.lineCounter = 0;
	}

	

	//
	// Handle the "Enter" key. (Future todo: call worker thread with input results)
	//
	_handleEnter(_e: KeyboardEvent, _textNode: HTMLElement): string
	{
		switch(this.consoleBuffer.length)
		{
			case 0:
			{	return; }
			
			default:
			{
				let textBeforeCursor :string = _textNode.innerHTML.slice(0, this.cursorPosition);
				//console.log("Zeile vor Enter: " + beforeCur);

				//handle the "cls" command directly
				if(textBeforeCursor.toLowerCase() === "cls")
				{
					let msg = {type:MESSAGES.CLS,data:""};
					window.postMessage(msg);
				}
				else // everything else sent to loader class
				{
					// Print the line to console and update the line counter accordingly.
					this.printLine(textBeforeCursor, "text");

					let msg = {type:MESSAGES.SEND, data: String(textBeforeCursor)};
					// send the input to loader class
					window.postMessage(msg);
				}

				//Clear the input line buffer and cancle an active text selection
				this._clearConsoleLineBuffer();
				
				// Update command history
				this.history.push(textBeforeCursor); //update history and counter
				this.currentlyActiveHistoryLine = (this.history.length - 1); // += 1 | always reset to the last added entry
				this.firstTimeHistoryUsedFlag = true; // Reset status flag

				return textBeforeCursor; // return the input, text only
			}
		}		
	}
	

	//
	// Handles Backspace to delete the previous entered char.
	//
	_handleBackspace(_e :KeyboardEvent, _textNode :HTMLElement)
	{
		switch(this.selectionActive)
		{
			case true:
			{
				if(this.selectionStartPos > this.cursorPosition)
				{
					// Selected text is after the current cursor position, on the right side
					const len = this.selectionStartPos - this.selectionEndPos;
					console.log(`Length selected text: ${len}`);
					this._removeCharsFromBuffer(len, true);
				}
				else
				{
					// Selected text is in front of the current cursor position, on the left side
					const len = this.selectionEndPos - this.selectionStartPos;
					console.log(`Length selected text: ${len}`);
					this._removeCharsFromBuffer(len, false);
				}
				break;
			}

			case false:
			default:
			{
				this._removeCharsFromBuffer();
				//console.log("Textzeile nach Backspace: " + this.consoleBuffer);
			}
		}
		
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
	_handleDeleteKey(_e :KeyboardEvent, _textNode :HTMLElement)
	{
		switch(this.selectionActive)
		{
			case true:
			{
				if(this.selectionStartPos > this.cursorPosition)
				{
					// Selected text is after the current cursor position, on the right side
					const len = this.selectionStartPos - this.selectionEndPos;
					console.log(`Length selected text: ${len}`);
					this._removeCharsFromBuffer(len, true);
				}
				else
				{
					// Selected text is in front of the current cursor position, on the left side
					const len = this.selectionEndPos - this.selectionStartPos;
					console.log(`Length selected text: ${len}`);
					this._removeCharsFromBuffer(len, false);
				}
				break;
			}

			case false:
			default:
			{
				this._removeCharsFromBuffer(1, true);
				//console.log("Textzeile nach Entf: " + this.consoleBuffer);
				break;
			}
		}
		

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
	_handleLeftArrowKey(_e :KeyboardEvent, _textNode :HTMLElement)
	{	
		// Handle left arrow key, should move the cursor to the left
		if(this.cursorPosition > 0)
		{
			//console.log("| <-- | Am Anfang --> Cursor position: " + this.cursorPosition);

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
						{ // Selection already active, nothing more needs to be done here. 
							break; 
						}

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
	} // _handleLeftArrowKey(_e, _textNode)


	//
	// Move cursor to the right, take care of an active selection if needed.
	//
	_handleRightArrowKey(_e :KeyboardEvent, _textNode :HTMLElement)
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
	// Scrolling the history
	// Parameter:
	//				_e -> Event object
	//				_dir -> direction, default is true, arrow key [up], false is opposite
 	//
	//
	// 
	_handleArrowKeysUpDown(_e :KeyboardEvent, _dir :boolean=true)
	{
		const historyMaxIndex = this.history.length-1; // max selectable value index
		let entry = "";


		if(0 < this.history.length)
		{
			//decide whats next
			switch(_dir)
			{
				case false: // from first to last entry (down-key)
				{

					// Point to next element if possible, update scroll direction
					if(historyMaxIndex > this.currentlyActiveHistoryLine)
					{	this.currentlyActiveHistoryLine = this.currentlyActiveHistoryLine + 1; }
					break; 
				}

				case true: // from last to first entry (up-key)
				default:
				{
					// Already reached the first entry in history?
					if(0 < this.currentlyActiveHistoryLine && false === this.firstTimeHistoryUsedFlag)
					{	this.currentlyActiveHistoryLine = (this.currentlyActiveHistoryLine - 1); }
					break;
				}
			}
			
			// get current entry
			entry = this.history[this.currentlyActiveHistoryLine];
			// set the usage flag
			this.firstTimeHistoryUsedFlag = false;

			//Update the line
			this.selectionActive = false;
			this._clearConsoleLineBuffer();
			this.updateBuffer(entry, this.cursorPosition);
			this.updateReqFlag = true;
		}
		return;
	}


	 //
	 // Pos1 key, set cursor to the begin of the line.
	 //
	_handlePos1Key(_e :KeyboardEvent, _textNode :HTMLElement)
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
	_handleEndKey(_e :KeyboardEvent, _textNode :HTMLElement)
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
