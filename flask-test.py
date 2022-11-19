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
       
    #proc = await asyncio.create_subprocess_shell(param, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)

    proc2 = subprocess.run(param, stdout=subprocess.PIPE, shell=True, stderr=subprocess.PIPE, text=True, check=True, timeout=120)

    #stdOut, stdError = await proc.communicate()

    stdout2 = proc2.stdout
    stderror2 = proc2.stderr

   # stdOutNew = stdOut.decode()
   # stdErrorNew = stdError.decode()

    #print("Neuer STDOUT String: " + stdOutNew)

    # Output
    #if(stdOutNew != NULL):
    if(stdout2 is not None and stdout2 != NULL):
        #print(f'[stdOut]\n{stdOut}')
        
        for line in stdout2.split("\n"):
            result.append(line)

        for line in result:
            print(f"Zeile gefunden: {line}")

        return result

    

    # Errors
    elif(stderror2 != NULL and stderror2 is not None):
       # print(f'[stdError]\n{stdError}')

        for line in stderror2.split(os.linesep):
          # result.append[line]
          print(line)

        return result





if __name__ == "__main__":
    #sys.argv --> Parameter
    flaskApp.config.from_object(__name__)
    flaskApp.run(host="127.0.0.1", port="5000")