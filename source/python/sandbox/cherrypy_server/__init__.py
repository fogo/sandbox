import os


def getWebPath():
    current = os.path.abspath(os.path.dirname(__file__))
    web_path = os.path.join(current, "..", "..", "..", "web")
    return web_path