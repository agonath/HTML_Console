from flask import Flask, render_template, request, redirect, session

#_cwd = dirname(abspath(__file__))

SECRET_KEY = "Super Duper Secret Key" #TODO: Change this, secret key to sign Flask's sessions
RANDOM_KEY = "not Random" #TODO: Change this


app = Flask(__name__)
app.config.from_object(__name__)

@app.route("/", methods=['GET', 'POST'])
def index():

    if(request.method == 'POST'):
        return "Hello World"
    else:
         return render_template('index.html')


# TODO
class MyApp ():

    def __init__(self):
        pass


if __name__ == "__main__":
    app.run(host="127.0.0.1", port="5000")