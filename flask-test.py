import subprocess
import sys
import os
import asyncio
import time
from urllib.request import Request
import json
#import webbrowser

from flask import Flask, render_template, request, redirect, session

#_cwd = dirname(abspath(__file__))


 # save the system streams
saveOut = sys.stdout
saveIn = sys.stdin
saveError = sys.stderr

SECRET_KEY = "Super Duper Secret Key" #TODO: Change this, secret key to sign Flask's sessions
RANDOM_KEY = "not Random" #TODO: Change this

# OS selection
WINDOWS :int = 1
UNIX :int = 2
currentOS = 1
execFunc = None

# Change directory allowed?
CHANGE_DIR = True

connected :bool = False

# HTML / Unicode Escape Chars
# Add more if needed.
replaceChars :dict = {
                        '&':    '&amp;', 
                        '"':    '&#34;', 
                        '\'':   '&#39;', 
                        '<':    '&lt;', 
                        '>':    '&gt;', 
                        '\\x84':'&auml;', # windows terminal problem 'ä'
                        'ä':    '&auml;', 
                        '\\x94':'&ouml', # windows terminal problem 'ö'
                        'ö':    '&ouml;',
                        '\\x81':'&uuml;', # windows terminal problem 'ü'
                        'ü':    '&uuml;',
                        '\\x8e':'&Auml;', # windows terminal problem 'Ä'
                        'Ä':    '&Auml;',
                        '\\x9a':'&Ouml', # windows terminal problem 'Ö'
                        'Ö':    '&Ouml;',
                        '\\x99':'&Uuml', # windows terminal problem 'Ü'
                        'Ü':    '&Uuml;',
                        '\\xe1':'&szlig', # windows terminal problem 'ß' 
                        'ß':    '&szlig;'
                    }


flaskApp = Flask(__name__)

@flaskApp.route("/", methods=['GET', 'POST'])
def index():
    if(request.method == 'POST'):

        result = asyncio.run(execFunc(request.json))

        return json.dumps(result, ensure_ascii=False)

    else:
        return render_template('index.html') 




"""
    Führt das übergebene Kommando aus. --- Windows

    TODO: Im Moment keine Input-Nachfragen (interaktiv) möglich.

"""
async def executeWindows(_param:str) -> dict:

    print("In Funktion execute Windows...")

    result :dict = {"info": [], 'error': []}
    processOutput = None

    try:
        if(_param == "cd .." or _param == "cd.."):
            os.chdir(os.pardir)
            result["info"].append(os.getcwd())
        
        elif(_param.startswith("cd ")):
            os.chdir(_param[3:])
            result["info"].append(os.getcwd())

        else:
            processOutput = subprocess.run(_param, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=False, check=True, timeout=120, shell=True, encoding="cp850")

            # Output
            if(processOutput.stdout is not None):

                for line in processOutput.stdout.split("\n"):
                    result["info"].append(await escape2HTML(line.strip('\r')))
        
        return result

    # Error from cd
    except(OSError) as error:
        result["error"].append(error.strerror)
        return result

    # StdError-Channel
    except(subprocess.CalledProcessError) as error:

        print(f"Error: {error.args} --> StdError: {error.stderr}")

        for line in error.stderr.split("\n"):
            result["error"].append(await escape2HTML(line.strip('\r')))
        
        return result


"""

    Führt das übergebene Kommando aus - Unix/Linux

"""
async def executeUnix(_param:str) -> dict:

    print("In Funktion execute Windows...")

    result :dict = {"info": [], 'error': []}
    processOutput = None
    cdFlag :bool = False

    try:
        if(_param == "cd .."):
            os.chdir(os.pardir)
            result["info"].append(os.getcwd())
        
        elif(_param.startswith("cd ")):
            os.chdir(_param[3:])
            result["info"].append(os.getcwd())

        else:
            processOutput = subprocess.run(_param, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=False, check=True, timeout=120, shell=True, encoding="utf-8")

            # Output
            if(processOutput.stdout is not None):

                for line in processOutput.stdout.split("\n"):
                    result["info"].append(await escape2HTML(line))

        return result

    # Error from cd
    except(OSError) as error:
        result["error"].append(error.strerror)
        return result
        
    # StdError-Channel
    except(subprocess.CalledProcessError) as error:

        print(f"Error: {error.args} --> StdError: {error.stderr}")

        for line in error.stderr.split("\n"):
            result["error"].append(await escape2HTML(line))
        
        return result


"""
    Umlaute, Sonderzeichen ersetzen
    TODO: Find a more efficient way
"""
async def escape2HTML(_inputString :str) -> str:

    tempString :str = _inputString
    print(f"Temp-String {tempString}")

    for key, value in replaceChars.items():
        tempString = tempString.replace(key , value)

    return tempString




if __name__ == "__main__":
    #sys.argv --> Parameter

    # Select the correct Exec-Funktion for the current used OS.
    if(os.name== "nt"):
        currentOS = WINDOWS
        execFunc = executeWindows

    elif(os.name == "posix"):
        currentOS = UNIX
        execFunc = executeUnix
    

    flaskApp.config.from_object(__name__)
    flaskApp.run(host="127.0.0.1", port="5000")
    #webbrowser.open("http://127.0.0.1:5000")
