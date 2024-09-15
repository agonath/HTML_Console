"use strict";
;
//
// TODO class for receive and send messages to server
// This version is just for demo....
// 
export class Loader extends Object {
    result;
    allowedServers;
    constructor(_serverAddrArray = ["127.0.0.1:80"]) {
        super();
        this.result = "";
        for (let x in _serverAddrArray.keys) {
            if (URL.canParse(_serverAddrArray[x])) {
                this.allowedServers.push(URL.parse(_serverAddrArray[x]));
                // Debug
                console.log(`Add server adress: ${this.allowedServers[x]}`);
            }
        }
    }
    /*
    * Helper, check if URL is in our allowed URLs list.
    */
    isURLAllowed(_url = "") {
        for (let entry in this.allowedServers) {
            if (this.allowedServers[entry].host === _url) {
                return true;
            }
        }
        return false;
    }
    //
    // Init stuff...
    //
    init() {
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
    async sendData(_server, _data, _method = 'POST') {
        // Check URL first
        if (true === this.isURLAllowed(_server.host)) {
            let payload = {
                method: _method,
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json;charset=utf-8' },
                body: JSON.stringify(_data)
            };
            let response = await fetch(_server, payload);
            console.log("ReceiveData -> response.status: " + response.status);
            this.receiveData(await response.json(), response.type, response.status, response.url);
        }
    }
    // TODO
    // Send results from server to console.
    //
    async receiveData(_data, _type, _status, _url) {
        // Check URL first
        if (true === this.isURLAllowed(_url)) {
            const msg = {
                type: 4 /* MESSAGES.RECEIVE */,
                data: _data,
                status: _status
            };
            window.postMessage(msg, _url);
            console.log(`In sendResultTo Console von URL: ${_url} mit Nachricht: ${msg} und Daten: ${JSON.stringify(_data)}`);
        }
    }
}
//# sourceMappingURL=loader.js.map