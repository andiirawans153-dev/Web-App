// ================= URL APPS SCRIPT =================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyeu7XmRo5te_oMCrfH1ZcqvwsnuuOkQdn6SfxSLYnjfzrXCa0qh3iS2_kBF-8WgCoH/exec";
// ===================================================

// State Management
let srutList = [], skrbList = [], archiveSrutList = [], archiveSkrbList = [];
let editSrutId = null, editSkrbId = null;
let trendChartInstance = null, prosesChartInstance = null, selesaiChartInstance = null;

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    
    if (type === 'success') {
        icon.setAttribute('data-lucide', 'check-circle');
        icon.classList.remove('text-teal-400');
        icon.classList.add('text-emerald-400');
    } else if (type === 'error') {
        icon.setAttribute('data-lucide', 'alert-circle');
        icon.classList.remove('text-teal-400');
        icon.classList.add('text-red-400');
    } else {
        icon.setAttribute('data-lucide', 'info');
        icon.classList.remove('text-emerald-400', 'text-red-400');
        icon.classList.add('text-teal-400');
    }
    
    lucide.createIcons();
    
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// Loading Toggle
function toggleLoading(show) {
    const screen = document.getElementById('loading-screen');
    if (show) {
        screen.classList.remove('hidden');
        setTimeout(() => screen.classList.remove('opacity-0'), 10);
    } else {
        screen.classList.add('opacity-0');
        setTimeout(() => screen.classList.add('hidden'), 300);
    }
}

// Data Loading
async function loadData() {
    if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_URL")) {
        showToast("Mohon masukkan URL Web App Google Script Anda!", "error");
        return;
    }
    
    toggleLoading(true);
    try {
        const res = await fetch(`${SCRIPT_URL}?action=read`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        
        srutList = data.srut || [];
        skrbList = data.skrb || [];
        archiveSrutList = data.archive_srut || [];
        archiveSkrbList = data.archive_skrb || [];
        
        renderSrutTable();
        renderSkrbTable();
        renderArchiveSrutTable();
        renderArchiveSkrbTable();
        
        document.getElementById('count-srut').innerText = srutList.length;
        document.getElementById('count-skrb').innerText = skrbList.length;
        document.getElementById('count-arch-srut').innerText = archiveSrutList.length;
        document.getElementById('count-arch-skrb').innerText = archiveSkrbList.length;
        
        generateCharts();
        showToast("Data berhasil dimuat", "success");
    } catch (err) {
        console.error(err);
        showToast("Gagal mengambil data. Pastikan deploy Apps Script 'Anyone'.", "error");
    } finally {
        toggleLoading(false);
    }
}

// Tab Switching
function switchTab(tabId) {
    // Hide all content
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Show active content
    const activeContent = document.getElementById(`content-${tabId}`);
    if (activeContent) activeContent.classList.remove('hidden');
    
    // Reset all tabs
    const tabClasses = "py-3 px-2 sm:px-1 cursor-pointer text-slate-400 hover:text-slate-700 transition-all border-b-2 border-transparent whitespace-nowrap flex items-center gap-2";
    const activeTabClasses = "py-3 px-2 sm:px-1 cursor-pointer border-b-2 border-slate-900 text-slate-900 font-black transition-all whitespace-nowrap flex items-center gap-2";
    const activeArchiveClasses = "py-3 px-2 sm:px-1 cursor-pointer border-b-2 border-teal-500 text-teal-600 font-black transition-all whitespace-nowrap flex items-center gap-2";
    
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.className = tabClasses;
    });
    
    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) {
        if (tabId === 'archive') {
            activeTab.className = activeArchiveClasses;
        } else {
            activeTab.className = activeTabClasses;
        }
    }
    
    // Re-render icons for active tab
    if (window.lucide) lucide.createIcons();
}

