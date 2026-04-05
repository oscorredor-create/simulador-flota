// --- Variables y Referencias del DOM ---
const sliderHours = document.getElementById('annualHours');
const valHours = document.getElementById('valHours');
const sliderFuel = document.getElementById('fuelConsumption');
const valFuel = document.getElementById('valFuel');
const sliderFuelPrice = document.getElementById('fuelPrice');
const valFuelPrice = document.getElementById('valFuelPrice');

// Inputs de Escenarios
const capexNewIn = document.getElementById('capexNew');
const opexNewIn = document.getElementById('opexNew');
const resaleNewIn = document.getElementById('resaleNew');
const capexRepIn = document.getElementById('capexRep');
const opexRepIn = document.getElementById('opexRep');
const monthlyRentIn = document.getElementById('monthlyRent');
const downtimeRentIn = document.getElementById('downtimeRent');
const rentWaitRepIn = document.getElementById('rentWaitRep');
const modelSelect = document.getElementById('newModelSelect');
const capexOptSelect = document.getElementById('capexOptSelect');
const rentModelSelect = document.getElementById('rentModelSelect');
const repModelSelect = document.getElementById('repModelSelect');

const repowerModels = [
    { id: 'cpt_hyd', name: 'CPT+HYD', capex: 158300, mantBase: 17.25, rentWait: 29063 },
    { id: 'rcd', name: 'RCD', capex: 187300, mantBase: 14.50, rentWait: 29063 }
];

const marketModels = [
    { id: 'cat_966_ng', name: 'CAT 966 Next Gen', capex1: 380000, capex2: 420000, resale: 180000, mantBase: 8.0, rent: 14922, downtime: 40875, fuel: 4.85 },
    { id: 'cat_966gc', name: 'CAT 966GC', capex1: 290000, capex2: 330000, resale: 130000, mantBase: 8.5, rent: 13335, downtime: 57150, fuel: 5.4 },
    { id: 'liebherr_l556', name: 'Liebherr L556', capex1: 320000, capex2: 360000, resale: 120000, mantBase: 8.0, rent: 13970, downtime: 48343, fuel: 3.85 },
    { id: 'johndeere_724p', name: 'John Deere 724P', capex1: 280000, capex2: 320000, resale: 100000, mantBase: 8.5, rent: 12382, downtime: 80962, fuel: 4.9 },
    { id: 'volvo_l120h', name: 'Volvo L120H', capex1: 275000, capex2: 315000, resale: 115000, mantBase: 8.5, rent: 13017, downtime: 73025, fuel: 4.5 },
    { id: 'komatsu_wa430', name: 'Komatsu WA430-6', capex1: 265000, capex2: 310000, resale: 105000, mantBase: 8.5, rent: 12700, downtime: 63575, fuel: 5.15 },
    { id: 'develon_dl320', name: 'Develon dl320-7', capex1: 260000, capex2: 290000, resale: 70000, mantBase: 9.5, rent: 11747, downtime: 98825, fuel: 5.5 },
    { id: 'hyundai_hl960', name: 'Hyundai HL960', capex1: 250000, capex2: 285000, resale: 55000, mantBase: 9.5, rent: 11112, downtime: 112875, fuel: 5.75 },
    { id: 'case_821g', name: 'Case 821G', capex1: 245000, capex2: 285000, resale: 60000, mantBase: 9.5, rent: 11430, downtime: 102875, fuel: 5.15 },
    { id: 'sdlg_l958f', name: 'SDLG L958F', capex1: 140000, capex2: 170000, resale: 25000, mantBase: 11.5, rent: 10160, downtime: 144862, fuel: 4.85 },
    { id: 'liugong_856h', name: 'Liugong 856 H', capex1: 130000, capex2: 160000, resale: 25000, mantBase: 12.0, rent: 10160, downtime: 144862, fuel: 6.25 }
];

// Displays
const winnerName = document.getElementById('winnerName');
const winnerSavings = document.getElementById('winnerSavings');
const totalFuelCostCard = document.getElementById('totalFuelCost');
const verdictCard = document.getElementById('verdictCard');

const YEARS = 5;

// Variables Globales de Gráficos
let currentTRM = 4000;
let tcoChart;
let cashflowChart;
let histChart;

// Colores de los charts
const colors = {
    new: '#3498db',     // Azul
    repower: '#fbbb21', // Amarillo CAT
    rent: '#e74c3c'     // Rojo
};

// Formateador de moneda
const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
});

