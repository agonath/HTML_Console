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
    constructor(_serverAddr=["127.0.0.1:80"])
    {
        super();
        
        this.result="";
        this.allowedServers = _serverAddr;

        for(var x in this.allowedServers)
        {   console.log(this.allowedServers[x]); }
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
    async executeCmd(_server, _data)
    {
        let payload = {
                        method: 'POST',
                        headers: {'Content-Type':'application/json;charset=utf-8'},
                        body:_data
                      }

        let cmdProm = await fetch(_server, payload); // TODO: Error handling....
        this.result = await Response.text(); // TODO
        this.sendResultToConsole(this.result); // TODO
        return;
    }


    // TODO
    // Send results from server to console.
    //
    sendResultToConsole(_server, _data)
    {
        let msg = {"type":LOADER_MESSAGES.LOADER_RESULT, "data":_data};
        window.postMessage(msg, _server);
        return;
    }

    // Event handler
    handleEvent(_event)
    {
        switch(_event.type)
        {
            case 'message': //handle messages only
            {
                let allowedOrigin = false;
                for(var x in this.allowedServers)
                {
                    if(_event.origin.toLowerCase() === this.allowedServers[x])
                    {   allowedOrigin = true; }
                }
        
                // DEBUG
                console.log("Origin in allowed servers: " + allowedOrigin + " origin: " + _event.origin);

                switch(allowedOrigin)
                {
                    case (true):
                    {
                        switch(_event.data.msg)
                        {
                            case LOADER_MESSAGES.LOADER_EXECUTE:
                            {
                                console.log("Message received: " + _event.data.msg + " " + event.data.data);
                                // Execute the input
                                this.executeCmd(_event.origin, _event.data.data);
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