// Chart Generation
function generateCharts() {
    const canvasTrend = document.getElementById('trendChart');
    const canvasProses = document.getElementById('prosesChart');
    const canvasSelesai = document.getElementById('selesaiChart');
    
    if (!canvasTrend || !canvasProses || !canvasSelesai) return;
    
    const ctxTrend = canvasTrend.getContext('2d');
    const ctxProses = canvasProses.getContext('2d');
    const ctxSelesai = canvasSelesai.getContext('2d');
    
    if (trendChartInstance) trendChartInstance.destroy();
    if (prosesChartInstance) prosesChartInstance.destroy();
    if (selesaiChartInstance) selesaiChartInstance.destroy();
    
    const baseMonths = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    let labels = [], srutCounts = [0,0,0,0,0,0], skrbCounts = [0,0,0,0,0,0], today = new Date();
    
    for (let i = 5; i >= 0; i--) {
        let m = new Date(today.getFullYear(), today.getMonth() - i, 1);
        labels.push(baseMonths[m.getMonth()] + " " + m.getFullYear().toString().slice(-2));
    }
    
    const fillCounts = (list, counts) => {
        list.forEach(item => {
            let d = new Date(item.tanggal);
            if (!isNaN(d.getTime())) {
                for (let i = 5; i >= 0; i--) {
                    let m = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    if (d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear()) counts[5 - i]++;
                }
            }
        });
    };
    
    fillCounts(srutList.concat(archiveSrutList), srutCounts);
    fillCounts(skrbList.concat(archiveSkrbList), skrbCounts);
    
    // Line Chart
    trendChartInstance = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { 
                    label: 'SRUT', 
                    data: srutCounts, 
                    borderColor: '#0d9488', 
                    backgroundColor: 'rgba(13, 148, 136, 0.08)', 
                    fill: true, 
                    tension: 0.3, 
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                { 
                    label: 'SKRB', 
                    data: skrbCounts, 
                    borderColor: '#475569', 
                    backgroundColor: 'rgba(71, 85, 105, 0.08)', 
                    fill: true, 
                    tension: 0.3, 
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'ui-monospace', size: 10 }, boxWidth: 10 } }
            },
            scales: { 
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'ui-monospace', size: 10 } }, grid: { color: '#f1f5f9' } },
                x: { ticks: { font: { family: 'ui-monospace', size: 10 } }, grid: { display: false } }
            }
        }
    });
    
    // Proses Doughnut
    prosesChartInstance = new Chart(ctxProses, {
        type: 'doughnut',
        data: { 
            labels: ['SRUT', 'SKRB'], 
            datasets: [{ 
                data: [srutList.length, skrbList.length], 
                backgroundColor: ['#f59e0b', '#64748b'], 
                borderWidth: 0,
                hoverOffset: 4
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            cutout: '65%',
            plugins: { 
                legend: { position: 'bottom', labels: { font: { family: 'ui-monospace', size: 10 }, boxWidth: 10, padding: 15 } } 
            } 
        }
    });
    
    // Selesai Doughnut
    selesaiChartInstance = new Chart(ctxSelesai, {
        type: 'doughnut',
        data: { 
            labels: ['SRUT', 'SKRB'], 
            datasets: [{ 
                data: [archiveSrutList.length, archiveSkrbList.length], 
                backgroundColor: ['#0d9488', '#047857'], 
                borderWidth: 0,
                hoverOffset: 4
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: { 
                legend: { position: 'bottom', labels: { font: { family: 'ui-monospace', size: 10 }, boxWidth: 10, padding: 15 } } 
            } 
        }
    });
}

// ================= SRUT MANAGEMENT =================
async function saveSrut(e) {
    e.preventDefault();
    const isEdit = editSrutId !== null;
    const payload = {
        action: isEdit ? 'update_srut' : 'insert_srut', 
        id: isEdit ? editSrutId.toString() : Date.now().toString(),
        no: document.getElementById('srut-no').value, 
        tanggal: document.getElementById('srut-tanggal').value,
        rangka: document.getElementById('srut-rangka').value, 
        mesin: document.getElementById('srut-mesin').value,
        merk: document.getElementById('srut-merk').value, 
        pemilik: document.getElementById('srut-pemilik').value
    };
    
    toggleLoading(true);
    try { 
        await fetch(SCRIPT_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload) 
        }); 
        if (isEdit) cancelEditSrut(); 
        else document.getElementById('form-srut').reset(); 
        await loadData();
        showToast(isEdit ? "Data SRUT berhasil diperbarui" : "Data SRUT berhasil ditambahkan", "success");
    } catch (error) { 
        showToast("Gagal memproses data SRUT!", "error"); 
    } finally { 
        toggleLoading(false); 
    }
}

function editSrut(id) {
    const item = srutList.find(i => i.id == id); 
    if (!item) return;
    editSrutId = id;
    document.getElementById('form-title-srut').innerHTML = `<i data-lucide="edit" class="w-4 h-4"></i> Edit Berkas SRUT`;
    document.getElementById('srut-no').value = item.no;
    document.getElementById('srut-tanggal').value = item.tanggal ? new Date(item.tanggal).toISOString().split('T')[0] : '';
    document.getElementById('srut-rangka').value = item.rangka;
    document.getElementById('srut-mesin').value = item.mesin;
    document.getElementById('srut-merk').value = item.merk;
    document.getElementById('srut-pemilik').value = item.pemilik;
    document.getElementById('btn-submit-srut').innerHTML = `<i data-lucide="refresh-cw" class="w-4 h-4 inline mr-1"></i> Update`;
    document.getElementById('btn-cancel-srut').classList.remove('hidden');
    lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEditSrut() {
    editSrutId = null; 
    document.getElementById('form-title-srut').innerHTML = `<i data-lucide="file-plus" class="w-4 h-4"></i> Form Entri SRUT`; 
    document.getElementById('form-srut').reset();
    document.getElementById('btn-submit-srut').innerHTML = `<i data-lucide="save" class="w-4 h-4 inline mr-1"></i> Submit`; 
    document.getElementById('btn-cancel-srut').classList.add('hidden');
    lucide.createIcons();
}

async function completeSrut(id) {
    if (confirm('Nyatakan pengerjaan data SRUT ini SELESAI dan pindahkan ke arsip?')) {
        toggleLoading(true);
        try { 
            await fetch(SCRIPT_URL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'complete_srut', id: id.toString() }) 
            }); 
            await loadData();
            showToast("Data SRUT berhasil diarsipkan", "success");
        } catch (error) { 
            showToast("Gagal mengarsipkan data!", "error"); 
        } finally { 
            toggleLoading(false); 
        }
    }
}

