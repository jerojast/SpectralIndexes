# Spectral Indexes Multitemporal (GEE App)

This repository contains a **Google Earth Engine (GEE)** script to calculate, visualize, and export multiple spectral indices derived from Sentinel‑2 (Level SR) over an Area of Interest (AOI) and a multitemporal range. It includes UI components to select the index and date, an average time series chart over the AOI, and an export module to Google Drive.

> Main file: `Spectral_Indexes_Multitemporal.js`

---

## Features

- **Supported indices:** `NDWI`, `NDVI`, `MNDWI`, `NDBI`, `SAVI`, `EVI`, `NBR`.
- **Cloud masking** using Sentinel‑2 SR **SCL** band (removes shadows, medium/thin/high clouds, and saturated pixels).
- **Rescaling** of optical bands to reflectance (factor `0.0001`).
- **Interactive UI** with index and date selectors.
- **Average time series** chart of the selected index over the AOI.
- **RGB and index visualization** with palettes based on the selected index type.
- **Export to Google Drive** of the AOI-clipped index image (with scale, folder, and CRS options).

---

## Requirements & Environment

- **Google Earth Engine** account and access to the **Code Editor**.
- Dataset: `COPERNICUS/S2_SR` (Sentinel‑2 Surface Reflectance).
- AOI must be published as a **FeatureCollection Asset** (e.g., `projects/ee-jorojasto/assets/Esperanza`).

> No external libraries required; script uses only GEE API and `ui.*` components.

---

## Script Structure

1. **Area of Interest (AOI)**: `ee.FeatureCollection('projects/...')`  
2. **Analysis dates**: `startDate`, `endDate`  
3. **Sentinel‑2 SR loading + SCL mask**: `maskClouds(image)`  
4. **Rescaling to reflectance**: bands `B2, B3, B4, B8, B11, B12` × `0.0001`  
5. **Index definitions**: `computeIndex(image, indexName)`  
6. **Indexed collection generator**: `indexedCollection(indexName)`  
7. **UI**: **Index** and **Date** selectors, chart panel  
8. **Export panel**: scale, folder, CRS, and “Download” button  
9. **Map and chart update**: `updateMapAndChart()`  
10. **Initialization**: center map on AOI, load panels and layers

---

## How to Use

1. **Open the GEE Code Editor** and **paste** `Spectral_Indexes_Multitemporal.js` into a new script.
2. **Set your AOI** by replacing the asset path:
   ```js
   var areaOfInterest = ee.FeatureCollection('projects/<your-project>/assets/<your-AOI>');
   ```
3. **Adjust analysis dates** if needed:
   ```js
   var startDate = 'YYYY-MM-DD';
   var endDate   = 'YYYY-MM-DD';
   ```
4. (Optional) **Change the cloud percentage threshold**:
   ```js
   .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
   ```
5. **Run** the script. In the **Console**, you'll see:
   - **Index** and **Date** selectors.
   - **Average time series chart**.
   - **Export panel** (scale, folder, CRS, and “Download Index (AOI)” button).
6. **Select an index and date** to visualize:
   - **RGB layer** (`B4, B3, B2`, min/max: `0 – 0.3`).
   - **Index layer** (`-1 – 1`) with specific palette.
7. **Export to Drive**:
   - **Scale** in meters (e.g., `10`).
   - **Folder** in Drive (e.g., `GEE`).
   - **CRS** (optional, e.g., `EPSG:3116`).

> The export creates a **task** in the **Tasks** tab of the Code Editor. Click **RUN** to start.

---

## Implemented Indices

Formulas for Sentinel‑2 SR bands (`B2=Blue`, `B3=Green`, `B4=Red`, `B8=NIR`, `B11=SWIR1`, `B12=SWIR2`).

- **NDVI** (Vegetation):  
  \[ \mathrm{NDVI} = \frac{B8 - B4}{B8 + B4} \]
- **NDWI** (Water, *McFeeters, 1996*):  
  \[ \mathrm{NDWI} = \frac{B3 - B8}{B3 + B8} \]
- **MNDWI** (Enhanced Water, *Xu, 2006*):  
  \[ \mathrm{MNDWI} = \frac{B3 - B11}{B3 + B11} \]
- **NDBI** (Built-up, *Zha et al., 2003*):  
  \[ \mathrm{NDBI} = \frac{B11 - B8}{B11 + B8} \]
- **SAVI** (Soil-adjusted, *Huete, 1988*), with \( L = 0.5 \):  
  \[ \mathrm{SAVI} = (1 + L) \cdot \frac{B8 - B4}{B8 + B4 + L} \]
