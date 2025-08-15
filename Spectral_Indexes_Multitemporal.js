// =========================
// 1. Área de interés
// =========================
var areaOfInterest = ee.FeatureCollection('projects/ee-jorojasto/assets/Esperanza');

// =========================
// 2. Fechas de análisis
// =========================
var startDate = '2017-03-01';
var endDate   = '2025-01-31';

// =========================
// 3. Cargar colección Sentinel-2 SR + máscara SCL
// =========================
function maskClouds(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(3)   // sombra de nubes
    .and(scl.neq(8))      // nubes medias
    .and(scl.neq(9))      // nubes finas
    .and(scl.neq(10))     // nubes altas
    .and(scl.neq(1));     // saturado
  return image.updateMask(mask);
}

var s2sr = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterBounds(areaOfInterest)
  .filterDate(startDate, endDate)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskClouds);

// =========================
// 4. Reescalado a reflectancia (0.0001)
// =========================
var scaledCollection = s2sr.map(function(image) {
  var scaled = image.select(['B2','B3','B4','B8','B11','B12'])
    .multiply(0.0001)
    .copyProperties(image, image.propertyNames());
  return scaled;
});

// =========================
// 5. Definición de índices
// =========================
function computeIndex(image, indexName){
  indexName = ee.String(indexName);

  var ndvi  = image.normalizedDifference(['B8','B4']);
  var ndwi  = image.normalizedDifference(['B3','B8']); // (McFeeters, 1996)
  var mndwi = image.normalizedDifference(['B3','B11']);
  var ndbi  = image.normalizedDifference(['B11','B8']);
  var savi  = image.expression('( (NIR - RED) / (NIR + RED + L) ) * (1+L)', {
    NIR: image.select('B8'), RED: image.select('B4'), L: 0.5
  });
  var evi   = image.expression('2.5 * ( (NIR - RED) / (NIR + 6*RED - 7.5*BLUE + 1) )', {
    NIR: image.select('B8'), RED: image.select('B4'), BLUE: image.select('B2')
  });
  var nbr   = image.normalizedDifference(['B8','B12']);

  var idx = ee.Image(ee.Algorithms.If(indexName.equals('NDVI'),  ndvi,
           ee.Algorithms.If(indexName.equals('NDWI'),  ndwi,
           ee.Algorithms.If(indexName.equals('MNDWI'), mndwi,
           ee.Algorithms.If(indexName.equals('NDBI'),  ndbi,
           ee.Algorithms.If(indexName.equals('SAVI'),  savi,
           ee.Algorithms.If(indexName.equals('EVI'),   evi,
           ee.Algorithms.If(indexName.equals('NBR'),   nbr,
             ndwi))))))));

  return image.addBands(idx.rename('INDEX'));
}

var palettes = {
  NDVI:  ['brown','beige','yellow','lightgreen','green','darkgreen'],
  NDWI:  ['darkred','orange','white','lightblue','blue','darkblue'],
  MNDWI: ['darkred','orange','white','lightblue','blue','darkblue'],
  NDBI:  ['navy','blue','white','orange','red','maroon'],
  SAVI:  ['brown','beige','yellow','lightgreen','green','darkgreen'],
  EVI:   ['brown','beige','yellow','lightgreen','green','darkgreen'],
  NBR:   ['purple','magenta','white','yellow','orange','red']
};

// =========================
// 6. Generador de colección con el índice elegido
// =========================
function indexedCollection(indexName){
  return scaledCollection.map(function(img){
    return computeIndex(img, indexName);
  });
}

// =========================
// 7. UI: Selectores de Índice y Fecha
// =========================
var indexList = ['NDWI','NDVI','MNDWI','NDBI','SAVI','EVI','NBR'];

var datesList = scaledCollection.aggregate_array('system:time_start')
  .map(function(d){ return ee.Date(d).format('YYYY-MM-dd'); });
var datesClient = datesList.getInfo();

var selectIndex = ui.Select({
  items: indexList,
  value: 'NDWI',
  placeholder: 'Índice',
  style: {width: '200px'}
});

var selectDate = ui.Select({
  items: datesClient,
  placeholder: 'Fecha',
  style: {width: '200px'}
});

var chartPanel = ui.Panel({style: {width: '600px'}});
print(chartPanel);

// =========================
// 7.5 Controles de exportación y botón
// =========================
var scaleInput  = ui.Textbox({value: '10',  placeholder: 'Escala (m)', style:{width:'90px'}});
var folderInput = ui.Textbox({value: 'GEE', placeholder: 'Carpeta Drive', style:{width:'150px'}});
var crsInput    = ui.Textbox({value: '',    placeholder: 'CRS (opcional, ej. EPSG:3116)', style:{width:'190px'}});
var statusLabel = ui.Label('', {color: 'gray'});

