from sandbox.cherrypy_server import getWebPath
from sandbox.cherrypy_server.table import Contents, Table
import cherrypy


if __name__ == '__main__':

    class Root(object):
        pass

    r = Root()
    r.foo = Contents()


    class Sandbox(object):

        table = Table()
        contents = r

        @cherrypy.expose
        def index(self):
            return """<html>
<head>
        <title>Sandbox</title>
</head>
<body>Hello, world!</body>
</html>"""

    config = {
        "global": {
            "server.socket_host": "0.0.0.0",
            "server.socket_port": 9090,
        },
        "/": {
            "tools.staticdir.root": getWebPath(),
        },
        "/contents": {
            "request.dispatch": cherrypy.dispatch.MethodDispatcher(),
        },
        "/extjs": {
            "tools.staticdir.on": True,
            "tools.staticdir.dir": "dist/ext-4.2.1",
        },
        "/sandbox": {
            "tools.staticdir.on": True,
            "tools.staticdir.dir": "js",
        },
    }

    cherrypy.quickstart(Sandbox(), config=config)