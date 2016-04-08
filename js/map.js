var map, sewerOutlines, mamholes, SCSewers;
require([
    "esri/map", "esri/dijit/Print", "esri/dijit/BasemapGallery", "esri/dijit/Bookmarks",
    "esri/layers/FeatureLayer", "dojo/cookie", "esri/tasks/GeometryService", "dojo/keys",
    "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/graphic", "esri/Color",
    "esri/layers/ArcGISDynamicMapServiceLayer","esri/config","esri/sniff", "esri/dijit/Measurement",
    "esri/tasks/query", "esri/SnappingManager",
    "esri/tasks/QueryTask",
    "esri/tasks/RelationshipQuery",
    "esri/toolbars/draw",
    "dojox/grid/DataGrid",
    "dojo/data/ItemFileReadStore",
    "esri/layers/ImageParameters",
    "dojo/parser",
    "esri/geometry/Extent",
    "dojo/_base/array",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/InfoTemplate", "dijit/registry", "dojo/dom",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "dijit/form/Button", "dijit/WidgetSet",
    "dijit/Dialog", "dijit/form/TextBox", 
    "dojo/domReady!"
], function(
    Map, Print, BasemapGallery, Bookmarks,
    FeatureLayer, Cookie, GeometryService, keys,
    SimpleFillSymbol, SimpleLineSymbol, Graphic, Color,
    DynamicMapServiceLayer, esriConfig, has, Measurement,
    Query, SnappingManager,
    QueryTask,
    RelationshipQuery,
    Draw,
    DataGrid,
    ItemFileReadStore,
    ImageParameters,
    parser,
    Extent,
    array,
    SimpleMarkerSymbol,
    InfoTemplate,
    registry, dom
) {
    parser.parse();
    map = new Map("mapDiv", {
        basemap: "satellite",
        center: [-73.135, 40.789],
        zoom: 11
    });


    var sewerOutlines = new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/8', {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

    var sewerDistricts = new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/9', {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

    var sewerSheets = new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/7', {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

    var manholes = new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/0', {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

    var sewerMains = new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/2', {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

    var layerList = [sewerOutlines, sewerDistricts, sewerSheets, manholes, sewerMains]


    layerList.forEach(function(layer) {
        map.addLayer(layer)
    });


    registry.forEach(function(d) {
        // d is a reference to a dijit
        // could be a layout container or a button
        if (d.declaredClass === "dijit.form.Button") {
            d.on("click", activateTool);
        }
    });

    var init = function() {
        map.graphics.enableMouseEvents();
        map.graphics.on("mouse-out", closeDialog);
        createToolbar();


    };
    var useLocalStorage = supports_local_storage();
    var storageName = 'esrijsapi_mapmarks';

    map.on("load", init)

    dojo.connect(dojo.byId('clear-storage'), 'onclick', clearBookmarks);
    // Draw Toolbar
    var createToolbar = function(theMap) {
        toolbar = new Draw(map);
        toolbar.on("draw-end", addToMap);
    }


    function activateTool() {
        var tool = this.label.toUpperCase().replace(/ /g, "_");
        toolbar.activate(Draw[tool]);
        map.hideZoomSlider();
    }

    function addToMap(evt) {
        var symbol;
        toolbar.deactivate();
        map.showZoomSlider();
        switch (evt.geometry.type) {
            case "point":
            case "multipoint":
                symbol = new SimpleMarkerSymbol();
                break;
            case "polyline":
                symbol = new SimpleLineSymbol();
                break;
            default:
                symbol = new SimpleFillSymbol();
                break;
        }
        var drawGraphic = new Graphic(evt.geometry, symbol);
        console.log('init')
        map.graphics.add(drawGraphic);
    }




    // Highlight

    var highlightSymbol = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            new Color([255, 0, 0]), 3
        ),
        new Color([125, 125, 125, 0.35])
    );


    sewerDistricts.on("mouse-over", function(evt) {
        var highlightGraphic = new Graphic(evt.graphic.geometry, highlightSymbol);
        highlightGraphic.name = "highlight "
        map.graphics.add(highlightGraphic);
    })

    function closeDialog() {
        map.graphics.clear();
    }


    //Print
    var app = {};
    app.map = map;
    app.printer = new Print({
        map: app.map,
        url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
    }, dom.byId("printButton"));
    app.printer.startup();



    //Basemap switcher

    var basemapGallery = new BasemapGallery({
        showArcGISBasemaps: true,
        map: map
    }, "basemapGallery");
    basemapGallery.startup();

    basemapGallery.on("error", function(msg) {
        console.log("basemap gallery error:  ", msg);
    });


    //BookMarks


    var bookmark = new Bookmarks({
        map: map,
        bookmarks: [],
        editable: true
    }, dojo.byId('bookmarks2'));



    dojo.connect(bookmark, 'onEdit', refreshBookmarks);
    dojo.connect(bookmark, 'onRemove', refreshBookmarks);

    var bmJSON;
    if (useLocalStorage) {
        bmJSON = window.localStorage.getItem(storageName);
    } else {
        bmJSON = dojo.cookie(storageName);
    }
    // Load bookmarks 
    // Fall back to a single bookmark if no cookie
    if (bmJSON && bmJSON != 'null' && bmJSON.length > 4) {
        console.log('cookie: ', bmJSON, bmJSON.length);
        var bmarks = dojo.fromJson(bmJSON);
        dojo.forEach(bmarks, function(b) {
            bookmark.addBookmark(b);
        });
    } else {
        console.log('no stored bookmarks...');
        var bookmarkPA = {
            "extent": {
                "spatialReference": {
                    "wkid": 102100
                },
                "xmin": -8669334,
                "ymin": 4982379,
                "xmax": -8664724,
                "ymax": 4984864
            },
            "name": "Central Pennsylvania"
        };
        // bookmark.addBookmark(bookmarkCA);
        bookmark.addBookmark(bookmarkPA);
    }


    function refreshBookmarks() {
        if (useLocalStorage) {
            window.localStorage.setItem(storageName, dojo.toJson(bookmark.toJson()));
        } else {
            var exp = 7; // number of days to persist the cookie
            dojo.cookie(storageName, dojo.toJson(bookmark.toJson()), {
                expires: exp
            });
        }
    }



    function clearBookmarks() {
        var conf = confirm('Click OK to remove your map bookmarks.');
        if (conf) {
            if (useLocalStorage) {
                // Remove from local storage
                window.localStorage.removeItem(storageName);
            } else {
                // Remove cookie
                dojo.cookie(storageName, null, { expires: -1 });
            }
            // Remove all user defined bookmarks
            // First get all bookmark names
            var bmNames = dojo.map(bookmark.bookmarks, function(bm) {
                if (bm.name != 'Central Pennsylvania') {
                    return bm.name;
                }
            });
            // Run removeBookmark
            dojo.forEach(bmNames, function(bName) {
                bookmark.removeBookmark(bName);
            });
            alert('Bookmarks Removed.');
        }
    }
    // source for supports_local_storage function:
    // http://diveintohtml5.org/detect.html
    function supports_local_storage() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }


    //Measure
    // esriConfig.defaults.io.alwaysUseProxy = false;
    esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");


    var snapManager = map.enableSnapping({
        snapKey: has("mac") ? keys.META : keys.CTRL
    });
    var layerInfos = [{
        layer: sewerDistricts
    }];
    snapManager.setLayerInfos(layerInfos);

    var measurement = new Measurement({
        map: map
    }, dom.byId("measurementDiv"));
    measurement.startup();



});
