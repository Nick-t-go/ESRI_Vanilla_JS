 require([
        "esri/map", "esri/layers/FeatureLayer",
        "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol",
        "esri/renderers/SimpleRenderer", "esri/graphic", "esri/lang",
        "esri/Color", "dojo/number", "dojo/dom-style",
        "dijit/TooltipDialog", "dijit/popup", "dojo/domReady!"
      ], function(
        Map, FeatureLayer,
        SimpleFillSymbol, SimpleLineSymbol,
        SimpleRenderer, Graphic, esriLang,
        Color, number, domStyle,
        TooltipDialog, dijitPopup
      ) {

        var highlightSymbol = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            new Color([255,0,0]), 3
          ),
          new Color([125,125,125,0.35])
        );


        map.on("load", function(){
          map.graphics.enableMouseEvents();
        });


        var highlightGraphic = new Graphic(evt.graphic.geometry,highlightSymbol);
          map.graphics.add(highlightGraphic);






});