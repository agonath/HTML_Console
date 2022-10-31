from asyncio.windows_events import NULL
import sys
import os
import asyncio
from urllib.request import Request

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
        return asyncio.run(execute(request.json))
    else:
        return render_template('index.html') 




"""
    Führt das übergebene Kommando aus.

    TODO: Im Moment keine Input-Nachfragen (interaktiv) möglich.

"""
async def execute(param:str) -> str:

    print("In Funktion execute...")
       
    proc = await asyncio.create_subprocess_shell(param, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)

    stdOut, stdError = await proc.communicate()

    if(stdOut != NULL):
        print(f'[stdOut]\n{stdOut}')
        return stdOut

    elif(stdError != NULL):
        print(f'[stdError]\n{stdError}')
        return stdError





if __name__ == "__main__":
    #sys.argv --> Parameter
    flaskApp.config.from_object(__name__)
    flaskApp.run(host="127.0.0.1", port="5000")