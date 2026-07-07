# Universe Live Desktop

GPU-rendered local 3D universe viewer for the labwc desktop.

Data sources in the current sample:

- SDSS DR18 SkyServer galaxy spectra: 7,000 points
- NASA HEASARC 2MASS Redshift Survey / 2MRS: 6,000 points
- Official GLADE+ ASCII catalog: 5,000 streamed sample points
- VizieR Cosmicflows-4 `J/ApJ/944/94/table2`: 5,000 points

The viewer renders point clouds only. It intentionally skips cosmic-web filament lines; the faint sphere lines are reference shell/grid lines.

Run:

```sh
/home/joe/.local/bin/universe-live-desktop
```

Refresh data:

```sh
cd /home/joe/.openclaw/workspace/universe-live-desktop
npm run fetch:data
```

The labwc config launches it on startup, keeps it out of the taskbar/window switcher, and places it underneath normal windows.