// Helper de Anualidades Bancarias (PMT)
function pmt(rate_per_period, number_of_periods, present_value) {
    if(rate_per_period === 0) return present_value / number_of_periods;
    return present_value * (rate_per_period * Math.pow(1 + rate_per_period, number_of_periods)) / (Math.pow(1 + rate_per_period, number_of_periods) - 1);
}

// Estado global del último cálculo (para exportar PDF)
let lastReport = {};

// --- Lógica Principal ---

function calculateAndRender() {
    // 1. Obtener valores
    const hA = parseInt(sliderHours.value); // Horas al año
    const fuelLts = parseFloat(sliderFuel.value); // Base o override
    const fuelPriceCOP = parseFloat(sliderFuelPrice.value);
    const fuelPrice = fuelPriceCOP / currentTRM;
    
    const capNew = parseFloat(capexNewIn.value) || 0;
    const opNew = parseFloat(opexNewIn.value) || 0;
    const resNew = parseFloat(resaleNewIn.value) || 0;
    const capRep = parseFloat(capexRepIn.value) || 0;
    const opRep = parseFloat(opexRepIn.value) || 0;
    const rentMo = parseFloat(monthlyRentIn.value) || 0;
    const rentWaitRep = parseFloat(rentWaitRepIn?.value) || 29063;

    const dpPercent = (parseFloat(document.getElementById('dpNew')?.value) || 0) / 100;
    const intRateNew = (parseFloat(document.getElementById('intNew')?.value) || 0) / 100;
    const intRateRep = (parseFloat(document.getElementById('intRep')?.value) || 0) / 100;
    const infRent = (parseFloat(document.getElementById('infRent')?.value) || 0) / 100;

    // Obtener modelos seleccionados para inyectar su combustible real
    const selectedNew = marketModels.find(m => m.id === modelSelect?.value);
    const selectedRent = marketModels.find(m => m.id === rentModelSelect?.value);
    
    // Tasa de Consumo por Escenario (Gal/hr)
    const fuelRateNew = (selectedNew && selectedNew.fuel) ? selectedNew.fuel : fuelLts;
    const fuelRateRent = (selectedRent && selectedRent.fuel) ? selectedRent.fuel : fuelLts;
    const fuelRateRep = 4.2; // Consumo CAT 966H por defecto de referencia

    // 2. Calcular TCO (Total Cost of Ownership a 5 años)
    
    // Escenario A: Nuevo
    const dpAmountNew = capNew * dpPercent;
    const financeAmountNew = capNew - dpAmountNew;
    const pmtNew = pmt(intRateNew / 12, YEARS * 12, financeAmountNew);
    const totalFinancedNew = pmtNew * 12 * YEARS;
    const tcoNew_capex = Math.max(0, (dpAmountNew + totalFinancedNew) - resNew); // Net Capex

    const tcoNew_opexMant = opNew * hA * YEARS;
    const tcoNew_opexFuel = (fuelRateNew * fuelPrice) * hA * YEARS;
    const dtNewYearly = selectedNew ? selectedNew.downtime : 40875;
    const tcoNew_opexDowntime = dtNewYearly * YEARS;
    const tcoNew_total = tcoNew_capex + tcoNew_opexMant + tcoNew_opexFuel + tcoNew_opexDowntime;

    // Escenario B: Repotenciar
    // La renta de contingencia se desembolsa el día 0. El Overhaul se financia 100%.
    const pmtRep = pmt(intRateRep / 12, YEARS * 12, capRep);
    const totalFinancedRep = pmtRep * 12 * YEARS;
    const tcoRep_capex = rentWaitRep + totalFinancedRep;

    const tcoRep_opexMant = opRep * hA * YEARS;
    const tcoRep_opexFuel = (fuelRateRep * fuelPrice) * hA * YEARS;
    const tcoRep_opexDowntime = 57150 * YEARS; // Asumiendo downtime similar a GC
    const tcoRep_total = tcoRep_capex + tcoRep_opexMant + tcoRep_opexFuel + tcoRep_opexDowntime;

    // Escenario C: Alquiler
    const dtRentYearly = parseFloat(downtimeRentIn.value) || 0;
    const tcoRent_capex = 0; // Rent no tiene capex
    
    let tcoRent_opexMant = 0;
    let rentCashflowAmounts = [];
    let currentRent = rentMo * 12; // Renta anual año 1
    for(let i=0; i<YEARS; i++) {
        tcoRent_opexMant += currentRent;
        rentCashflowAmounts.push(currentRent);
        currentRent = currentRent * (1 + infRent); // Inflar tarifa anual
    }

    const tcoRent_opexFuel = (fuelRateRent * fuelPrice) * hA * YEARS;
    const tcoRent_opexDowntime = dtRentYearly * YEARS;
    const tcoRent_total = tcoRent_capex + tcoRent_opexMant + tcoRent_opexFuel + tcoRent_opexDowntime;

    // 3. Evaluar Ganador
    const options = [
        { name: "Comprar Nuevo", tco: tcoNew_total, id: 'new', fuelDisplay: tcoNew_opexFuel },
        { name: "Repotenciar", tco: tcoRep_total, id: 'rep', fuelDisplay: tcoRep_opexFuel },
        { name: "Alquilar", tco: tcoRent_total, id: 'rent', fuelDisplay: tcoRent_opexFuel }
    ];
    options.sort((a,b) => a.tco - b.tco); // Mayor a menor TCO
    
    const winner = options[0];
    const second = options[1];
    const savings = second.tco - winner.tco;

    winnerName.innerText = winner.name;
    winnerSavings.innerText = `Ahorro vs Opción 2: ${formatter.format(savings)}`;
    
    // Asignar el gasto de combustible del equipo ganador al Top Card
    totalFuelCostCard.innerText = formatter.format(winner.fuelDisplay);

    const tcoCopValue = document.getElementById('tcoCopValue');
    if (tcoCopValue) {
        tcoCopValue.innerText = 'COP ' + (winner.tco * currentTRM).toLocaleString('es-CO', {maximumFractionDigits: 0});
    }

    // Cambiar color de tarjeta
    verdictCard.style.borderLeftColor = winner.id === 'new' ? colors.new : (winner.id === 'rep' ? colors.repower : colors.rent);

    // 4. Actualizar Gráficos y Flujo de Caja
    updateTcoChart(
        [tcoNew_capex, tcoRep_capex, tcoRent_capex], 
        [tcoNew_opexMant, tcoRep_opexMant, tcoRent_opexMant], 
        [tcoNew_opexFuel, tcoRep_opexFuel, tcoRent_opexFuel],
        [tcoNew_opexDowntime, tcoRep_opexDowntime, tcoRent_opexDowntime]
    );

    // Helpers Flujo de Caja
    function getArr(yr0, yr1, yr2, yr3, yr4, yr5_ops, resale) {
        let arr = [yr0];
        let cum = yr0;
        cum += yr1; arr.push(cum);
        cum += yr2; arr.push(cum);
        cum += yr3; arr.push(cum);
        cum += yr4; arr.push(cum);
        cum += (yr5_ops - resale); arr.push(cum);
        return arr;
    }

    const yrOpexNew = (opNew * hA) + ((fuelRateNew * fuelPrice) * hA) + dtNewYearly;
    const yrDebtNew = pmtNew * 12;
    const cashNew = getArr(dpAmountNew, yrDebtNew + yrOpexNew, yrDebtNew + yrOpexNew, yrDebtNew + yrOpexNew, yrDebtNew + yrOpexNew, yrDebtNew + yrOpexNew, resNew);

    const yrOpexRep = (opRep * hA) + ((fuelRateRep * fuelPrice) * hA) + 57150;
    const yrDebtRep = pmtRep * 12;
    const cashRep = getArr(rentWaitRep, yrDebtRep + yrOpexRep, yrDebtRep + yrOpexRep, yrDebtRep + yrOpexRep, yrDebtRep + yrOpexRep, yrDebtRep + yrOpexRep, 0);

    const yrOpexRentFuelDt = ((fuelRateRent * fuelPrice) * hA) + dtRentYearly;
    const cashRent = getArr(0, rentCashflowAmounts[0] + yrOpexRentFuelDt, rentCashflowAmounts[1] + yrOpexRentFuelDt, rentCashflowAmounts[2] + yrOpexRentFuelDt, rentCashflowAmounts[3] + yrOpexRentFuelDt, rentCashflowAmounts[4] + yrOpexRentFuelDt, 0);

    updateCashflowChart(cashNew, cashRep, cashRent);

    // Guardar snapshot para exportación ejecutiva
    lastReport = {
        fecha: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
        hA, fuelPriceCOP,
        selectedNewName: selectedNew ? selectedNew.name : 'CAT 966H Next Gen',
        selectedRentName: selectedRent ? selectedRent.name : 'CAT 966H Next Gen',
        dpPercent: (dpPercent * 100).toFixed(0),
        intRateNew: (intRateNew * 100).toFixed(1),
        intRateRep: (intRateRep * 100).toFixed(1),
        infRent: (infRent * 100).toFixed(1),
        tcoNew: tcoNew_total, tcoRep: tcoRep_total, tcoRent: tcoRent_total,
        tcoNewCapex: tcoNew_capex, tcoRepCapex: tcoRep_capex,
        tcoNewMant: tcoNew_opexMant, tcoRepMant: tcoRep_opexMant, tcoRentMant: tcoRent_opexMant,
        tcoNewFuel: tcoNew_opexFuel, tcoRepFuel: tcoRep_opexFuel, tcoRentFuel: tcoRent_opexFuel,
        tcoNewDt: tcoNew_opexDowntime, tcoRepDt: tcoRep_opexDowntime, tcoRentDt: tcoRent_opexDowntime,
        winner: options[0], second: options[1], third: options[2],
        savings: options[1].tco - options[0].tco,
        trm: currentTRM,
        capNew, capRep, rentMo, resNew,
        pmtNew: pmtNew * 12, pmtRep: pmtRep * 12 // Cuotas anuales
    };
}

