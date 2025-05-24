
const canvas = document.getElementById('gamecanvas'); // oyun için canvas elementi
const ctx = canvas.getContext('2d'); // 2d çizim bağlamı
const startscreen = document.getElementById('startscreen'); // başlangıç ekranı
const startbutton = document.getElementById('startbutton'); // başlangıç butonu
const upgrademenu = document.getElementById('upgrademenu'); // yükseltme menüsü
const shootSound = new Audio('sounds/shoot.wav'); // mermi atış sesi
const bgAudio = document.getElementById('bgAudio'); // arka plan müziği
const infoScreen = document.getElementById('infoScreen'); // bilgi ekranı
const infoafter = document.getElementById('infoafter'); // bilgi ekranından sonra geçiş butonu


let oyunabasladimi = false; // oyunun başlayıp başlamadığını kontrol eder
let oyundurdumu = false; // oyunun duraklatılıp duraklatılmadığını kontrol eder
let bitissuresi = 0; // son frame zamanını tutar (zaman delta hesaplaması için)
let gameOver = false; // oyunun bitip bitmediğini kontrol eder


let countdownactive = false; // geri sayımın aktif olup olmadığını kontrol eder
let countdowncalue = 3; // geri sayım başlangıç değeri (3 saniye)
let countdowntimer = 0; // geri sayım zamanlayıcısı

const player_size = 48; // oyuncu boyutu (piksel)
let player_speed = 200; // oyuncu hızı (piksel/saniye)
let bullet_speed = 500; // mermi hızı (piksel/saniye)
const spawn_interval = 500; // düşman oluşturma aralığı (milisaniye)
const max_level = 10; // maksimum seviye sayısı
const enemy_speed_base = 50; // temel düşman hızı
const boss_size_base = 96; // temel boss boyutu
const boss_speed_base = 50; // temel boss hızı
const boss_health_base = 25; // temel boss canı
const boss_shoot_interval = 2000; // bossun ateş etme aralığı (milisaniye)
const boss_bullet_speed_saf = 300; // boss mermi hızı
const boss_bullet_damage_saf = 2; // boss mermi hasarı
const boss_bullet_count_saf = 1; // bossun attığı mermi sayısı

let spawnTimer = 0; // düşman oluşturma zamanlayıcısı
let score = 0; // oyuncu skoru
let level = 1; // mevcut seviye
let spawnedEnemiesCount = 0; // spawn edilen düşman sayısı
let bossdogum = false; // bossun doğup doğmadığını kontrol eder
let boss = null; // boss objesi
let bossshootsayac = 0; // bossun ateş etme zamanlayıcısı


let upgradesayaci = 1; // mermi sayısı (yükseltmeyle artar)
let playeremaxcan = 10; // oyuncunun maksimum canı


const bullets = [];
const enemies = []; 
const bossmermi = []; 


const player = {
  x: canvas.width / 2 - player_size / 2, // oyuncu x pozisyonu (canvas ortası)
  y: canvas.height - player_size - 10, // oyuncu y pozisyonu (alt kenar)
  width: player_size, // oyuncu genişliği
  height: player_size, // oyuncu yüksekliği
  health: playeremaxcan, // oyuncu canı
  vx: 0, // x ekseninde hız (tahmini nişan için)
  vy: 0 // y ekseninde hız (tahmini nişan için)
};

// --- görseller ---
// oyun için görsel dosyalar
const playerImg = new Image(); playerImg.src = 'karakter.png'; // oyuncu görseli
const enemyImg = new Image(); enemyImg.src = 'dusmans.png'; // düşman görseli
const bossImg = new Image(); bossImg.src = 'boss.png'; // boss görseli

// bilgi ekranından başlangıç ekranına geçiş
infoafter.addEventListener('click', () => {
  infoScreen.classList.add('hidden'); // bilgi ekranını gizler
  startscreen.classList.remove('hidden'); // başlangıç ekranını gösterir
});

