/*
*
*/
roles = {
    COMMONER : 1,
    KING : 2
};
PERMISSION_ALL_ROLES = roles.COMMONER | roles.KING;
PERMISSION_NO_ROLES = 0;


role_utils = {}
role_utils.hasPermission = function(role, permissions) {
    return role & permissions;
}

/*
* Description of meta-models.
*/
meta = {};  // TODO: create a proper namespace

meta.Barrier = {
    name: 'Barrier',
    caption: tr('Barrier'),
    props: [
        {name : 'id', type : 'int', permissions: PERMISSION_NO_ROLES},
        {name : 'name', type : 'string', caption: tr('Name'), permissions: PERMISSION_ALL_ROLES},
        {name : 'acronym', type : 'string', caption: tr('Acronym'), permissions: PERMISSION_ALL_ROLES},
        {name : 'description', type : 'longstring', caption: tr('Description'), permissions: PERMISSION_ALL_ROLES},
        {
            name: 'path',
            caption: tr('Path'),
            permissions: PERMISSION_ALL_ROLES,
            type : {
                xtype : 'enum',
                enumMap : [ [0, tr("column")], [1, tr("annulus")] ]
            }
        },
        {name: 'official', type: 'boolean', caption: tr('Official'), permissions: roles.KING},
    ],
    connection: {
        url: '/contents/foo'
    }
};

// TODO: create a proper class for properties
meta.Barrier.getType = function(prop) {
    if (prop.type instanceof Object) {
        var type_obj = prop.type;
        return type_obj.xtype;
    } else {
        return prop.type;
    }
}

/*
* Functions to help convert meta-models to ExtJS objects.
*/
metaToExt = {};  // TODO: create a proper namespace


//
metaToExt.defineModel = function(meta_model) {

    // Create ExtJS model fields
    var fields = [];
    for (var i=0; i<meta_model.props.length; ++i) {
        var f = {};
        var prop = meta_model.props[i];

        f.name = prop.name;
        if (prop.type instanceof Object) {
            var type_obj = prop.type;
            switch (type_obj.xtype) {
                case 'enum': {
                    f.type = 'int';
                    break;
                }
                default : {
                    throw Error("Invalid type object set for property.");
                }
            };
        } else {
            f.type = prop.type;
        }

        fields.push(f);
    }

    Ext.define(meta_model.name, {
        extend : 'Ext.data.Model',
        idProperty : 'id',
        fields : fields
    });
};


//
metaToExt.createStore = function(meta_model) {
    var url = meta_model.connection.url;

    var store = Ext.create('Ext.data.Store', {
        model : meta_model.name,
        pageSize : 50,  // TODO: probably should be configurable
        remoteSort: false,  // TODO: probably should be configurable
        proxy : {
            type : 'rest',
            url: url,
            reader : {
                type : 'json',
                metaProperty : 'meta',
                root : 'data',
                idProperty : 'id',
                totalProperty : 'meta.total',
                successProperty : 'meta.success'
            },
            writer : {
                type : 'json',
                encode : true,
                writeAllFields : true,
                root : 'data',
                allowSingle : true,
                batch : false,
                writeRecords : function(request, data) {
                    request.jsonData = data;
                    return request;
                }
            }
        }
    });

    return store;
}