- **EVI** (Enhanced Vegetation, *Huete et al., 2002*):  
  \[ \mathrm{EVI} = 2.5 \cdot \frac{B8 - B4}{B8 + 6B4 - 7.5B2 + 1} \]
- **NBR** (Burn severity, *Key & Benson, 2006*):  
  \[ \mathrm{NBR} = \frac{B8 - B12}{B8 + B12} \]

---

## 🎛️ Key Parameters

- **SCL mask**: removes `SCL ∈ {1,3,8,9,10}` → saturated, shadow, medium/thin/high clouds.
- **ND range**: index visualization in `[-1, 1]`.
- **Reflectance**: scaled × `0.0001` before calculation.
- **Temporal aggregation**: series shows **spatial average of the index** over AOI per available image.
- **Export**:
  - `scale` (m), `folder` (Drive), `crs` (optional), `region` (AOI), `maxPixels: 1e13`.

---

## Visualization

- **RGB**: `B4, B3, B2` (min: `0`, max: `0.3`).
- **Index**: pre‑defined palettes, e.g.:
  - `NDVI / SAVI / EVI`: brown → dark green.
  - `NDWI / MNDWI`: dark red → dark blue.
  - `NDBI`: navy → red/brown.
  - `NBR`: purple → red.

---

## Quick Customization

- Change **AOI** and **dates** (sections 1 & 2).
- Adjust **CLOUDY_PIXEL_PERCENTAGE**.
- Modify **SAVI** parameter `L` for more/less soil exposure.
- Add new **indices** in `computeIndex()` and extend `palettes`/`indexList`.

---

## Limitations & Notes

- The `[-1, 1]` visualization range is generic; adapt min/max to your case.
- **EVI** may be sensitive to **Blue (B2)** noise and aerosols.
- The **SCL mask** doesn’t remove all artifacts (e.g., haze, thin cirrus).
- Time series shows **spatial average**; add percentile/zonal analysis if needed.
- Ensure **AOI** does not exceed **`maxPixels`** limits.

---

## Data Quality Recommendations

- Check atmospheric quality and complement with **QA60** if needed.
- Inspect outlier images visually.
- Consider **monthly/seasonal composites** for temporal consistency.

---

## References

- Huete, A. R. (1988). A soil‑adjusted vegetation index (SAVI). *Remote Sensing of Environment*, 25(3), 295–309.
- Huete, A., Didan, K., Miura, T., Rodriguez, E. P., Gao, X., & Ferreira, L. G. (2002). Overview of the radiometric and biophysical performance of the MODIS vegetation indices. *Remote Sensing of Environment*, 83(1-2), 195–213.
- Key, C. H., & Benson, N. C. (2006). Landscape assessment (LA) sampling and analysis methods. *FIREMON: Fire effects monitoring and inventory system*.
- McFeeters, S. K. (1996). The use of the normalized difference water index (NDWI) in the delineation of open water features. *International Journal of Remote Sensing*, 17(7), 1425–1432.
- Xu, H. (2006). Modification of normalised difference water index (NDWI) to enhance open water features: A MNDWI. *International Journal of Remote Sensing*, 27(14), 3025–3033.
- Zha, Y., Gao, J., & Ni, S. (2003). Use of normalized difference built‑up index in automatically mapping urban areas from TM imagery. *International Journal of Remote Sensing*, 24(3), 583–594.

---

## License

This project is licensed under the **MIT License**.

---

## Contributions

Contributions and pull requests are welcome!

---

## Acknowledgments

- GEE community and official documentation.

___________________________________________________________________________________________________________________________________________________________________________________________________________

# Spectral Indexes Multitemporal (GEE App)

Este repositorio contiene un script para **Google Earth Engine (GEE)** que permite calcular, visualizar y exportar de manera interactiva varios índices espectrales derivados de Sentinel‑2 (Nivel SR), sobre un Área de Interés (AOI) y en un rango multitemporal. Incluye componentes de UI para seleccionar índice y fecha, una gráfica de serie temporal promedio sobre el AOI y un módulo de exportación a Google Drive.

> Archivo principal: `Spectral_Indexes_Multitemporal.js`

---

## Características

