import sys
from flask import Flask, render_template, request, redirect, session

#_cwd = dirname(abspath(__file__))


 # save the system streams
saveOut = sys.stdout
saveIn = sys.stdin
saveError = sys.stderr

SECRET_KEY = "Super Duper Secret Key" #TODO: Change this, secret key to sign Flask's sessions
RANDOM_KEY = "not Random" #TODO: Change this

connected : bool = False


flaskApp = Flask(__name__);

@flaskApp.route("/", methods=['GET', 'POST'])
def index():
    if(request.method == 'POST'):
        return execute(request.json); # Todo asynchron machen
    else:
        return render_template('index.html') 


def execute(param:str) -> str:
     try:
        #Todo
        sys.stdin.write(param);
        return str(sys.stdout);

     except(Exception):
        return str(sys.stderr)
    


if __name__ == "__main__":
    #sys.argv --> Parameter
    flaskApp.config.from_object(__name__)
    flaskApp.run(host="127.0.0.1", port="5000")