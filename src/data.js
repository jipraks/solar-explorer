/* ============================================================
   DATA · Solar System
   Astronomical figures: NASA Planetary Fact Sheet + IAU MPC (2026)
   ============================================================ */
const S = {                       // display scale constants (educational, compressed)
  sizeBase: 1.40, sizeExp: 0.42,  // display radius = sizeBase * (R/R_earth)^sizeExp
  orbBase: 18, orbK: 30, orbExp: 0.55, // display distance = orbBase + orbK * AU^orbExp
  sunR: 9.0
};
const rDisp = km => S.sizeBase * Math.pow(km / 6371, S.sizeExp);
const dDisp = au => S.orbBase + S.orbK * Math.pow(au, S.orbExp);

const UI = {
  id: {
    title: "Jelajah Tata Surya", sub: "Museum Antariksa Interaktif",
    loading: "Memuat tata surya…",
    speed: "Kecepatan waktu", perSec: "hari/detik", paused: "dijeda",
    tgOrbit: "Garis orbit", tgLabel: "Nama planet", tgBelt: "Sabuk asteroid",
    tgMoon: "Bulan", tgTop: "Tampak atas",
    hint: "Seret untuk memutar · Cubit atau gulir untuk zoom · Ketuk planet untuk info",
    hintDesk: "Seret untuk memutar · Gulir untuk zoom · Klik planet untuk info",
    star: "Bintang", planet: "Planet", dwarf: "Planet Kerdil", region: "Kawasan", moon: "Satelit Alami",
    diameter: "Diameter", distance: "Jarak dari Matahari", year: "Satu tahun", day: "Satu hari",
    moons: "Jumlah bulan", gravity: "Gravitasi", temp: "Suhu rata-rata", speedOrb: "Kecepatan orbit",
    factsHead: "Tahukah kamu?", statsHead: "Data utama", deepHead: "Penjelasan lengkap",
    more: "Baca penjelasan lengkap", less: "Sembunyikan penjelasan",
    listen: "Bacakan", listenStop: "Hentikan",
    pilot: "Mode pilot",
    ckThr: "Dorongan", ckSpd: "Kecepatan", ckTgt: "Terdekat",
    ckExit: "Keluar", ckData: "Buka data", ckVoice: "Suara komputer", ckEngine: "Suara mesin",
    ckUnit: "juta km/detik", ckDistUnit: "juta km", ckLight: "× kecepatan cahaya",
    ckHintTouch: "Geser stik untuk membelok · Tarik tuas dorongan ke atas",
    ckHintDesk: "Panah atau WASD untuk membelok · Roda mouse untuk dorongan · Spasi untuk rem",
    ckWarnHot: "Terlalu dekat Matahari",
    ckWarnHit: "Menabrak permukaan",
    sayStart: "Mesin dinyalakan. Selamat terbang, Kapten.",
    sayFull: "Dorongan penuh.",
    sayIdle: "Mesin siaga.",
    sayNear: "Mendekati {name}.",
    sayArrive: "Kita sampai di {name}. Tekan buka data untuk mempelajarinya.",
    sayHot: "Peringatan. Terlalu dekat Matahari. Menjauh sekarang.",
    sayHit: "Tabrakan. Kapal dipantulkan menjauh.",
    sayExit: "Mesin dimatikan. Kembali ke peta.",
    voiceMissing: "Perangkat ini belum punya suara Bahasa Indonesia, jadi narasinya mungkin terdengar aneh. Coba pasang paket suara Indonesia di pengaturan perangkat.",
    goto: "Terbangkan aku ke sini", moonsHead: "Bulan utama",
    cmpSize: "Ukuran dibanding Bumi", cmpDay: "Panjang hari dibanding Bumi",
    earthUnit: "Bumi = 1", days: "hari", years: "tahun", hours: "jam", none: "tidak ada",
    retro: "berlawanan arah (retrograde)",
    helpTitle: "Cara menjelajah", helpSub: "Tiga gerakan saja, lalu tinggal seru-seruan.",
    h1t: "Putar pandangan", h1d: "Seret satu jari di layar (atau tahan klik kiri lalu gerakkan mouse).",
    h2t: "Zoom masuk & keluar", h2d: "Cubit dengan dua jari, atau gulir roda mouse. Dekati planet sampai terlihat permukaannya.",
    h3t: "Ketuk planet", h3d: "Ketuk bola planet atau tombol namanya di bawah untuk membuka info detail dan terbang ke sana.",
    h4t: "Atur waktu", h4d: "Geser slider untuk mempercepat atau memperlambat orbit. Tekan tombol jeda untuk membekukan tata surya.",
    h5t: "Minta dibacakan", h5d: "Di dalam panel info ada tombol “Bacakan”. Tekan, dan cerita planetnya dibacakan dengan suara sambil kalimat yang sedang dibaca disorot.",
    h7t: "Jadi pilot pesawat", h7d: "Tekan tombol roket di pojok kanan atas untuk mengambil alih kemudi. Ada tuas dorongan, stik kemudi, dan komputer kapal yang berbicara. Terbanglah ke planet mana pun yang kamu mau.",
    h6t: "Catatan skala", h6d: "Jarak dan ukuran sengaja dikompres agar semua planet muat di satu layar. Kalau digambar sesuai skala asli, Bumi hanya sebesar titik dan Neptunus berada 100 layar jauhnya. Karena petanya dipadatkan, kapalmu ikut melaju jauh melampaui kecepatan cahaya — mesin warp seperti itu hanya ada di cerita, bukan di dunia nyata.",
    close: "Mengerti, ayo mulai", closeShort: "Tutup",
    creditsTitle: "Kredit & sumber data", creditsSub: "Dari mana angka dan gambarnya berasal.",
    creditsNote: "Dibuat untuk edukasi dan tidak berafiliasi dengan NASA maupun IAU. Jarak dan ukuran sengaja dikompres agar semua planet muat di satu layar.",
    scaleNote: "Skala edukatif — jarak & ukuran dikompres agar mudah dilihat.",
    moonNote: "Jumlah bulan terus bertambah seiring penemuan baru (data IAU 2026)."
  },
  en: {
    title: "Explore the Solar System", sub: "Interactive Space Museum",
    loading: "Loading the solar system…",
    speed: "Time speed", perSec: "days/sec", paused: "paused",
    tgOrbit: "Orbit lines", tgLabel: "Planet names", tgBelt: "Asteroid belt",
    tgMoon: "Moons", tgTop: "Top view",
    hint: "Drag to rotate · Pinch or scroll to zoom · Tap a planet for info",
    hintDesk: "Drag to rotate · Scroll to zoom · Click a planet for info",
    star: "Star", planet: "Planet", dwarf: "Dwarf Planet", region: "Region", moon: "Natural Satellite",
    diameter: "Diameter", distance: "Distance from Sun", year: "One year", day: "One day",
    moons: "Number of moons", gravity: "Gravity", temp: "Average temperature", speedOrb: "Orbital speed",
    factsHead: "Did you know?", statsHead: "Key data", deepHead: "Full explanation",
    more: "Read the full explanation", less: "Hide explanation",
    listen: "Read aloud", listenStop: "Stop",
    pilot: "Pilot mode",
    ckThr: "Thrust", ckSpd: "Speed", ckTgt: "Nearest",
    ckExit: "Exit", ckData: "Open data", ckVoice: "Ship computer voice", ckEngine: "Engine sound",
    ckUnit: "million km/sec", ckDistUnit: "million km", ckLight: "× the speed of light",
    ckHintTouch: "Slide the stick to steer · Pull the thrust lever up",
    ckHintDesk: "Arrows or WASD to steer · Mouse wheel for thrust · Space to brake",
    ckWarnHot: "Too close to the Sun",
    ckWarnHit: "Surface impact",
    sayStart: "Engines online. Have a good flight, Captain.",
    sayFull: "Full thrust.",
    sayIdle: "Engines idle.",
    sayNear: "Approaching {name}.",
    sayArrive: "We have arrived at {name}. Press open data to learn about it.",
    sayHot: "Warning. Too close to the Sun. Pulling away now.",
    sayHit: "Impact. The ship has been bounced clear.",
    sayExit: "Engines off. Back to the map.",
    voiceMissing: "This device has no English voice installed, so the narration may sound odd. Try adding an English voice pack in your device settings.",
    goto: "Fly me there", moonsHead: "Major moons",
    cmpSize: "Size compared to Earth", cmpDay: "Day length compared to Earth",
    earthUnit: "Earth = 1", days: "days", years: "years", hours: "hours", none: "none",
    retro: "backwards (retrograde)",
    helpTitle: "How to explore", helpSub: "Three moves to learn, then just enjoy the ride.",
    h1t: "Rotate the view", h1d: "Drag one finger across the screen (or hold left-click and move the mouse).",
    h2t: "Zoom in & out", h2d: "Pinch with two fingers, or scroll the mouse wheel. Get close enough to see a planet's surface.",
    h3t: "Tap a planet", h3d: "Tap the planet itself or its name button below to open the detail panel and fly there.",
    h4t: "Control time", h4d: "Slide to speed up or slow down the orbits. Hit pause to freeze the whole solar system.",
    h5t: "Have it read to you", h5d: "Every info panel has a “Read aloud” button. Press it and the planet's story is spoken out loud, with the sentence being read highlighted as it goes.",
    h7t: "Fly the ship yourself", h7d: "Press the rocket button at the top right to take the controls. There is a thrust lever, a steering stick, and a ship computer that talks to you. Fly to any planet you like.",
    h6t: "About the scale", h6d: "Distances and sizes are deliberately compressed so every planet fits on one screen. At true scale Earth would be a single pixel and Neptune would sit 100 screens away. Because the map is compressed, your ship also travels far faster than light — a warp drive like that only exists in stories, not in the real world.",
    close: "Got it, let's go", closeShort: "Close",
    creditsTitle: "Credits & data sources", creditsSub: "Where the numbers and the imagery come from.",
    creditsNote: "Built for education and not affiliated with NASA or the IAU. Distances and sizes are deliberately compressed so every planet fits on one screen.",
    scaleNote: "Educational scale — distances & sizes are compressed for visibility.",
    moonNote: "Moon counts keep rising as new discoveries are confirmed (IAU, 2026)."
  }
};