- **Índices soportados:** `NDWI`, `NDVI`, `MNDWI`, `NDBI`, `SAVI`, `EVI`, `NBR`.
- **Máscara de nubes** usando la banda **SCL** de Sentinel‑2 SR (excluye sombras, nubes medias/finas/altas y píxeles saturados).
- **Reescalado** de bandas ópticas a reflectancia (factor `0.0001`).
- **UI interactiva** con selectores de índice y fecha.
- **Serie temporal promedio** del índice seleccionado sobre el AOI.
- **Visualización RGB** y del índice con paletas configuradas por tipo de índice.
- **Exportación a Google Drive** de la imagen del índice recortada al AOI (con escala, carpeta y CRS configurables).

---

## Dependencias y entorno

- Cuenta en **Google Earth Engine** y acceso al **Code Editor**.
- Colección: `COPERNICUS/S2_SR` (Sentinel‑2 Surface Reflectance).
- El AOI debe estar publicado como **Asset** de tipo *FeatureCollection* (ej.: `projects/ee-jorojasto/assets/Esperanza`).

> No requiere librerías externas adicionales; el script usa sólo la API de GEE y componentes de `ui.*`.

---

## Estructura del script

1. **Área de interés (AOI)**: `ee.FeatureCollection('projects/...')`  
2. **Fechas de análisis**: `startDate`, `endDate`  
3. **Carga de Sentinel‑2 SR + máscara SCL**: `maskClouds(image)`  
4. **Reescalado a reflectancia**: bandas `B2, B3, B4, B8, B11, B12` × `0.0001`  
5. **Definición de índices**: `computeIndex(image, indexName)`  
6. **Colección indexada**: `indexedCollection(indexName)`  
7. **UI**: selectores de **Índice** y **Fecha**, panel de **gráfica**  
8. **Exportación**: panel con **escala, carpeta, CRS** y botón **Descargar**  
9. **Actualización de mapa y gráfica**: `updateMapAndChart()`  
10. **Inicialización**: centrado en AOI, carga de paneles y capas

---

## Cómo usar

1. **Abrir el Code Editor** de GEE y **pegar** `Spectral_Indexes_Multitemporal.js` en un nuevo *script*.
2. **Configurar tu AOI** reemplazando la ruta del asset:
   ```js
   var areaOfInterest = ee.FeatureCollection('projects/<tu-proyecto>/assets/<tu-AOI>');
   ```
3. **Ajustar fechas** de análisis si es necesario:
   ```js
   var startDate = 'YYYY-MM-DD';
   var endDate   = 'YYYY-MM-DD';
   ```
4. (Opcional) **Cambiar el umbral de nubes** de Sentinel‑2 SR:
   ```js
   .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
   ```
5. **Ejecutar** el script. En la **Consola**, verás:
   - Selectores de **Índice** y **Fecha**.
   - Panel con la **serie temporal promedio** del índice.
   - Panel de **exportación** (escala, carpeta, CRS y botón “Descargar índice (AOI)”).
6. **Selecciona un índice y una fecha** para visualizar:
   - Capa **RGB** (`B4, B3, B2`, min/max: `0 – 0.3`).
   - Capa del **índice** (`-1 – 1`) con paleta específica.
7. **Exporta a Drive** con el botón:
   - **Escala** en metros (p. ej., `10`).
   - **Carpeta** en Drive (p. ej., `GEE`).
   - **CRS** (opcional, p. ej., `EPSG:3116`).

> La exportación crea una **tarea** en la pestaña **Tasks** del Code Editor. Debes pulsar **RUN** para iniciar el proceso en GEE.

---

## Índices implementados

A continuación, los índices y sus fórmulas (bandas Sentinel‑2 SR: `B2=Blue`, `B3=Green`, `B4=Red`, `B8=NIR`, `B11=SWIR1`, `B12=SWIR2`).

- **NDVI** (Vegetación):  
  \[ \mathrm{NDVI} = \frac{B8 - B4}{B8 + B4} \]
- **NDWI** (Agua, *McFeeters, 1996*):  
  \[ \mathrm{NDWI} = \frac{B3 - B8}{B3 + B8} \]
- **MNDWI** (Agua mejorado, *Xu, 2006*):  
  \[ \mathrm{MNDWI} = \frac{B3 - B11}{B3 + B11} \]
- **NDBI** (Área construida, *Zha et al., 2003*):  
  \[ \mathrm{NDBI} = \frac{B11 - B8}{B11 + B8} \]
- **SAVI** (Vegetación en suelos expuestos, *Huete, 1988*), con \( L = 0.5 \):  
  \[ \mathrm{SAVI} = (1 + L) \cdot \frac{B8 - B4}{B8 + B4 + L} \]