// --- Inicialización y Listeners ---

function initCharts() {
    Chart.register(ChartDataLabels);
    Chart.defaults.color = '#9aa0a6';
    Chart.defaults.font.family = 'Inter';

    // TCO Chart (Barras Apiladas)
    const ctxTco = document.getElementById('tcoChart').getContext('2d');
    tcoChart = new Chart(ctxTco, {
        type: 'bar',
        data: {
            labels: ['Nuevo', 'Repotenciado', 'Alquiler'],
            datasets: [
                { label: 'CAPEX (Inversión Inicial)', data: [], backgroundColor: 'rgba(255, 255, 255, 0.8)' },
                { label: 'OPEX Mantenimiento/Renta', data: [], backgroundColor: 'rgba(251, 187, 33, 0.7)' },
                { label: 'OPEX Combustible', data: [], backgroundColor: 'rgba(74, 144, 226, 0.5)' },
                { label: 'Riesgo Downtime (Oculto)', data: [], backgroundColor: 'rgba(231, 76, 60, 0.65)' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false, color: '#333' } },
                y: { stacked: true, grid: { color: '#333' }, ticks: { callback: (v) => '$' + (v/1000) + 'k'} }
            },
            plugins: { 
                tooltip: { mode: 'index' },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 11 },
                    formatter: (value) => {
                        if (value < 1000) return '';
                        return '$' + Math.round(value / 1000) + 'k';
                    }
                }
            }
        }
    });

    // Cashflow Chart (Líneas Curvas)
    const ctxCash = document.getElementById('cashflowChart').getContext('2d');
    cashflowChart = new Chart(ctxCash, {
        type: 'line',
        data: {
            labels: ['Año 0', 'Año 1', 'Año 2', 'Año 3', 'Año 4', 'Año 5'],
            datasets: [
                { label: 'Nuevo', data: [], borderColor: colors.new, tension: 0.3, fill: false, borderWidth: 3 },
                { label: 'Repotenciado', data: [], borderColor: colors.repower, tension: 0.3, fill: false, borderWidth: 3 },
                { label: 'Alquiler', data: [], borderColor: colors.rent, tension: 0.3, fill: false, borderWidth: 3 }
            ]
        },
        options: {
            layout: { padding: { right: 45, top: 15, bottom: 15 } },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: '#333' }, ticks: { callback: (v) => '$' + (v/1000) + 'k' } },
                x: { grid: { display: false } }
            },
            plugins: { 
                tooltip: { mode: 'index', intersect: false },
                datalabels: {
                    display: true, // Mostrar todas siempre
                    align: (ctx) => {
                        const v0 = ctx.chart.data.datasets[0].data[ctx.dataIndex];
                        const v1 = ctx.chart.data.datasets[1].data[ctx.dataIndex];
                        const v2 = ctx.chart.data.datasets[2].data[ctx.dataIndex];
                        const myVal = ctx.dataset.data[ctx.dataIndex];
                        
                        // Ordenar de mayor a menor para asignar direcciones sin choques
                        const sorted = [v0, v1, v2].sort((a,b) => b - a);
                        
                        if (myVal === sorted[0]) return 'top';
                        if (myVal === sorted[2]) return 'bottom';
                        return 'right';
                    },
                    color: (ctx) => ctx.dataset.borderColor,
                    backgroundColor: '#111111', // Fondo opaco para evitar mezcla de texto
                    borderRadius: 4,
                    padding: 4,
                    font: { weight: 'bold', size: 10 },
                    formatter: (value) => '$' + Math.round(value / 1000) + 'k'
                }
            }
        }
    });

    // Historical Doughnut Chart
    const ctxHist = document.getElementById('historicalChart').getContext('2d');
    histChart = new Chart(ctxHist, {
        type: 'doughnut',
        data: {
            labels: ['Motor y Equipo T', 'Llantas Nuevas', 'Lubricantes / Gasoil', 'Otros Sistemas'],
            datasets: [{
                data: [1761, 208, 52, 222],
                backgroundColor: ['#fbbb21', '#e74c3c', '#3498db', '#9b59b6'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 14 },
                    formatter: (val) => {
                        let total = 2243;
                        return Math.round((val / total) * 100) + '%';
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ' ' + ctx.label + ': $' + ctx.raw + 'M COP'
                    }
                }
            }
        }
    });
}