//
metaToExt.createTable = function(meta_model, role) {
    // Requirements:
    // * can filter columns - check
    // * can sort columns - check
    // * table are configured according to roles - check
    // * multiple selection - check
    // * can copy contents - check

    var store = metaToExt.createStore(meta_model);

    // Enable row edit (pg.85)

    // TODO: We can't use row edition in table if we want to use text area for fields as description, it has a resize
    // bug =(
    // http://www.sencha.com/forum/showthread.php?174096-Focused-row-in-grid-RowEditing-does-not-resize-correctly-and-renders-behind-things
    //var rowEditing = Ext.create('Ext.grid.plugin.RowEditing', {
    var rowEditing = Ext.create('Ext.grid.plugin.CellEditing', {
        clicksToEdit : 2,
        autoCancel : false
    });

    // Enable filters feature
    var filters = {
        ftype: 'filters',
        autoReload: false, //don't reload automatically
        local: true
    };

    // Create paging toolbar
    // TODO: refactor onInsertRecord and onEditRecord to reuse code.
    var onInsertRecord = function() {
        var selected = grid.selModel.getSelection();
        rowEditing.cancelEdit();

        var onOk = function() {
            // TODO: should show full edition dialog
            // NOTE: it may add it in pages that are not visible at the moment!
            store.add(newItem);
        }

        var newItem = Ext.create(meta_model.name);

        // TODO: extract dialog to some function used for confirmation dialog.
        var dialog = Ext.create('Ext.window.Window', {
            title : meta_model.caption,
            layout : 'fit',
            modal : true,
            items : metaToExt.createEditionPanel(meta_model, role, newItem),
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'bottom',
                ui: 'footer',
                items: [{
                    xtype: 'button',
                    text: tr('OK'),
                    handler: function() {
                        onOk();
                        dialog.close();
                    }
                 }, {
                    xtype: 'button',
                    text: tr('Cancel'),
                    handler: function() {
                        dialog.close();
                    }
                }]
            }]
        })
        dialog.show();
    };

    var onEditRecord = function() {
        var selected = grid.selModel.getSelection();
        rowEditing.cancelEdit();

        var onOk = function() {
        }

        var onCancel = function() {
            editionItem.reject();
        }

        // TODO: if has multiple selection, show message to user.
        var editionItem = selected[0];

        // TODO: extract dialog to some function used for confirmation dialog.
        var dialog = Ext.create('Ext.window.Window', {
            title : meta_model.caption,
            layout : 'fit',
            modal : true,
            items : metaToExt.createEditionPanel(meta_model, role, editionItem),
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'bottom',
                ui: 'footer',
                items: [{
                    xtype: 'button',
                    text: tr('OK'),
                    handler: function() {
                        onOk();
                        dialog.close();
                    }
                 }, {
                    xtype: 'button',
                    text: tr('Cancel'),
                    handler: function() {
                        onCancel();
                        dialog.close();
                    }
                }]
            }]
        })
        dialog.show();
    }

    var onDeleteRecord = function() {
        // TODO: not considering case where nothing is selected
        var selected = grid.selModel.getSelection();
        grid.store.remove(selected);
    };

    var pagingToolbar = {
        xtype : 'pagingtoolbar',
        store : store,
        dock : 'top',
        displayInfo : true,
        items : [
            // TODO: actions below may not always be available/visible depending on some roles
            '-',
            {
                text: tr('Add'),
                handler : onInsertRecord
            },
            {
                text: tr('Remove'),
                handler : onDeleteRecord
            },
            {
                text : tr('Save'),
                handler : function () {
                    store.sync();
                }
            },
            {
                text : tr('Discard'),
                handler : function () {
                    store.rejectChanges();
                }
            },
            '-',
            // TODO: these filters should be for whole widget, not only for a table
            // TODO: find a decent way to shared toggle event for all buttons in group
            {
                text : tr('Mine'),
                enableToggle: true,
                toggleGroup: 'filter-records',
                listeners: {
                    toggle: function(btn, pressed, eOpts) {
                        store.clearFilter();
                        // TODO: author name must correspond to user of current session.
                        if (pressed) {
                            store.filter("author", "alice");
                        }
                    }
                }
            }, {
                text: tr('Official'),
                enableToggle: true,
                toggleGroup: 'filter-records',
                listeners: {
                    toggle: function(btn, pressed, eOpts) {
                        store.clearFilter();
                        // TODO: author name must correspond to user of current session.
                        if (pressed) {
                            store.filter("official", true);
                        }
                    }
                }
            }, {
                text: tr('All'),
                enableToggle: true,
                toggleGroup: 'filter-records',
                listeners: {
                    toggle: function(btn, pressed, eOpts) {
                        store.clearFilter();
                    }
                }
            }
        ]
    };

    // Create columns of table
    var columns = [];

    var stringEditor = {
        xtype : 'textfield'
    };

    for (var i=0; i<meta_model.props.length; ++i) {
        var prop = meta_model.props[i];
        var hasPermission = role_utils.hasPermission(role, prop.permissions);

        var column = {};

        switch(meta_model.getType(prop)) {
            case 'int' : {
                // special case
                if (prop.name == "id") {
                    column = {
                        xtype : 'templatecolumn',
                        header : 'ID',
                        dataIndex : 'id',
                        sortable : true,
                        width : 50,
                        resizable : false,
                        hidden : true,
                        tpl : '<span style="color: #0000FF;">{id}</span>',
                        editor : null,  // id can never be edited by client side
                    }
                } else {
                    // TODO: not yet!
                    console.error("no columns for 'int' yet");
                }

                break;
            }
            case 'string' : {
                column = {
                    header : prop.caption,
                    dataIndex : prop.name,  // TODO: should we really couple property name to this?
                    sortable : true,
                    hideable : false,
                    filter: {
                        type: 'auto'
                        // specify disabled to disable the filter menu
                        //, disabled: true
                    }
                    //editor : stringEditor  // TODO: current user role should decide if it editable or not!!!
                };
                if (hasPermission) {
                    column.editor = stringEditor;
                }

                break;
            }
            case 'longstring' : {
                column = {
                    header : prop.caption,
                    dataIndex : prop.name,  // TODO: should we really couple property name to this?
                    sortable : true,
                    hideable : false,
                    filter: {
                        type: 'auto'
                        // specify disabled to disable the filter menu
                        //, disabled: true
                    }
                    //editor : stringEditor  // TODO: current user role should decide if it editable or not!!!
                };
                if (hasPermission) {
                    column.editor = {
                        xtype: 'textarea',
                        height: 100
                    };
                }

                break;
            }
            case 'boolean' : {
                column = {
                    xtype: 'booleancolumn',
                    trueText: tr('Yes'),  // TODO: make it configurable, because one day someone will need this.
                    falseText: tr('No'),
                    header : prop.caption,
                    dataIndex : prop.name,  // TODO: should we really couple property name to this?
                    sortable : true,
                    hideable : false,
                    filter: {
                        type: 'boolean'
                    }
                    //editor : null  // TODO: current user role should decide if it editable or not!!!
                }

                if (hasPermission) {
                    var boolMap = [
                        [true, tr('Yes')],  // TODO: make it configurable, because one day someone will need this.
                        [false, tr('No')],
                    ];

                    var boolColumnStore = Ext.create('Ext.data.ArrayStore', {
                        fields: [
                           'id',
                           'text'
                        ],
                        data : boolMap
                    });

                    var boolColumnCombo = {
                        xtype : 'combo',
                        triggerAction : 'all',
                        displayField : 'text',
                        valueField : 'id',
                        store : boolColumnStore
                    };

                    column.editor = boolColumnCombo;  // TODO: current user role should decide if it editable or not!!!
                }

                break;
            }
            case 'enum' : {
                var enumMap = prop.type.enumMap;

                // TODO: we can't really define a model here, might be overwritten by other calls to method. Can we
                // avoid this model?
                Ext.define('__EnumOptions__', {
                    extend : 'Ext.data.Model',
                    fields : ['id', 'text']  // NOTE: filter seems to require fields to be named like this!
                });

                var enumColumnStore = Ext.create('Ext.data.ArrayStore', {
                    model: '__EnumOptions__',
                    data : enumMap
                });

                column = {
                    header : prop.caption,
                    dataIndex : prop.name,  // TODO: should we really couple property name to this?
                    sortable : true,
                    hideable : false,
                    filter: {
                        type: 'list',
                        store: enumColumnStore
                    },
                    editor : enumColumnCombo,  // TODO: current user role should decide if it editable or not!!!
                    renderer: function(v) {
                        // We have to change rendered cell text to be enum caption and not its internal value.
                        for (var i=enumMap.length; i--;) {
                            var value = enumMap[i][0];
                            if (value == v) {
                                return enumMap[i][1];
                            }
                        }

                        throw Error("Unexpected value in enum:" + v);
                    }
                }

                if (hasPermission) {
                    var enumColumnCombo = {
                        xtype : 'combo',
                        triggerAction : 'all',
                        displayField : 'text',
                        valueField : 'id',
                        store : enumColumnStore
                    };

                    column.editor = enumColumnCombo;
                }

                break;
            }
            default: {
                throw Error("Unable to create column for property with type:" + prop.type);
            }
        }

        columns.push(column);
    }

    // Finally create table
    var grid = Ext.create('Ext.grid.Panel', {
        title : meta_model.caption,  // TODO: needs to be configurable!
        renderTo : Ext.getBody(),  // TODO: ops! review this :)
        autoHeight : true,  // TODO: needs to be configurable!
        width : 250,  // TODO: needs to be configurable!
        store : store,
        selType : 'rowmodel',  // NOTE: selection model could possibly be configurable
        selModel: {
            mode: 'MULTI'
        },
        dockedItems : [
            pagingToolbar
        ],
        features: [filters],
        plugins : [rowEditing],
        viewConfig : {
            forceFit : true  // TODO: what is this for ?
        },
        emptyText: tr('No records found.'),
        columns : columns
    });

    grid.on("afterrender", function(grid, eOpts) {
        grid.getEl().addKeyMap({
            eventName: "keyup",
            binding: [{
                key : Ext.EventObject.F2,
                shift : true,
                fn :  onEditRecord
            }]
        });
    });


    return grid;
}