async function deleteSrut(id) {
    if (confirm('Data SRUT ini akan dihapus permanently. Lanjutkan?')) { 
        toggleLoading(true); 
        try { 
            await fetch(SCRIPT_URL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'delete_srut', id: id.toString() }) 
            }); 
            await loadData();
            showToast("Data SRUT berhasil dihapus", "success");
        } catch (error) { 
            showToast("Gagal menghapus data!", "error"); 
        } finally { 
            toggleLoading(false); 
        } 
    }
}

function renderSrutTable() {
    const tbody = document.getElementById('table-srut-body');
    const mobileList = document.getElementById('mobile-srut-list');
    
    if (srutList.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400 italic font-mono text-xs">Belum ada data.</td></tr>`; 
        mobileList.innerHTML = `<div class="text-center text-slate-400 italic font-mono text-xs py-4">Belum ada data.</div>`;
        return; 
    }
    
    // Desktop Table
    tbody.innerHTML = srutList.map(item => `
        <tr class="hover:bg-slate-50 text-xs border-b border-slate-100 transition-colors">
            <td class="p-3 font-bold font-mono text-slate-900">${item.no}</td>
            <td class="p-3 text-slate-500">${formatDate(item.tanggal)}</td>
            <td class="p-3 font-mono text-[11px]">
                <span class="text-slate-700">R: ${item.rangka}</span><br>
                <span class="text-slate-400">M: ${item.mesin}</span>
            </td>
            <td class="p-3">
                <span class="text-slate-900 font-bold">${item.merk}</span><br>
                <span class="text-[11px] text-slate-400 uppercase font-mono">${item.pemilik}</span>
            </td>
            <td class="p-3 text-center">
                <div class="flex justify-center gap-1 flex-wrap">
                    <button onclick="completeSrut('${item.id}')" class="action-btn btn-complete">
                        <i data-lucide="check" class="w-3 h-3"></i> Selesai
                    </button>
                    <button onclick="editSrut('${item.id}')" class="action-btn btn-edit">
                        <i data-lucide="pencil" class="w-3 h-3"></i> Edit
                    </button>
                    <button onclick="deleteSrut('${item.id}')" class="action-btn btn-delete">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                    </button>
                </div>
            </td>
        </tr>`).join('');
    
    // Mobile Cards
    mobileList.innerHTML = srutList.map(item => `
        <div class="mobile-card">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="mobile-card-label">No Pendaftaran</div>
                    <div class="font-bold font-mono text-slate-900">${item.no}</div>
                </div>
                <span class="text-[10px] text-slate-400">${formatDate(item.tanggal)}</span>
            </div>
            <div class="mb-2">
                <div class="mobile-card-label">Chassis / Engine</div>
                <div class="font-mono text-[11px] text-slate-700">R: ${item.rangka}</div>
                <div class="font-mono text-[11px] text-slate-400">M: ${item.mesin}</div>
            </div>
            <div class="mb-3">
                <div class="mobile-card-label">Spesifikasi</div>
                <div class="font-bold text-slate-900">${item.merk}</div>
                <div class="text-[11px] text-slate-400 uppercase font-mono">${item.pemilik}</div>
            </div>
            <div class="flex gap-2">
                <button onclick="completeSrut('${item.id}')" class="action-btn btn-complete flex-1 justify-center">
                    <i data-lucide="check" class="w-3 h-3"></i> Selesai
                </button>
                <button onclick="editSrut('${item.id}')" class="action-btn btn-edit">
                    <i data-lucide="pencil" class="w-3 h-3"></i>
                </button>
                <button onclick="deleteSrut('${item.id}')" class="action-btn btn-delete">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// ================= SKRB MANAGEMENT =================
async function saveSkrb(e) {
    e.preventDefault(); 
    const isEdit = editSkrbId !== null;
    const payload = {
        action: isEdit ? 'update_skrb' : 'insert_skrb', 
        id: isEdit ? editSkrbId.toString() : Date.now().toString(),
        no: document.getElementById('skrb-no').value, 
        tanggal: document.getElementById('skrb-tanggal').value,
        jenis: document.getElementById('skrb-jenis').value, 
        perusahaan: document.getElementById('skrb-perusahaan').value, 
        landasan: document.getElementById('skrb-landasan').value
    };
    
    toggleLoading(true);
    try { 
        await fetch(SCRIPT_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload) 
        }); 
        if (isEdit) cancelEditSkrb(); 
        else document.getElementById('form-skrb').reset(); 
        await loadData();
        showToast(isEdit ? "Data SKRB berhasil diperbarui" : "Data SKRB berhasil ditambahkan", "success");
    } catch (error) { 
        showToast("Gagal memproses data SKRB!", "error"); 
    } finally { 
        toggleLoading(false); 
    }
}

function editSkrb(id) {
    const item = skrbList.find(i => i.id == id); 
    if (!item) return;
    editSkrbId = id;
    document.getElementById('form-title-skrb').innerHTML = `<i data-lucide="edit" class="w-4 h-4"></i> Edit Berkas SKRB`;
    document.getElementById('skrb-no').value = item.no;
    document.getElementById('skrb-tanggal').value = item.tanggal ? new Date(item.tanggal).toISOString().split('T')[0] : '';
    document.getElementById('skrb-jenis').value = item.jenis;
    document.getElementById('skrb-perusahaan').value = item.perusahaan;
    document.getElementById('skrb-landasan').value = item.landasan;
    document.getElementById('btn-submit-skrb').innerHTML = `<i data-lucide="refresh-cw" class="w-4 h-4 inline mr-1"></i> Update`;
    document.getElementById('btn-cancel-skrb').classList.remove('hidden');
    lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEditSkrb() {
    editSkrbId = null; 
    document.getElementById('form-title-skrb').innerHTML = `<i data-lucide="file-plus" class="w-4 h-4"></i> Form Entri SKRB`; 
    document.getElementById('form-skrb').reset();
    document.getElementById('btn-submit-skrb').innerHTML = `<i data-lucide="save" class="w-4 h-4 inline mr-1"></i> Submit`; 
    document.getElementById('btn-cancel-skrb').classList.add('hidden');
    lucide.createIcons();
}

async function completeSkrb(id) {
    if (confirm('Nyatakan pengerjaan data SKRB ini SELESAI dan pindahkan ke arsip?')) {
        toggleLoading(true);
        try { 
            await fetch(SCRIPT_URL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'complete_skrb', id: id.toString() }) 
            }); 
            await loadData();
            showToast("Data SKRB berhasil diarsipkan", "success");
        } catch (error) { 
            showToast("Gagal mengarsipkan data!", "error"); 
        } finally { 
            toggleLoading(false); 
        }
    }
}

async function deleteSkrb(id) {
    if (confirm('Data SKRB ini akan dihapus permanently. Lanjutkan?')) { 
        toggleLoading(true); 
        try { 
            await fetch(SCRIPT_URL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'delete_skrb', id: id.toString() }) 
            }); 
            await loadData();
            showToast("Data SKRB berhasil dihapus", "success");
        } catch (error) { 
            showToast("Gagal menghapus data!", "error"); 
        } finally { 
            toggleLoading(false); 
        } 
    }
}

function renderSkrbTable() {
    const tbody = document.getElementById('table-skrb-body');
    const mobileList = document.getElementById('mobile-skrb-list');
    
    if (skrbList.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400 italic font-mono text-xs">Belum ada data.</td></tr>`; 
        mobileList.innerHTML = `<div class="text-center text-slate-400 italic font-mono text-xs py-4">Belum ada data.</div>`;
        return; 
    }
    
    tbody.innerHTML = skrbList.map(item => `
        <tr class="hover:bg-slate-50 text-xs border-b border-slate-100 transition-colors">
            <td class="p-3 font-bold font-mono text-slate-900">${item.no}</td>
            <td class="p-3 text-slate-500">${formatDate(item.tanggal)}</td>
            <td class="p-3">
                <strong class="text-slate-900">${item.jenis}</strong><br>
                <span class="text-slate-400">${item.perusahaan}</span>
            </td>
            <td class="p-3 font-mono text-[11px] text-slate-700">${item.landasan}</td>
            <td class="p-3 text-center">
                <div class="flex justify-center gap-1 flex-wrap">
                    <button onclick="completeSkrb('${item.id}')" class="action-btn btn-complete">
                        <i data-lucide="check" class="w-3 h-3"></i> Selesai
                    </button>
                    <button onclick="editSkrb('${item.id}')" class="action-btn btn-edit">
                        <i data-lucide="pencil" class="w-3 h-3"></i> Edit
                    </button>
                    <button onclick="deleteSkrb('${item.id}')" class="action-btn btn-delete">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                    </button>
                </div>
            </td>
        </tr>`).join('');
    
    mobileList.innerHTML = skrbList.map(item => `
        <div class="mobile-card">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="mobile-card-label">No Pendaftaran</div>
                    <div class="font-bold font-mono text-slate-900">${item.no}</div>
                </div>
                <span class="text-[10px] text-slate-400">${formatDate(item.tanggal)}</span>
            </div>
            <div class="mb-2">
                <div class="mobile-card-label">Jenis / Perusahaan</div>
                <div class="font-bold text-slate-900">${item.jenis}</div>
                <div class="text-[11px] text-slate-400">${item.perusahaan}</div>
            </div>
            <div class="mb-3">
                <div class="mobile-card-label">Landasan</div>
                <div class="font-mono text-[11px] text-slate-700">${item.landasan}</div>
            </div>
            <div class="flex gap-2">
                <button onclick="completeSkrb('${item.id}')" class="action-btn btn-complete flex-1 justify-center">
                    <i data-lucide="check" class="w-3 h-3"></i> Selesai
                </button>
                <button onclick="editSkrb('${item.id}')" class="action-btn btn-edit">
                    <i data-lucide="pencil" class="w-3 h-3"></i>
                </button>
                <button onclick="deleteSkrb('${item.id}')" class="action-btn btn-delete">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// ================= ARCHIVE MANAGEMENT =================
function renderArchiveSrutTable() {
    const tbody = document.getElementById('table-arch-srut-body');
    const mobileList = document.getElementById('mobile-arch-srut-list');
    
    if (archiveSrutList.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400 italic font-mono text-xs">Arsip kosong.</td></tr>`; 
        mobileList.innerHTML = `<div class="text-center text-slate-400 italic font-mono text-xs py-4">Arsip kosong.</div>`;
        return; 
    }
    
    tbody.innerHTML = archiveSrutList.map(item => `
        <tr class="hover:bg-slate-50 text-xs border-b border-slate-100 transition-colors bg-slate-50/30">
            <td class="p-3 font-mono text-slate-600">${item.no}</td>
            <td class="p-3 text-slate-500">${formatDate(item.tanggal)}</td>
            <td class="p-3 font-mono text-[11px] text-slate-600">
                <span>R: ${item.rangka}</span><br>
                <span class="text-slate-400">M: ${item.mesin}</span>
            </td>
            <td class="p-3">
                <span class="font-medium text-slate-700">${item.merk}</span><br>
                <span class="text-[11px] uppercase font-mono text-slate-400">${item.pemilik}</span>
            </td>
            <td class="p-3 text-center">
                <span class="badge-success">
                    <i data-lucide="check-circle" class="w-3 h-3"></i> Selesai
                </span>
            </td>
        </tr>`).join('');
    
    mobileList.innerHTML = archiveSrutList.map(item => `
        <div class="mobile-card bg-slate-50/50">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="mobile-card-label">No Pendaftaran</div>
                    <div class="font-mono text-slate-700 font-bold">${item.no}</div>
                </div>
                <span class="badge-success">
                    <i data-lucide="check-circle" class="w-3 h-3"></i> Selesai
                </span>
            </div>
            <div class="mb-2">
                <div class="mobile-card-label">Tanggal</div>
                <div class="text-slate-500">${formatDate(item.tanggal)}</div>
            </div>
            <div class="mb-2">
                <div class="mobile-card-label">Chassis / Engine</div>
                <div class="font-mono text-[11px] text-slate-600">R: ${item.rangka}</div>
                <div class="font-mono text-[11px] text-slate-400">M: ${item.mesin}</div>
            </div>
            <div>
                <div class="mobile-card-label">Spesifikasi</div>
                <div class="font-medium text-slate-700">${item.merk}</div>
                <div class="text-[11px] uppercase font-mono text-slate-400">${item.pemilik}</div>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

function renderArchiveSkrbTable() {
    const tbody = document.getElementById('table-arch-skrb-body');
    const mobileList = document.getElementById('mobile-arch-skrb-list');
    
    if (archiveSkrbList.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400 italic font-mono text-xs">Arsip kosong.</td></tr>`; 
        mobileList.innerHTML = `<div class="text-center text-slate-400 italic font-mono text-xs py-4">Arsip kosong.</div>`;
        return; 
    }
    
    tbody.innerHTML = archiveSkrbList.map(item => `
        <tr class="hover:bg-slate-50 text-xs border-b border-slate-100 transition-colors bg-slate-50/30">
            <td class="p-3 font-mono text-slate-600">${item.no}</td>
            <td class="p-3 text-slate-500">${formatDate(item.tanggal)}</td>
            <td class="p-3">
                <strong class="text-slate-700">${item.jenis}</strong><br>
                <span class="text-slate-400">${item.perusahaan}</span>
            </td>
            <td class="p-3 font-mono text-[11px] text-slate-600">${item.landasan}</td>
            <td class="p-3 text-center">
                <span class="badge-success">
                    <i data-lucide="check-circle" class="w-3 h-3"></i> Selesai
                </span>
            </td>
        </tr>`).join('');
    
    mobileList.innerHTML = archiveSkrbList.map(item => `
        <div class="mobile-card bg-slate-50/50">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="mobile-card-label">No Pendaftaran</div>
                    <div class="font-mono text-slate-700 font-bold">${item.no}</div>
                </div>
                <span class="badge-success">
                    <i data-lucide="check-circle" class="w-3 h-3"></i> Selesai
                </span>
            </div>
            <div class="mb-2">
                <div class="mobile-card-label">Tanggal</div>
                <div class="text-slate-500">${formatDate(item.tanggal)}</div>
            </div>
            <div class="mb-2">
                <div class="mobile-card-label">Jenis / Perusahaan</div>
                <div class="font-medium text-slate-700">${item.jenis}</div>
                <div class="text-slate-400">${item.perusahaan}</div>
            </div>
            <div>
                <div class="mobile-card-label">Landasan</div>
                <div class="font-mono text-[11px] text-slate-600">${item.landasan}</div>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// ================= UTILITIES =================
function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    switchTab('dashboard');
    
    // Global error handler
    window.onerror = function(message, source, lineno, colno, error) {
        console.error("Global Error:", message, "at", source, ":", lineno);
        showToast("Terjadi kesalahan sistem: " + message, "error");
        return false;
    };
});