/* Credits — mirrors the "Data sources" section of the README. */
const CREDITS = [
  {ic:"🛰️",
   t:{id:"Angka planet", en:"Planet figures"},
   d:{id:"Diameter, jarak, periode orbit & rotasi, gravitasi, dan suhu rata-rata.",
      en:"Diameters, distances, orbital & rotation periods, gravity, and average temperatures."},
   links:[{label:"NASA Planetary Fact Sheet", url:"https://nssdc.gsfc.nasa.gov/planetary/factsheet/"}]},
  {ic:"🌙",
   t:{id:"Jumlah bulan", en:"Moon counts"},
   d:{id:"Data Maret 2026 — Jupiter 101, Saturnus 285. Angkanya terus bertambah.",
      en:"As of March 2026 — Jupiter 101, Saturn 285. The numbers keep rising."},
   links:[{label:"IAU Minor Planet Center", url:"https://www.iau.org/"}]},
  {ic:"🖼️",
   t:{id:"Tekstur planet", en:"Planet textures"},
   d:{id:"Disusun dari citra NASA, dimuat saat aplikasi berjalan dan tunduk pada lisensinya masing-masing.",
      en:"Assembled from NASA imagery, loaded at runtime and subject to their own licences."},
   links:[{label:"threex.planets — Jerome Etienne (MIT)", url:"https://github.com/jeromeetienne/threex.planets"},
          {label:"Planet Pixel Emporium — James Hastings-Trew", url:"https://planetpixelemporium.com/"}]},
  {ic:"🧊",
   t:{id:"Mesin 3D", en:"3D engine"},
   d:{id:"Seluruh adegan digambar dengan WebGL lewat Three.js r180.",
      en:"The whole scene is drawn with WebGL through Three.js r180."},
   links:[{label:"Three.js", url:"https://threejs.org/"}]},
  {ic:"📄",
   t:{id:"Kode sumber", en:"Source code"},
   d:{id:"Terbuka dengan lisensi MIT — bebas dipakai dan diubah untuk kelas atau pameran.",
      en:"Open under the MIT licence — free to use and adapt for classrooms or exhibits."},
   links:[{label:"github.com/jipraks/solar-explorer", url:"https://github.com/jipraks/solar-explorer"}]}
];

const TEX = "https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/";