//
metaToExt.createEditionPanel = function(meta_model, role, model) {
    // TODO: needs to check if meta model corresponds to ext model!
    // TODO: refactor method to create editor for property and reuse in edition panel and column
    // TODO: ext model edition probably should silence events

    var editionPanel = Ext.create('Ext.panel.Panel', {
        width : 350,
        height : 250,
        //title : 'Ext Panels rock!',
        renderTo : Ext.getBody()
        //html : 'Content body',
        /*buttons : buttons,
        dockedItems : [
            topDockedToolbar,
            bottomDockedToolbar,
            leftDockedToolbar,
            rightDockedToolbar
        ]*/
    });

    var stringEditor = {
        xtype: 'textfield'
    };

    // Create edition components for each property
    for (var i=0; i<meta_model.props.length; ++i) {
        var prop = meta_model.props[i];
        var hasPermission = role_utils.hasPermission(role, prop.permissions);

        var component = null;

        switch(meta_model.getType(prop)) {
            case 'int' : {
                break;
            }
            case 'string' : {
                component = stringEditor;

                function onChange(propName, editor, newValue, oldValue, eOpts) {
                     model.set(propName, newValue);
                }

                component.fieldLabel = prop.caption;
                component.listeners = {
                    change: onChange.bind(this, prop.name)
                }
                component.value = model.get(prop.name);
                component.disabled = !hasPermission;

                break;
            }
            case 'longstring' : {
                component = {
                    xtype: 'textarea',
                    height: 100
                };

                function onChange(propName, editor, newValue, oldValue, eOpts) {
                     model.set(propName, newValue);
                }

                component.fieldLabel = prop.caption;
                component.listeners = {
                    change: onChange.bind(this, prop.name)
                }
                component.value = model.get(prop.name);
                component.disabled = !hasPermission;

                break;
            }
            case 'boolean' : {
                var boolMap = [
                    [true, tr('Yes')],  // TODO: make it configurable, because one day someone will need this.
                    [false, tr('No')],
                ];

                var boolColumnStore = Ext.create('Ext.data.ArrayStore', {
                    fields: [
                       'id',
                       'text'
                    ],
                    data : boolMap
                });

                function onChange(propName, editor, newValue, oldValue, eOpts) {
                     model.set(propName, newValue);
                }

                var boolColumnCombo = {
                    xtype : 'combo',
                    triggerAction : 'all',
                    displayField : 'text',
                    valueField : 'id',
                    store : boolColumnStore,
                    fieldLabel: prop.caption,
                    value: model.get(prop.name),
                    disabled : !hasPermission,
                    listeners : {
                        change: onChange.bind(this, prop.name)
                    }
                };

                component = boolColumnCombo;  // TODO: current user role should decide if it editable or not!!!

                break;
            }
            case 'enum' : {
                var enumMap = prop.type.enumMap;

                var enumColumnStore = Ext.create('Ext.data.ArrayStore', {
                    fields: [
                       'id',
                       'text'
                    ],
                    data : enumMap
                });

                function onChange(propName, editor, newValue, oldValue, eOpts) {
                     model.set(propName, newValue);
                }

                var enumColumnCombo = {
                    xtype : 'combo',
                    triggerAction : 'all',
                    displayField : 'text',
                    valueField : 'id',
                    store : enumColumnStore,
                    fieldLabel: prop.caption,
                    value: model.get(prop.name),
                    disabled : !hasPermission,
                    listeners : {
                        change: onChange.bind(this, prop.name)
                    }
                };

                component = enumColumnCombo;

                break;
            }
            default: {
                console.error("Error in createEditionDialog");
            }
        }

        editionPanel.add(component);
    }

    return editionPanel;
}