var downloadBtn = ui.Button({
  label: '⬇️ Descargar índice (AOI)',
  style: {stretch: 'horizontal', color: 'black', backgroundColor: '#4285F4'},
  onClick: function(){
    var idxName = selectIndex.getValue();
    var selectedDate = selectDate.getValue();

    if (!idxName){
      statusLabel.setValue('Selecciona un índice.');
      statusLabel.style().set('color', 'red'); return;
    }
    if (!selectedDate){
      statusLabel.setValue('Selecciona una fecha.');
      statusLabel.style().set('color', 'red'); return;
    }

    var colIdx = indexedCollection(idxName);
    var image = ee.Image(
      colIdx.filterDate(selectedDate, ee.Date(selectedDate).advance(1, 'day')).first()
    );

    var hasBands = ee.Number(image.bandNames().size()).gt(0).getInfo();
    if (!hasBands){
      statusLabel.setValue('No se encontró imagen para esa fecha.');
      statusLabel.style().set('color', 'red'); return;
    }

    var indexImg = image.select('INDEX').toFloat().clip(areaOfInterest);
    var fileName = idxName + '_' + selectedDate.replace(/-/g, '');
    var scale = ee.Number.parse(scaleInput.getValue()).int();

    var params = {
      image: indexImg,
      description: fileName,
      folder: folderInput.getValue(),
      fileNamePrefix: fileName,
      region: areaOfInterest.geometry(),
      scale: scale,
      maxPixels: 1e13
    };
    var crs = (crsInput.getValue() || '').trim();
    if (crs !== '') params.crs = crs;

    Export.image.toDrive(params);

    print('Tarea creada (fecha única):', fileName, '→ Drive/', params.folder);
    statusLabel.setValue('Tarea creada. Abre "Tasks" y pulsa "Run".');
    statusLabel.style().set('color', 'green');
  }
});

var downloadPanel = ui.Panel([
  ui.Label('Exportar índice como ráster (recortado al AOI):', {fontWeight: 'bold'}),
  ui.Panel([
    ui.Label('Escala (m):'), scaleInput,
    ui.Label('Carpeta Drive:'), folderInput,
    ui.Label('CRS:'), crsInput
  ], ui.Panel.Layout.flow('horizontal')),
  downloadBtn,
  statusLabel
]);

// =========================
// 8. Funciones de actualización de Mapa y Gráfica
// =========================
function updateMapAndChart(){
  var idxName = selectIndex.getValue();
  var colIdx  = indexedCollection(idxName);

  var ts = colIdx.map(function(image){
    var meanVal = image.select('INDEX').reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: areaOfInterest.geometry(),
      scale: 10,
      maxPixels: 1e9
    });
    return ee.Feature(null, {
      date: image.date().format('YYYY-MM-dd'),
      value: meanVal.get('INDEX')
    });
  });

  var fc = ee.FeatureCollection(ts);

  var chart = ui.Chart.feature.byFeature({
    features: fc, xProperty: 'date', yProperties: ['value']
  }).setOptions({
    title: 'Serie temporal promedio - ' + idxName,
    hAxis: {title: 'Fecha'},
    vAxis: {title: idxName, viewWindow: {min: -1, max: 1}},
    lineWidth: 2, pointSize: 3
  });

  chartPanel.clear();
  chartPanel.add(chart);

  var selectedDate = selectDate.getValue();
  if (selectedDate){
    var image = colIdx.filterDate(selectedDate, ee.Date(selectedDate).advance(1, 'day')).first();

    Map.layers().reset();
    Map.centerObject(areaOfInterest, 11);
    Map.addLayer(areaOfInterest, {color: 'black'}, 'AOI');

    var rgb = image.select(['B4','B3','B2']);
    Map.addLayer(rgb, {min: 0, max: 0.3}, 'RGB - ' + selectedDate);

    var pal = palettes[idxName] || palettes['NDWI'];
    Map.addLayer(image.select('INDEX'), {min: -1, max: 1, palette: pal}, idxName + ' - ' + selectedDate);

    Map.addLayer(areaOfInterest, {color: 'black'}, 'AOI (encima)');
  }
}

// Callbacks
selectIndex.onChange(function(){ updateMapAndChart(); });
selectDate.onChange(function(){ updateMapAndChart(); });

// =========================
// 9. Inicialización UI
// =========================
Map.centerObject(areaOfInterest, 10);
Map.addLayer(areaOfInterest, {color: 'black'}, 'Área de Interés');
print(ui.Label('Elige un índice y luego una fecha para visualizarlo:'));
print(ui.Panel([
  ui.Label('Índice:'), selectIndex,
  ui.Label('Fecha:'),  selectDate
], ui.Panel.Layout.flow('horizontal')));

// Panel de exportación debajo de los selectores
print(downloadPanel);
