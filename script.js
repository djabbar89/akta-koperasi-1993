// ============================================================
// Rujukan Akta Koperasi 1993 (Akta 502) — Logik Web App (MVP)
// RUJUKAN TIDAK RASMI — tiada tafsiran, papar teks asal sahaja
// ============================================================

// ----- Data global (diisi selepas muat JSON) -----
let SENARAI_SEKSYEN  = [];   // kandungan src/data/seksyen.json
let SENARAI_BAHAGIAN = [];   // kandungan src/data/bahagian.json

// ----- Rujukan elemen DOM -----
const el = (id) => document.getElementById(id);
const paparanUtama   = el('paparan-utama');
const paparanSeksyen = el('paparan-seksyen');
const inputCarian    = el('input-carian');
const hasilCarian    = el('hasil-carian');
const senaraiBahagian = el('senarai-bahagian');

// ============================================================
// 1. MUAT DATA JSON
// ============================================================
async function muatData() {
  try {
    // Muat kedua-dua fail JSON secara serentak
    const [resSeksyen, resBahagian] = await Promise.all([
      fetch('src/data/seksyen.json'),
      fetch('src/data/bahagian.json'),
    ]);

    if (!resSeksyen.ok || !resBahagian.ok) {
      throw new Error('Fail JSON tidak dijumpai di src/data/');
    }

    const dataSeksyen  = await resSeksyen.json();
    const dataBahagian = await resBahagian.json();

    SENARAI_SEKSYEN  = dataSeksyen.seksyen  || [];
    SENARAI_BAHAGIAN = dataBahagian.bahagian || [];

    paparSenaraiBahagian();
  } catch (err) {
    senaraiBahagian.innerHTML =
      '<p class="tiada-hasil">Ralat memuatkan data: ' + err.message +
      '<br>Pastikan halaman diakses melalui pelayan web ' +
      '(bukan file://) dan fail JSON wujud di src/data/.</p>';
  }
}

// ============================================================
// 2. PAPAR SENARAI BAHAGIAN (accordion)
// ============================================================
function paparSenaraiBahagian() {
  senaraiBahagian.innerHTML = '';

  for (const b of SENARAI_BAHAGIAN) {
    // Elemen <details> = accordion terbina-tanpa JavaScript
    const details = document.createElement('details');

    // --- Tajuk Bahagian ---
    const summary = document.createElement('summary');
    summary.innerHTML =
      'Bahagian ' + b.huruf + ' — ' + b.tajuk +
      ' <span class="bilangan-seksyen">(' + b.seksyen.length + ' seksyen)</span>';
    details.appendChild(summary);

    // --- Senarai seksyen dalam Bahagian ini ---
    // bahagian.json: seksyen = [{nombor, status}, ...]
    for (const s of b.seksyen) {
      const btn = document.createElement('button');
      btn.className = 'butang-seksyen';
      btn.dataset.nombor = s.nombor;

      const lencana = s.status === 'dipotong'
        ? '<span class="lencana-status lencana-dipotong">Dipotong</span>'
        : '<span class="lencana-status lencana-aktif">Aktif</span>';

      btn.innerHTML =
        '<span class="nombor">' + s.nombor + '</span>' +
        '<span class="tajuk">' + cariTajuk(s.nombor) + '</span>' +
        lencana;

      // Klik → papar seksyen (hanya jika sudah diekstrak)
      btn.addEventListener('click', () => paparSeksyen(s.nombor));
      details.appendChild(btn);
    }

    senaraiBahagian.appendChild(details);
  }
}

// Cari tajuk seksyen daripada data seksyen.json
// (jika belum diekstrak, pulangkan tanda placeholder)
function cariTajuk(nombor) {
  const s = SENARAI_SEKSYEN.find(x => x.nombor === nombor);
  return s ? s.tajuk : '<em style="color:#999">(belum diekstrak)</em>';
}

