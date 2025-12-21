/* =========================================
   設定とデータ
   ========================================= */
const DEMO_MODE = false; 

const triviaList = [
    "和歌山県は日本一のみかん生産量を誇ります。",
    "美味しいみかんは、皮のツブツブ（油胞）がきめ細かいと言われています。",
    "みかんの白い筋には栄養（ヘスペリジン）がたっぷり含まれています。",
    "「有田みかん」は和歌山を代表するブランドみかんです。",
    "和歌山の段々畑は、水はけを良くし、太陽の光をたっぷり浴びるための工夫です。",
    "みかんを食べると風邪予防になると昔から言われています。",
    "ベテラン農家は、みかんの色だけでなく「重さ」でも味を見分けます。",
    "和歌山では、ヘタのない方から実を半分に割って皮ごと剥く『有田むき』が一般的です。", 
    "美味しいみかんは、空からの太陽、海からの照り返し、石垣からの照り返しの『３つの太陽』で育つと言われています。", 
    "みかんの木の下に白いシートを敷くのは、光を反射させ、水分を調整して甘みを極限まで引き出すためです。", 
    "みかんの皮を乾燥させた『陳皮（ちんぴ）』は、入浴剤や七味唐辛子の材料として古くから利用されています。", 
    "和歌山県海南市にある『橘本（きつもと）神社』は、日本で唯一のみかんの神様を祀っている神社です。", 
    "伝説の豪商・紀伊國屋文左衛門は、嵐の中、船で江戸へみかんを運び巨万の富を得たと言い伝えられています。", 
    "最近人気の品種『ゆら早生（わせ）』は、見た目が青くても驚くほど甘いのが特徴です。"
];

let stream = null;
const videoElement = document.getElementById('video-preview');
const imagePreview = document.getElementById('image-preview');
const fileInput = document.getElementById('file-upload');
const analyzeBtn = document.getElementById('analyze-btn');
const captureBtn = document.getElementById('capture-btn');
const retakeBtn = document.getElementById('retake-btn'); 
const resultArea = document.getElementById('result-area');
const loadingOverlay = document.getElementById('loading-overlay');
const triviaText = document.getElementById('trivia-text');
const placeholderText = document.getElementById('placeholder-text');
const veteranToggle = document.getElementById('veteran-mode');
const modeDescription = document.getElementById('mode-description');

/* =========================================
   UI ロジック（モード切替など）
   ========================================= */
veteranToggle.addEventListener('change', function() {
    if (this.checked) {
        document.body.classList.add('veteran-active');
        modeDescription.textContent = "和歌山弁の厳しい（でも愛情ある）鑑定が受けられます。";
        modeDescription.style.color = "var(--dark-green)";
        modeDescription.style.fontWeight = "bold";
    } else {
        document.body.classList.remove('veteran-active');
        modeDescription.textContent = "標準語で丁寧な鑑定が受けられます。";
        modeDescription.style.color = "#e67e00";
        modeDescription.style.fontWeight = "bold";
    }
});

function resetPreview() {
    imagePreview.style.display = 'none';
    videoElement.style.display = 'none';
    placeholderText.style.display = 'block';
    captureBtn.classList.add('hidden');
    retakeBtn.classList.add('hidden');
    analyzeBtn.classList.add('hidden');
    resultArea.style.display = 'none';
}

/* =========================================
   カメラ & ファイル入力処理
   ========================================= */
fileInput.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        stopCamera();
        const reader = new FileReader();
        reader.onload = function(e) {
            placeholderText.style.display = 'none';
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            videoElement.style.display = 'none';
            
            captureBtn.classList.add('hidden');
            retakeBtn.classList.add('hidden'); 
            analyzeBtn.classList.remove('hidden');
        }
        reader.readAsDataURL(this.files[0]);
    }
});

document.getElementById('start-camera').addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false 
        });
        
        placeholderText.style.display = 'none';
        videoElement.srcObject = stream;
        videoElement.play();
        videoElement.style.display = 'block';
        imagePreview.style.display = 'none';
        resultArea.style.display = 'none';
        
        captureBtn.classList.remove('hidden');
        retakeBtn.classList.add('hidden');
        analyzeBtn.classList.add('hidden');
        
        fileInput.value = ''; 
    } catch (err) {
        alert("カメラを起動できませんでした。\nブラウザの権限設定を確認してください。\nエラー: " + err.message);
    }
});

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

captureBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    canvas.getContext('2d').drawImage(videoElement, 0, 0);
    
    imagePreview.src = canvas.toDataURL('image/jpeg');
    imagePreview.style.display = 'block';
    videoElement.style.display = 'none';
    
    stopCamera();
    
    captureBtn.classList.add('hidden');
    retakeBtn.classList.remove('hidden'); 
    analyzeBtn.classList.remove('hidden');
});

retakeBtn.addEventListener('click', () => {
    document.getElementById('start-camera').click();
});

/* =========================================
   鑑定ロジック (API or Demo)
   ========================================= */
analyzeBtn.addEventListener('click', async () => {
    const isVeteran = veteranToggle.checked;
    const mode = isVeteran ? 'veteran' : 'normal';
    
    showLoading();

    try {
        let resultText = "";

        if (DEMO_MODE) {
            // デモモード
            await new Promise(resolve => setTimeout(resolve, 3500));
            if (isVeteran) {
                resultText = `**【ベテラン農家の鑑定結果】**\n\nおおっ、こらまたええ色したみかんやなぁ！\n皮のツブツブ（油胞）がきめ細かくて、パンっと張っとる。\n\n* 糖度: **12度以上**ありそうやで\n* 酸味: 程よく抜けてて、「コク」がある\n\nスーパーで買うたら高いやつや。大事に食べよしよ！`;
            } else {
                resultText = `**【鑑定結果】**\n\n形状と色味から分析しました。\n\n* **形状**: 扁平（完熟の証）\n* **色味**: 濃い橙色\n\n全体的に非常に状態が良いみかんです。`;
            }
        } else {
            // 本番モード
            const formData = new FormData();
            formData.append('mode', mode);
            const blob = await (await fetch(imagePreview.src)).blob();
            formData.append('file', blob, 'image.jpg');

            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`Server Error: ${response.status}`);
            const data = await response.json();
            resultText = data.result;
        }

        hideLoading();
        resultArea.style.display = 'block';

        // ★★★ ここが変更点です：MarkdownをHTMLに変換して表示 ★★★
        // marked.parse() を使って、**太字** などをHTMLタグに直します
        resultArea.innerHTML = marked.parse(resultText);
        
        resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        hideLoading();
        alert("エラーが発生しました: " + error.message);
    }
});

/* =========================================
   豆知識ローテーション
   ========================================= */
let triviaInterval;

function showLoading() {
    loadingOverlay.style.display = 'flex';
    resultArea.style.display = 'none';
    updateTrivia();
    triviaInterval = setInterval(updateTrivia, 3000);
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
    clearInterval(triviaInterval);
}

function updateTrivia() {
    const randomIndex = Math.floor(Math.random() * triviaList.length);
    triviaText.textContent = triviaList[randomIndex];
}