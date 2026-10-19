const PLACEHOLDER = 'img/placeholder.svg';

(function () {
  var tahunEl = document.getElementById('tahun');
  if (tahunEl) tahunEl.textContent = new Date().getFullYear();

  // ---------- Lightbox galeri ----------
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');
  var fokusSebelumnya = null;

  function openLightbox(src, alt) {
    fokusSebelumnya = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || 'Foto kegiatan';
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.removeAttribute('src');
    document.body.classList.remove('lightbox-open');
    if (fokusSebelumnya && fokusSebelumnya.focus) fokusSebelumnya.focus();
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    // Fokus tetap di dalam lightbox
    if (e.key === 'Tab') {
      e.preventDefault();
      if (lightboxClose) lightboxClose.focus();
    }
  });

  // Foto yang bisa diperbesar juga bisa dibuka dengan keyboard (Enter / Spasi)
  function bisaDiperbesar(img) {
    if (!img) return;
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Perbesar foto: ' + (img.alt || 'foto'));
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        img.click();
      }
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
    if (phoneLinkEl) {
      phoneLinkEl.textContent = '📞 Nomor belum tersedia';
      phoneLinkEl.removeAttribute('href');
    }
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
      initZoomFoto();
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
          bisaDiperbesar(img);
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
            img.alt = item.judul ? 'Foto kegiatan: ' + item.judul : 'Foto berita kegiatan';
            img.loading = 'lazy';
            img.className = 'berita-item-img';
            bisaDiperbesar(img);
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
            img.alt = item.nama ? 'Foto ' + item.nama + (item.jabatan ? ', ' + item.jabatan : '') : 'Foto guru';
            img.loading = 'lazy';
            bisaDiperbesar(img);
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

  var KATEGORI_VALID = ['jadwal', 'dokumen', 'kelompok', 'lainnya'];

  function inferKategori(judul) {
    var j = String(judul || '').toLowerCase();
    if (/dokumen|pas\s*foto|berkas|persyaratan/.test(j)) return 'dokumen';
    if (/usia|kelas|kelompok/.test(j)) return 'kelompok';
    if (/jadwal|tanggal|pengumuman|wawancara|observasi|daftar ulang|registrasi/.test(j)) return 'jadwal';
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

    var grup = { jadwal: [], dokumen: [], kelompok: [], lainnya: [] };
    items.forEach(function (it) {
      if (!it) return;
      var judul = String(it.judul || '').trim();
      var isi = String(it.isi || '').trim();
      if (!judul && !isi) return;
      var awal = it.kategori === 'catatan' ? 'lainnya' : it.kategori;
      var kat = KATEGORI_VALID.indexOf(awal) !== -1 ? awal : inferKategori(judul);
      if (kat === 'lainnya' && /^(catatan|keterangan|informasi|info)$/i.test(judul)) judul = '';
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

    if (grup.lainnya.length) {
      var kartuLain = buat('div', 'info-card');
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
      kartuLain.appendChild(ulLain);
      tambahBlok(container, 'Informasi Lainnya', kartuLain);
    }

    if (!container.children.length) {
      container.appendChild(buat('p', 'load-message', 'Informasi pendaftaran belum tersedia.'));
    }
  }

  function linkWA(phone, pesan) {
    var url = 'https://wa.me/' + normalizePhone(phone);
    if (pesan) url += '?text=' + encodeURIComponent(pesan);
    return url;
  }

  // Foto yang bisa diperbesar dengan lightbox galeri: Tentang Kami, Guru & Staff, Berita Acara
  function initZoomFoto() {
    var selektor = '#profil-foto, #guru-grid img, #kegiatan-grid img';
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || t.tagName !== 'IMG' || !t.matches(selektor)) return;
      var src = t.currentSrc || t.src;
      if (!src || /placeholder\.svg/.test(src)) return;
      openLightbox(src, t.alt);
    });
  }

  // Data terstruktur untuk mesin pencari (diisi dari data yang diatur admin)
  function isiDataTerstruktur(map, digits) {
    var data = { '@context': 'https://schema.org', '@type': 'Preschool', name: 'KB Bhineka Tunggal Ika' };
    if (map.tentang_teks) data.description = map.tentang_teks;
    if (map.alamat) data.address = { '@type': 'PostalAddress', streetAddress: map.alamat, addressCountry: 'ID' };
    if (digits) data.telephone = '+' + digits;
    if (map.foto_hero_url) data.image = map.foto_hero_url;
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  function loadPengaturan(config) {
    supaFetch(config, 'pengaturan', 'select=key,value')
      .then(function (rows) {
        if (!Array.isArray(rows) || rows.length === 0) return;
        var map = {};
        rows.forEach(function (r) { map[r.key] = r.value; });

        setText('tagline', map.tagline);
        setAttr('profil-foto', 'src', map.foto_profil_url);
        if (map.foto_profil_url) bisaDiperbesar(document.getElementById('profil-foto'));
        setText('profil-teks', map.tentang_teks);
        setAttr('hero-photo', 'src', map.foto_hero_url);
        setText('alamat-text', map.alamat);
        setText('jam-text', map.jam_operasional);
        if (map.maps_koordinat) {
          var frame = document.getElementById('maps-frame');
          if (frame) {
            frame.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(map.maps_koordinat) + '&z=15&ie=UTF8&iwloc=&output=embed';
          }
        }

        renderInfoPendaftaran(map.info_pendaftaran);

        var digits = '';
        if (map.no_telp) {
          digits = normalizePhone(map.no_telp);
          if (digits) {
            var phoneLink = document.getElementById('phone-link');
            if (phoneLink) {
              phoneLink.setAttribute('href', 'tel:+' + digits);
              phoneLink.textContent = '\uD83D\uDCDE ' + formatPhoneDisplay(digits);
            }
            var waUrl = linkWA(map.no_telp, map.wa_pesan);
            var waCta = document.getElementById('wa-cta');
            if (waCta) {
              waCta.setAttribute('href', waUrl);
              waCta.hidden = false;
            }
            var waFloat = document.getElementById('wa-float');
            if (waFloat) {
              waFloat.setAttribute('href', waUrl);
              waFloat.hidden = false;
            }
          }
        } else {
          var phoneLinkEl = document.getElementById('phone-link');
          if (phoneLinkEl) {
            phoneLinkEl.textContent = '📞 Nomor belum diatur admin';
            phoneLinkEl.removeAttribute('href');
          }
        }

        isiDataTerstruktur(map, digits);
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