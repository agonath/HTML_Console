from asyncio.windows_events import NULL
import subprocess
import sys
import os
import asyncio
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

connected : bool = False


flaskApp = Flask(__name__)

@flaskApp.route("/", methods=['GET', 'POST'])
def index():
    if(request.method == 'POST'):

        jsonResult : dict = {}

        result = asyncio.run(execute(request.json))

        for line in result:
            jsonResult["line"] = line
        
       # for (key, value) in jsonResult:
        #    print(key + " : " + value)

        return json.dumps(jsonResult)

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
        if(processOutput.stdout is not None and processOutput.stdout != NULL):
        
            for line in processOutput.stdout.split("\n"):
                result.append(line)

            for line in result:
                print(f"Zeile gefunden: {line}")

        return result

    # Error-Channel
    except(subprocess.CalledProcessError) as error:

        print(f"Error: {error.args} --> StdError: {error.stderr}")
        return result





if __name__ == "__main__":
    #sys.argv --> Parameter
    flaskApp.config.from_object(__name__)
    flaskApp.run(host="127.0.0.1", port="5000")