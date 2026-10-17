const PLACEHOLDER = 'img/placeholder.svg';

(function () {
  var tahunEl = document.getElementById('tahun');
  if (tahunEl) tahunEl.textContent = new Date().getFullYear();

  // ---------- Lightbox galeri ----------
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || 'Foto kegiatan';
    lightbox.hidden = false;
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = '';
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  function showLoadError(containerId, message) {
    var el = document.getElementById(containerId);
    if (el) el.innerHTML = '<p class="load-message">' + message + '</p>';
  }

  function showEmpty(containerId, message) {
    var el = document.getElementById(containerId);
    if (el) el.innerHTML = '<p class="load-message">' + message + '</p>';
  }

  function showConfigMissing() {
    var msg = 'Informasi belum bisa dimuat saat ini. Silakan hubungi kami langsung lewat WhatsApp.';
    showLoadError('kegiatan-grid', msg);
    showLoadError('galeri-grid', msg);
    showLoadError('guru-grid', msg);
    showLoadError('testimoni-list', msg);
    var phoneLinkEl = document.getElementById('phone-link');
    if (phoneLinkEl) phoneLinkEl.textContent = '📞 Nomor belum tersedia';
  }

  // ---------- Ambil data sekolah dari Supabase ----------
  fetch('/api/public-config')
    .then(function (r) { return r.json(); })
    .then(function (config) {
      if (!config.supabaseUrl || !config.supabaseAnonKey) {
        showConfigMissing();
        return;
      }
      loadGaleri(config);
      loadKegiatan(config);
      loadTestimoni(config);
      loadPengaturan(config);
      loadGuru(config);
    })
    .catch(function () {
      showConfigMissing();
    });

  function supaFetch(config, table, query) {
    var url = config.supabaseUrl + '/rest/v1/' + table + '?' + query;
    return fetch(url, {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: 'Bearer ' + config.supabaseAnonKey,
      },
    }).then(function (r) { return r.json(); });
  }

  function loadGaleri(config) {
    supaFetch(config, 'galeri', 'select=judul,url_foto&order=created_at.desc&limit=9')
      .then(function (data) {
        var grid = document.getElementById('galeri-grid');
        if (!grid) return;
        if (!Array.isArray(data)) {
          showLoadError('galeri-grid', 'Galeri belum bisa ditampilkan saat ini. Silakan hubungi kami langsung lewat WhatsApp.');
          return;
        }
        if (data.length === 0) {
          showEmpty('galeri-grid', 'Belum ada foto kegiatan.');
          return;
        }
        grid.innerHTML = '';
        data.forEach(function (item) {
          var card = document.createElement('div');
          card.className = 'galeri-card';
          var img = document.createElement('img');
          img.src = item.url_foto;
          img.alt = item.judul || 'Foto kegiatan';
          img.loading = 'lazy';
          img.addEventListener('click', function () { openLightbox(img.src, img.alt); });
          var h3 = document.createElement('h3');
          h3.textContent = item.judul || '';
          card.appendChild(img);
          card.appendChild(h3);
          grid.appendChild(card);
        });
      })
      .catch(function () {
        showLoadError('galeri-grid', 'Galeri belum bisa ditampilkan saat ini. Silakan hubungi kami langsung lewat WhatsApp.');
      });
  }

  var BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function formatTanggal(tanggal) {
    if (!tanggal) return '';
    var parts = tanggal.split('-');
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return tanggal;
    return d + ' ' + BULAN_ID[m] + ' ' + y;
  }

  function loadKegiatan(config) {
    supaFetch(config, 'berita_kegiatan', 'select=judul,isi,foto_url&order=created_at.desc&limit=6')
      .then(function (data) {
        var grid = document.getElementById('kegiatan-grid');
        if (!grid) return;
        if (!Array.isArray(data)) {
          showLoadError('kegiatan-grid', 'Berita acara belum bisa ditampilkan saat ini. Silakan hubungi kami langsung lewat WhatsApp.');
          return;
        }
        if (data.length === 0) {
          showEmpty('kegiatan-grid', 'Belum ada berita acara.');
          return;
        }
        grid.innerHTML = '';
        data.forEach(function (item) {
          var card = document.createElement('article');
          card.className = 'berita-item';
          if (item.foto_url) {
            var img = document.createElement('img');
            img.src = item.foto_url || PLACEHOLDER;
            img.alt = item.judul || '';
            img.loading = 'lazy';
            img.className = 'berita-item-img';
            card.appendChild(img);
          }
          var body = document.createElement('div');
          body.className = 'berita-item-body';
          var h3 = document.createElement('h3');
          h3.textContent = item.judul;
          var p = document.createElement('p');
          p.textContent = item.isi || '';
          body.appendChild(h3);
          body.appendChild(p);
          card.appendChild(body);
          grid.appendChild(card);
        });
      })
      .catch(function () {
        showLoadError('kegiatan-grid', 'Berita acara belum bisa ditampilkan saat ini. Silakan hubungi kami langsung lewat WhatsApp.');
      });
  }

  function loadGuru(config) {
    supaFetch(config, 'guru_staff', 'select=nama,jabatan,foto_url&order=created_at.desc&limit=8')
      .then(function (data) {
        var grid = document.getElementById('guru-grid');
        if (!grid) return;
        if (!Array.isArray(data)) {
          showLoadError('guru-grid', 'Data guru & staff belum bisa ditampilkan saat ini. Silakan hubungi kami langsung lewat WhatsApp.');
          return;
        }
        if (data.length === 0) {
          showEmpty('guru-grid', 'Belum ada data guru & staff.');
          return;
        }
        grid.innerHTML = '';
        data.forEach(function (item) {
          var card = document.createElement('div');
          card.className = 'guru-card';
          if (item.foto_url) {
            var img = document.createElement('img');
            img.src = item.foto_url || PLACEHOLDER;
            img.alt = item.nama || '';
            img.loading = 'lazy';
            card.appendChild(img);
          }
          var h3 = document.createElement('h3');
          h3.textContent = item.nama || '';
          var p = document.createElement('p');
          p.textContent = item.jabatan || '';
          card.appendChild(h3);
          card.appendChild(p);
          grid.appendChild(card);
        });
      })
      .catch(function () {
        showLoadError('guru-grid', 'Data guru & staff belum bisa ditampilkan saat ini. Silakan hubungi kami langsung lewat WhatsApp.');
      });
  }
  function normalizePhone(raw) {
  var digits = String(raw || '').replace(/\D/g, '');
  if (digits.indexOf('0') === 0) {
    digits = '62' + digits.slice(1);
  }
  return digits;
}

  function formatPhoneDisplay(digits) {
    var local = digits.indexOf('62') === 0 ? '0' + digits.slice(2) : digits;
    if (local.length <= 4) return local;
    var groups = [local.slice(0, 4)];
    var rest = local.slice(4);
    while (rest.length > 4) {
      groups.push(rest.slice(0, 4));
      rest = rest.slice(4);
    }
    if (rest) groups.push(rest);
    return groups.join('-');
  }
    var KATEGORI_VALID = ['jadwal', 'dokumen', 'kelompok', 'catatan', 'lainnya'];

  function inferKategori(judul) {
    var j = String(judul || '').toLowerCase();
    if (/dokumen|pas\s*foto|berkas|persyaratan/.test(j)) return 'dokumen';
    if (/usia|kelas|kelompok/.test(j)) return 'kelompok';
    if (/jadwal|tanggal|pengumuman|wawancara|observasi|daftar ulang|registrasi/.test(j)) return 'jadwal';
    if (/catatan|keterangan/.test(j)) return 'catatan';
    return 'lainnya';
  }

  function capFirst(s) {
    s = String(s || '').trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  function ikutiHuruf(asli, kata) {
    var c = asli.charAt(0);
    var besar = c !== c.toLowerCase();
    return besar ? kata.charAt(0).toUpperCase() + kata.slice(1) : kata;
  }

  // Normalisasi hanya saat tampil; data di database tidak diubah
  function rapikanEjaan(s) {
    return String(s || '')
      .replace(/\bfoto\s*(?:copy|kopi)\b/gi, function (m) { return ikutiHuruf(m, 'fotokopi'); })
      .replace(/\bakte\b/gi, function (m) { return ikutiHuruf(m, 'akta'); })
      .replace(/\bpas\s*foto\b|\bpasphoto\b/gi, function (m) { return ikutiHuruf(m, 'pasfoto'); });
  }

  function rapikanRentang(s) {
    s = String(s || '').trim();
    if (/\d{1,2}\s*[-\/.]\s*\d{1,2}\s*[-\/.]\s*\d{2,4}/.test(s)) return s; // tanggal 10-06-2026 jangan diubah
    return s.replace(/(\d)\s*[-\u2013\u2014]\s*(\d)/g, '$1\u2013$2');
  }

  function buat(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }

  function tambahBlok(container, judul, isi) {
    var blok = buat('div', 'info-block');
    blok.appendChild(buat('h3', 'info-heading', judul));
    blok.appendChild(isi);
    container.appendChild(blok);
  }

  function renderInfoPendaftaran(raw) {
    var container = document.getElementById('info-grid');
    if (!container) return;

    var items;
    try { items = JSON.parse(raw || '[]'); } catch (e) { items = []; }
    if (!Array.isArray(items)) items = [];

    var grup = { jadwal: [], dokumen: [], kelompok: [], catatan: [], lainnya: [] };
    items.forEach(function (it) {
      if (!it) return;
      var judul = String(it.judul || '').trim();
      var isi = String(it.isi || '').trim();
      if (!judul && !isi) return;
      var kat = KATEGORI_VALID.indexOf(it.kategori) !== -1 ? it.kategori : inferKategori(judul);
      grup[kat].push({ judul: judul, isi: isi });
    });

    container.innerHTML = '';

    if (grup.jadwal.length) {
      var olJadwal = buat('ol', 'jadwal-list');
      grup.jadwal.forEach(function (g, i) {
        var li = buat('li', 'jadwal-item');
        li.appendChild(buat('span', 'jadwal-no', String(i + 1)));
        var body = buat('div', 'jadwal-body');
        body.appendChild(buat('div', 'jadwal-nama', capFirst(rapikanEjaan(g.judul || g.isi))));
        if (g.judul && g.isi) body.appendChild(buat('div', 'jadwal-tanggal', rapikanRentang(g.isi)));
        li.appendChild(body);
        olJadwal.appendChild(li);
      });
      tambahBlok(container, 'Jadwal Pendaftaran', olJadwal);
    }

    if (grup.dokumen.length) {
      var kartuDokumen = buat('div', 'info-card');
      var ulDokumen = buat('ul', 'check-list');
      grup.dokumen.forEach(function (g) {
        var umum = !g.judul || /^(dokumen|pas\s*foto|berkas|persyaratan)$/i.test(g.judul);
        var teks = umum ? (g.isi || g.judul) : (g.isi ? g.judul + ': ' + g.isi : g.judul);
        ulDokumen.appendChild(buat('li', null, capFirst(rapikanEjaan(teks))));
      });
      kartuDokumen.appendChild(ulDokumen);
      tambahBlok(container, 'Dokumen yang Dibawa', kartuDokumen);
    }

    if (grup.kelompok.length) {
      var gridKelompok = buat('div', 'kelompok-grid');
      grup.kelompok.forEach(function (g) {
        var cocok = g.judul.match(/\b(?:kelas|kelompok|kel)\b\.?\s*([A-Za-z0-9]+)/i);
        var nama;
        if (cocok) {
          var kode = cocok[1];
          nama = 'Kelompok ' + (kode.length <= 2 ? kode.toUpperCase() : capFirst(kode));
        } else {
          nama = capFirst(rapikanEjaan(g.judul || 'Kelompok'));
        }
        var usia = rapikanRentang(g.isi);
        if (cocok && usia && !/^usia/i.test(usia)) usia = 'Usia ' + usia;
        var kartuKelompok = buat('div', 'kelompok-card');
        kartuKelompok.appendChild(buat('div', 'kelompok-nama', nama));
        if (usia) kartuKelompok.appendChild(buat('div', 'kelompok-usia', usia));
        gridKelompok.appendChild(kartuKelompok);
      });
      tambahBlok(container, 'Usia dan Kelompok', gridKelompok);
    }

    if (grup.catatan.length) {
      var ulCatatan = buat('ul', 'catatan-list');
      grup.catatan.forEach(function (g) {
        var umum = !g.judul || /^(catatan|keterangan)$/i.test(g.judul);
        var teks = umum ? (g.isi || g.judul) : (g.isi ? g.judul + ': ' + g.isi : g.judul);
        if (teks) ulCatatan.appendChild(buat('li', null, capFirst(rapikanEjaan(teks))));
      });
      tambahBlok(container, 'Catatan', ulCatatan);
    }

    if (grup.lainnya.length) {
      var ulLain = buat('ul', 'lain-list');
      grup.lainnya.forEach(function (g) {
        var li = buat('li');
        if (g.judul && g.isi) {
          li.appendChild(buat('strong', null, capFirst(rapikanEjaan(g.judul)) + ':'));
          li.appendChild(document.createTextNode(' ' + capFirst(rapikanEjaan(g.isi))));
        } else {
          li.textContent = capFirst(rapikanEjaan(g.judul || g.isi));
        }
        ulLain.appendChild(li);
      });
      tambahBlok(container, 'Informasi Lainnya', ulLain);
    }

    if (!container.children.length) {
      container.appendChild(buat('p', 'load-message', 'Informasi pendaftaran belum tersedia.'));
    }
  }

  function loadPengaturan(config) {
    supaFetch(config, 'pengaturan', 'select=key,value')
      .then(function (rows) {
        if (!Array.isArray(rows) || rows.length === 0) return;
        var map = {};
        rows.forEach(function (r) { map[r.key] = r.value; });

        setText('tagline', map.tagline);
        setAttr('profil-foto', 'src', map.foto_profil_url);
        setText('profil-teks', map.tentang_teks);
        setAttr('hero-photo', 'src', map.foto_hero_url);
        setText('alamat-text', map.alamat);
        setText('jam-text', map.jam_operasional);
        setText('cta-teks', map.cta_teks);
        if (map.maps_koordinat) {
          var frame = document.getElementById('maps-frame');
          if (frame) {
            frame.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(map.maps_koordinat) + '&z=15&ie=UTF8&iwloc=&output=embed';
          }
        }

        renderInfoPendaftaran(map.info_pendaftaran);

        if (map.no_telp) {
          var digits = normalizePhone(map.no_telp);
          if (digits) {
            var phoneLink = document.getElementById('phone-link');
            if (phoneLink) {
              phoneLink.setAttribute('href', 'tel:+' + digits);
              phoneLink.textContent = '\uD83D\uDCDE ' + formatPhoneDisplay(digits);
            }
            var waMsg = 'Halo, saya ingin tanya-tanya soal Daftar Sekolah di KB Bhineka Tunggal Ika';
            var waUrl = 'https://wa.me/' + digits + '?text=' + encodeURIComponent(waMsg);
            setAttr('wa-cta', 'href', waUrl);
          }
        } else {
          var phoneLinkEl = document.getElementById('phone-link');
          if (phoneLinkEl) phoneLinkEl.textContent = '📞 Nomor belum diatur admin';
        }
      });
  }

  function setText(id, value) {
    if (!value) return;
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setAttr(id, attr, value) {
    if (!value) return;
    var el = document.getElementById(id);
    if (el) el.setAttribute(attr, value);
  }

  function loadTestimoni(config) {
    supaFetch(config, 'testimoni', 'select=nama_ortu,isi&order=created_at.desc&limit=6')
      .then(function (data) {
        var list = document.getElementById('testimoni-list');
        if (!list) return;
        if (!Array.isArray(data)) {
          showLoadError('testimoni-list', 'Testimoni belum bisa ditampilkan saat ini.');
          return;
        }
        if (data.length === 0) {
          showEmpty('testimoni-list', 'Belum ada testimoni.');
          return;
        }
        list.innerHTML = '';
        data.forEach(function (item) {
          var card = document.createElement('blockquote');
          card.className = 'testimoni-card';
          var p = document.createElement('p');
          p.textContent = '"' + item.isi + '"';
          var cite = document.createElement('cite');
          cite.textContent = '— ' + item.nama_ortu + ', orang tua murid';
          card.appendChild(p);
          card.appendChild(cite);
          list.appendChild(card);
        });
      })
      .catch(function () {
        showLoadError('testimoni-list', 'Testimoni belum bisa ditampilkan saat ini.');
      });
  }
})();