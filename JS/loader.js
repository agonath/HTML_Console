"use strict";

//export {myLoader as default};
//export {Loader};
//export {LOADER_MESSAGES};


// Enum for possible messages.
const LOADER_MESSAGES = { NONE:0, LOADER_EXECUTE:1, LOADER_RESULT:2 };
Object.freeze(LOADER_MESSAGES);


//
// TODO class for receive and send messages to server
// 

class Loader extends Object
{
    constructor(_serverAddr=("127.0.0.1:80"))
    {
        super();
        
        this.result="";
        this.allowedServers = _serverAddr;
    }


    //
    // Init stuff...
    //
    init()
    {
        const self = this; // needed to keep the reference of this to our console class object
        console.log("Loader: " + this);
        addEventListener("message", function(_e){ return self.handleEvent(_e);});
    }


    // TODO
    // Execute a command
    //
    async executeCmd(_data)
    {
        let cmdProm = await fetch(SERVER_ADDR, _data);
        this.result = await Response.text();
        this.sendResultToConsole(this.result);
        return;
    }


    // TODO
    // Send results from server to console.
    //
    sendResultToConsole(_data)
    {
        let msg = {"type":LOADER_MESSAGES.LOADER_RESULT, "data":_data};
        window.postMessage(msg, SERVER_ADDR);
        return;
    }

    // Event handler
    handleEvent(_event)
    {
        switch(_event.type)
        {
            case 'message': //handle messages only
            {
                switch(_event.origin)
                {
                    case (_event.origin in this.allowedServers):
                    {
                        switch(_event.data)
                        {
                            case LOADER_MESSAGES.LOADER_EXECUTE:
                            {
                                // TODO: implement this
                                console.log("Message received: " + _event.data)
                                if(_event.data.msg === LOADER_MESSAGES.LOADER_EXECUTE)
                                {
                                    this.executeCmd(_event.data.data);
                                }
                                break;
                            }

                            default:
                            {   return; }
                        }

                    }
                }
                break;
            }// case 'message'

            default:
            {   return; }
        }
    }
}


//var myLoader = new Loader();