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

        if (map.info_pendaftaran) {
          try {
            var infoItems = JSON.parse(map.info_pendaftaran);
            var infoGrid = document.getElementById('info-grid');
            if (infoGrid && Array.isArray(infoItems)) {
              infoGrid.innerHTML = '';
              infoItems.forEach(function (item) {
                var div = document.createElement('div');
                div.className = 'info-item';
                var label = document.createElement('span');
                label.className = 'info-label';
                label.textContent = item.judul;
                var value = document.createElement('span');
                value.className = 'info-value';
                value.textContent = item.isi;
                div.appendChild(label);
                div.appendChild(value);
                infoGrid.appendChild(div);
              });
            }
          } catch (e) {}
        }

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