var map, grid, store;
require([

    "dijit/Menu",
    "dijit/MenuItem",
    "dijit/form/ComboButton",
    "esri/dijit/Bookmarks",

    "dijit/form/Select",
    "dojo/data/ObjectStore",
    "dojo/store/Memory",

    "esri/dijit/Legend",
    "dojo/_base/array",

    "esri/dijit/BasemapGallery",
    "esri/arcgis/utils",
    "esri/toolbars/draw",

    "esri/dijit/Print",
    "esri/symbols/SimpleMarkerSymbol",
    "dojo/query",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/tasks/RelationshipQuery",
    "dijit/form/Button",
    "esri/graphic",

    "dojo/dom",
    "esri/Color",
    "dojo/keys",
    "dojo/parser",

    "esri/config",
    "esri/sniff",
    "esri/map",
    "esri/SnappingManager",
    "esri/dijit/Measurement",
    "esri/layers/FeatureLayer",
    "esri/renderers/SimpleRenderer",
    "esri/tasks/GeometryService",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",

    "esri/dijit/Scalebar",
    "dojo/data/ItemFileReadStore",
    "dojox/grid/DataGrid",
    "esri/geometry/Extent",

    "dijit/layout/BorderContainer",
    "dijit/layout/AccordionContainer",
    "dijit/layout/ContentPane",
    "dijit/TitlePane",
    "dijit/form/CheckBox",
    "dijit/form/DropDownButton",
    "dojo/domReady!"
], function(
    Menu, MenuItem, ComboButton, Bookmarks, Select, ObjectStore, Memory, Legend, arrayUtils, BasemapGallery, arcgisUtils, Draw, Print, SimpleMarkerSymbol, query, Query, QueryTask, RelationshipQuery, Button, Graphic, dom, Color, keys, parser,
    esriConfig, has, Map, SnappingManager, Measurement, FeatureLayer, SimpleRenderer, GeometryService, SimpleLineSymbol, SimpleFillSymbol, Scalebar, ItemFileReadStore,  DataGrid, Extent
) {
    parser.parse();
    //This sample may require a proxy page to handle communications with the ArcGIS Server services. You will need to
    //replace the url below with the location of a proxy on your machine. See the 'Using the proxy page' help topic
    //for details on setting up a proxy page.
    esriConfig.defaults.io.proxyUrl = "/proxy/";
    esriConfig.defaults.io.alwaysUseProxy = false;

    //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications
    esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

    map = new Map("map", {
        basemap: "satellite",
        center: [-85.743, 38.256],
        zoom: 17
    });

    map.on("load", function() {
        toolbar = new Draw(map);
        toolbar.on("draw-end", addToMap);

    });

    var useLocalStorage = supports_local_storage();
    var storageName = 'esrijsapi_mapmarks';

    // var sfs = new SimpleFillSymbol(
    //     "solid",
    //     new SimpleLineSymbol("solid", new Color([195, 176, 23]), 2),
    //     null
    // );

    // var parcelsLayer = new FeatureLayer("https://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Louisville/LOJIC_LandRecords_Louisville/MapServer/0", {
    //     mode: FeatureLayer.MODE_ONDEMAND,
    //     outFields: ["*"]
    // });
    // parcelsLayer.setRenderer(new SimpleRenderer(sfs));


   


    var sewerOutlines = new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/8', {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

    sewerOutlines.relId = [4];

    var sewerDistricts = new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/9', {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

    sewerDistricts.relId = [5, 6];
    console.log(sewerDistricts)

    var selectedLayer = [sewerOutlines];

    var sewerSheets = new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/7', {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

    var manholes = new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/0', {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

    manholes.relId = [0];

    var sewerMains = new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/2', {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });
    


    var layerList = [sewerOutlines, sewerDistricts, sewerSheets, manholes, sewerMains]


    map.addLayers(layerList)


    //Once all layers are added populate select box for selectable features
    map.on('layers-add-result',function(){
      var sel = document.getElementById('LayerList');
      var fragment = document.createDocumentFragment();
      layerList.forEach(function(layer, index) {
          var opt = document.createElement('option');
          opt.innerHTML = layer.name;
          opt.value = layer.name;
          fragment.appendChild(opt);
      });
      sel.appendChild(fragment);
      sel.onchange = function(evt){
        d = document.getElementById("LayerList").value;
        selectedLayer = layerList.filter(function(layer){
          return layer.name === d;
        })
        console.log(selectedLayer[0])
      };
    })  



    //dojo.keys.copyKey maps to CTRL on windows and Cmd on Mac., but has wrong code for Chrome on Mac
    var snapManager = map.enableSnapping({
        snapKey: has("mac") ? keys.META : keys.CTRL
    });
    var layerInfos = [{
        layer: sewerDistricts //parcelsLayer
    }];
    snapManager.setLayerInfos(layerInfos);

    var measurement = new Measurement({
        map: map
    }, dom.byId("measurementDiv"));
    measurement.startup();

    var basemapGallery = new BasemapGallery({
        showArcGISBasemaps: true,
        map: map
    }, "basemapGallery");
    basemapGallery.startup();

    printer = new Print({
        map: map,
        url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
    }, dom.byId("printButton"));
    printer.startup();

    // set up symbols for the various geometry types
    symbols = {};
    symbols.point = new SimpleMarkerSymbol("square", 10, new SimpleLineSymbol(), new Color([0, 255, 0, 0.75]));
    symbols.polyline = new SimpleLineSymbol("solid", new Color([255, 128, 0]), 2);
    symbols.polygon = new SimpleFillSymbol().setColor(new Color([255, 255, 0, 0.25]));
    symbols.circle = new SimpleFillSymbol().setColor(new Color([0, 0, 180, 0.25]));

    // find the divs for buttons
    query(".drawing").forEach(function(btn) {
        var button = new Button({
            label: btn.innerHTML,
            onClick: function() {
                activateTool(this.id);
            }
        }, btn);
    });

    function activateTool(type) {
        tool = type.replace("freehand", "");
        toolbar.activate(type);
        map.hideZoomSlider();
    }

    function addToMap(evt) {
        toolbar.deactivate();
        map.showZoomSlider();

        var graphic = new Graphic(evt.geometry, symbols[tool]);
        map.graphics.add(graphic);
    }

    var scalebar = new Scalebar({
        map: map,
        attachTo: "bottom-left"
    });


    //Bookmarks


    var bookmark = new Bookmarks({
        map: map,
        bookmarks: bookmark,
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
        bookmark.addBookmark(bookmarkCA);
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

    //Legend
    var legend = new Legend({
        map: map
    }, "legendDiv");
    legend.startup();

    //Find Related Records Code

    function findRelatedRecords(evt) {
            var features = evt.features;
            var relatedTopsQuery = new RelationshipQuery();
            relatedTopsQuery.outFields = ["*"];
            relatedTopsQuery.relationshipId = selectedLayer[0].relId[0];
            relatedTopsQuery.objectIds = [features[0].attributes.OBJECTID];
            selectedLayer[0].queryRelatedFeatures(relatedTopsQuery, function(relatedRecords) {
              console.log("related recs: ", relatedRecords);
              if ( ! relatedRecords.hasOwnProperty(features[0].attributes.OBJECTID) ) {
                console.log("No related records for ObjectID: ", features[0].attributes.OBJECTID);
                return;
              }
              var fset = relatedRecords[features[0].attributes.OBJECTID];
              var items = fset.features.map (function(feature) {
                return feature.attributes;
              });
              //Create data object to be used in store
              var data = {
                identifier: "OBJECTID",  //This field needs to have unique values
                label: "OBJECTID", //Name field for display. Not pertinent to a grid but may be used elsewhere.
                items: items
              };

              //Create data store and bind to grid.
              store = new ItemFileReadStore({ data:data });
              grid.setStore(store);
              grid.setQuery({ OBJECTID: "*" });
            });
        }

        function findSelected(evt) {
          console.log('click')
            grid.setStore(null);
            var selectionQuery = new Query();
            var tol = map.extent.getWidth()/map.width * 5;
            var x = evt.mapPoint.x;
            var y = evt.mapPoint.y;
            var queryExtent = new Extent(x-tol,y-tol,x+tol,y+tol,evt.mapPoint.spatialReference);
            selectionQuery.geometry = queryExtent;
            selectedLayer[0].selectFeatures(selectionQuery,FeatureLayer.SELECTION_NEW);
        }


        var selectionSymbol = new SimpleMarkerSymbol().setColor("red");
        selectedLayer[0].setSelectionSymbol(selectionSymbol);
        selectedLayer[0].on("selection-complete", findRelatedRecords);

        selectedLayer.on("click", findSelected);










});