function updateTcoChart(capexArr, opexArr, fuelArr, dtArr) {
    tcoChart.data.datasets[0].data = capexArr;
    tcoChart.data.datasets[1].data = opexArr;
    tcoChart.data.datasets[2].data = fuelArr;
    tcoChart.data.datasets[3].data = dtArr;
    tcoChart.update();
}

function updateCashflowChart(dtNew, dtRep, dtRent) {
    cashflowChart.data.datasets[0].data = dtNew;
    cashflowChart.data.datasets[1].data = dtRep;
    cashflowChart.data.datasets[2].data = dtRent;
    cashflowChart.update();
}

// Bind Listeners
const sliders = [
    sliderHours, sliderFuel, sliderFuelPrice, capexNewIn, opexNewIn, resaleNewIn, capexRepIn, opexRepIn, monthlyRentIn,
    document.getElementById('dpNew'), document.getElementById('intNew'), document.getElementById('intRep'), document.getElementById('infRent')
];
sliders.forEach(el => {
    if(el){ el.addEventListener('input', () => {
        // Actualizar displays si existen
        if(el === sliderHours) valHours.innerText = Number(el.value).toLocaleString() + ' h';
        if(el === sliderFuel) valFuel.innerText = el.value + ' Gal/h';
        if(el === sliderFuelPrice) valFuelPrice.innerText = 'COP ' + Number(el.value).toLocaleString();
        
        calculateAndRender();
    });}
});