// --- input dinleyicileri ---
// fare tıklamasıyla mermi ateşleme
canvas.addEventListener('click', e => {
  if (!oyunabasladimi || oyundurdumu || countdownactive) return; // oyun başlamadıysa veya durduysa işlem yapma
  const rect = canvas.getBoundingClientRect(); // canvasın pozisyonunu al
  const clickX = e.clientX - rect.left; // tıklama x koordinatı
  const clickY = e.clientY - rect.top; // tıklama y koordinatı
  const startX = player.x + player.width / 2; // oyuncu merkezi x
  const startY = player.y + player.height / 2; // oyuncu merkezi y
  const dx = clickX - startX; // tıklama yönü x
  const dy = clickY - startY; // tıklama yönü y
  const len = Math.hypot(dx, dy) || 1; // yön vektörünün uzunluğu
  player.vx = dx / len * bullet_speed; // oyuncu mermi hızı x
  player.vy = dy / len * bullet_speed; // oyuncu mermi hızı y
  shootSound.currentTime = 0; // atış sesini başa al
  shootSound.play(); // atış sesini çal
  for (let i = 0; i < upgradesayaci; i++) { // yükseltme sayısına göre mermi oluştur
    const angle = Math.atan2(dy, dx) + (i - (upgradesayaci - 1) / 2) * 0.2; // mermi açısı
    bullets.push({
      x: startX - 5, // mermi başlangıç x
      y: startY - 5, // mermi başlangıç y
      width: 10, // mermi genişliği
      height: 10, // mermi yüksekliği
      vx: Math.cos(angle) * bullet_speed, // mermi x hızı
      vy: Math.sin(angle) * bullet_speed, // mermi y hızı
      life: 3 // mermi ömrü (saniye)
    });
  }
});

// klavye girişlerini dinleme
const keys = {}; // basılan tuşları saklar
document.addEventListener('keydown', e => keys[e.code] = true); // tuş basıldığında
document.addEventListener('keyup', e => keys[e.code] = false); // tuş bırakıldığında

// --- başlat & upgrade menü ---
// oyunu başlatma
startbutton.addEventListener('click', () => {
  startscreen.classList.add('hidden'); // başlangıç ekranını gizle
  oyunabasladimi = true; // oyunu başlat
  countdownactive = true; // geri sayımı başlat
  oyundurdumu = true; // oyunu duraklat (geri sayım için)
  countdowncalue = 3; // geri sayım değerini sıfırla
  countdowntimer = 0; // geri sayım zamanlayıcısını sıfırla
  bitissuresi = performance.now(); // zamanlayıcıyı başlat
  bgAudio.loop = true; // arka plan müziğini döngüye al
  bgAudio.play(); // arka plan müziğini çal
  requestAnimationFrame(oyundongusu); // oyun döngüsünü başlat
});

// arka plan müziği için döngü ayarı
bgAudio.loop = true;

// sayfa yüklendiğinde ses kontrolü
window.addEventListener('DOMContentLoaded', () => {
  const bgAudio = document.getElementById('bgAudio'); // arka plan müziği
  const volumeSlider = document.getElementById('volumeSlider'); // ses kontrol kaydırıcısı

  bgAudio.volume = volumeSlider.value; // başlangıç ses seviyesi
  document.body.addEventListener('click', () => { // kullanıcı etkileşimiyle otomatik oynatma
    if (bgAudio.paused) bgAudio.play(); // müzik durmuşsa çal
  }, { once: true }); // sadece bir kez çalışır

  volumeSlider.addEventListener('input', () => { // ses seviyesi değiştiğinde
    bgAudio.volume = volumeSlider.value; // ses seviyesini güncelle
  });
});

// yükseltme menüsü butonları
upgrademenu.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    yukseltmeuygula(btn.dataset.upg); // seçilen yükseltmeyi uygula
    upgrademenu.style.display = 'none'; // yükseltme menüsünü gizle
    level++; // seviyeyi artır
    spawnedEnemiesCount = 0; // spawn edilen düşman sayısını sıfırla
    bossdogum = false; // boss doğumunu sıfırla
    bossshootsayac = 0; // boss atış sayacını sıfırla
    countdownactive = true; // geri sayımı başlat
    oyundurdumu = true; // oyunu duraklat
    countdowncalue = 3; // geri sayım değerini sıfırla
    countdowntimer = 0; // geri sayım zamanlayıcısını sıfırla
    bitissuresi = performance.now(); // zamanlayıcıyı sıfırla
  });
});