const BODIES = [
{
  key:"sun", type:"star", color:"#ffb347", emissive:true,
  name:{id:"Matahari",en:"Sun"}, alt:{id:"Sol · bintang induk kita",en:"Sol · our parent star"},
  map:TEX+"sunmap.jpg",
  radiusKm:696340, dispR:S.sunR, dist:0, orbitDays:0, rotHours:609.12, tilt:7.25, inc:0, ecc:0,
  moonsN:0, gravity:274, tempC:5505, orbKms:0,
  desc:{
    id:"Matahari adalah bintang di pusat tata surya kita — sebuah bola gas panas raksasa yang menahan semua planet tetap di orbitnya. Massanya sekitar 99,86% dari seluruh massa tata surya, jadi hampir semua \"isi\" tata surya sebenarnya adalah Matahari. Cahayanya butuh 8 menit 20 detik untuk sampai ke Bumi.",
    en:"The Sun is the star at the centre of our solar system — a giant ball of hot gas whose gravity keeps every planet in orbit. It holds about 99.86% of all the mass in the solar system, so almost everything here is, quite literally, the Sun. Its light takes 8 minutes and 20 seconds to reach Earth."
  },
  deep:{
    id:"Di inti Matahari, suhu mencapai sekitar 15 juta °C dan tekanannya begitu besar sehingga inti-inti atom hidrogen melebur menjadi helium. Proses yang disebut fusi nuklir ini mengubah sekitar 4 juta ton materi menjadi energi murni setiap detik. Energi itu butuh puluhan ribu tahun untuk merambat keluar dari inti, lalu hanya delapan menit untuk melintasi ruang hampa menuju Bumi.\n\nPermukaan yang kita lihat disebut fotosfer, bersuhu sekitar 5.500 °C. Di atasnya ada korona — atmosfer luar Matahari yang justru jauh lebih panas (lebih dari sejuta derajat), sebuah teka-teki yang sampai sekarang masih diteliti para astronom. Matahari saat ini berumur sekitar 4,6 miliar tahun dan berada di tengah masa hidupnya; sekitar 5 miliar tahun lagi ia akan mengembang menjadi raksasa merah.",
    en:"In the Sun's core, temperatures reach about 15 million °C and pressures are so extreme that hydrogen nuclei fuse into helium. This process — nuclear fusion — converts roughly 4 million tonnes of matter into pure energy every second. That energy takes tens of thousands of years to work its way out of the core, then just eight minutes to cross empty space to Earth.\n\nThe surface we see is the photosphere, at about 5,500 °C. Above it lies the corona, the Sun's outer atmosphere, which is bafflingly hotter — over a million degrees — a puzzle astronomers are still working on. The Sun is around 4.6 billion years old and roughly halfway through its life; in about 5 billion years it will swell into a red giant."
  },
  facts:[
    {ic:"🌍",id:"Sekitar 1,3 juta Bumi bisa dijejalkan ke dalam Matahari.",en:"About 1.3 million Earths could fit inside the Sun."},
    {ic:"⏱️",id:"Matahari mengubah 4 juta ton massa menjadi energi setiap detik — dan sudah melakukannya selama 4,6 miliar tahun.",en:"The Sun turns 4 million tonnes of mass into energy every second — and has done so for 4.6 billion years."},
    {ic:"🌀",id:"Matahari tidak berputar sebagai satu benda padat: khatulistiwanya berputar dalam 25 hari, tapi kutubnya butuh 35 hari.",en:"The Sun doesn't spin as a solid body: its equator rotates in 25 days, but its poles take 35."}
  ]
},
{
  key:"mercury", type:"planet", color:"#a8a29b",
  name:{id:"Merkurius",en:"Mercury"}, alt:{id:"Planet terkecil & terdekat dari Matahari",en:"Smallest planet, closest to the Sun"},
  map:TEX+"mercurymap.jpg", bump:TEX+"mercurybump.jpg",
  radiusKm:2440, dist:0.387, orbitDays:87.97, rotHours:1407.6, tilt:0.03, inc:7.0, ecc:0.2056,
  moonsN:0, gravity:3.7, tempC:167, orbKms:47.4,
  desc:{
    id:"Merkurius adalah planet terkecil dan yang paling dekat dengan Matahari. Karena hampir tak punya atmosfer, panas siang hari langsung lolos ke angkasa saat malam tiba — sehingga suhunya berayun ekstrem, dari 427 °C menjadi −173 °C. Permukaannya penuh kawah, sangat mirip Bulan kita.",
    en:"Mercury is the smallest planet and the closest to the Sun. With almost no atmosphere, the daytime heat escapes straight back into space at night — so temperatures swing wildly, from 427 °C down to −173 °C. Its cratered surface looks a lot like our Moon."
  },
  deep:{
    id:"Merkurius mengelilingi Matahari hanya dalam 88 hari Bumi, tercepat di antara semua planet — itulah sebabnya bangsa Romawi menamainya dari dewa pembawa pesan yang bersayap. Namun rotasinya justru sangat lambat: satu putaran penuh butuh 59 hari Bumi. Kombinasi keduanya menghasilkan resonansi 3:2 yang aneh — Merkurius berputar tepat tiga kali setiap dua kali mengelilingi Matahari, sehingga satu \"hari matahari\" di sana berlangsung 176 hari Bumi.\n\nPlanet ini punya inti besi yang sangat besar, mengisi sekitar 85% jari-jarinya, dan menghasilkan medan magnet lemah yang tidak dimiliki Venus maupun Mars. Orbitnya juga paling lonjong di antara planet-planet, dan pergeseran halus pada orbit itu (presesi perihelion) dulu tak bisa dijelaskan fisika Newton — sampai teori relativitas umum Einstein memecahkannya pada 1915.",
    en:"Mercury circles the Sun in just 88 Earth days — faster than any other planet, which is why the Romans named it after their winged messenger god. Yet it spins remarkably slowly: one rotation takes 59 Earth days. Together these produce a strange 3:2 resonance — Mercury turns exactly three times for every two orbits — so a single solar day there lasts 176 Earth days.\n\nThe planet has an outsized iron core filling about 85% of its radius, generating a weak magnetic field that neither Venus nor Mars possesses. Its orbit is also the most elliptical of the planets, and the subtle drift of that orbit (perihelion precession) defied Newtonian physics until Einstein's general relativity explained it in 1915."
  },
  facts:[
    {ic:"🌡️",id:"Meski paling dekat dengan Matahari, Merkurius bukan planet terpanas — Venus mengalahkannya.",en:"Despite being closest to the Sun, Mercury is not the hottest planet — Venus beats it."},
    {ic:"🧊",id:"Di dasar kawah kutubnya yang tak pernah kena sinar Matahari, ada es air yang bertahan miliaran tahun.",en:"Water ice survives for billions of years in polar craters that sunlight never reaches."},
    {ic:"📅",id:"Satu hari di Merkurius (dari matahari terbit ke terbit berikutnya) berlangsung dua tahun Merkurius.",en:"One Mercurian day (sunrise to sunrise) lasts two Mercurian years."}
  ]
},
{
  key:"venus", type:"planet", color:"#e6c489",
  name:{id:"Venus",en:"Venus"}, alt:{id:"Planet terpanas · kembaran Bumi yang gagal",en:"Hottest planet · Earth's failed twin"},
  map:TEX+"venusmap.jpg", bump:TEX+"venusbump.jpg",
  radiusKm:6052, dist:0.723, orbitDays:224.7, rotHours:-5832.5, tilt:177.4, inc:3.39, ecc:0.0068,
  moonsN:0, gravity:8.87, tempC:464, orbKms:35.0,
  desc:{
    id:"Venus hampir sebesar Bumi, tapi nasibnya jauh berbeda. Atmosfernya yang tebal dan penuh karbon dioksida memerangkap panas sampai suhu permukaannya mencapai 464 °C — cukup untuk melelehkan timbal. Tekanan udaranya 92 kali lipat Bumi, setara berada 900 meter di bawah laut.",
    en:"Venus is nearly the same size as Earth, but its fate went very differently. A thick carbon-dioxide atmosphere traps heat until the surface reaches 464 °C — hot enough to melt lead. The air pressure is 92 times Earth's, like standing 900 metres under the ocean."
  },
  deep:{
    id:"Venus adalah contoh paling dramatis tentang efek rumah kaca yang lepas kendali. Miliaran tahun lalu Venus mungkin punya samudra, tapi Matahari yang perlahan memanas menguapkannya. Uap air memerangkap lebih banyak panas, yang menguapkan lebih banyak air lagi — sebuah lingkaran umpan balik yang berakhir dengan planet gersang berselimut awan asam sulfat.\n\nVenus juga berputar mundur: bila kamu berdiri di sana, Matahari terbit dari barat. Rotasinya begitu lambat (243 hari Bumi) sehingga satu hari Venus lebih panjang daripada satu tahun Venus (225 hari). Penyebab rotasi terbalik ini masih diperdebatkan — kemungkinan tumbukan raksasa di masa muda, atau tarikan pasang surut atmosfer yang tebal selama miliaran tahun.",
    en:"Venus is the most dramatic example we know of a runaway greenhouse effect. Billions of years ago it may have had oceans, but a slowly brightening Sun boiled them away. Water vapour trapped more heat, which evaporated more water — a feedback loop that ended in a parched world wrapped in sulphuric-acid clouds.\n\nVenus also spins backwards: stand on its surface and the Sun would rise in the west. It rotates so slowly (243 Earth days) that a Venusian day is longer than a Venusian year (225 days). Why it turned over is still debated — perhaps a giant impact early on, or billions of years of tidal tugging on its heavy atmosphere."
  },
  facts:[
    {ic:"🔄",id:"Satu hari di Venus lebih lama daripada satu tahunnya.",en:"A day on Venus lasts longer than its entire year."},
    {ic:"✨",id:"Venus adalah objek paling terang di langit malam setelah Bulan — itulah \"Bintang Kejora\".",en:"Venus is the brightest object in the night sky after the Moon — the classic 'evening star'."},
    {ic:"☔",id:"Hujan di Venus terbuat dari asam sulfat, dan menguap sebelum sempat menyentuh tanah.",en:"Venus rains sulphuric acid — which evaporates before it ever reaches the ground."}
  ]
},
{
  key:"earth", type:"planet", color:"#4f93d1",
  name:{id:"Bumi",en:"Earth"}, alt:{id:"Rumah kita · satu-satunya dunia berpenghuni yang diketahui",en:"Our home · the only known living world"},
  map:TEX+"earthmap1k.jpg", bump:TEX+"earthbump1k.jpg", spec:TEX+"earthspec1k.jpg",
  clouds:TEX+"earthcloudmap.jpg", cloudsAlpha:TEX+"earthcloudmaptrans.jpg", atmo:"#6bb8ff",
  radiusKm:6371, dist:1.0, orbitDays:365.256, rotHours:23.934, tilt:23.44, inc:0, ecc:0.0167,
  moonsN:1, gravity:9.81, tempC:15, orbKms:29.8,
  moons:[{key:"moon",name:{id:"Bulan",en:"Moon"},r:0.36,d:3.3,p:27.32,map:TEX+"moonmap1k.jpg",color:"#c9c6bd"}],
  desc:{
    id:"Bumi adalah satu-satunya tempat di alam semesta yang kita tahu pasti dihuni kehidupan. Jaraknya dari Matahari pas: cukup hangat agar air tetap cair, cukup dingin agar tidak menguap. Sekitar 71% permukaannya tertutup air, dan atmosfernya yang kaya oksigen melindungi kita dari radiasi berbahaya.",
    en:"Earth is the only place in the universe we know for certain hosts life. Its distance from the Sun is just right: warm enough for liquid water, cool enough that it doesn't boil away. About 71% of the surface is water, and an oxygen-rich atmosphere shields us from harmful radiation."
  },
  deep:{
    id:"Yang membuat Bumi istimewa bukan satu hal, melainkan kombinasi yang beruntung. Inti besi cairnya menghasilkan medan magnet yang membelokkan angin surya, mencegah atmosfer terkelupas seperti yang terjadi pada Mars. Lempeng tektonik terus mendaur ulang karbon antara batuan, laut, dan udara, menjaga iklim tetap stabil selama miliaran tahun.\n\nKemiringan sumbu 23,4° memberi kita musim: sepanjang tahun belahan utara dan selatan bergantian condong ke arah Matahari. Kemiringan itu dijaga tetap stabil oleh Bulan — satelit yang luar biasa besar dibanding planetnya, kemungkinan besar terbentuk dari tumbukan raksasa dengan objek seukuran Mars sekitar 4,5 miliar tahun lalu.",
    en:"What makes Earth special isn't one thing but a lucky combination. Its liquid iron core generates a magnetic field that deflects the solar wind, preventing the atmosphere from being stripped away as Mars's was. Plate tectonics continuously recycle carbon between rock, ocean and air, keeping the climate stable over billions of years.\n\nOur 23.4° axial tilt gives us seasons: through the year the northern and southern hemispheres take turns leaning toward the Sun. That tilt is held steady by the Moon — a satellite extraordinarily large relative to its planet, most likely formed when a Mars-sized body struck the young Earth some 4.5 billion years ago."
  },
  facts:[
    {ic:"🌊",id:"Lebih dari 80% lautan Bumi belum pernah dipetakan atau dijelajahi manusia.",en:"More than 80% of Earth's ocean has never been mapped or explored."},
    {ic:"🌕",id:"Bulan menjauh dari Bumi sekitar 3,8 cm setiap tahun — kira-kira secepat kuku jari tumbuh.",en:"The Moon drifts about 3.8 cm further away each year — roughly the speed a fingernail grows."},
    {ic:"🚀",id:"Bumi melaju mengelilingi Matahari dengan kecepatan 107.000 km/jam, dan kita sama sekali tidak merasakannya.",en:"Earth races around the Sun at 107,000 km/h — and we feel absolutely nothing."}
  ]
},
{
  key:"mars", type:"planet", color:"#c1603f",
  name:{id:"Mars",en:"Mars"}, alt:{id:"Planet Merah · target berikutnya manusia",en:"The Red Planet · humanity's next stop"},
  map:TEX+"marsmap1k.jpg", bump:TEX+"marsbump1k.jpg", atmo:"#d98b6a",
  radiusKm:3390, dist:1.524, orbitDays:686.98, rotHours:24.62, tilt:25.19, inc:1.85, ecc:0.0934,
  moonsN:2, gravity:3.72, tempC:-65, orbKms:24.1,
  moons:[
    {key:"phobos",name:{id:"Phobos",en:"Phobos"},r:0.10,d:1.75,p:0.319,color:"#8c7f74"},
    {key:"deimos",name:{id:"Deimos",en:"Deimos"},r:0.075,d:2.35,p:1.263,color:"#9c8f83"}
  ],
  desc:{
    id:"Mars berwarna merah karena tanahnya kaya oksida besi — pada dasarnya karat. Ukurannya sekitar setengah Bumi, punya musim, tudung es kutub, dan hari yang panjangnya hampir sama (24 jam 37 menit). Inilah planet yang paling banyak dikunjungi wahana robotik kita.",
    en:"Mars is red because its soil is rich in iron oxide — essentially rust. About half Earth's size, it has seasons, polar ice caps, and a day almost exactly as long as ours (24 hours 37 minutes). It is by far the most visited planet in our robotic exploration programme."
  },
  deep:{
    id:"Mars menyimpan bukti kuat bahwa air pernah mengalir di permukaannya: dasar sungai purba, delta, mineral yang hanya terbentuk di air, dan endapan garam. Sekitar 3,5 miliar tahun lalu Mars mungkin punya danau, bahkan samudra dangkal di belahan utara. Lalu intinya mendingin, medan magnetnya melemah, dan angin surya perlahan mengikis atmosfernya sampai tinggal 1% kerapatan Bumi.\n\nMars juga memegang beberapa rekor tata surya. Olympus Mons adalah gunung berapi tertinggi yang diketahui — tingginya sekitar 22 km, hampir tiga kali Everest, dengan alas selebar Pulau Jawa. Valles Marineris adalah ngarai sepanjang 4.000 km, membentang seperti Grand Canyon yang memanjang dari Sabang sampai Merauke.",
    en:"Mars carries strong evidence that water once flowed across it: ancient riverbeds, deltas, minerals that only form in water, and salt deposits. Around 3.5 billion years ago Mars may have had lakes and even a shallow northern ocean. Then its core cooled, its magnetic field faded, and the solar wind slowly stripped the atmosphere down to 1% of Earth's density.\n\nMars also holds several solar-system records. Olympus Mons is the tallest known volcano — about 22 km high, nearly three times Everest, with a base the size of a small country. Valles Marineris is a canyon system 4,000 km long, as if the Grand Canyon stretched clear across a continent."
  },
  facts:[
    {ic:"🏔️",id:"Olympus Mons di Mars adalah gunung tertinggi di tata surya — hampir tiga kali tinggi Everest.",en:"Olympus Mons on Mars is the tallest mountain in the solar system — nearly three times Everest."},
    {ic:"🌪️",id:"Badai debu Mars bisa menyelimuti seluruh planet dan berlangsung berbulan-bulan.",en:"Martian dust storms can swallow the entire planet and last for months."},
    {ic:"🌑",id:"Phobos, bulan terbesar Mars, terus mendekat dan akan hancur menjadi cincin dalam ~50 juta tahun.",en:"Phobos, Mars's largest moon, is spiralling inward and will shatter into a ring in ~50 million years."}
  ]
},
{
  key:"jupiter", type:"planet", color:"#d8a173",
  name:{id:"Jupiter",en:"Jupiter"}, alt:{id:"Raksasa gas · pelindung tata surya bagian dalam",en:"Gas giant · guardian of the inner solar system"},
  map:TEX+"jupitermap.jpg", atmo:"#e0b78d",
  radiusKm:69911, dist:5.203, orbitDays:4332.6, rotHours:9.93, tilt:3.13, inc:1.30, ecc:0.0489,
  moonsN:101, gravity:24.79, tempC:-110, orbKms:13.1,
  moons:[
    {key:"io",name:{id:"Io",en:"Io"},r:0.34,d:6.4,p:1.769,color:"#e3d06a"},
    {key:"europa",name:{id:"Europa",en:"Europa"},r:0.30,d:7.7,p:3.551,color:"#d8cfc0"},
    {key:"ganymede",name:{id:"Ganimede",en:"Ganymede"},r:0.50,d:9.4,p:7.155,color:"#a89887"},
    {key:"callisto",name:{id:"Kalisto",en:"Callisto"},r:0.46,d:11.4,p:16.689,color:"#7d7469"}
  ],
  desc:{
    id:"Jupiter adalah planet terbesar — lebih dari dua kali massa semua planet lain digabungkan. Ia hampir seluruhnya terdiri dari hidrogen dan helium, tanpa permukaan padat untuk dipijak. Gravitasinya yang raksasa berperan sebagai \"penyapu\" komet dan asteroid, ikut melindungi planet-planet dalam.",
    en:"Jupiter is the largest planet — more than twice the mass of every other planet combined. It is made almost entirely of hydrogen and helium, with no solid surface to stand on. Its enormous gravity acts as a cosmic vacuum cleaner for comets and asteroids, helping shield the inner planets."
  },
  deep:{
    id:"Bintik Merah Besar Jupiter adalah badai antisiklon yang sudah diamati selama lebih dari 190 tahun secara berkelanjutan (dan mungkin sejak 1665). Lebarnya pernah mencapai tiga kali diameter Bumi, meski kini menyusut. Angin di sana bertiup hingga 430 km/jam.\n\nJupiter berotasi tercepat di antara semua planet — satu putaran hanya 9 jam 56 menit — sehingga bentuknya terlihat gepeng di kutub. Di kedalamannya, tekanan begitu ekstrem sampai hidrogen berubah menjadi cairan logam yang menghantarkan listrik, menghasilkan medan magnet 20.000 kali lebih kuat dari Bumi. Empat bulan terbesarnya — Io, Europa, Ganimede, Kalisto — ditemukan Galileo pada 1610, dan penemuan itu menjadi bukti pertama bahwa tidak semua benda langit mengorbit Bumi.",
    en:"Jupiter's Great Red Spot is an anticyclonic storm that has been watched continuously for over 190 years (and possibly since 1665). It once spanned three Earth diameters, though it is now shrinking. Winds inside it reach 430 km/h.\n\nJupiter spins faster than any other planet — one rotation in just 9 hours 56 minutes — which visibly flattens it at the poles. Deep inside, pressures are so extreme that hydrogen becomes a liquid metal that conducts electricity, generating a magnetic field 20,000 times stronger than Earth's. Its four largest moons — Io, Europa, Ganymede, Callisto — were spotted by Galileo in 1610, the first proof that not everything orbits the Earth."
  },
  facts:[
    {ic:"🔴",id:"Bintik Merah Besar adalah badai raksasa yang sudah berputar selama ratusan tahun.",en:"The Great Red Spot is a giant storm that has been spinning for centuries."},
    {ic:"🌋",id:"Io, bulannya, adalah objek paling vulkanik di tata surya — lebih dari 400 gunung berapi aktif.",en:"Its moon Io is the most volcanic body in the solar system — over 400 active volcanoes."},
    {ic:"💧",id:"Di bawah kerak es Europa diperkirakan ada samudra dengan air lebih banyak daripada seluruh lautan Bumi.",en:"Beneath Europa's icy crust lies an ocean thought to hold more water than all of Earth's seas."}
  ]
},
{
  key:"saturn", type:"planet", color:"#e0c98d",
  name:{id:"Saturnus",en:"Saturn"}, alt:{id:"Permata bercincin · raja bulan",en:"The ringed jewel · king of moons"},
  map:TEX+"saturnmap.jpg", atmo:"#efdcae",
  ring:{inner:1.25, outer:2.30, map:TEX+"saturnringcolor.jpg", alpha:TEX+"saturnringpattern.gif", tiltWithPlanet:true},
  radiusKm:58232, dist:9.537, orbitDays:10759, rotHours:10.66, tilt:26.73, inc:2.49, ecc:0.0565,
  moonsN:285, gravity:10.44, tempC:-140, orbKms:9.7,
  moons:[
    {key:"enceladus",name:{id:"Enceladus",en:"Enceladus"},r:0.16,d:9.2,p:1.370,color:"#eef3f6"},
    {key:"titan",name:{id:"Titan",en:"Titan"},r:0.50,d:12.2,p:15.945,color:"#d8a24a"}
  ],
  desc:{
    id:"Saturnus terkenal karena sistem cincinnya yang menakjubkan — miliaran bongkahan es dan batu, dari sebesar butiran pasir hingga sebesar rumah, mengorbit dalam lapisan yang sangat tipis. Meski selebar 280.000 km, tebal cincin itu rata-rata hanya sekitar 10 meter.",
    en:"Saturn is famous for its breathtaking ring system — billions of chunks of ice and rock, from grains of sand to house-sized boulders, orbiting in an astonishingly thin sheet. Though 280,000 km across, the rings average only about 10 metres thick."
  },
  deep:{
    id:"Saturnus adalah planet paling ringan relatif terhadap ukurannya: kerapatannya hanya 0,687 g/cm³, lebih ringan daripada air. Kalau ada bak mandi yang cukup besar, Saturnus akan mengapung.\n\nCincinnya kemungkinan besar masih muda — data wahana Cassini menunjukkan usianya mungkin hanya 100 juta tahun, artinya dinosaurus mungkin melihat Saturnus tanpa cincin. Cincin itu juga perlahan \"hujan\" jatuh ke planet dan diperkirakan lenyap dalam beberapa ratus juta tahun.\n\nSaturnus kini memegang gelar planet dengan bulan terbanyak — 285 bulan terkonfirmasi per Maret 2026 menurut IAU. Yang paling menarik adalah Titan, satu-satunya bulan dengan atmosfer tebal dan satu-satunya dunia selain Bumi yang punya danau dan sungai permukaan — meski isinya metana cair, bukan air.",
    en:"Saturn is the least dense planet relative to its size: just 0.687 g/cm³, lighter than water. Given a big enough bathtub, Saturn would float.\n\nIts rings are probably young — Cassini data suggests they may be only 100 million years old, meaning dinosaurs might have seen a ringless Saturn. They are also slowly raining down onto the planet and may vanish within a few hundred million years.\n\nSaturn currently holds the title of most moons — 285 confirmed as of March 2026 according to the IAU. The most intriguing is Titan, the only moon with a thick atmosphere and the only world besides Earth with lakes and rivers on its surface — though they are filled with liquid methane, not water."
  },
  facts:[
    {ic:"🛁",id:"Saturnus lebih ringan daripada air — kalau ada bak mandi cukup besar, ia akan mengapung.",en:"Saturn is less dense than water — with a big enough bathtub, it would float."},
    {ic:"💍",id:"Cincin Saturnus selebar 280.000 km, tapi tebalnya rata-rata hanya sekitar 10 meter.",en:"Saturn's rings span 280,000 km but average only about 10 metres in thickness."},
    {ic:"🌊",id:"Titan punya sungai dan danau — tapi berisi metana cair, bukan air.",en:"Titan has rivers and lakes — filled with liquid methane instead of water."}
  ]
},
{
  key:"uranus", type:"planet", color:"#8fd3dd",
  name:{id:"Uranus",en:"Uranus"}, alt:{id:"Raksasa es yang berguling",en:"The ice giant that rolls on its side"},
  map:TEX+"uranusmap.jpg", atmo:"#a9e4ec",
  ring:{inner:1.55, outer:2.00, map:TEX+"uranusringcolour.jpg", alpha:TEX+"uranusringtrans.gif", tiltWithPlanet:true, faint:true},
  radiusKm:25362, dist:19.191, orbitDays:30688, rotHours:-17.24, tilt:97.77, inc:0.77, ecc:0.0457,
  moonsN:29, gravity:8.87, tempC:-195, orbKms:6.8,
  moons:[{key:"titania",name:{id:"Titania",en:"Titania"},r:0.26,d:6.6,p:8.706,color:"#a8a29d"}],
  desc:{
    id:"Uranus berputar miring hampir 98° — praktis berguling mengelilingi Matahari, bukan berputar tegak seperti planet lain. Akibatnya, setiap kutub mengalami 42 tahun siang terus-menerus, lalu 42 tahun malam. Warna birunya berasal dari gas metana di atmosfernya.",
    en:"Uranus is tipped almost 98° — it effectively rolls around the Sun instead of spinning upright like the others. As a result each pole gets 42 years of continuous daylight followed by 42 years of night. Its blue-green colour comes from methane in its atmosphere."
  },
  deep:{
    id:"Penyebab kemiringan ekstrem Uranus kemungkinan besar adalah tumbukan dengan objek seukuran Bumi di masa awal tata surya — atau serangkaian tumbukan yang lebih kecil. Cincin dan bulan-bulannya ikut miring mengikuti planetnya, jadi seluruh sistem itu tampak berputar seperti target panah dilihat dari Bumi.\n\nUranus dan Neptunus disebut \"raksasa es\" karena di bawah atmosfer hidrogen-helium mereka terdapat mantel panas dan padat berisi air, metana, dan amonia. Uranus punya atmosfer terdingin yang pernah diukur di tata surya, mencapai −224 °C. Anehnya, ia memancarkan panas internal jauh lebih sedikit dibanding raksasa lain — sebuah misteri yang belum terpecahkan. Sampai kini Uranus baru dikunjungi satu kali, oleh Voyager 2 pada 1986.",
    en:"Uranus's extreme tilt was most likely caused by a collision with an Earth-sized body early in the solar system's history — or a series of smaller impacts. Its rings and moons tilted along with it, so the whole system appears to spin like an archery target as seen from Earth.\n\nUranus and Neptune are called 'ice giants' because beneath their hydrogen-helium atmospheres lies a hot, dense mantle of water, methane and ammonia. Uranus has the coldest atmosphere ever measured in the solar system, reaching −224 °C. Oddly, it radiates far less internal heat than the other giants — a mystery still unsolved. It has been visited just once, by Voyager 2 in 1986."
  },
  facts:[
    {ic:"🎳",id:"Uranus berputar menyamping, seolah menggelinding mengelilingi Matahari.",en:"Uranus spins on its side, as if rolling around the Sun."},
    {ic:"❄️",id:"Suhu −224 °C menjadikan atmosfer Uranus yang terdingin di tata surya.",en:"At −224 °C, Uranus has the coldest atmosphere in the solar system."},
    {ic:"🛰️",id:"Hanya satu wahana yang pernah mengunjunginya: Voyager 2, empat puluh tahun lalu.",en:"Only one spacecraft has ever visited: Voyager 2, four decades ago."}
  ]
},
{
  key:"neptune", type:"planet", color:"#3f62c9",
  name:{id:"Neptunus",en:"Neptune"}, alt:{id:"Dunia berangin · planet terjauh",en:"The windy world · outermost planet"},
  map:TEX+"neptunemap.jpg", atmo:"#5b7ff0",
  radiusKm:24622, dist:30.07, orbitDays:60195, rotHours:16.11, tilt:28.32, inc:1.77, ecc:0.0113,
  moonsN:18, gravity:11.15, tempC:-200, orbKms:5.4,
  moons:[{key:"triton",name:{id:"Triton",en:"Triton"},r:0.32,d:6.8,p:-5.877,color:"#cfd6dc"}],
  desc:{
    id:"Neptunus adalah planet terjauh dari Matahari dan rumah bagi angin terkencang di tata surya — mencapai 2.100 km/jam, lebih cepat dari kecepatan suara di Bumi. Satu tahun di sana berlangsung 165 tahun Bumi, jadi Neptunus baru satu kali menyelesaikan orbit sejak ditemukan pada 1846.",
    en:"Neptune is the most distant planet from the Sun and home to the fiercest winds in the solar system — up to 2,100 km/h, faster than the speed of sound on Earth. A year there lasts 165 Earth years, so Neptune has completed just one orbit since its discovery in 1846."
  },
  deep:{
    id:"Neptunus punya kisah penemuan yang unik: ia ditemukan lewat matematika sebelum dilihat lewat teleskop. Para astronom memperhatikan orbit Uranus sedikit menyimpang dari perhitungan, lalu Urbain Le Verrier menghitung di mana planet tak dikenal itu seharusnya berada. Malam itu juga, pada 23 September 1846, Johann Galle mengarahkan teleskopnya ke koordinat tersebut dan langsung menemukannya.\n\nMeski menerima sinar Matahari 900 kali lebih sedikit dari Bumi, Neptunus memancarkan panas internal 2,6 kali lipat dari yang diserapnya — sumber energi yang menggerakkan badai dahsyatnya. Bulan terbesarnya, Triton, mengorbit berlawanan arah dengan rotasi planet, pertanda kuat bahwa ia adalah objek Sabuk Kuiper yang tertangkap gravitasi Neptunus.",
    en:"Neptune has a remarkable discovery story: it was found with mathematics before anyone saw it through a telescope. Astronomers noticed Uranus's orbit deviating slightly from predictions, and Urbain Le Verrier calculated where an unseen planet must be. That same night — 23 September 1846 — Johann Galle pointed his telescope at those coordinates and found it immediately.\n\nThough it receives 900 times less sunlight than Earth, Neptune radiates 2.6 times more internal heat than it absorbs — the engine driving its violent storms. Its largest moon, Triton, orbits backwards relative to the planet's spin, strong evidence that it is a captured Kuiper Belt object."
  },
  facts:[
    {ic:"💨",id:"Angin Neptunus mencapai 2.100 km/jam — tercepat di seluruh tata surya.",en:"Neptune's winds reach 2,100 km/h — the fastest anywhere in the solar system."},
    {ic:"🔭",id:"Neptunus ditemukan lewat perhitungan matematika sebelum pernah dilihat orang.",en:"Neptune was discovered through mathematics before anyone had ever seen it."},
    {ic:"🧊",id:"Triton mengorbit terbalik dan menyemburkan gaiser nitrogen dari permukaannya yang beku.",en:"Triton orbits backwards and erupts nitrogen geysers from its frozen surface."}
  ]
},
{
  key:"pluto", type:"dwarf", color:"#c9b299",
  name:{id:"Pluto",en:"Pluto"}, alt:{id:"Planet kerdil · penjaga Sabuk Kuiper",en:"Dwarf planet · sentinel of the Kuiper Belt"},
  map:TEX+"plutomap1k.jpg", bump:TEX+"plutobump1k.jpg",
  radiusKm:1188, dist:39.48, orbitDays:90560, rotHours:-153.3, tilt:122.5, inc:17.16, ecc:0.2488,
  moonsN:5, gravity:0.62, tempC:-229, orbKms:4.7,
  moons:[{key:"charon",name:{id:"Charon",en:"Charon"},r:0.34,d:2.7,p:6.387,color:"#9c948b"}],
  desc:{
    id:"Pluto adalah planet kerdil di Sabuk Kuiper, wilayah beku di tepi tata surya. Sempat berstatus planet kesembilan selama 76 tahun, statusnya diubah IAU pada 2006 karena orbitnya masih dipenuhi objek-objek lain. Ukurannya lebih kecil daripada Bulan kita.",
    en:"Pluto is a dwarf planet in the Kuiper Belt, the frozen frontier at the edge of the solar system. Counted as the ninth planet for 76 years, it was reclassified by the IAU in 2006 because its orbital neighbourhood is still full of other objects. It is smaller than our own Moon."
  },
  deep:{
    id:"Selama puluhan tahun Pluto hanyalah titik kabur, sampai wahana New Horizons melintas dekat pada Juli 2015 dan mengubah segalanya. Yang terlihat jauh melampaui dugaan: pegunungan es air setinggi 3.500 meter, gletser nitrogen yang mengalir, kabut berlapis di atmosfer tipisnya, dan dataran berbentuk hati bernama Sputnik Planitia yang permukaannya begitu mulus sehingga hampir tak berkawah — pertanda ia masih diperbarui secara geologis.\n\nOrbit Pluto sangat lonjong dan miring 17° dari bidang orbit planet lain. Antara 1979 dan 1999, Pluto sebenarnya berada lebih dekat ke Matahari daripada Neptunus. Bulan terbesarnya, Charon, begitu besar dibanding Pluto sehingga keduanya saling mengorbit sebuah titik di ruang kosong di antara mereka — sistem planet ganda sejati.",
    en:"For decades Pluto was just a blurry dot, until New Horizons flew past in July 2015 and changed everything. What appeared far exceeded expectations: water-ice mountains 3,500 metres tall, flowing nitrogen glaciers, layered hazes in its thin atmosphere, and a heart-shaped plain called Sputnik Planitia so smooth it is essentially crater-free — a sign it is still being geologically resurfaced.\n\nPluto's orbit is highly elliptical and tilted 17° from the plane of the other planets. Between 1979 and 1999 it was actually closer to the Sun than Neptune. Its largest moon, Charon, is so big relative to Pluto that the two orbit a point in empty space between them — a genuine double system."
  },
  facts:[
    {ic:"💛",id:"Pluto punya \"jantung\" raksasa di permukaannya: dataran es nitrogen selebar 1.000 km.",en:"Pluto wears a giant heart on its surface: a nitrogen-ice plain 1,000 km wide."},
    {ic:"⚖️",id:"Pluto dan Charon saling mengorbit titik kosong di antara keduanya — bukan Charon mengelilingi Pluto.",en:"Pluto and Charon orbit a point in empty space between them — Charon doesn't simply circle Pluto."},
    {ic:"📜",id:"Nama Pluto diusulkan oleh Venetia Burney, seorang anak berusia 11 tahun dari Inggris, pada 1930.",en:"Pluto was named by Venetia Burney, an 11-year-old English schoolgirl, in 1930."}
  ]
}
];

