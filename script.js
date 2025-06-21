document.addEventListener('DOMContentLoaded', () => {
    // HTML elemanlarını seçme
    const trackTypeSelect = document.getElementById('trackType');
    const weatherConditionSelect = document.getElementById('weatherCondition');
    const tireTypeSelect = document.getElementById('tireType');
    const currentLapInput = document.getElementById('currentLap');
    const totalLapsInput = document.getElementById('totalLaps');
    const getStrategyBtn = document.getElementById('getStrategyBtn');
    const strategyOutput = document.getElementById('strategyOutput');
    const errorMessagesDiv = document.getElementById('errorMessages');

    // Hata mesajlarını temizleme fonksiyonu
    const clearErrors = () => {
        errorMessagesDiv.textContent = '';
        errorMessagesDiv.style.display = 'none';
    };

    // Hata mesajı gösterme fonksiyonu
    const showError = (message) => {
        errorMessagesDiv.textContent = message;
        errorMessagesDiv.style.display = 'block';
        strategyOutput.textContent = ''; // Öneri alanını temizle
    };

    // Strateji butona tıklama olayı
    getStrategyBtn.addEventListener('click', () => {
        clearErrors(); // Her yeni hesaplamada önceki hataları temizle

        // Kullanıcı girişlerini alma
        const P = trackTypeSelect.value;         // Pist Tipi
        const W = weatherConditionSelect.value;  // Hava Durumu
        const T = tireTypeSelect.value;          // Mevcut Lastik Tipi
        const L = parseInt(currentLapInput.value); // Mevcut Tur Sayısı
        const R = parseInt(totalLapsInput.value);  // Toplam Tur Sayısı

        let recommendations = []; // Öneri listesi

        // 1. Kullanıcı Girişi Doğrulaması (Beklenen Kullanıcı Etkileşimi 2: Hata Mesajı)
        if (isNaN(L) || L <= 0) {
            showError("Lütfen geçerli bir mevcut tur sayısı girin.");
            return;
        }
        if (isNaN(R) || R <= 0) {
            showError("Lütfen geçerli bir toplam tur sayısı girin.");
            return;
        }
        if (L > R) {
            showError("Mevcut Tur sayısı, Toplam Tur sayısından fazla olamaz.");
            return;
        }

        // 2. Karar Noktası: Lastik Uyumluluğu Kontrolü
        // IF W = wet AND (T = soft OR T = hard OR T = medium) THEN Recommend: switch to intermediate or wet tires
        if (W === 'wet' && (T === 'soft' || T === 'medium' || T === 'hard')) {
            recommendations.push("Islak zemin için lastikleriniz (kuru zemin lastiği) uygun değil. Öneri: Intermediate veya Wet lastiğe geçin.");
        }
        // IF W = dry AND (T = intermediate OR T = wet) THEN Recommend: switch to dry tires
        else if (W === 'dry' && (T === 'intermediate' || T === 'wet')) {
            recommendations.push("Kuru zemin için lastikleriniz (ıslak zemin lastiği) uygun değil. Öneri: Soft, Medium veya Hard lastiğe geçin (pist/stratejiye göre).");
        }

        // 3. Karar Noktası: Yarış Aşaması Analizi
        const raceProgress = L / R;
        let raceStageMessage = '';

        // IF (L / R) < 0.3 (Early Race) THEN Recommend: aggressive driving, consider short pit if needed.
        if (raceProgress < 0.3) {
            raceStageMessage = "Yarışın erken aşamasındasınız.";
            recommendations.push("Genel Sürüş Önerisi: Agresif sürüş düşünebilirsiniz, ancak lastik aşınmasını dikkatle izleyin. Gerekirse kısa bir pit-stop değerlendirin.");
        }
        // IF (L / R) >= 0.3 AND (L / R) < 0.7 (Mid Race) THEN Recommend: balanced driving, monitor tire wear, plan pit stop window.
        else if (raceProgress >= 0.3 && raceProgress < 0.7) {
            raceStageMessage = "Yarışın orta aşamasındasınız.";
            recommendations.push("Genel Sürüş Önerisi: Dengeli sürüş yapın ve lastik aşınmasını yakından takip edin. Pit-stop penceresini planlamaya başlayın.");
        }
        // IF (L / R) >= 0.7 (Late Race) THEN Recommend: push hard, manage fuel, final pit if necessary for fresh tires.
        else { // raceProgress >= 0.7
            raceStageMessage = "Yarışın son aşamasındasınız.";
            recommendations.push("Genel Sürüş Önerisi: Bitime kadar zorlayın! Yakıt ve lastik durumunu dikkatlice yönetin. Gerekliyse taze lastik için son bir pit-stop düşünebilirsiniz.");
        }
        recommendations.unshift(`Yarış Aşaması: ${raceStageMessage} (Tur ${L} / ${R})`);


        // 4. Karar Noktası: Lastik Aşınması / Pit Stop Mantığı
        // IF T = soft AND L > 15 THEN Recommend: pit-stop needed, tires might be worn out.
        if (T === 'soft' && L > 15) {
            recommendations.push("Soft lastikleriniz aşınmış olabilir. Performans kaybı yaşıyorsanız pit-stop yapın.");
        }
        // IF T = medium AND L > 25 THEN Recommend: consider pit-stop, tires might be losing performance.
        else if (T === 'medium' && L > 25) {
            recommendations.push("Medium lastiklerinizin performansı düşüyor olabilir. Pit-stop değerlendirin.");
        }
        // IF T = hard AND L > 35 THEN Recommend: long stint possible, monitor performance.
        else if (T === 'hard' && L > 35) {
            recommendations.push("Hard lastiklerinizle uzun bir stint atmak mümkün. Ancak performansı ve aşınmayı izlemeye devam edin.");
        }

        // 5. Karar Noktası: Pist Tipine Özel Öneriler
        // IF P = street AND W = dry THEN Recommend: soft tires can be used, but high wear risk due to street circuit characteristics.
        if (P === 'street' && W === 'dry') {
            recommendations.push("Pist Özelliği: Sokak pistlerinde soft lastikler tercih edilebilir ancak duvarlara yakın sürüş ve yüksek aşınma riski vardır. Özellikle viraj çıkışlarında dikkatli olun.");
        }
        // IF P = track AND W = dry THEN Recommend: flexible tire choice based on strategy.
        else if (P === 'track' && W === 'dry') {
            recommendations.push("Pist Özelliği: Normal pistlerde lastik seçimi stratejinize göre esneklik gösterir. Genellikle dengeli bir lastik aşınması beklenir.");
        }

        // 6. Karar Noktası: Hava Durumu Değişimine Göre Sürüş Tarzı (Genel olarak mevcut duruma göre)
        // IF W = wet THEN Recommend: drive more cautiously and controlled in wet conditions.
        if (W === 'wet') {
            recommendations.push("Hava Durumu Sürüşü: Islak zeminde daha dikkatli ve kontrollü sürüş yapın, su birikintilerine dikkat edin ve ani manevralardan kaçının.");
        }
        // IF W = dry THEN Recommend: follow the ideal line for optimal grip in dry conditions.
        else { // W === 'dry'
            recommendations.push("Hava Durumu Sürüşü: Kuru zeminde optimal yol tutuşu için ideal çizgiyi takip edin ve lastikleri ısıtmaya özen gösterin.");
        }

        // 7. Önerileri Göster (Beklenen Kullanıcı Etkileşimi 1 & 3: Sistem Y ile yanıt verir / Koşul karşılandığında bir sonraki adıma geçer)
        if (recommendations.length === 0) {
            strategyOutput.textContent = "Mevcut durum için özel bir öneri bulunamadı. Her şey yolunda görünüyor!";
        } else {
            strategyOutput.innerHTML = recommendations.map(rec => `- ${rec}`).join('<br>');
        }
    });

    // Kullanıcı girişleri değiştiğinde hataları temizle (Görsel geri bildirim)
    trackTypeSelect.addEventListener('change', clearErrors);
    weatherConditionSelect.addEventListener('change', clearErrors);
    tireTypeSelect.addEventListener('change', clearErrors);
    currentLapInput.addEventListener('input', clearErrors);
    totalLapsInput.addEventListener('input', clearErrors);
});