// --- oyun döngüsü ---
// ana oyun döngüsü
function oyundongusu(ts) {
  if (!oyunabasladimi) return; // oyun başlamadıysa çık
  const dt = ts - bitissuresi; // zaman farkını hesapla
  bitissuresi = ts; // son zamanı güncelle
  update(dt); // oyunu güncelle
  draw(); // ekranı çiz
  requestAnimationFrame(oyundongusu); // bir sonraki frame için döngüyü devam ettir
}

// --- güncelleme ---
// oyun durumunu güncelleme
function update(dt) {
  const delta = dt / 1000; // zaman farkını saniyeye çevir

  // geri sayım işlemi
  if (countdownactive) {
    countdowntimer += dt; // geri sayım zamanlayıcısını artır
    if (countdowntimer >= 1000) { // her 1 saniyede
      countdowntimer -= 1000; // zamanlayıcıyı sıfırla
      countdowncalue--; // geri sayım değerini azalt
      if (countdowncalue <= 0) { // geri sayım bittiyse
        countdownactive = false; // geri sayımı durdur
        oyundurdumu = false; // oyunu devam ettir
      }
    }
    return; // geri sayım sırasında diğer güncellemeleri yapma
  }

  if (oyundurdumu) return; // oyun duraklatılmışsa çık

  // seviye ölçekli değişkenler
  const enemyspeed = level * enemy_speed_base; // düşman hızı (seviyeye bağlı)
  const bossspeed = boss_speed_base + level * 2; // boss hızı
  const bossbuyukluk = boss_size_base + level * 2; // boss boyutu
  const bosscan = boss_health_base * level; // boss canı
  const bossbulletspeed = boss_bullet_speed_saf + level * 100; // boss mermi hızı
  const bossbulletdamage = boss_bullet_damage_saf + Math.floor(level / 2); // boss mermi hasarı
  const bossbulletcount = boss_bullet_count_saf + Math.floor(level / 3); // boss mermi sayısı


  if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player_speed * delta; // sola hareket
  if (keys['ArrowRight'] || keys['KeyD']) player.x += player_speed * delta; // sağa hareket
  if (keys['ArrowUp'] || keys['KeyW']) player.y -= player_speed * delta; // yukarı hareket
  if (keys['ArrowDown'] || keys['KeyS']) player.y += player_speed * delta; // aşağı hareket
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x)); // x sınırları
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y)); // y sınırları


  for (let i = bullets.length - 1; i >= 0; i--) { // tüm mermileri gez
    const b = bullets[i];
    b.x += b.vx * delta; // mermiyi x yönünde hareket ettir
    b.y += b.vy * delta; // mermiyi y yönünde hareket ettir
    b.life -= delta; // mermi ömrünü azalt
    if (b.life <= 0 || b.x + b.width < 0 || b.x > canvas.width || b.y + b.height < 0 || b.y > canvas.height) {
      bullets.splice(i, 1); // ömrü biten veya ekran dışındaki mermiyi kaldır
    }
  }

  if (spawnedEnemiesCount < level * 10) { // seviye başına düşman sayısı
    spawnTimer += dt; // spawn zamanlayıcısını artır
    if (spawnTimer > spawn_interval) { // spawn zamanı geldiyse
      spawnTimer = 0; // zamanlayıcıyı sıfırla
      enemies.push(spawnenemy()); // yeni düşman oluştur
      spawnedEnemiesCount++; // spawn edilen düşman sayısını artır
    }
  } else if (enemies.length === 0) { // tüm düşmanlar temizlendiyse
    if (level >= 3 && !bossdogum) { // seviye 3 ve sonrası için boss
      boss = spawnboss(boss_size_base + level * 2, boss_health_base * level); // boss oluştur
      bossdogum = true; // boss doğdu
    } else if (level < 3) { // seviye 1 ve 2 için
      winLevel(); // seviyeyi kazan
    }
  }

  dusmanhareketi(delta, enemyspeed); // düşmanları oyuncuya doğru hareket ettir

  if (boss) {
    bosshareketi(delta, bossspeed); // bossu oyuncuya doğru hareket ettir
    bossshootsayac += dt; // boss atış zamanlayıcısını artır
    if (bossshootsayac >= boss_shoot_interval) { // atış zamanı geldiyse
      bossshootsayac -= boss_shoot_interval; // zamanlayıcıyı sıfırla
      const bx = boss.x + boss.width / 2; // boss merkezi x
      const by = boss.y + boss.height / 2; // boss merkezi y
      const tx = player.x + player.width / 2; // oyuncu merkezi x
      const ty = player.y + player.height / 2; // oyuncu merkezi y
      const baseAngle = Math.atan2(ty - by, tx - bx); // atış açısı
      const spreadAngle = 0.4; // yayılım açısı
      for (let i = 0; i < bossbulletcount; i++) { // mermi sayısı kadar
        const angle = baseAngle + spreadAngle * (i / (bossbulletcount - 1) - 0.5); // yayılım açısı
        bossmermi.push(bossmermiolustur(bx, by, angle, bossbulletspeed, bossbulletdamage)); // boss mermisi oluştur
      }
    }
  }

  for (let i = bossmermi.length - 1; i >= 0; i--) { // tüm boss mermilerini gez
    const b = bossmermi[i];
    b.x += b.vx * delta; // mermiyi x yönünde hareket ettir
    b.y += b.vy * delta; // mermiyi y yönünde hareket ettir
    if (
      b.x < player.x + player.width &&
      player.x < b.x + b.width &&
      b.y < player.y + player.height &&
      player.y < b.y + b.height
    ) { // oyuncuya çarpma kontrolü
      player.health -= b.damage; // oyuncu canını azalt
      bossmermi.splice(i, 1); // mermiyi kaldır
      continue;
    }
    if (
      b.x + b.width < 0 ||
      b.x > canvas.width ||
      b.y + b.height < 0 ||
      b.y > canvas.height
    ) { // ekran dışına çıktıysa
      bossmermi.splice(i, 1); // mermiyi kaldır
    }
  }


  checkBulletEnemyCollisions(); // mermi-düşman çarpışmalarını kontrol et
  checkBulletBossCollision(); // mermi-boss çarpışmalarını kontrol et
  checkEnemyPlayerCollision(); // düşman-oyuncu çarpışmalarını kontrol et
  if (player.health <= 0) endGame(); // oyuncu canı biterse oyunu bitir
}

