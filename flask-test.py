from flask import Flask, render_template

#_cwd = dirname(abspath(__file__))

SECRET_KEY = "Super Duper Secret Key" #TODO: Change this, secret key to sign Flask's sessions
RANDOM_KEY = "not Random" #TODO: Change this


app = Flask(__name__)

@app.route("/")
def index():
    return "Hello World" #render_template("index.html")

class MyApp ():

    def __init__(self):
        pass


if __name__ == "__main__":
    app.run(host="127.0.0.1", port="80")