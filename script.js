// Menunggu hingga seluruh halaman HTML dimuat
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELEKSI ELEMEN PENTING ---
    const tombolTambah = document.querySelectorAll('.tambah-keranjang');
    const daftarKeranjangUI = document.getElementById('daftar-keranjang');
    const formCheckout = document.getElementById('pembayaran-form');
    const tombolBayar = document.getElementById('checkout-button');
    const peringatanKeranjang = document.getElementById('peringatan-keranjang');

    // Elemen Total
    const totalBelanjaUI = document.getElementById('total-belanja');
    const ongkirUI = document.getElementById('ongkir');
    const grandTotalUI = document.getElementById('grand-total');

    // Pilihan Metode Bayar (untuk cek biaya COD)
    const metodeBayarRadios = document.querySelectorAll('input[name="metode_bayar"]');

    // Nomor WhatsApp Tujuan (Ganti 0 di depan dengan 62)
    const WHATSAPP_NUMBER = '6285692128064';
    
    // Variabel untuk menyimpan data keranjang
    let keranjang = [];
    const BASE_ONGKIR = 10000; // Ongkir dasar
    const BIAYA_COD = 5000;     // Biaya tambahan jika COD

    // --- 2. FUNGSI UTAMA ---

    /**
     * Fungsi untuk menambahkan produk ke keranjang
     */
    function tambahKeKeranjang(event) {
        const tombol = event.target;
        const idProduk = tombol.dataset.id;
        const namaProduk = tombol.dataset.nama;
        const hargaProduk = parseInt(tombol.dataset.harga);

        // Cek apakah produk sudah ada di keranjang
        const itemDiKeranjang = keranjang.find(item => item.id === idProduk);

        if (itemDiKeranjang) {
            // Jika sudah ada, tambah jumlahnya
            itemDiKeranjang.kuantitas++;
        } else {
            // Jika belum ada, tambahkan ke array keranjang
            keranjang.push({
                id: idProduk,
                nama: namaProduk,
                harga: hargaProduk,
                kuantitas: 1
            });
        }
        
        // Perbarui tampilan keranjang
        renderKeranjang();
    }

    /**
     * Fungsi untuk me-render ulang tampilan daftar keranjang
     */
    function renderKeranjang() {
        // Kosongkan daftar keranjang di HTML
        daftarKeranjangUI.innerHTML = '';

        if (keranjang.length === 0) {
            // Tampilkan pesan keranjang kosong
            daftarKeranjangUI.innerHTML = '<li>Keranjang belanja Anda masih kosong.</li>';
            tombolBayar.disabled = true;
            peringatanKeranjang.style.display = 'block';
        } else {
            // Sembunyikan pesan keranjang kosong
            tombolBayar.disabled = false;
            peringaringatanKeranjang.style.display = 'none';

            // Loop setiap item di keranjang dan buat elemen list
            keranjang.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'item-keranjang'; // Tambahkan class untuk styling (opsional)
                li.innerHTML = `
                    <span>${item.nama}</span>
                    <div class="kontrol-item">
                        <input type="number" class="qty-input" value="${item.kuantitas}" min="1" data-index="${index}">
                        <button class="hapus-btn" data-index="${index}">Hapus</button>
                    </div>
                `;
                daftarKeranjangUI.appendChild(li);
            });

            // Tambahkan event listener untuk tombol hapus dan input kuantitas
            document.querySelectorAll('.hapus-btn').forEach(btn => {
                btn.addEventListener('click', hapusItemDariKeranjang);
            });
            document.querySelectorAll('.qty-input').forEach(input => {
                input.addEventListener('change', ubahKuantitas);
            });
        }

        // Hitung ulang total harga
        updateTotalHarga();
    }

    /**
     * Fungsi untuk menghapus item dari keranjang
     */
    function hapusItemDariKeranjang(event) {
        const index = event.target.dataset.index;
        keranjang.splice(index, 1); // Hapus item dari array
        renderKeranjang(); // Render ulang
    }

    /**
     * Fungsi untuk mengubah kuantitas item
     */
    function ubahKuantitas(event) {
        const index = event.target.dataset.index;
        const kuantitasBaru = parseInt(event.target.value);

        if (kuantitasBaru <= 0) {
            // Jika kuantitas 0 atau kurang, hapus item
            keranjang.splice(index, 1);
        } else {
            // Update kuantitas item
            keranjang[index].kuantitas = kuantitasBaru;
        }
        renderKeranjang(); // Render ulang
    }

    /**
     * Fungsi untuk menghitung dan memperbarui total harga
     */
    function updateTotalHarga() {
        // Hitung total belanja (subtotal)
        const subtotal = keranjang.reduce((total, item) => total + (item.harga * item.kuantitas), 0);

        // Cek apakah COD dipilih
        const metodeBayarTerpilih = document.querySelector('input[name="metode_bayar"]:checked');
        let biayaTambahan = 0;
        if (metodeBayarTerpilih && metodeBayarTerpilih.value === 'cod') {
            biayaTambahan = BIAYA_COD;
        }

        const totalOngkir = BASE_ONGKIR + biayaTambahan;
        const grandTotal = subtotal + totalOngkir;

        // Update tampilan di HTML
        totalBelanjaUI.textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
        ongkirUI.textContent = `Rp ${totalOngkir.toLocaleString('id-ID')}`;
        grandTotalUI.textContent = `Rp ${grandTotal.toLocaleString('id-ID')}`;
    }

    /**
     * Fungsi untuk mengirim data form ke WhatsApp
     */
    function kirimKeWhatsApp(event) {
        event.preventDefault(); // Mencegah form submit default

        // Ambil semua data dari form
        const nama = document.getElementById('nama').value;
        const alamat = document.getElementById('alamat').value;
        const telepon = document.getElementById('telepon').value;
        
        // Ambil data yang dicentang (checked)
        const kemasan = document.querySelector('input[name="packaging"]:checked').value;
        const metodeBayar = document.querySelector('input[name="metode_bayar"]:checked').value;

        // Ambil data total
        const totalBelanja = totalBelanjaUI.textContent;
        const ongkir = ongkirUI.textContent;
        const grandTotal = grandTotalUI.textContent;

        // Format pesan WhatsApp
        let pesan = `Halo *Toko Buah Segar* 🛒, saya mau pesan:\n\n`;
        pesan += `*--- DETAIL PESANAN ---*\n`;
        
        keranjang.forEach(item => {
            pesan += `• ${item.nama} (x${item.kuantitas}) - Rp ${(item.harga * item.kuantitas).toLocaleString('id-ID')}\n`;
        });

        pesan += `\n*--- RINCIAN BIAYA ---*\n`;
        pesan += `Total Belanja: ${totalBelanja}\n`;
        pesan += `Ongkos Kirim: ${ongkir}\n`;
        pesan += `*Total Bayar: ${grandTotal}*\n\n`;

        pesan += `*--- INFO PENGIRIMAN ---*\n`;
        pesan += `Nama: ${nama}\n`;
        pesan += `Alamat: ${alamat}\n`;
        pesan += `Telepon: ${telepon}\n\n`;

        pesan += `*--- OPSI ---*\n`;
        pesan += `Kemasan: ${kemasan}\n`;
        pesan += `Metode Bayar: ${metodeBayar}\n\n`;
        
        pesan += `Mohon segera diproses. Terima kasih! 🙏`;

        // Encode pesan untuk URL
        const pesanEncoded = encodeURIComponent(pesan);

        // Buat URL WhatsApp
        const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMBER}?text=${pesanEncoded}`;

        // Buka WhatsApp di tab baru
        window.open(urlWhatsApp, '_blank');
    }

    // --- 3. PASANG EVENT LISTENER ---

    // 1. Tombol "Tambah ke Keranjang"
    tombolTambah.forEach(tombol => {
        tombol.addEventListener('click', tambahKeKeranjang);
    });

    // 2. Tombol "Bayar Sekarang" (Form Submit)
    formCheckout.addEventListener('submit', kirimKeWhatsApp);

    // 3. Pilihan Metode Pembayaran (untuk cek ongkir COD)
    metodeBayarRadios.forEach(radio => {
        radio.addEventListener('change', updateTotalHarga);
    });

    // 4. Render keranjang saat pertama kali load (untuk menampilkan pesan "kosong")
    renderKeranjang();

});
