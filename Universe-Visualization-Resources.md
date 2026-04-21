# Universe Visualization Project — Tài Liệu & Nguồn Dữ Liệu

> Tổng hợp toàn bộ tài liệu, dữ liệu, và công cụ cần thiết để xây dựng dự án visualize vũ trụ 3D interactive với độ chính xác khoa học cao nhất.

---

## 1. DỮ LIỆU THIÊN VĂN (Astronomical Data)

### 1.1 Star Catalogs — Danh mục sao

| Catalog | Số lượng sao | Mô tả | Link |
|---------|-------------|-------|------|
| **Gaia DR3** (ESA) | ~1.8 tỷ sao | Dữ liệu chính xác nhất hiện nay — vị trí 3D, vận tốc, nhiệt độ, độ sáng | [gea.esac.esa.int/archive](https://gea.esac.esa.int/archive/) |
| **Hipparcos-2** | ~118,000 sao | Sao sáng gần, parallax chính xác cao — lý tưởng cho Solar neighborhood | [heasarc.gsfc.nasa.gov](https://heasarc.gsfc.nasa.gov/w3browse/star-catalog/hipparcos.html) |
| **Tycho-2** | ~2.5 triệu sao | Mở rộng từ Hipparcos, tốt cho star field background | Included in Gaia archive |
| **Yale Bright Star Catalog** | ~9,110 sao | Sao sáng nhất nhìn bằng mắt thường — tốt cho constellation overlay | [VizieR](https://vizier.cds.unistra.fr/) |

**Cách sử dụng:** Gaia DR3 là nguồn chính. Dùng parallax để tính khoảng cách 3D, color index cho màu sao, và absolute magnitude cho độ sáng thực.

### 1.2 Planetary Data — Dữ liệu hành tinh

| Nguồn | Mô tả | Link |
|-------|-------|------|
| **NASA JPL Horizons API** | Vị trí chính xác của mọi thiên thể trong Hệ Mặt Trời theo thời gian thực. Hỗ trợ 1.4M+ tiểu hành tinh, 4000+ sao chổi, 424 vệ tinh tự nhiên | [ssd.jpl.nasa.gov/horizons](https://ssd.jpl.nasa.gov/horizons/) |
| **JPL Horizons REST API** | API endpoint để query programmatically | [ssd-api.jpl.nasa.gov/doc/horizons.html](https://ssd-api.jpl.nasa.gov/doc/horizons.html) |
| **NASA Planetary Fact Sheet** | Thông số vật lý chi tiết: khối lượng, bán kính, nhiệt độ, thành phần khí quyển | [nssdc.gsfc.nasa.gov/planetary/factsheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) |
| **JPL Small-Body Database** | Quỹ đạo và thông số vật lý của tiểu hành tinh, sao chổi | [ssd.jpl.nasa.gov/tools/sbdb](https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html) |
| **JPL Orbital Elements** | Keplerian elements cho tất cả hành tinh | [ssd.jpl.nasa.gov/planets/orbits](https://ssd.jpl.nasa.gov/planets/orbits.html) |

**Cách sử dụng:** JPL Horizons API cung cấp ephemeris (vị trí + vận tốc) theo Cartesian coordinates (x,y,z) — map trực tiếp vào Three.js scene.

### 1.3 Galaxy Catalogs — Danh mục thiên hà

| Catalog | Mô tả | Link |
|---------|-------|------|
| **SDSS DR18** | Sloan Digital Sky Survey — hàng trăm nghìn thiên hà với spectroscopy, redshift, morphology | [sdss.org/dr18](https://www.sdss.org/dr18/) |
| **SDSS Value-Added Catalogs** | Bao gồm "Cosmic Slime" catalog cho cosmic web density | [sdss.org/dr18/data_access/value-added-catalogs](https://www.sdss.org/dr18/data_access/value-added-catalogs/) |
| **2MASS Extended Source Catalog** | 1.6 triệu thiên hà từ infrared survey | [irsa.ipac.caltech.edu](https://irsa.ipac.caltech.edu/Missions/2mass.html) |
| **NGC/IC Catalog** | ~13,000 deep-sky objects kinh điển (thiên hà, tinh vân, cụm sao) | [ngcicproject.observers.org](https://www.ngcicproject.observers.org/) |
| **NASA/IPAC Extragalactic Database (NED)** | Cơ sở dữ liệu thiên hà tổng hợp lớn nhất | [ned.ipac.caltech.edu](https://ned.ipac.caltech.edu/) |

### 1.4 Large-Scale Structure & Cosmic Web

| Nguồn | Mô tả | Link |
|-------|-------|------|
| **DESI Early Data Release** | Cosmic web classification mới nhất (2025) — filament, void, sheet, knot | [arxiv.org/html/2604.01456](https://arxiv.org/html/2604.01456) |
| **Bolshoi-Planck Simulation** | N-body simulation của cosmic web — dark matter distribution | [hipacc.ucsc.edu/Bolshoi](https://www.hipacc.ucsc.edu/Bolshoi/) |
| **IllustrisTNG** | Simulation lớn nhất về hình thành thiên hà và cosmic structure | [tng-project.org](https://www.tng-project.org/) |
| **Dark Energy Survey** | Large-scale structure mapping | [darkenergysurvey.org](https://www.darkenergysurvey.org/) |
| **Cosmic Microwave Background (Planck)** | Bản đồ CMB — "ảnh chụp" vũ trụ lúc 380,000 năm tuổi | [pla.esac.esa.int](https://pla.esac.esa.int/) |

---

## 2. TEXTURES & VISUAL ASSETS

### 2.1 Planet & Moon Textures

| Nguồn | Mô tả | Độ phân giải | Link |
|-------|-------|-------------|------|
| **Solar System Scope** | Texture maps dựa trên dữ liệu NASA — FREE, commercial-friendly | Lên tới 8K | [solarsystemscope.com/textures](https://www.solarsystemscope.com/textures/) |
| **Planet Pixel Emporium** | Texture map chất lượng cao cho mọi hành tinh | 1K–4K | [planetpixelemporium.com](https://planetpixelemporium.com/planets.html) |
| **NASA 3D Resources** | Official NASA textures, 3D models — hoàn toàn miễn phí | Varied | [nasa.gov/3d-resources](https://www.nasa.gov/3d-resources/) |
| **NASA 3D Resources (GitHub)** | Mirror trên GitHub, dễ clone | Varied | [github.com/nasa/NASA-3D-Resources](https://github.com/nasa/NASA-3D-Resources) |
| **NASA SVS Deep Star Maps** | Panoramic star maps từ Gaia — dùng làm skybox | 16K+ | [svs.gsfc.nasa.gov/4851](https://svs.gsfc.nasa.gov/4851) |

### 2.2 Nebula & Galaxy Images

| Nguồn | Mô tả | Link |
|-------|-------|------|
| **Hubble Heritage Gallery** | Ảnh gốc từ Hubble — tinh vân, thiên hà, cụm sao | [hubblesite.org/images/gallery](https://hubblesite.org/images/gallery) |
| **James Webb Space Telescope Gallery** | Ảnh infrared chi tiết nhất từng có | [webbtelescope.org/images](https://webbtelescope.org/images) |
| **ESO Image Archive** | European Southern Observatory — ảnh ground-based chất lượng cao | [eso.org/public/images](https://www.eso.org/public/images/) |
| **NASA Image and Video Library** | Kho ảnh tổng hợp NASA | [images.nasa.gov](https://images.nasa.gov/) |

### 2.3 HDRI / Skybox

| Nguồn | Mô tả | Link |
|-------|-------|------|
| **NASA Deep Star Maps (OpenEXR)** | Skybox từ 1.7 tỷ sao Gaia — format OpenEXR cho HDR | [svs.gsfc.nasa.gov/4851](https://svs.gsfc.nasa.gov/4851) |
| **Poly Haven (Space HDRIs)** | Free HDRIs cho space scenes | [polyhaven.com](https://polyhaven.com/) |
| **OpenGameArt Space Skyboxes** | Skybox textures miễn phí cho game/visualization | [opengameart.org](https://opengameart.org/) |

---

## 3. CÔNG NGHỆ & THƯ VIỆN (Tech Stack)

### 3.1 Core 3D Engine

| Thư viện | Mô tả | Link |
|----------|-------|------|
| **Three.js** | Thư viện 3D WebGL chính — nền tảng của project | [threejs.org](https://threejs.org/) |
| **React Three Fiber** | React wrapper cho Three.js — nếu muốn dùng React components | [docs.pmnd.rs/react-three-fiber](https://docs.pmnd.rs/react-three-fiber) |
| **@react-three/drei** | Helper collection cho R3F: controls, effects, loaders | [github.com/pmndrs/drei](https://github.com/pmndrs/drei) |
| **@react-three/postprocessing** | Bloom, god rays, chromatic aberration — tạo hiệu ứng vũ trụ | [github.com/pmndrs/react-postprocessing](https://github.com/pmndrs/react-postprocessing) |

### 3.2 Shader & Visual Effects

| Công nghệ | Mô tả | Link |
|-----------|-------|------|
| **GLSL (Custom Shaders)** | Viết shader cho sao, tinh vân, black hole, lensing effect | [thebookofshaders.com](https://thebookofshaders.com/) |
| **Shadertoy** | Kho shader examples — nhiều space/cosmic effects | [shadertoy.com](https://www.shadertoy.com/) |
| **GPU Particle Systems** | Render hàng triệu sao bằng instanced rendering / point sprites | Three.js docs |

### 3.3 Physics & Orbital Mechanics

| Thư viện / Tài liệu | Mô tả | Link |
|----------------------|-------|------|
| **Kepler's Laws** | Tính quỹ đạo elliptical từ orbital elements | [Wikipedia](https://en.wikipedia.org/wiki/Kepler%27s_laws_of_planetary_motion) |
| **VSOP87** | Planetary theory — tính vị trí hành tinh chính xác theo epoch | [neoprogrammics.com/vsop87](https://neoprogrammics.com/vsop87/) |
| **astronomy-engine (npm)** | JavaScript library tính vị trí thiên thể, eclipses, conjunctions | [github.com/cosinekitty/astronomy](https://github.com/cosinekitty/astronomy) |
| **N-body simulation** | Mô phỏng gravitational dynamics cho galaxy formation | [WebGL N-body Galaxy Sim](https://andrewdcampbell.github.io/galaxy-sim-report) |

### 3.4 Stellar Physics

| Tài liệu | Mô tả | Link |
|----------|-------|------|
| **Hertzsprung-Russell Diagram** | Phân loại sao theo nhiệt độ-độ sáng — xác định màu sắc và kích thước sao | [Wikipedia](https://en.wikipedia.org/wiki/Hertzsprung%E2%80%93Russell_diagram) |
| **MESA** | Open-source stellar evolution code — mô phỏng đời sống ngôi sao | [docs.mesastar.org](https://docs.mesastar.org/) |
| **Stellar Classification** | Spectral types O-B-A-F-G-K-M → color mapping cho rendering | [Wikipedia](https://en.wikipedia.org/wiki/Stellar_classification) |
| **Stellar Evolution Simulator** | Interactive tool để hiểu life cycle of stars | [calcpeak.com](https://www.calcpeak.com/stellar-evolution-simulator/) |

### 3.5 Sound & Audio

| Công nghệ | Mô tả | Link |
|-----------|-------|------|
| **Web Audio API** | Browser-native API cho procedural audio synthesis | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) |
| **Tone.js** | Framework cho Web Audio — synthesizers, effects, scheduling | [tonejs.github.io](https://tonejs.github.io/) |
| **Generative.fm** | Open-source generative ambient music — tham khảo approach | [generative.fm](https://generative.fm/) |
| **NASA Sonification** | NASA chuyển dữ liệu thiên văn thành âm thanh — inspiration | [chandra.si.edu/sound](https://chandra.si.edu/sound/) |
| **Spatial Audio (PannerNode)** | Âm thanh 3D trong không gian — gắn sound vào vị trí thiên thể | [MDN Spatialization](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics) |

---

## 4. DỰ ÁN THAM KHẢO (Reference Projects)

| Dự án | Mô tả | Link |
|-------|-------|------|
| **Gaia Sky** | ESA's official 3D visualization của Gaia catalog — benchmark về độ chính xác | [gaiasky.space](https://gaiasky.space/) |
| **NASA Eyes on the Solar System** | Official NASA WebGL solar system explorer | [eyes.nasa.gov](https://eyes.nasa.gov/apps/solar-system/) |
| **Galaxy Voyager** | Procedural galaxy explorer with 220+ star systems — Three.js + React Three Fiber | [Three.js Forum](https://discourse.threejs.org/t/galaxy-voyager-a-procedural-galaxy-explorer-with-220-star-systems-built-with-react-three-fiber-post-processing/86659) |
| **100,000 Stars (Google)** | Chrome Experiment hiển thị 100K sao gần — Three.js classic | [stars.chromeexperiments.com](https://stars.chromeexperiments.com/) |
| **SpaceEngine** | Desktop app — gold standard cho universe visualization | [spaceengine.org](https://spaceengine.org/) |
| **Celestia** | Open-source 3D space simulator | [celestiaproject.space](https://celestiaproject.space/) |
| **Universe in JavaScript** | Blog chi tiết cách build toàn bộ vũ trụ bằng JS | [jesuisundev.com](https://www.jesuisundev.com/en/i-built-the-entire-universe-in-javascript/) |

---

## 5. TÀI LIỆU KHOA HỌC BỔ SUNG

### 5.1 Scale of the Universe

| Chủ đề | Mô tả |
|--------|-------|
| **Logarithmic scale** | Vũ trụ trải dài ~93 tỷ năm ánh sáng — cần dùng logarithmic scale để render multi-scale (từ mét → parsec → megaparsec) |
| **Cosmic distance ladder** | Parallax → Cepheid variables → Type Ia Supernovae → Redshift — hiểu cách đo khoảng cách ở mỗi scale |
| **Observable universe** | Bán kính ~46.5 tỷ năm ánh sáng, chứa ~2 nghìn tỷ thiên hà, ~10²⁴ ngôi sao |

### 5.2 Key Physical Constants

| Hằng số | Giá trị | Sử dụng |
|---------|---------|---------|
| Speed of Light (c) | 299,792,458 m/s | Tính travel time, light delay |
| Gravitational Constant (G) | 6.674×10⁻¹¹ N⋅m²/kg² | N-body simulation |
| 1 AU | 149,597,870.7 km | Đơn vị trong Solar System |
| 1 Parsec | 3.2616 light-years | Đơn vị cho stellar distances |
| 1 Megaparsec | 3.26 triệu light-years | Đơn vị cho cosmological distances |
| Hubble Constant | ~67.4 km/s/Mpc | Tính expansion rate, redshift→distance |

### 5.3 Color Science cho Stars

| Spectral Type | Nhiệt độ (K) | Màu | Ví dụ |
|---------------|-------------|-----|-------|
| O | >30,000 | Xanh tím rực | Mintaka |
| B | 10,000–30,000 | Xanh trắng | Rigel, Spica |
| A | 7,500–10,000 | Trắng | Sirius, Vega |
| F | 6,000–7,500 | Trắng vàng | Canopus, Procyon |
| G | 5,200–6,000 | Vàng | Mặt Trời, Alpha Centauri A |
| K | 3,700–5,200 | Cam | Arcturus, Aldebaran |
| M | 2,400–3,700 | Đỏ | Betelgeuse, Proxima Centauri |

---

## 6. KIẾN TRÚC DỰ ÁN GỢI Ý

```
universe-viz/
├── src/
│   ├── core/
│   │   ├── SceneManager.js          # Three.js scene, camera, renderer
│   │   ├── ScaleManager.js          # Multi-scale coordinate system
│   │   └── TimeEngine.js            # Time simulation (speed, direction)
│   ├── scales/
│   │   ├── SolarSystem.js           # Planets, moons, asteroids
│   │   ├── StellarNeighborhood.js   # Nearby stars (~100 ly)
│   │   ├── MilkyWay.js              # Galaxy structure, spiral arms
│   │   ├── LocalGroup.js            # Andromeda, Magellanic Clouds
│   │   ├── GalaxyClusters.js        # Virgo, Coma clusters
│   │   └── CosmicWeb.js             # Filaments, voids, sheets
│   ├── objects/
│   │   ├── Star.js                  # Render star by spectral type
│   │   ├── Planet.js                # Textured sphere + atmosphere
│   │   ├── Nebula.js                # Volumetric/billboard nebula
│   │   ├── BlackHole.js             # Gravitational lensing shader
│   │   └── Galaxy.js                # Particle-based galaxy
│   ├── physics/
│   │   ├── OrbitalMechanics.js      # Kepler solver
│   │   ├── NBody.js                 # Gravitational simulation
│   │   └── CosmicExpansion.js       # Hubble flow
│   ├── audio/
│   │   ├── CosmicAmbient.js         # Procedural ambient generator
│   │   └── SpatialAudio.js          # 3D positional audio
│   ├── ui/
│   │   ├── InfoPanel.js             # Scientific data display
│   │   ├── NavigationHUD.js         # Scale indicator, coordinates
│   │   ├── TimeControls.js          # Play/pause/speed slider
│   │   └── SearchBar.js             # Search celestial objects
│   ├── data/
│   │   ├── stars.json               # Processed Gaia/Hipparcos data
│   │   ├── planets.json             # JPL orbital elements
│   │   ├── galaxies.json            # SDSS/NGC catalog subset
│   │   └── cosmic-web.json          # Filament network data
│   └── shaders/
│       ├── star.glsl                # Star rendering
│       ├── nebula.glsl              # Volumetric nebula
│       ├── bloom.glsl               # Glow effect
│       ├── atmosphere.glsl          # Planetary atmosphere
│       └── lensing.glsl             # Gravitational lensing
├── public/
│   └── textures/                    # Planet maps, skybox, sprites
├── package.json
└── README.md
```

---

## 7. ROADMAP GỢI Ý

| Phase | Nội dung | Thời gian ước tính |
|-------|---------|-------------------|
| **Phase 1** | Solar System hoàn chỉnh: 8 hành tinh + mặt trăng + vành đai tiểu hành tinh, quỹ đạo chính xác từ JPL, texture 4K+ | 2–3 tuần |
| **Phase 2** | Stellar neighborhood: 100,000 sao gần nhất từ Gaia, đúng màu spectral type, constellation lines | 1–2 tuần |
| **Phase 3** | Milky Way galaxy: cấu trúc xoắn ốc, trung tâm thiên hà, Sagittarius A* | 2 tuần |
| **Phase 4** | Extragalactic: Local Group, galaxy clusters, cosmic web | 2–3 tuần |
| **Phase 5** | Audio system: procedural ambient + spatial sound | 1 tuần |
| **Phase 6** | Info system + Time simulation + Polish | 2 tuần |

---

*Tài liệu này được tổng hợp vào ngày 16/04/2026. Các nguồn dữ liệu thiên văn được cập nhật liên tục — hãy kiểm tra phiên bản mới nhất khi bắt đầu triển khai.*
