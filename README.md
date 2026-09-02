# Huerta IoT · Demo

Tablero web estático para el proyecto académico **“Monitoreo de una huerta orgánica experimental mediante IoT”**.

**Sitio esperado:** <https://hernanruggeri.github.io/huerta-iot-demo/>

## Funciones de la demo

- Resumen de variables ambientales, humedad por cantero, alertas y actividad.
- Historial gráfico filtrable por cantero y período, con umbrales específicos.
- Registro local de riegos manuales (no acciona equipamiento).
- Estado simulado de nodos ESP32 e interrupción/reconexión del Cantero 2.
- Actualización manual o automática de datos simulados.

## Desarrollo local

```bash
npm install
npm run dev
```

La compilación de producción se genera con `npm run build`. La base pública está configurada como `/huerta-iot-demo/` y el workflow de GitHub Actions publica `dist/` en GitHub Pages al actualizar `main`.