//çizme
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // ekranı temizle
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height); // oyuncuyu çiz
  ctx.fillStyle = 'yellow'; // mermi rengi
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height)); // mermileri çiz
  enemies.forEach(e => ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height)); // düşmanları çiz
  if (boss) { // boss varsa
    ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height); // bossu çiz
    ctx.fillStyle = 'red'; // boss can çubuğu rengi
    ctx.fillRect(boss.x, boss.y - 10, boss.width * (boss.health / (boss_health_base * level)), 5); // boss can çubuğunu çiz
  }
  ctx.fillStyle = 'purple'; // boss mermi rengi
  bossmermi.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height)); // boss mermilerini çiz
  ctx.fillStyle = 'white'; // yazı rengi
  ctx.font = '20px Arial'; // yazı tipi
  ctx.fillText(`Skor: ${score}`, 10, 30); // skoru yaz
  ctx.fillText(`Seviye: ${level}`, canvas.width - 140, 30); // seviyeyi yaz
  ctx.fillText(`Can: ${player.health}`, canvas.width / 2 - 40, 30); // canı yaz

  // geri sayım ekranı
  if (countdownactive) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; // yarı saydam arka plan
    ctx.fillRect(0, 0, canvas.width, canvas.height); // ekranı doldur
    ctx.fillStyle = 'white'; // yazı rengi
    ctx.font = '80px Arial'; // yazı tipi
    ctx.textAlign = 'center'; // yazıyı ortala
    ctx.textBaseline = 'middle'; // yazı hizası
    ctx.fillText(countdowncalue, canvas.width / 2, canvas.height / 2); // geri sayımı yaz
    ctx.textAlign = 'start'; // hizayı sıfırla
    ctx.textBaseline = 'alphabetic'; // hizayı sıfırla
  }
}

