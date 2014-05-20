
describe("Meta-object", function() {

    it("Define model", function() {
        metaToExt.defineModel(meta.Barrier);

        var ext_model = Ext.create('Barrier');

        expect(ext_model.get("id")).toBe(0);
        expect(ext_model.get("name")).toBe("");
        expect(ext_model.get("acronym")).toBe("");
        expect(ext_model.get("description")).toBe("");
        expect(ext_model.get("path")).toBe(0);
        expect(ext_model.get("official")).toBe(false);
    });

    it("Create store", function() {
        var store = metaToExt.createStore(meta.Barrier);

        var proxy = store.getProxy();

        expect(proxy.proxyConfig.type).toBe("rest");
        expect(proxy.proxyConfig.url).toBe("/contents/foo");

        expect(proxy.proxyConfig.reader.type).toBe("json");
        expect(proxy.proxyConfig.reader.metaProperty).toBe("meta");
        expect(proxy.proxyConfig.reader.root).toBe("data");
        expect(proxy.proxyConfig.reader.idProperty).toBe("id");
        expect(proxy.proxyConfig.reader.totalProperty).toBe("meta.total");
        expect(proxy.proxyConfig.reader.successProperty).toBe("meta.success");

        expect(proxy.proxyConfig.writer.type).toBe("json");
        expect(proxy.proxyConfig.writer.encode).toBe(true);
        expect(proxy.proxyConfig.writer.writeAllFields).toBe(true);
        expect(proxy.proxyConfig.writer.root).toBe("data");
        expect(proxy.proxyConfig.writer.allowSingle).toBe(true);
        expect(proxy.proxyConfig.writer.batch).toBe(false);
    });
});