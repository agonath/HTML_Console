import sys
from flask import Flask, render_template, request, redirect, session

#_cwd = dirname(abspath(__file__))


 # save the system streams
saveOut = sys.stdout
saveIn = sys.stdin
saveError = sys.stderr

# set std streams, defaults to system values
sys.stdout = _stdout
sys.stdin = _stdin
sys.stderr = _stderror

SECRET_KEY = "Super Duper Secret Key" #TODO: Change this, secret key to sign Flask's sessions
RANDOM_KEY = "not Random" #TODO: Change this

flaskApp = Flask(__name__);

@flaskApp.route("/", methods=['GET', 'POST'])
def index():
    return app.index(request); 

    

class MyApp(object):

    __slots__ = ["_connected"]

    def __init__(self):
        self._connected = False
    

    def index(self, request):

        if(request.method == 'POST' and self._connected == True):
            return self.execute(request.json); # Todo asynchron machen
        else:
            self._connected = True;
            return render_template('index.html')

    
    """
        Execute something
        Parameter: String --> what to execute
    """
    def execute(self, String:_param):
        try:
            #Todo
        except(e):
            return sys.stderr


if __name__ == "__main__":
    #sys.argv --> Parameter
    app = MyApp();
    flaskApp.config.from_object(__name__)
    flaskApp.run(host="127.0.0.1", port="5000")