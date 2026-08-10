# 🪐 Jelajah Tata Surya · Explore the Solar System

Simulasi tata surya 3D interaktif untuk edukasi — bisa diputar, di-zoom, dan setiap planet bisa diketuk untuk melihat info detailnya. Dwibahasa (Indonesia / English), berjalan di satu file HTML tanpa build step.

*An interactive 3D solar-system simulation for education — orbit, zoom, and tap any planet for details. Bilingual (Indonesian / English), runs from a single HTML file with no build step.*

![Tampilan utama](docs/screenshots/desktop-overview.jpg)

---

## ✨ Fitur · Features

| | |
|---|---|
| 🌍 **10 benda langit** | Matahari, 8 planet, dan Pluto dengan tekstur foto NASA |
| 🌙 **12 bulan utama** | Bulan, Io, Europa, Ganimede, Kalisto, Titan, Enceladus, Triton, Titania, Charon, Phobos, Deimos |
| 💍 **Cincin** | Saturnus dan Uranus, dengan kemiringan sumbu yang benar |
| ☄️ **Sabuk asteroid** | ~2.200 batuan dengan rotasi diferensial sesuai Hukum Kepler III |
| 🔭 **Orbit sungguhan** | Elips dengan eksentrisitas & inklinasi asli, diselesaikan lewat persamaan Kepler — planet benar-benar melambat di aphelion |
| 🌗 **Rotasi & kemiringan** | Periode rotasi dan kemiringan sumbu asli; Venus dan Uranus berputar retrograde |
| ⏱️ **Kontrol waktu** | 0,01 – 600 hari/detik, dengan tombol jeda |
| 🌐 **Dwibahasa** | Tombol ID/EN mengganti seluruh antarmuka *dan* isi konten |
| 📱 **Mobile-first** | Panel info jadi bottom sheet, target sentuh diperbesar, kamera menyesuaikan bingkai otomatis |

### Konten edukatif

Setiap benda langit punya:

- deskripsi ringkas yang ramah anak,
- tabel data (diameter, jarak, periode orbit & rotasi, jumlah bulan, gravitasi, suhu, kecepatan orbit),
- perbandingan visual dengan Bumi,
- tiga fakta menarik,
- dan penjelasan lengkap yang bisa dibuka untuk pembaca dewasa.

Semuanya tersedia penuh dalam Bahasa Indonesia dan Bahasa Inggris.

---

## 🚀 Cara pakai · Getting started

Buka `index.html` di browser mana pun. Tidak ada build step, tidak ada dependency yang perlu di-install.

```bash
git clone https://github.com/jipraks/solar-explorer.git
cd solar-explorer
python3 -m http.server 8000
# buka http://localhost:8000
```

> **Butuh koneksi internet** untuk memuat Three.js dan tekstur planet dari CDN.
> Kalau gagal dimuat, halaman menampilkan pesan yang jelas, bukan layar memuat yang berputar selamanya.

### GitHub Pages

Repo ini siap di-deploy apa adanya. Buka **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**, lalu situsnya terbit di `https://jipraks.github.io/solar-explorer/`.

---

## 🖼️ Tangkapan layar · Screenshots

| Bumi & Bulan | Saturnus |
|---|---|
| ![Bumi](docs/screenshots/desktop-earth.jpg) | ![Saturnus](docs/screenshots/desktop-saturn.jpg) |

| Tampak atas | Mobile |
|---|---|
| ![Tampak atas](docs/screenshots/desktop-top.jpg) | ![Mobile](docs/screenshots/mobile-overview.jpg) |

---

## 🛠️ Pengembangan · Development

Sumbernya dipecah tiga file di `src/`, lalu digabung jadi satu `index.html`:

```
src/index.template.html   HTML + CSS + struktur UI
src/data.js               data astronomi & seluruh teks dwibahasa
src/app.js                scene Three.js, kamera, interaksi, logika UI
```

```bash
python3 build.py           # gabungkan src/ → index.html
python3 build.py --check   # cek index.html sudah sinkron dengan src/
```

Selalu edit file di `src/`, lalu jalankan `build.py`. Jangan mengedit `index.html` langsung — file itu hasil generate.

### Menambah benda langit baru

Tambahkan satu objek ke array `BODIES` di `src/data.js`. Radius tampil, jarak orbit, dan bingkai kamera semuanya dihitung otomatis dari `radiusKm` dan `dist` (dalam AU).

### Catatan skala

Jarak dan ukuran sengaja **dikompres** agar semua planet muat di satu layar:

```
radius tampil = 1,40 × (R / R_bumi) ^ 0,42
jarak tampil  = 18 + 30 × (AU ^ 0,55)
```

Kalau digambar sesuai skala asli, Bumi hanya sebesar satu piksel dan Neptunus berada seratus layar jauhnya. Kompresi ini dijelaskan di dalam aplikasi (panduan "Cara menjelajah" dan catatan di setiap panel info) supaya tidak menimbulkan salah paham.

Yang **tidak** dikompres: eksentrisitas orbit, inklinasi, kemiringan sumbu, periode orbit, dan periode rotasi — semuanya memakai angka asli.

---

## 📊 Sumber data · Data sources

- Angka planet: [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- Jumlah bulan: [IAU Minor Planet Center](https://www.iau.org/) (Maret 2026 — Jupiter 101, Saturnus 285)
- Tekstur planet: [threex.planets](https://github.com/jeromeetienne/threex.planets) oleh Jerome Etienne (MIT), disusun dari citra NASA dan [Planet Pixel Emporium](https://planetpixelemporium.com/) oleh James Hastings-Trew
- Mesin 3D: [Three.js](https://threejs.org/) r180

Jumlah bulan terus bertambah seiring penemuan baru — aplikasi mencantumkan catatan ini di panel planet yang punya banyak bulan.

---

## 📄 Lisensi · License

Kode: [MIT](LICENSE).

Tekstur planet dimuat saat runtime dari repositori pihak ketiga dan tunduk pada lisensinya masing-masing; tekstur tersebut tidak disertakan di repo ini.