// ============================================================
// 3. PAPAR SATU SEKSYEN
// ============================================================
function paparSeksyen(nombor) {
  const s = SENARAI_SEKSYEN.find(
    x => x.nombor.toLowerCase() === String(nombor).toLowerCase()
  );
  if (!s) {
    alert('Seksyen ' + nombor + ' belum diekstrak lagi. ' +
          'Data penuh akan dimuatkan kemudian.');
    return;
  }

  // Isi kandungan
  el('seksyen-tajuk').textContent =
    'Seksyen ' + s.nombor + ' — ' + s.tajuk;

  // Metadata: Bahagian + status
  el('seksyen-meta').innerHTML =
    '<span class="meta-item">Bahagian ' + s.bahagian + '</span>' +
    (s.status === 'dipotong'
      ? '<span class="meta-item" style="background:#fbe4e4;color:#a12622">Dipotong</span>'
      : '');

  // Teks penuh (format asal dikekalkan dengan pre-wrap)
  el('seksyen-teks').textContent = s.teks;

  // Subseksyen (jika ada dalam data)
  const bekasSub = el('seksyen-sub');
  bekasSub.innerHTML = '';
  if (Array.isArray(s.subseksyen) && s.subseksyen.length > 0) {
    const tajukSub = document.createElement('h3');
    tajukSub.textContent = 'Subseksyen';
    bekasSub.appendChild(tajukSub);

    for (const sub of s.subseksyen) {
      const item = document.createElement('div');
      item.className = 'subseksyen-item';

      const nom = document.createElement('span');
      nom.className = 'sub-nombor';
      nom.textContent = sub.nombor;

      const teks = document.createElement('div');
      teks.className = 'subseksyen-teks';
      teks.textContent = sub.teks;

      item.appendChild(nom);
      item.appendChild(teks);
      bekasSub.appendChild(item);
    }
  }

  // Rujukan halaman PDF
  el('seksyen-halaman').textContent =
    'Sumber: PDF Akta 502 (2021), halaman ' +
    s.halaman_pdf +
    (s.halaman_tamat_pdf && s.halaman_tamat_pdf !== s.halaman_pdf
      ? '–' + s.halaman_tamat_pdf
      : '') + '.';

  // Tukar paparan: sorok utama, tunjuk seksyen
  paparanUtama.hidden = true;
  hasilCarian.hidden = true;
  paparanSeksyen.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// 4. BUTANG KEMBALI
// ============================================================
function kembaliKeSenarai() {
  paparanSeksyen.hidden = true;
  paparanUtama.hidden = false;
}

// ============================================================
// 5. CARIAN INSTANT (semasa menaip)
// ============================================================
function jalankanCarian() {
  const q = inputCarian.value.trim().toLowerCase();

  // Input kosong → sorok hasil
  if (!q) {
    hasilCarian.innerHTML = '';
    hasilCarian.hidden = true;
    return;
  }

  const hasil = [];

  // --- (a) Padanan langsung nombor seksyen ---
  // Buang perkataan "seksyen" jika pengguna menaipnya
  const qNombor = q.replace(/^s(?:eksyen)?\.?\s*/, '').toUpperCase();
  const padananLangsung = SENARAI_SEKSYEN.find(
    s => s.nombor.toUpperCase() === qNombor
  );
  if (padananLangsung) hasil.push({ s: padananLangsung, jenis: 'pasti' });

  // --- (b) Padanan kata kunci / tajuk / teks ---
  if (q.length >= 3) {   // elakkan carian terlalu pendek (contoh: "57" sudah dilindungi di atas)
    for (const s of SENARAI_SEKSYEN) {
      if (padananLangsung && s.nombor === padananLangsung.nombor) continue;

      const padanKataKunci = (s.kata_kunci || []).some(
        k => k.toLowerCase().includes(q)
      );
      const padanTajuk = s.tajuk.toLowerCase().includes(q);
      const padanTeks  = s.teks.toLowerCase().includes(q);

      if (padanKataKunci || padanTajuk || padanTeks) {
        hasil.push({ s, jenis: 'kata' });
      }
    }
  }

  // --- Papar hasil ---
  hasilCarian.innerHTML = '';

  if (hasil.length === 0) {
    hasilCarian.innerHTML =
      '<p class="tiada-hasil">Tiada seksyen padan dengan &ldquo;' +
      inputCarian.value.trim() + '&rdquo;.</p>';
  } else {
    // Hadkan paparan kepada 20 hasil pertama (elakkan senarai terlalu panjang)
    for (const { s, jenis } of hasil.slice(0, 20)) {
      const btn = document.createElement('button');
      btn.className = 'hasil-item';

      const lencana = jenis === 'pasti'
        ? '<span class="lencana lencana-pasti">Padanan seksyen</span>'
        : '<span class="lencana lencana-kata">Kata kunci</span>';

      btn.innerHTML = lencana +
        '<strong>Seksyen ' + s.nombor + '</strong> — ' + s.tajuk;

      btn.addEventListener('click', () => paparSeksyen(s.nombor));
      hasilCarian.appendChild(btn);
    }
  }

  hasilCarian.hidden = false;
}

// ============================================================
// 6. PERMULAAN (INIT)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  muatData();                                   // muat data JSON
  inputCarian.addEventListener('input', jalankanCarian);  // carian instant
  el('butang-kembali').addEventListener('click', kembaliKeSenarai);
});
