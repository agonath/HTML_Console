"use strict";

//export {myLoader as default};
//export {Loader};
//export {LOADER_MESSAGES};


// Enum for possible messages.
//const LOADER_MESSAGES = { NONE:0, LOADER_EXECUTE:1, LOADER_RESULT:2 };
//Object.freeze(LOADER_MESSAGES);


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

        // Debug
        for(var x in this.allowedServers)
        {   console.log(this.allowedServers[x]); }
    }


    //
    // Init stuff...
    //
    init()
    {
        const self = this; // needed to keep the reference of this to our console class object
        //addEventListener("message", function(_e){ return self.handleEvent(_e);});
    }


    //
    // Send data to server using the fetch api.
    //
    // _server = Server address
    // _data = Data to be sent in JSON format
    // _method = GET / POST ....
    //
    //
    //
    async sendData(_server, _data, _method='POST')
    {
        let payload = {
                        method: _method,
                        cache: 'no-cache',
                        headers: {'Content-Type':'application/json;charset=utf-8'},
                        body:_data
                      }

        let response = await fetch(_server, payload);
        
        if(response.ok === false)
        {   
            this.sendResultToConsole(response.status);
            this.sendResultToConsole(response.statusText);
            return;
        }

        this.sendResultToConsole(response.status);
        this.sendResultToConsole(await response.text());


        return;
    }


    // TODO
    // Send results from server to console.
    //
    sendResultToConsole(_data)
    {
        let msg = {type:MESSAGES.LOADER_RESULT, data:_data};
        //let msg = String('{"type":' + LOADER_MESSAGES.LOADER_EXECUTE + ',"data":"' + beforeCur + '"}');
        //let jsonMsg = JSON.parse(msg);
        console.log("In sendResultTo Console mit Nachricht: " + msg);
        window.postMessage(msg);
        return;
    }

    // Event handler
    handleEvent(_event)
    {
        switch(_event.type)
        {
            case 'message': //handle messages only -- 
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
                        switch(_event.data.type)
                        {
                            case MESSAGES.LOADER_EXECUTE:
                            {
                                console.log("Message received: " + _event.data.type + " " + event.data.data);
                                // Execute the input
                                this.sendData(_event.origin, _event.data.data);                              
                                break;
                            }

                            default:
                            { return; }
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