// --- Modal Listeners ---
const btnModal = document.getElementById('btnBaseCalculo');
const modal = document.getElementById('calcModal');
const closeBtn = document.getElementById('closeModal');

const btnHist = document.getElementById('btnHistorico');
const histModal = document.getElementById('histModal');
const closeHistBtn = document.getElementById('closeHistModal');
const btnLoadBudget = document.getElementById('btnLoadBudget');

if(btnModal && modal) {
    btnModal.addEventListener('click', () => modal.classList.add('active'));
}
if(closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
}
if(btnHist && histModal) {
    btnHist.addEventListener('click', () => histModal.classList.add('active'));
}
if(closeHistBtn && histModal) {
    closeHistBtn.addEventListener('click', () => histModal.classList.remove('active'));
}
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
    if (e.target === histModal) histModal.classList.remove('active');
});

if(btnLoadBudget) {
    btnLoadBudget.addEventListener('click', () => {
        sliderHours.value = 2989;
        sliderFuel.value = 4.2;
        sliderFuelPrice.value = 9892;
        
        valHours.innerText = '2,989 h';
        valFuel.innerText = '4.2 Gal/h';
        valFuelPrice.innerText = 'COP 9,892';
        
        calculateAndRender();
        
        btnLoadBudget.innerText = '✓ Aplicado';
        setTimeout(() => btnLoadBudget.innerText = '📋 Cargar Presupuesto', 2000);
    });
}

