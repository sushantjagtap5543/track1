const getCertificateHtml = (t, item) => `
<html>
    <head>
        <title>${t('certAis140Title')}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
        body { font-family: 'Inter', sans-serif; padding: 60px; color: #0f172a; background: #f8fafc; }
        .cert-container { max-width: 800px; margin: 0 auto; background: white; padding: 60px; border-radius: 24px; box-shadow: 0 40px 100px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
        .cert-container::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 10px; background: linear-gradient(90deg, #10b981, #3b82f6); }
        .header { text-align: center; margin-bottom: 50px; }
        .logo-placeholder { font-weight: 900; font-size: 24px; color: #10b981; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; }
        .badge { background: #10b981; color: white; font-weight: 800; padding: 10px 20px; border-radius: 99px; display: inline-block; margin-top: 20px; font-size: 13px; letter-spacing: 1px; }
        .title { font-size: 32px; font-weight: 800; margin: 0; color: #1e293b; letter-spacing: -1px; }
        .subtitle { color: #64748b; font-size: 16px; margin-top: 8px; }
        .details { margin-top: 40px; }
        .row { display: flex; justify-content: space-between; padding: 20px 0; border-bottom: 1px solid #f1f5f9; }
        .row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .value { font-weight: 700; color: #0f172a; font-size: 16px; }
        .footer { margin-top: 60px; text-align: center; border-top: 2px solid #f1f5f9; pt: 40px; }
        .footer-text { font-size: 14px; color: #94a3b8; line-height: 1.6; max-width: 500px; margin: 20px auto 0; }
        .signature-area { display: flex; justify-content: space-between; margin-top: 80px; }
        .sig-block { text-align: center; width: 200px; }
        .sig-line { border-top: 2px solid #e2e8f0; margin-top: 10px; padding-top: 10px; font-weight: 700; color: #64748b; font-size: 14px; }
        @media print { body { background: white; padding: 0; } .cert-container { box-shadow: none; border: none; width: 100%; max-width: none; } }
        </style>
    </head>
    <body>
        <div class="cert-container">
        <div class="header">
            <div class="logo-placeholder">GEOSUREPATH</div>
            <h1 class="title">${t('certAis140Title')}</h1>
            <p class="subtitle">${t('certAis140Subtitle')}</p>
            <div class="badge">${t('certSecuredValidated')}</div>
        </div>
        <div class="details">
            <div class="row"><span class="label">${t('certVehicleName')}</span> <span class="value">${item.name}</span></div>
            <div class="row"><span class="label">${t('certVrn')}</span> <span class="value">${item.attributes?.vrn || t('deviceStatusUnknown')}</span></div>
            <div class="row"><span class="label">${t('certChassisNumber')}</span> <span class="value">${item.attributes?.chassisNumber || t('deviceStatusUnknown')}</span></div>
            <div class="row"><span class="label">${t('certEngineNumber')}</span> <span class="value">${item.attributes?.engineNumber || t('deviceStatusUnknown')}</span></div>
            <div class="row"><span class="label">${t('certImei')}</span> <span class="value">${item.uniqueId}</span></div>
            <div class="row"><span class="label">${t('certHardwareModel')}</span> <span class="value">${item.model || 'Standard AIS140'}</span></div>
            <div class="row"><span class="label">${t('certInstallationDate')}</span> <span class="value">${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
            <div class="row"><span class="label">${t('certVltStatus')}</span> <span class="value" style="color: ${item.attributes?.vltForwarding ? '#10b981' : '#f59e0b'}">${item.attributes?.vltForwarding ? t('certSynchronized') : t('certLocalOnly')}</span></div>
        </div>
        <div class="signature-area">
            <div class="sig-block"><div style="height: 40px"></div><div class="sig-line">${t('certOfficialSeal')}</div></div>
            <div class="sig-block"><div style="height: 40px"></div><div class="sig-line">${t('certRegisteredOwner')}</div></div>
        </div>
        <div class="footer">
            <p class="footer-text">${t('certFooterText')}</p>
            <p style="font-weight: 800; font-size: 12px; transform: uppercase; letter-spacing: 1px; color: #cbd5e1; margin-top: 30px;">${t('certDigitalId')}: GSP-${item.id}-${Date.now().toString(36).toUpperCase()}</p>
        </div>
        </div>
        <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }</script>
    </body>
</html>
`;

export default getCertificateHtml;
