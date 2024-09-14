"use strict";

// Enum for possible messages.
const enum MESSAGES { NONE=0, UPDATE=1, CLS=2, SEND=3, RECEIVE=4 };

//
// TODO class for receive and send messages to server
// This version is just for demo....
// 

class Loader extends Object
{
    private result :string;
    private allowedServers :string[];

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
        //const self = this; // needed to keep the reference of this to our console class object
        //addEventListener("message", function(_e){ return self.handleEvent(_e);});
    }


    //
    // Send data to server using the fetch api.
    //
    // _server = Server address
    // _data = Data to be sent as JavaScript-Object
    // _method = GET / POST ....
    //
    //
    //
    public async sendData(_server, _data, _method :string ='POST')
    {
        let payload :RequestInit = {
                        method: _method,
                        cache: 'no-cache',
                        headers: {'Content-Type':'application/json;charset=utf-8'},
                        body: JSON.stringify(_data)
                      }

        let response = await fetch(_server, payload);

        console.log("ReceiveData -> response.status: " + response.status);
        this.receiveData(await response.json(), response.type, response.status);
    }


    // TODO
    // Send results from server to console.
    //
    public async receiveData(_data, _type :ResponseType, _status :number)
    {
        let msg = {type:MESSAGES.RECEIVE, data:_data, status:_status};
        window.postMessage(msg); // TODO check origin
        console.log("In sendResultTo Console mit Nachricht: " + msg + " und Daten: " + JSON.stringify(_data));
    }

    // Event handler -- not used at the moment
 /*   handleEvent(_event)
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
                            case MESSAGES.SEND:
                            {
                                console.log("Loader - Message received: " + _event.data.type + " " + _event.data.data);
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
    } */
}