const BELT = {
  key:"belt", type:"region", color:"#8b8378",
  name:{id:"Sabuk Asteroid",en:"Asteroid Belt"},
  alt:{id:"Antara Mars dan Jupiter · sisa pembentukan tata surya",en:"Between Mars and Jupiter · leftovers of planet formation"},
  desc:{
    id:"Sabuk asteroid adalah cincin lebar berisi jutaan bongkahan batu dan logam yang mengorbit antara Mars dan Jupiter. Meski di film terlihat rapat, kenyataannya sangat lengang — jarak antar-asteroid rata-rata ratusan ribu kilometer, sehingga wahana antariksa melewatinya tanpa kesulitan.",
    en:"The asteroid belt is a broad ring of millions of rocky and metallic bodies orbiting between Mars and Jupiter. Films make it look crowded, but it is almost empty — asteroids are typically hundreds of thousands of kilometres apart, so spacecraft cross it without trouble."
  },
  deep:{
    id:"Total massa seluruh sabuk asteroid hanya sekitar 3% massa Bulan kita. Sabuk ini bukan sisa planet yang meledak, melainkan bahan mentah yang tak pernah sempat menyatu menjadi planet — tarikan gravitasi Jupiter yang raksasa terus mengaduk wilayah itu sehingga bongkahan-bongkahan kecil bertabrakan terlalu cepat untuk saling menempel.\n\nObjek terbesarnya adalah Ceres, berdiameter 940 km, yang cukup besar untuk berbentuk bulat dan kini diklasifikasikan sebagai planet kerdil. Meteorit yang jatuh ke Bumi sebagian besar berasal dari sabuk ini, dan karena usianya sama tuanya dengan tata surya, batuan itu menjadi kapsul waktu yang memberi tahu kita bagaimana planet-planet terbentuk 4,6 miliar tahun lalu.",
    en:"The entire belt's mass adds up to only about 3% of our Moon. It is not the debris of an exploded planet but raw material that never managed to coalesce — Jupiter's massive gravity keeps stirring the region so the fragments collide too fast to stick together.\n\nIts largest member is Ceres, 940 km across, big enough to be round and now classified as a dwarf planet. Most meteorites that fall to Earth come from this belt, and because they are as old as the solar system itself, they act as time capsules telling us how the planets formed 4.6 billion years ago."
  },
  facts:[
    {ic:"🪨",id:"Kalau semua asteroid disatukan, massanya hanya sekitar 3% massa Bulan.",en:"Combine every asteroid and you'd get only about 3% of the Moon's mass."},
    {ic:"🚀",id:"Sabuknya sangat lengang — wahana antariksa melintas tanpa perlu menghindar sama sekali.",en:"The belt is so sparse that spacecraft fly through without dodging anything."},
    {ic:"⏳",id:"Batuan di sini berumur 4,6 miliar tahun — sisa bahan pembangun planet yang tak pernah terpakai.",en:"These rocks are 4.6 billion years old — leftover planet-building material never used."}
  ]
};
