var map, sewerOutlines, mamholes, SCSewers;
      require([
        "esri/map",
        "esri/layers/FeatureLayer",
        "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol","esri/graphic","esri/Color",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/tasks/query",
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
        "esri/InfoTemplate","dijit/registry",
        "dijit/layout/BorderContainer",
        "dijit/layout/ContentPane",
        "dijit/form/Button", "dijit/WidgetSet",
        "dojo/domReady!"
      ], function(
        Map,
        FeatureLayer,
        SimpleFillSymbol, SimpleLineSymbol, Graphic, Color,
        DynamicMapServiceLayer,
        Query,
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
        registry
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

        var sewerDistricts = new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/9',{
          mode: FeatureLayer.MODE_ONDEMAND,
          outFields: ["*"]
        });

        var sewerSheets = new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/7',{
          mode: FeatureLayer.MODE_ONDEMAND,
          outFields: ["*"]
        });

        var manholes =  new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/0',{
          mode: FeatureLayer.MODE_ONDEMAND,
          outFields: ["*"]
        });

        var sewerMains =  new FeatureLayer('https://fs-gdb10:6443/arcgis/rest/services/SuffolkCounty/SCSewers/MapServer/2',{
          mode: FeatureLayer.MODE_ONDEMAND,
          outFields: ["*"]
        });

        var layerList = [ sewerOutlines, sewerDistricts, sewerSheets, manholes, sewerMains ]


        layerList.forEach(function(layer){
            map.addLayer(layer)
          });


        registry.forEach(function(d) {
          // d is a reference to a dijit
          // could be a layout container or a button
          if ( d.declaredClass === "dijit.form.Button" ) {
            d.on("click", activateTool);
          }
        });

        var init =  function(){
          map.graphics.enableMouseEvents();
          map.graphics.on("mouse-out", closeDialog);
          createToolbar();
          
        };

        map.on("load", init)


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
            new Color([255,0,0]), 3
          ),
          new Color([125,125,125,0.35])
        );

       
        sewerDistricts.on("mouse-over", function(evt){
         var highlightGraphic = new Graphic(evt.graphic.geometry,highlightSymbol);
         highlightGraphic.name = "highlight "
         map.graphics.add(highlightGraphic);
        })

        function closeDialog() {
          map.graphics.clear();
        }




        
       
    });