// mermi-düşman çarpışmalarını kontrol etme
function checkBulletEnemyCollisions() {
  for (let i = enemies.length - 1; i >= 0; i--) { // tüm düşmanları gez
    for (let j = bullets.length - 1; j >= 0; j--) { // tüm mermileri gez
      if (collides(bullets[j], enemies[i])) { // çarpışma varsa
        enemies.splice(i, 1); // düşmanı kaldır
        bullets.splice(j, 1); // mermiyi kaldır
        score += 10; // skoru artır
        break; // iç döngüden çık
      }
    }
  }
}

function spawnenemy() {
  const side = Math.floor(Math.random() * 4); // rastgele kenar seç
  let x, y;
  switch (side) { // kenara göre pozisyon belirle
    case 0: x = Math.random() * (canvas.width - player_size); y = -player_size; break; // üst
    case 1: x = canvas.width; y = Math.random() * (canvas.height - player_size); break; // sağ
    case 2: x = Math.random() * (canvas.width - player_size); y = canvas.height; break; // alt
    case 3: x = -player_size; y = Math.random() * (canvas.height - player_size); break; // sol
  }
  return { x, y, width: player_size, height: player_size }; // düşman objesini döndür
}

function spawnboss(size, health) {
  const side = Math.floor(Math.random() * 4); // rastgele kenar seç
  let x, y;
  switch (side) { // kenara göre pozisyon belirle
    case 0: x = Math.random() * (canvas.width - size); y = -size; break; // üst
    case 1: x = canvas.width; y = Math.random() * (canvas.height - size); break; // sağ
    case 2: x = Math.random() * (canvas.width - size); y = canvas.height; break; // alt
    case 3: x = -size; y = Math.random() * (canvas.height - size); break; // sol
  }
  return { x, y, width: size, height: size, health }; // boss objesini döndür
}

function dusmanhareketi(delta, speed) {
  const cx = player.x + player.width / 2; // oyuncu merkezi x
  const cy = player.y + player.height / 2; // oyuncu merkezi y
  enemies.forEach(e => { // tüm düşmanları gez
    const dx = cx - (e.x + e.width / 2); // oyuncuya x yönünde mesafe
    const dy = cy - (e.y + e.height / 2); // oyuncuya y yönünde mesafe
    const L = Math.hypot(dx, dy) || 1; // mesafenin uzunluğu
    e.x += dx / L * speed * delta; // x yönünde hareket
    e.y += dy / L * speed * delta; // y yönünde hareket
  });
}

function bosshareketi(delta, speed) {
  const cx = player.x + player.width / 2; // oyuncu merkezi x
  const cy = player.y + player.height / 2; // oyuncu merkezi y
  const dx = cx - (boss.x + boss.width / 2); // oyuncuya x yönünde mesafe
  const dy = cy - (boss.y + boss.height / 2); // oyuncuya y yönünde mesafe
  const L = Math.hypot(dx, dy) || 1; // mesafenin uzunluğu
  boss.x += dx / L * speed * delta; // x yönünde hareket
  boss.y += dy / L * speed * delta; // y yönünde hareket
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyR' && gameOver) { // r tuşuna basılırsa ve oyun bittiyse
    restartGame(); // oyunu yeniden başlat
  }
});

