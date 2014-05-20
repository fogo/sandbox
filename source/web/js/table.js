// Requirements:
// * can filter columns - check
// * can sort columns - check
// * table are configured according to roles
// * multiple selection - check
// * can copy contents - check
//
// What else we will need:
// * A "meta-model" describing barriers, etc that can be used to generate model, store, columns, etc in ExtJS.
// * A way to assign roles for each part this "meta-model" and spread this to GUI components.

//Ext.Loader.setConfig({enabled: true});
//Ext.Loader.setPath('Ext.ux', '/extjs/examples/ux');
Ext.require([
    'Ext.ux.grid.filter.BooleanFilter',
    'Ext.ux.grid.filter.DateFilter',
    'Ext.ux.grid.filter.ListFilter',
    'Ext.ux.grid.filter.NumericFilter',
    'Ext.ux.grid.filter.StringFilter'
]);

metaToExt.defineModel(meta.Barrier);

var currentRole = roles.COMMONER;
var grid = metaToExt.createTable(meta.Barrier, currentRole);

grid.getStore().load();