- **EVI** (Vegetación mejorado, *Huete et al., 2002*):  
  \[ \mathrm{EVI} = 2.5 \cdot \frac{B8 - B4}{B8 + 6B4 - 7.5B2 + 1} \]
- **NBR** (Severidad de quemas, *Key & Benson, 2006*):  
  \[ \mathrm{NBR} = \frac{B8 - B12}{B8 + B12} \]

> El script establece automáticamente la **paleta** acorde al índice seleccionado.

---

##  Parámetros clave

- **Máscara SCL**: excluye `SCL ∈ {1,3,8,9,10}` → saturado, sombra, nubes medias/finas/altas.
- **Rango ND**: visualización de índices en `[-1, 1]`.
- **Reflectancia**: bandas reescaladas × `0.0001` antes del cálculo.
- **Agregación temporal**: la serie muestra el **promedio espacial del índice** sobre el AOI por imagen disponible.
- **Exportación**:
  - `scale` (m), `folder` (Drive), `crs` (opcional), `region` (AOI), `maxPixels: 1e13`.

---

## Visualización

- **RGB**: `B4, B3, B2` (min: `0`, max: `0.3`).
- **Índice**: paletas predefinidas por índice, p. ej.:
  - `NDVI / SAVI / EVI`: marrón → verde oscuro.
  - `NDWI / MNDWI`: rojo oscuro → azul oscuro.
  - `NDBI`: azul marino → rojo/marrón.
  - `NBR`: púrpura → rojo.

---

## Personalización rápida

- Cambia el **AOI** y **fechas** (secciones 1 y 2).
- Ajusta **CLOUDY_PIXEL_PERCENTAGE** según tu tolerancia a nubes.
- Modifica el **parámetro L** de **SAVI** si tu escena tiene más/menos suelo expuesto.
- Añade nuevos **índices** dentro de `computeIndex(image, indexName)` y extiende `palettes`/`indexList`.

---

## Limitaciones y notas

- El rango `[-1, 1]` en las visualizaciones es genérico; puedes adaptar min/max a tu caso.
- **EVI** puede ser sensible al **ruido en Blue (B2)** y a aerosoles; valida según tu región.
- La **máscara SCL** no elimina el 100% de artefactos (bruma, cirros finos, bordes de nube).
- La serie temporal refleja **promedio espacial**; para análisis por **percentiles** o **zonal** agrega tu propia reducción.
- Asegúrate de que el **AOI** no exceda los límites de **`maxPixels`** o ajusta la **escala**.

---

## Calidad de datos (recomendaciones)

- Verificar **calidad atmosférica** de las escenas y complementar con **QA60** si es necesario.
- Realizar **inspección visual** de imágenes extremas (valores outliers).
- Considerar **composites mensuales**/estacionales si se requiere consistencia temporal.

---

## Referencias

- Huete, A. R. (1988). A soil‑adjusted vegetation index (SAVI). *Remote Sensing of Environment*, 25(3), 295–309.
- Huete, A., Didan, K., Miura, T., Rodriguez, E. P., Gao, X., & Ferreira, L. G. (2002). Overview of the radiometric and biophysical performance of the MODIS vegetation indices. *Remote Sensing of Environment*, 83(1-2), 195–213.
- Key, C. H., & Benson, N. C. (2006). Landscape assessment (LA) sampling and analysis methods. *FIREMON: Fire effects monitoring and inventory system*.
- McFeeters, S. K. (1996). The use of the normalized difference water index (NDWI) in the delineation of open water features. *International Journal of Remote Sensing*, 17(7), 1425–1432.
- Xu, H. (2006). Modification of normalised difference water index (NDWI) to enhance open water features: A MNDWI. *International Journal of Remote Sensing*, 27(14), 3025–3033.
- Zha, Y., Gao, J., & Ni, S. (2003). Use of normalized difference built‑up index in automatically mapping urban areas from TM imagery. *International Journal of Remote Sensing*, 24(3), 583–594.

> Las referencias se listan con fines informativos para sustentar las fórmulas implementadas en el script.

---

## Licencia

Este proyecto se distribuye bajo licencia **MIT**. Puedes usar, modificar y redistribuir el código citando este repositorio.

---

## Contribuciones

¡Sugerencias y *pull requests* son bienvenidos! Para cambios mayores, abre un *issue* y describe lo que te gustaría modificar.

---

## Agradecimientos

- Comunidad de GEE y documentación oficial.
- Colección Sentinel‑2 (Copernicus).


- Sentinel‑2 (Copernicus) dataset.

