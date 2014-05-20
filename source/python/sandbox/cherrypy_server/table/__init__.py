import json
import os
import cherrypy
from sandbox.cherrypy_server import getWebPath


PATH_COLUMN = 0
PATH_ANNULUS = 1

barriers = {
    1: {
        "name": "Barreira 1",
        "acronym": "B01",
        "description": "primeira",
        "path": PATH_COLUMN,
        "author": "alice",
        "official": True,
    },
    2: {
        "name": "Barreira 2",
        "acronym": "B02",
        "description": "segunda",
        "path": PATH_ANNULUS,
        "author": "bob",
        "official": False,
    },
}


class Contents(object):

    exposed = True

    def GET(self, *args, **kwargs):
        # start, _dc, limit, page

        def ItemDump(k, v):
            vv = v.copy()
            vv["id"] = k
            return vv

        barriers_dump = [ItemDump(k, v) for k, v in barriers.iteritems()]

        return json.dumps({
            "data": barriers_dump,
            "meta": {
                "total": len(barriers_dump),
                "success": True,
            },
        })


    def PUT(self, *args, **kwargs):
        raw = cherrypy.request.body.read()
        parsed = json.loads(raw)

        for client_barrier in parsed:
            barrier_id = client_barrier.pop("id")
            barriers[barrier_id] = client_barrier

        return json.dumps({
            "meta": {
                "total": len(barriers),
                "success": True,
            },
        })


    def POST(self, *args, **kwargs):
        raw = cherrypy.request.body.read()
        parsed = json.loads(raw)

        for client_barrier in parsed:
            barrier_id = client_barrier.pop("id")
            barriers[barrier_id] = client_barrier

        return json.dumps({
            "meta": {
                "total": len(barriers),
                "success": True,
            },
        })


    def DELETE(self, *args, **kwargs):
        for barrier_id in args:
            barrier_id = int(barrier_id)
            del barriers[barrier_id]

        return json.dumps({
            "meta": {
                "total": len(barriers),
                "success": True,
            },
        })



class Table(object):

    @cherrypy.expose
    def index(self):
        web_path = getWebPath()
        with open(os.path.join(web_path, "html", "table.html"), "rb") as f:
            return f.read()