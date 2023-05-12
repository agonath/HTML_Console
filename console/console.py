import subprocess
import sys
import os
import asyncio
import time

# save the system streams
saveOut = sys.stdout
saveIn = sys.stdin
saveError = sys.stderr

#
# Process info struct - not used yet
#
class Process():
    name :str = ""
    pid :int = 0
    proc :subprocess.Popen = None
    running :bool = False
    result :dict = {"info":[], "error":[]}


    def Process(self, _name :str):
        self.name = _name



# process list
processList :dict = {}

# known commands list
commandList:dict = {}


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


escapeChars :dict = {
                        '\\': '\\\\',
                        '"': '\\\"',
                        '\'': '\\\''
}



"""
    Umlaute, Sonderzeichen ersetzen
    TODO: Find a more efficient way
"""
def escape2HTML(_inputString :str) -> str:

    tempString :str = _inputString

    for key, value in replaceChars.items():
        tempString = tempString.replace(key , value)

    return tempString

"""
    Umlaute, Sonderzeichen ersetzen - Windows
"""
async def escapeWindows(_inputString :str) -> str:

    tempString :str = _inputString

    for key, value in escapeChars.items():
        tempString = tempString.replace(key , value)

    return tempString




#
#   Registriert ein Befehl
#
#   Besteht aus Name (String) und einem Funktionszeiger zur Ausführung des Befehls 
#
def registerCommand(_name:str, _ptr_function:any):
    if(len(_name) > 0):
        try:
            commandList[_name] = _ptr_function
            print("Command {0} - added...".format(_name))
        
        except LookupError as e:
            print("Command {0} already known.".format(_name))




"""
    Holt alle Ausgaben eines Prozess ab.
"""
async def getProcessInformation(_process :subprocess.Popen):
    
    result :dict = {"info":[], "error":[]}

    # get pipe values
    stdout, stderror = _process.communicate(_process.stdin);
    # check und collect results
    
    for line in stdout.split("\n"):
        result["info"].append(await escape2HTML(line.strip('\r')))

    for line in stderror.split("\n"):
        result["error"].append(await escape2HTML(line.strip('\r')))
    
    return result




"""
    TODO

    Führt das übergebene Kommando aus. --- Windows

    TODO: Im Moment keine Input-Nachfragen (interaktiv) möglich.

"""
def executeWindows_2(_param:str, _name:str) -> dict:

    print("In Funktion execute Windows 2 neue Version...")

    if(processList.get(_name) != None):
        # Prozess existiert noch, mit diesem weitermachen
        processList[_name]

        pass
    else:
        # neuen prozess anlegen
        processList[_name].proc = subprocess.Popen(_param, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=False, check=True, timeout=120, shell=True, encoding="cp850")
        processList[_name].running = True
        pass


    result :dict = None
    #process = None

    try:
        if(_param == "cd .." or _param == "cd.."):
            os.chdir(os.pardir)
            result["info"].append(os.getcwd())
        
        elif(_param.startswith("cd ")):
            os.chdir(_param[3:])
            result["info"].append(os.getcwd())

        else:
            processList[_name] = subprocess.Popen(_param, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=False, check=True, timeout=120, shell=True, encoding="cp850")
            print(f"Name: {_name} Prozess: {processList[_name]}")
            # Output
            if(processList[_name].stdout is not None):

                for line in processList[_name].stdout.split("\n"):
                    result["info"].append(escape2HTML(line.strip('\r')))
        
        return result

    # Error from cd
    except(OSError) as error:
        result["error"].append(error.strerror)
        return result

    # StdError-Channel
    except(subprocess.CalledProcessError) as error:

        print(f"Error: {error.args} --> StdError: {error.stderr}")

        for line in error.stderr.split("\n"):
            result["error"].append(escape2HTML(line.strip('\r')))
        
        return result



"""
    Führt das übergebene Kommando aus. --- Windows



    TODO: Im Moment keine Input-Nachfragen (interaktiv) möglich.

"""
async def executeWindows(_param:str, _name:str) -> dict:

    print("In Funktion execute Windows...")

    result :dict = {"info": [], 'error': []}
    process = None

    try:

        try:
            # known command
            await commandList[_name](_param, result);
            return result
        
        except LookupError:
            # everthing else                                
            p :str = await escapeWindows(_param)
            process = subprocess.run(p, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=False, check=True, timeout=120, shell=True, encoding="cp850")
            
            # Output
            if(process.stdout is not None):
                for line in process.stdout.split("\n"):
                    result["info"].append(escape2HTML(line.strip('\r')))
        
            return result

    # StdError-Channel
    except(subprocess.CalledProcessError) as error:

        print(f"Error: {error.args} --> StdError: {error.stderr}")

        for line in error.stderr.split("\n"):
            result["error"].append(escape2HTML(line.strip('\r')))
        
        return result


"""

    Führt das übergebene Kommando aus - Unix/Linux

"""
async def executeUnix(_param:str, _name:str) -> dict:

    print("In Funktion execute Windows...")

    result :dict = {"info": [], 'error': []}
    processOutput = None
    cdFlag :bool = False

    try:
        try:
            # known command
            await commandList[_name](_param, result);
            return result
        
        except LookupError:
            # everthing else
            processOutput = subprocess.run(quote(_param), stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=False, check=True, timeout=120, shell=True, encoding="utf-8")

            # Output
            if(processOutput.stdout is not None):
                for line in processOutput.stdout.split("\n"):
                    result["info"].append(escape2HTML(line))

            return result
        
    # StdError-Channel
    except(subprocess.CalledProcessError) as error:

        print(f"Error: {error.args} --> StdError: {error.stderr}")

        for line in error.stderr.split("\n"):
            result["error"].append(escape2HTML(line))
        
        return result