// boss mermisi oluşturma
function bossmermiolustur(x, y, angle, speed, damage) {
  return {
    x: x - 5, // mermi başlangıç x
    y: y - 5, // mermi başlangıç y
    width: 10, // mermi genişliği
    height: 10, // mermi yüksekliği
    vx: Math.cos(angle) * speed, // mermi x hızı
    vy: Math.sin(angle) * speed, // mermi y hızı
    damage, // mermi hasarı
    life: 3 // mermi ömrü
  };
}

// mermi-boss çarpışması
function checkBulletBossCollision() {
  if (!boss) return; // boss yoksa çık
  for (let i = bullets.length - 1; i >= 0; i--) { // tüm mermileri gez
    if (collides(bullets[i], boss)) { // çarpışma varsa
      bullets.splice(i, 1); // mermiyi kaldır
      boss.health--; // boss canını azalt
      if (boss.health <= 0) winLevel(); // boss canı biterse seviyeyi kazan
      break; // döngüden çık
    }
  }
}

// düşman-oyuncu çarpışması
function checkEnemyPlayerCollision() {
  for (let i = enemies.length - 1; i >= 0; i--) { // tüm düşmanları gez
    if (collides(player, enemies[i])) { // çarpışma varsa
      enemies.splice(i, 1); // düşmanı kaldır
      player.health--; // oyuncu canını azalt
    }
  }
}

// çarpışma kontrolü
function collides(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  ); // iki nesne çarpışıyorsa true döndür
}


function endGame() {
  oyunabasladimi = false; // oyunu durdur
  gameOver = true; // oyun bitti durumunu set et
  alert('Oyun Bitti! Yeniden başlatmak için R tuşuna basın.'); // uyarı göster
}

// oyunu yeniden başlatma
function restartGame() {

  gameOver = false; // oyun bitti durumunu sıfırla
  score = 0; // skoru sıfırla
  level = 1; // seviyeyi sıfırla
  spawnedEnemiesCount = 0; // spawn edilen düşman sayısını sıfırla
  bossdogum = false; // boss doğumunu sıfırla
  boss = null; // bossu sıfırla
  bullets.length = 0; // mermileri temizle
  enemies.length = 0; // düşmanları temizle
  bossmermi.length = 0; // boss mermilerini temizle
  upgradesayaci = 1; // yükseltme sayısını sıfırla
  player.health = playeremaxcan; // oyuncu canını yenile
  player.x = canvas.width / 2 - player_size / 2; // oyuncu x pozisyonunu sıfırla
  player.y = canvas.height - player_size - 10; // oyuncu y pozisyonunu sıfırla

  upgrademenu.style.display = 'none'; // yükseltme menüsünü gizle
  startscreen.classList.add('hidden'); // başlangıç ekranını gizle

  bitissuresi = performance.now(); // zamanlayıcıyı sıfırla
  oyunabasladimi = true; // oyunu başlat
  countdownactive = false; // geri sayımı kapat
  oyundurdumu = false; // oyunu devam ettir
  requestAnimationFrame(oyundongusu); // oyun döngüsünü başlat
  playeremaxcan = 10; // oyuncu maksimum canını sıfırla
  player.health = playeremaxcan; // oyuncu canını yenile
  player.x = canvas.width / 2 - player_size / 2; // oyuncu x pozisyonunu sıfırla
  player.y = canvas.height - player_size - 10; // oyuncu y pozisyonunu sıfırla
}

function winLevel() {
  boss = null; // bossu sıfırla
  bossdogum = false; // boss doğumunu sıfırla
  oyundurdumu = true; // oyunu duraklat
  upgrademenu.querySelector('h2').textContent = `Seviye ${level} Tamamlandı!`; // menü başlığını güncelle
  upgrademenu.style.display = 'flex'; // yükseltme menüsünü göster
}

function yukseltmeuygula(choice) {
  switch (choice) { // seçilen yükseltmeye göre
    case '1': upgradesayaci++; break; // mermi sayısını artır
    case '2': player_speed += 50; break; // oyuncu hızını artır
    case '3': bullet_speed += 200; break; // mermi hızını artır
    case '4': playeremaxcan++; player.health = playeremaxcan; break; // oyuncu canını artır
  }
}