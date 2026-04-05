
// --- Exportación PDF Ejecutivo (Reporte en Ventana Dedicada) ---

/**
 * Captura un Chart.js en un canvas auxiliar a SCALE_FACTOR veces la resolución
 * del canvas original, sin afectar la visualización en pantalla.
 */
function captureChartHiRes(chart, scaleFactor) {
    const srcCanvas = chart.canvas;
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    const hiRes = document.createElement('canvas');
    hiRes.width  = w * scaleFactor;
    hiRes.height = h * scaleFactor;
    const ctx = hiRes.getContext('2d');
    ctx.fillStyle = '#131c2e';
    ctx.fillRect(0, 0, hiRes.width, hiRes.height);
    ctx.drawImage(srcCanvas, 0, 0, hiRes.width, hiRes.height);
    return hiRes.toDataURL('image/png', 1.0);
}

function exportToPDF() {
    const btn = document.getElementById('btnExportPDF');
    btn.innerHTML = '\u23F3 Generando...';
    btn.style.opacity = '0.5';

    // Capturar gráficos a 4× resolución
    const SCALE = 4;
    const tcoImg  = captureChartHiRes(tcoChart,      SCALE);
    const cashImg = captureChartHiRes(cashflowChart, SCALE);
    const r = lastReport;

    const fmt = function(v) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD', maximumFractionDigits: 0
        }).format(v || 0);
    };

    const winnerColor = r.winner && r.winner.id === 'new' ? '#3498db'
        : (r.winner && r.winner.id === 'rep' ? '#fbbb21' : '#e74c3c');

    const maxTco = Math.max(r.tcoNew || 0, r.tcoRep || 0, r.tcoRent || 0);
    function rankBar(tco, color) {
        const pct = maxTco > 0 ? ((tco || 0) / maxTco * 100).toFixed(1) : 0;
        return '<div style="flex:1;background:#1e2a3a;border-radius:4px;height:6px;overflow:hidden;min-width:80px;">'
            + '<div style="height:6px;border-radius:4px;width:' + pct + '%;background:' + color + ';"></div></div>';
    }

    const tcoRanking = [
        { label: r.winner && r.winner.name, tco: r.winner && r.winner.tco, badge: '\uD83E\uDD47 RECOMENDADO', color: winnerColor },
        { label: r.second && r.second.name, tco: r.second && r.second.tco, badge: '\uD83E\uDD48 2\u00AA OPCI\u00D3N',  color: '#888' },
        { label: r.third  && r.third.name,  tco: r.third  && r.third.tco,  badge: '\uD83E\uDD49 3\u00AA OPCI\u00D3N',  color: '#555' },
    ];

    const rankingRows = tcoRanking.map(function(item, i) {
        return '<div style="display:flex;align-items:center;gap:14px;padding:10px 16px;margin-bottom:6px;border-radius:8px;background:#131c2e;border:1px solid ' + (i === 0 ? winnerColor : '#1e2a3a') + ';">'
            + '<span style="font-size:0.75rem;font-weight:700;min-width:120px;color:#aaa;">' + item.badge + '</span>'
            + '<span style="font-size:0.95rem;font-weight:600;color:#f0f0f0;flex:1;">' + (item.label || '\u2014') + '</span>'
            + rankBar(item.tco, item.color)
            + '<span style="font-size:1.1rem;font-weight:800;color:#fbbb21;min-width:130px;text-align:right;">' + fmt(item.tco) + '</span>'
            + '</div>';
    }).join('');

    function pageHeader(section, title) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1e2a3a;padding-bottom:10px;margin-bottom:20px;">'
            + '<div><div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:2px;color:#555;margin-bottom:3px;">' + section + '</div>'
            + '<div style="font-size:1.25rem;font-weight:700;color:#f0f0f0;">' + title + '</div></div>'
            + '<div style="display:flex;align-items:center;gap:8px;">'
            + '<div style="display:flex;gap:4px;">'
            + '<div style="display:flex;flex-direction:column;align-items:flex-end;"><div style="width:18px;height:7px;background:#ef3e42;"></div><div style="width:7px;height:14px;background:#ef3e42;"></div></div>'
            + '<div style="display:flex;flex-direction:column;align-items:flex-start;"><div style="width:18px;height:7px;background:#ef3e42;"></div><div style="width:7px;height:14px;background:#ef3e42;"></div></div>'
            + '</div><div style="font-size:0.9rem;font-weight:700;color:#ccc;">Tequendama</div></div>'
            + '</div>';
    }

    function footer(page, total) {
        return '<div style="margin-top:auto;padding-top:10px;border-top:1px solid #1e2a3a;display:flex;justify-content:space-between;font-size:0.65rem;color:#444;">'
            + '<span>SIMULADOR CAPEX/OPEX &middot; CAT 966H &middot; Tequendama S.A.</span>'
            + '<span>CONFIDENCIAL &mdash; Para uso exclusivo de la Presidencia</span>'
            + '<span>' + (r.fecha || '') + ' &mdash; P\u00E1gina ' + page + ' de ' + total + '</span>'
            + '</div>';
    }

    const TOTAL = 5;
    const PAGE = 'width:100vw;min-height:100vh;padding:14mm 18mm;background:#0d1117;display:flex;flex-direction:column;';

    var html = '<!DOCTYPE html><html lang="es"><head>'
        + '<meta charset="UTF-8"><title>Reporte Ejecutivo TCO &mdash; CAT 966H</title>'
        + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">'
        + '<style>'
        + '@page{size:A4 landscape;margin:0;}'
        + '*{box-sizing:border-box;margin:0;padding:0;font-family:\'Inter\',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
        + 'body{background:#0d1117;color:#f0f0f0;}'
        + '@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}body{background:#0d1117!important;}.no-print{display:none!important;}}'
        + '</style></head><body>'

        // ─── PORTADA ──────────────────────────────────────────────────────────────
        + '<div style="width:100vw;height:100vh;background:linear-gradient(135deg,#0d1117 0%,#1a2236 60%,#0d1117 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;page-break-after:always;position:relative;overflow:hidden;">'
        + '<div style="position:absolute;top:30px;right:40px;border:1px solid #333;padding:4px 12px;font-size:0.7rem;color:#666;border-radius:4px;letter-spacing:1px;text-transform:uppercase;">CONFIDENCIAL</div>'
        + '<div style="display:flex;flex-direction:column;align-items:center;margin-bottom:50px;">'
        + '<div style="display:flex;gap:7px;margin-bottom:10px;">'
        + '<div style="display:flex;flex-direction:column;align-items:flex-end;"><div style="width:44px;height:16px;background:#ef3e42;"></div><div style="width:16px;height:34px;background:#ef3e42;"></div></div>'
        + '<div style="display:flex;flex-direction:column;align-items:flex-start;"><div style="width:44px;height:16px;background:#ef3e42;"></div><div style="width:16px;height:34px;background:#ef3e42;"></div></div>'
        + '</div>'
        + '<div style="font-size:2.6rem;font-weight:800;color:#fff;letter-spacing:-1px;">Tequendama</div>'
        + '<div style="font-size:0.75rem;color:#888;margin-top:4px;letter-spacing:0.5px;">Juntos construimos una Colombia mejor</div>'
        + '</div>'
        + '<div style="width:100px;height:3px;background:#fbbb21;border-radius:2px;margin:30px 0;"></div>'
        + '<div style="font-size:2rem;font-weight:700;color:#fff;text-align:center;line-height:1.3;">Informe Ejecutivo de An\u00E1lisis<br>de Costo Total de Propiedad<br><span style="color:#fbbb21;">CAT 966H &mdash; Decisi\u00F3n Estrat\u00E9gica de Flota</span></div>'
        + '<div style="font-size:1rem;color:#9aa0a6;margin-top:14px;text-align:center;">Escenarios: Compra Nueva &middot; Repotenciaci\u00F3n &middot; Alquiler/Renting &mdash; Horizonte 5 A\u00F1os</div>'
        + '<div style="position:absolute;bottom:40px;display:flex;gap:50px;align-items:center;">'
        + '<div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:#fbbb21;">' + ((r.hA || 0).toLocaleString('es-CO')) + ' h</div><div style="font-size:0.7rem;color:#666;margin-top:2px;text-transform:uppercase;letter-spacing:1px;">Uso Anual Est.</div></div>'
        + '<div style="width:1px;height:40px;background:#333;"></div>'
        + '<div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:#fbbb21;">' + (r.winner && r.winner.name || '\u2014') + '</div><div style="font-size:0.7rem;color:#666;margin-top:2px;text-transform:uppercase;letter-spacing:1px;">Opci\u00F3n Recomendada</div></div>'
        + '<div style="width:1px;height:40px;background:#333;"></div>'
        + '<div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:#fbbb21;">' + fmt(r.savings) + '</div><div style="font-size:0.7rem;color:#666;margin-top:2px;text-transform:uppercase;letter-spacing:1px;">Ahorro vs 2\u00AA Opci\u00F3n</div></div>'
        + '</div>'
        + '<div style="position:absolute;bottom:40px;right:40px;font-size:0.75rem;color:#444;">Preparado: ' + (r.fecha || '') + '</div>'
        + '</div>'

        // ─── PÁGINA 2: RESUMEN EJECUTIVO ──────────────────────────────────────────
        + '<div style="' + PAGE + 'page-break-after:always;">'
        + pageHeader('Secci\u00F3n 1 \u2014 S\u00EDntesis Gerencial', 'Resumen Ejecutivo &amp; Recomendaci\u00F3n')
        + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">'
        + '<div style="background:#131c2e;border:1px solid ' + winnerColor + ';border-radius:10px;padding:16px 20px;">'
        + '<div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:6px;">\u2705 Opci\u00F3n Recomendada</div>'
        + '<div style="font-size:1.6rem;font-weight:800;color:#fbbb21;">' + (r.winner && r.winner.name || '\u2014') + '</div>'
        + '<div style="font-size:0.7rem;color:#555;margin-top:4px;">TCO 5 a\u00F1os: <strong>' + fmt(r.winner && r.winner.tco) + '</strong></div>'
        + '</div>'
        + '<div style="background:#131c2e;border:1px solid #1e2a3a;border-radius:10px;padding:16px 20px;">'
        + '<div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:6px;">\uD83D\uDCB0 Ahorro vs 2\u00AA Opci\u00F3n (' + (r.second && r.second.name || '') + ')</div>'
        + '<div style="font-size:1.4rem;font-weight:800;color:#2ecc71;">' + fmt(r.savings) + '</div>'
        + '<div style="font-size:0.7rem;color:#555;margin-top:4px;">Diferencia acumulada al A\u00F1o 5</div>'
        + '</div>'
        + '<div style="background:#131c2e;border:1px solid #1e2a3a;border-radius:10px;padding:16px 20px;">'
        + '<div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:6px;">\uD83D\uDCCB TCO en Pesos Colombianos</div>'
        + '<div style="font-size:1.1rem;font-weight:800;color:#f0f0f0;">COP ' + (((r.winner && r.winner.tco) || 0) * (r.trm || 3662)).toLocaleString('es-CO', {maximumFractionDigits:0}) + '</div>'
        + '<div style="font-size:0.7rem;color:#555;margin-top:4px;">TRM: $' + (r.trm || 3662).toLocaleString('es-CO', {maximumFractionDigits:2}) + ' COP/$</div>'
        + '</div>'
        + '</div>'
        + rankingRows
        + '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;margin-top:12px;">'
        + '<thead><tr>'
        + '<th style="background:#131c2e;color:#9aa0a6;font-weight:600;padding:10px 14px;text-align:left;border-bottom:1px solid #1e2a3a;font-size:0.7rem;text-transform:uppercase;">Componente de Costo (5 a\u00F1os)</th>'
        + '<th style="background:#131c2e;color:#3498db;font-weight:600;padding:10px 14px;text-align:right;border-bottom:1px solid #1e2a3a;font-size:0.7rem;text-transform:uppercase;">Comprar Nuevo</th>'
        + '<th style="background:#131c2e;color:#fbbb21;font-weight:600;padding:10px 14px;text-align:right;border-bottom:1px solid #1e2a3a;font-size:0.7rem;text-transform:uppercase;">Repotenciar</th>'
        + '<th style="background:#131c2e;color:#e74c3c;font-weight:600;padding:10px 14px;text-align:right;border-bottom:1px solid #1e2a3a;font-size:0.7rem;text-transform:uppercase;">Alquiler</th>'
        + '</tr></thead><tbody>'
        + '<tr><td style="padding:9px 14px;font-weight:600;color:#f0f0f0;border-bottom:1px solid #161f2e;">CAPEX / Financiaci\u00F3n</td><td style="padding:9px 14px;text-align:right;color:#3498db;border-bottom:1px solid #161f2e;">' + fmt(r.tcoNewCapex) + '</td><td style="padding:9px 14px;text-align:right;color:#fbbb21;border-bottom:1px solid #161f2e;">' + fmt(r.tcoRepCapex) + '</td><td style="padding:9px 14px;text-align:right;color:#e74c3c;border-bottom:1px solid #161f2e;">$0</td></tr>'
        + '<tr><td style="padding:9px 14px;font-weight:600;color:#f0f0f0;border-bottom:1px solid #161f2e;">OPEX Mantenimiento / Renta</td><td style="padding:9px 14px;text-align:right;color:#3498db;border-bottom:1px solid #161f2e;">' + fmt(r.tcoNewMant) + '</td><td style="padding:9px 14px;text-align:right;color:#fbbb21;border-bottom:1px solid #161f2e;">' + fmt(r.tcoRepMant) + '</td><td style="padding:9px 14px;text-align:right;color:#e74c3c;border-bottom:1px solid #161f2e;">' + fmt(r.tcoRentMant) + '</td></tr>'
        + '<tr><td style="padding:9px 14px;font-weight:600;color:#f0f0f0;border-bottom:1px solid #161f2e;">OPEX Combustible</td><td style="padding:9px 14px;text-align:right;color:#3498db;border-bottom:1px solid #161f2e;">' + fmt(r.tcoNewFuel) + '</td><td style="padding:9px 14px;text-align:right;color:#fbbb21;border-bottom:1px solid #161f2e;">' + fmt(r.tcoRepFuel) + '</td><td style="padding:9px 14px;text-align:right;color:#e74c3c;border-bottom:1px solid #161f2e;">' + fmt(r.tcoRentFuel) + '</td></tr>'
        + '<tr><td style="padding:9px 14px;font-weight:600;color:#f0f0f0;border-bottom:1px solid #161f2e;">Riesgo Downtime</td><td style="padding:9px 14px;text-align:right;color:#3498db;border-bottom:1px solid #161f2e;">' + fmt(r.tcoNewDt) + '</td><td style="padding:9px 14px;text-align:right;color:#fbbb21;border-bottom:1px solid #161f2e;">' + fmt(r.tcoRepDt) + '</td><td style="padding:9px 14px;text-align:right;color:#e74c3c;border-bottom:1px solid #161f2e;">' + fmt(r.tcoRentDt) + '</td></tr>'
        + '<tr><td style="padding:9px 14px;font-weight:700;color:#fbbb21;background:#131c2e;font-size:0.85rem;"><strong>TOTAL TCO 5 A\u00F1os</strong></td><td style="padding:9px 14px;text-align:right;color:#3498db;font-weight:700;background:#131c2e;"><strong>' + fmt(r.tcoNew) + '</strong></td><td style="padding:9px 14px;text-align:right;color:#fbbb21;font-weight:700;background:#131c2e;"><strong>' + fmt(r.tcoRep) + '</strong></td><td style="padding:9px 14px;text-align:right;color:#e74c3c;font-weight:700;background:#131c2e;"><strong>' + fmt(r.tcoRent) + '</strong></td></tr>'
        + '</tbody></table>'
        + footer('2', TOTAL)
        + '</div>'

        // ─── PÁGINA 3: TCO CHART PANTALLA COMPLETA ───────────────────────────────
        + '<div style="' + PAGE + 'page-break-after:always;">'
        + pageHeader('Secci\u00F3n 2 \u2014 An\u00E1lisis Visual', 'Desglose Costo Total de Propiedad \u2014 TCO a 5 A\u00F1os')
        + '<div style="display:flex;gap:20px;margin-bottom:14px;">'
        + '<div style="display:flex;align-items:center;gap:6px;"><div style="width:14px;height:14px;background:#eee;border-radius:3px;"></div><span style="font-size:0.8rem;color:#9aa0a6;">CAPEX / Inversi\u00F3n Inicial</span></div>'
        + '<div style="display:flex;align-items:center;gap:6px;"><div style="width:14px;height:14px;background:#fbbb21;border-radius:3px;"></div><span style="font-size:0.8rem;color:#9aa0a6;">OPEX Mantenimiento / Renta</span></div>'
        + '<div style="display:flex;align-items:center;gap:6px;"><div style="width:14px;height:14px;background:#4a90e2;border-radius:3px;"></div><span style="font-size:0.8rem;color:#9aa0a6;">OPEX Combustible</span></div>'
        + '<div style="display:flex;align-items:center;gap:6px;"><div style="width:14px;height:14px;background:#e74c3c;border-radius:3px;"></div><span style="font-size:0.8rem;color:#9aa0a6;">Riesgo Downtime (Oculto)</span></div>'
        + '</div>'
        + '<div style="flex:1;background:#131c2e;border:1px solid #1e2a3a;border-radius:12px;padding:24px;display:flex;align-items:center;justify-content:center;">'
        + '<img src="' + tcoImg + '" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;" />'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px;">'
        + '<div style="background:#131c2e;border:1px solid #3498db;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:0.65rem;text-transform:uppercase;color:#9aa0a6;letter-spacing:1px;margin-bottom:6px;">Comprar Nuevo</div><div style="font-size:1.4rem;font-weight:800;color:#3498db;">' + fmt(r.tcoNew) + '</div><div style="font-size:0.7rem;color:#555;margin-top:4px;">TCO Total 5 A\u00F1os</div></div>'
        + '<div style="background:#131c2e;border:1px solid #fbbb21;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:0.65rem;text-transform:uppercase;color:#9aa0a6;letter-spacing:1px;margin-bottom:6px;">Repotenciar</div><div style="font-size:1.4rem;font-weight:800;color:#fbbb21;">' + fmt(r.tcoRep) + '</div><div style="font-size:0.7rem;color:#555;margin-top:4px;">TCO Total 5 A\u00F1os</div></div>'
        + '<div style="background:#131c2e;border:1px solid #e74c3c;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:0.65rem;text-transform:uppercase;color:#9aa0a6;letter-spacing:1px;margin-bottom:6px;">Alquiler</div><div style="font-size:1.4rem;font-weight:800;color:#e74c3c;">' + fmt(r.tcoRent) + '</div><div style="font-size:0.7rem;color:#555;margin-top:4px;">TCO Total 5 A\u00F1os</div></div>'
        + '</div>'
        + footer('3', TOTAL)
        + '</div>'

        // ─── PÁGINA 4: CASHFLOW CHART PANTALLA COMPLETA ───────────────────────────
        + '<div style="' + PAGE + 'page-break-after:always;">'
        + pageHeader('Secci\u00F3n 3 \u2014 An\u00E1lisis Visual', 'Proyecci\u00F3n Acumulada \u2014 Flujo de Caja (A\u00F1os 0 a 5)')
        + '<div style="background:#131c2e;border-left:4px solid ' + winnerColor + ';border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:14px;">'
        + '<div style="font-size:0.7rem;text-transform:uppercase;color:#555;letter-spacing:1px;margin-bottom:4px;">Lectura Ejecutiva</div>'
        + '<div style="font-size:0.85rem;color:#ccc;">La opci\u00F3n <strong style="color:' + winnerColor + ';">' + (r.winner && r.winner.name || '\u2014') + '</strong> genera el menor costo acumulado al A\u00F1o 5: <strong style="color:' + winnerColor + ';">' + fmt(r.winner && r.winner.tco) + '</strong>, representando un ahorro de <strong style="color:#2ecc71;">' + fmt(r.savings) + '</strong> vs la segunda mejor opci\u00F3n.</div>'
        + '</div>'
        + '<div style="display:flex;gap:24px;margin-bottom:12px;">'
        + '<div style="display:flex;align-items:center;gap:6px;"><div style="width:30px;height:3px;background:#3498db;border-radius:2px;"></div><span style="font-size:0.85rem;color:#9aa0a6;">Comprar Nuevo</span></div>'
        + '<div style="display:flex;align-items:center;gap:6px;"><div style="width:30px;height:3px;background:#fbbb21;border-radius:2px;"></div><span style="font-size:0.85rem;color:#9aa0a6;">Repotenciar</span></div>'
        + '<div style="display:flex;align-items:center;gap:6px;"><div style="width:30px;height:3px;background:#e74c3c;border-radius:2px;"></div><span style="font-size:0.85rem;color:#9aa0a6;">Alquiler / Renting</span></div>'
        + '</div>'
        + '<div style="flex:1;background:#131c2e;border:1px solid #1e2a3a;border-radius:12px;padding:24px;display:flex;align-items:center;justify-content:center;">'
        + '<img src="' + cashImg + '" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;" />'
        + '</div>'
        + footer('4', TOTAL)
        + '</div>'

        // ─── PÁGINA 5: SUPUESTOS FINANCIEROS ─────────────────────────────────────
        + '<div style="' + PAGE + '">'
        + pageHeader('Secci\u00F3n 4 \u2014 Modelo Financiero', 'Supuestos y Variables del Modelo')
        + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px;">'
        + '<div style="background:#131c2e;border:1px solid #1e2a3a;border-radius:10px;padding:22px;">'
        + '<div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;color:#3498db;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #1e2a3a;">Compra Equipo Nuevo</div>'
        + _arowLg('Modelo seleccionado', r.selectedNewName || '\u2014')
        + _arowLg('CAPEX equipo', fmt(r.capNew))
        + _arowLg('Cuota inicial', (r.dpPercent || 0) + '% (' + fmt((r.capNew || 0) * (r.dpPercent || 0) / 100) + ')')
        + _arowLg('Tasa cr\u00E9dito anual', (r.intRateNew || 0) + '%')
        + _arowLg('Cuota anual banco', fmt(r.pmtNew))
        + _arowLg('Valor reventa A\u00F1o 5', fmt(r.resNew))
        + '</div>'
        + '<div style="background:#131c2e;border:1px solid #1e2a3a;border-radius:10px;padding:22px;">'
        + '<div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;color:#fbbb21;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #1e2a3a;">Repotenciaci\u00F3n (Overhaul)</div>'
        + _arowLg('CAPEX Overhaul', fmt(r.capRep))
        + _arowLg('Tasa cr\u00E9dito anual', (r.intRateRep || 0) + '%')
        + _arowLg('Cuota anual banco', fmt(r.pmtRep))
        + _arowLg('Renta espera (2 meses)', fmt((r.tcoRepCapex || 0) - (r.pmtRep || 0) * 5))
        + '</div>'
        + '<div style="background:#131c2e;border:1px solid #1e2a3a;border-radius:10px;padding:22px;">'
        + '<div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;color:#e74c3c;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #1e2a3a;">Alquiler / Renting</div>'
        + _arowLg('Modelo seleccionado', r.selectedRentName || '\u2014')
        + _arowLg('Canon mensual A\u00F1o 1', fmt(r.rentMo))
        + _arowLg('Incremento tarifa anual', (r.infRent || 0) + '%')
        + _arowLg('Horas anuales uso', ((r.hA || 0).toLocaleString('es-CO')) + ' h')
        + _arowLg('Costo combustible', 'COP ' + ((r.fuelPriceCOP || 0).toLocaleString('es-CO')) + '/gal')
        + '</div>'
        + '</div>'
        + '<div style="background:#131c2e;border:1px solid #1e2a3a;border-radius:8px;padding:18px;">'
        + '<div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:#555;margin-bottom:10px;">Nota Metodol\u00F3gica</div>'
        + '<div style="font-size:0.85rem;color:#9aa0a6;line-height:1.8;">Metodolog\u00EDa: <strong>Costo Total de Propiedad (TCO)</strong> en horizonte de <strong>5 a\u00F1os</strong>. Financiamiento calculado mediante <strong>Anualidades (PMT)</strong> con capitalizaci\u00F3n mensual compuesta. Consumo de combustible derivado del modelo t\u00E9cnico seleccionado. Costos de downtime valorados a tarifa horaria de mercado. TRM aplicada: <strong style="color:#fbbb21;">$' + (r.trm || 3662).toLocaleString('es-CO', {maximumFractionDigits:2}) + ' COP/USD</strong>.</div>'
        + '</div>'
        + footer('5', TOTAL)
        + '</div>'

        + '<button style="position:fixed;bottom:24px;right:24px;background:#2ecc71;color:#000;border:none;padding:14px 32px;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(46,204,113,0.4);z-index:999;" class="no-print" onclick="window.print()">\uD83D\uDDB8 Imprimir / Guardar PDF (5 p\u00E1g.)</button>'
        + '</body></html>';

    var win = window.open('', '_blank');
    if (!win) {
        alert('Por favor permite las ventanas emergentes para este sitio y vuelve a intentarlo.');
        btn.innerHTML = '\uD83D\uDCE5 Exportar a PDF Ejecutivo';
        btn.style.opacity = '1';
        return;
    }
    win.document.write(html);
    win.document.close();

    btn.innerHTML = '\uD83D\uDCE5 Exportar a PDF Ejecutivo';
    btn.style.opacity = '1';
}

function _arow(key, val) {
    return '<div style="display:flex;justify-content:space-between;margin-bottom:5px;">'
        + '<span style="font-size:0.72rem;color:#888;">' + key + '</span>'
        + '<span style="font-size:0.72rem;color:#fbbb21;font-weight:600;">' + val + '</span>'
        + '</div>';
}

function _arowLg(key, val) {
    return '<div style="display:flex;justify-content:space-between;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.04);">'
        + '<span style="font-size:0.85rem;color:#9aa0a6;">' + key + '</span>'
        + '<span style="font-size:0.85rem;color:#fbbb21;font-weight:700;">' + val + '</span>'
        + '</div>';
}