// Kickoff
window.onload = async () => {
    initCharts();
    
    if (modelSelect) {
        marketModels.forEach(m => {
            let opt = document.createElement('option');
            opt.value = m.id;
            opt.innerText = m.name;
            modelSelect.appendChild(opt);
            
            // Populate rental selector
            let optRent = document.createElement('option');
            optRent.value = m.id;
            optRent.innerText = m.name;
            if(rentModelSelect) rentModelSelect.appendChild(optRent);
        });
        
        function updateCapexFromModel() {
            const selected = marketModels.find(m => m.id === modelSelect.value);
            if(selected) {
                if(capexOptSelect && capexOptSelect.value === '2') {
                    capexNewIn.value = selected.capex2;
                } else {
                    capexNewIn.value = selected.capex1;
                }
                resaleNewIn.value = selected.resale;
                opexNewIn.value = selected.mantBase;
                if(selected.fuel) {
                    sliderFuel.value = selected.fuel;
                    valFuel.innerText = selected.fuel + ' Gal/h';
                }
                calculateAndRender();
            }
        }
        
        function updateRentFromModel() {
            const selected = marketModels.find(m => m.id === rentModelSelect.value);
            if(selected) {
                monthlyRentIn.value = selected.rent;
                downtimeRentIn.value = selected.downtime;
                if(selected.fuel) {
                    sliderFuel.value = selected.fuel;
                    valFuel.innerText = selected.fuel + ' Gal/h';
                }
                calculateAndRender();
            }
        }
        
        modelSelect.addEventListener('change', updateCapexFromModel);
        if(capexOptSelect) capexOptSelect.addEventListener('change', updateCapexFromModel);
        if(rentModelSelect) {
            rentModelSelect.value = 'cat_966_ng'; // Default init
            rentModelSelect.addEventListener('change', updateRentFromModel);
        }
    }
    
    // Población DB Repower
    if(repModelSelect) {
        repowerModels.forEach(m => {
            let opt = document.createElement('option');
            opt.value = m.id;
            opt.innerText = m.name;
            repModelSelect.appendChild(opt);
        });
        
        repModelSelect.addEventListener('change', () => {
            const selected = repowerModels.find(m => m.id === repModelSelect.value);
            if(selected) {
                capexRepIn.value = selected.capex;
                opexRepIn.value = selected.mantBase;
                if(rentWaitRepIn) rentWaitRepIn.value = selected.rentWait;
                calculateAndRender();
            }
        });
    }

    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        if (data && data.rates && data.rates.COP) {
            currentTRM = data.rates.COP;
            document.getElementById('trmDisplay').innerText = `TRM Actual: $${currentTRM.toLocaleString('es-CO', {maximumFractionDigits:2})} COP`;
            document.getElementById('trmNote').innerText = `(Convertido a USD internamente. Tasa: ${currentTRM.toLocaleString('es-CO', {maximumFractionDigits:2})} COP/$)`;
        }
    } catch (err) {
        console.error('Error al obtener TRM', err);
        document.getElementById('trmDisplay').innerText = `TRM Fija: $${currentTRM} COP (Offline)`;
    }
    calculateAndRender();
};

// === Inteligencia de Mercado DB Modal ===
function openMarketDbModal() {
    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    const tbodyCapex = document.querySelector('#dbCapexTable tbody');
    const tbodyRent = document.querySelector('#dbRentTable tbody');
    tbodyCapex.innerHTML = '';
    tbodyRent.innerHTML = '';

    marketModels.forEach(m => {
        tbodyCapex.innerHTML += `
            <tr>
                <td style="color:#fff; font-weight:500;">${m.name}</td>
                <td style="color:var(--accent-blue);">${formatCurrency(m.capex1)}</td>
                <td style="color:var(--accent-blue);">${formatCurrency(m.capex2)}</td>
                <td style="color:var(--accent-green);">${formatCurrency(m.resale)}</td>
                <td style="color:var(--cat-yellow);">${formatCurrency(m.mantBase)}</td>
            </tr>`;
            
        tbodyRent.innerHTML += `
            <tr>
                <td style="color:#fff; font-weight:500;">${m.name}</td>
                <td style="color:#f39c12;">${formatCurrency(m.rent || 0)}</td>
                <td style="color:#e74c3c;">${formatCurrency(m.downtime || 0)}</td>
            </tr>`;
    });

    const tbodyRep = document.querySelector('#dbRepowerTable tbody');
    tbodyRep.innerHTML = '';
    repowerModels.forEach(m => {
        tbodyRep.innerHTML += `
            <tr>
                <td style="color:#fff; font-weight:500;">${m.name}</td>
                <td style="color:var(--accent-blue);">${formatCurrency(m.capex)}</td>
                <td style="color:#e74c3c;">${formatCurrency(m.rentWait)}</td>
                <td style="color:var(--cat-yellow);">${formatCurrency(m.mantBase)}</td>
            </tr>`;
    });

    document.getElementById('marketDbModal').classList.add('active');
}

function closeMarketDbModal() {
    document.getElementById('marketDbModal').classList.remove('active');
}

// --- Ver export_pdf.js para la función exportToPDF ---
