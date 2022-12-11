import subprocess
import sys
import os
import asyncio
import time
from urllib.request import Request
import json
import html

from flask import Flask, render_template, request, redirect, session

#_cwd = dirname(abspath(__file__))


 # save the system streams
saveOut = sys.stdout
saveIn = sys.stdin
saveError = sys.stderr

SECRET_KEY = "Super Duper Secret Key" #TODO: Change this, secret key to sign Flask's sessions
RANDOM_KEY = "not Random" #TODO: Change this

connected :bool = False

# HTML Escape Chars
replaceChars :dict = {'&':'&amp;', '"':'&#34;', '\'':'&#39;', '<':'&lt;', '>':'&gt;', 'ä':'&auml;', 'ö':'&ouml;', 'ü':'&uuml;', 'Ä':'&Auml;', 'Ö':'&Ouml;', 'Ü':'&Uuml;', 'ß':'&szlig;'}


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
        
       # for item in jsonResult.items():
        #    print(item)

        #print(json.dumps(jsonResult))

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


    try:
        processOutput = subprocess.run(param, stdout=subprocess.PIPE, shell=True, stderr=subprocess.PIPE, text=True, check=True, timeout=120) 

        # Output
        if(processOutput.stdout is not None):
            
            for line in processOutput.stdout.split("\n"):
                result.append(await escape2HTML(line))
            
        return result

    # Error-Channel
    except(subprocess.CalledProcessError) as error:

        print(f"Error: {error.args} --> StdError: {error.stderr}")

        for line in error.stderr.split("\n"):
            result.append(await escape2HTML(line))

        return result



"""
    Umlaute, Sonderzeichen ersetzen
"""
async def escape2HTML(_inputString :str) -> str:

    tempString :str

    for key, value in replaceChars.items():
        tempString = _inputString.replace(key , value)

    return tempString




if __name__ == "__main__":
    #sys.argv --> Parameter
    flaskApp.config.from_object(__name__)
    flaskApp.run(host="127.0.0.1", port="5000")