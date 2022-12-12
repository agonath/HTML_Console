import subprocess
import sys
import asyncio
import time
from urllib.request import Request
import json

from flask import Flask, render_template, request, redirect, session

#_cwd = dirname(abspath(__file__))


 # save the system streams
saveOut = sys.stdout
saveIn = sys.stdin
saveError = sys.stderr

SECRET_KEY = "Super Duper Secret Key" #TODO: Change this, secret key to sign Flask's sessions
RANDOM_KEY = "not Random" #TODO: Change this

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

        jsonResult : dict = {}

        result = asyncio.run(execute(request.json))

        counter:int = 0
        for line in result:
           jsonResult[str(counter)] = line
           counter += 1
        
        for item in jsonResult.items():
            print(item)

        return json.dumps(jsonResult, ensure_ascii=False)

    else:
        return render_template('index.html') 




"""
    Führt das übergebene Kommando aus.

    TODO: Im Moment keine Input-Nachfragen (interaktiv) möglich.

"""
async def execute(param:str) -> list:

    print("In Funktion execute...")

    result:list = []
    processOutput = None
    cdFlag :bool = False

    if(param.startswith("cd ")):
        cdFlag=True

    try:
        if(CHANGE_DIR == True and cdFlag == True):
            pass #processOutput = TODO
        else:
            processOutput = subprocess.run(param, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=False, check=True, timeout=120, shell=True)

        # Output
        if(processOutput.stdout is not None):

            for line in processOutput.stdout.decode('cp850', 'backslashreplace').split("\n"): # Todo Linux und Windows einzeln behandeln
                result.append(await escape2HTML(line.strip('\r')))
        return result

    # Error-Channel
    except(subprocess.CalledProcessError) as error:

        print(f"Error: {error.args} --> StdError: {error.stderr}")

        for line in error.stderr.decode('utf-8', 'backslashreplace').split("\n"):
            result.append(await escape2HTML(line.strip('\r')))
        
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
    flaskApp.config.from_object(__name__)
    flaskApp.run(host="127.0.0.1", port="5000")