
import sys
import os
from urllib.request import Request
import json
#import webbrowser
from shlex import quote
import secrets

# flask stuff
from flask import Flask, render_template, request, redirect, session
# console stuff
from console.console import *
from console.cd import *

#_cwd = dirname(abspath(__file__))

# active user list
activeUserList :dict = {}

# OS selection
WINDOWS :int = 1
UNIX :int = 2
currentOS = 1
execFunc = None

SECRET_KEY = "Super Duper Secret Key" #TODO: Change this, secret key to sign Flask's sessions
RANDOM_VALUE = secrets.token_urlsafe(32)


"""
    Web-Console, Befehle ausführen
"""

flaskApp = Flask(__name__)

@flaskApp.route("/", methods=['GET', 'POST'])
def webConsole():
    if(request.method == 'POST'):

        print(f"Json sent: {request.json}")
        result = asyncio.run(execFunc(request.json, request.json.split(' ')[0])) # Name = alles bis zu ersten Leerzeichen (der aufgerufene Befehl)

        return json.dumps(result, ensure_ascii=False)
    else:
        return render_template('console.html')


"""
    Main entry point
"""
if __name__ == "__main__":
    #sys.argv --> Parameter

    # Select the correct Exec-Funktion for the current used OS.
    if(os.name== "nt"):
        currentOS = WINDOWS
        execFunc = executeWindows

    elif(os.name == "posix"):
        currentOS = UNIX
        execFunc = executeUnix

    registerCommand("cd", cd)
    registerCommand("cd..", cd) # should also work
    

    flaskApp.config.from_object(__name__)
    flaskApp.run(host="127.0.0.1", port="5000")
    #webbrowser.open("http://127.0.0.1:5000")
