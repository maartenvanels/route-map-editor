# Vakantieroute kaart

Deze map bevat een kleine generator waarmee je een lijst met vakantieplekken omzet naar een hoogwaardige SVG-routekaart.

## Locaties invullen

Vervang de voorbeeldregels in `locations.csv` door je echte route:

```csv
order,name,lat,lon
1,Amsterdam,52.3676,4.9041
2,Paris,48.8566,2.3522
3,Lyon,45.7640,4.8357
```

Belangrijk:

- `order` bepaalt de volgorde van de lijn.
- `name` is het label op de kaart.
- `lat` en `lon` zijn coordinaten. Gebruik bij voorkeur punt-decimalen, maar komma-decimalen werken ook in een puntkomma-CSV.

## SVG maken

```powershell
python .\route_map.py
```

De output komt in:

```text
output/route-map.svg
```

Je kunt ook een groter formaat kiezen:

```powershell
python .\route_map.py --width 4800 --height 3200 --output output/route-map-large.svg
```

De route wordt standaard als vloeiende SVG-curve getekend. Als je ooit de oude rechte lijnen wilt vergelijken:

```powershell
python .\route_map.py --line-style straight --output output/route-map-straight.svg
```

## Wegen, water en groen toevoegen

Download eerst de OpenStreetMap contextlagen rond de route:

```powershell
python .\download_osm_context.py
```

Daarna gebruikt `route_map.py` automatisch:

```text
data/osm-context.json
```

De extra lagen zijn hoofdwegen, kleinere wegen, rivieren/water, bossen en landbouw/velden. De route blijft daar duidelijk bovenop liggen.

## Editor openen

Start een lokale webserver in deze map:

```powershell
node .\serve_editor.js
```

Open daarna:

```text
http://127.0.0.1:8790/editor.html
```

In de editor kun je plaatsnamen slepen, font en kleuren aanpassen, lagen aan/uit zetten, routekleur/breedte/lijntype wijzigen en de bewerkte SVG exporteren.

## Online delen via GitHub Pages

De map `docs/` is klaar om direct via GitHub Pages gepubliceerd te worden. De publieke Pages-versie bevat de editor en de routekaart als standaard SVG.

GitHub-instelling:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/docs`

Daarna opent `index.html` automatisch de editor met `docs/output/route-map.svg`. De ander kan daar ook zelf een andere SVG uploaden, bewerken en weer exporteren.

## Basemap

De generator gebruikt standaard deze echte Natural Earth vector-basemap:

```text
data/ne_10m_admin_0_countries.geojson
```

Daardoor worden de steden en de kaart met dezelfde lengte- en breedtegraden geprojecteerd. De SVG blijft vector, dus die kun je zonder kwaliteitsverlies vergroten.

Bron: https://github.com/nvkelso/natural-earth-vector
