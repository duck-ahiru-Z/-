import os
from flask import Flask, request, jsonify, send_from_directory
from google import genai
from PIL import Image
import io

# ==========================================
# 1. 設定エリア
# ==========================================
# ★ここにAPIキーを入れてください
api_key = ""

# 新しいクライアントの作成
client = genai.Client(api_key=api_key)

# Webサーバーの準備
app = Flask(__name__, static_folder='.')

# ==========================================
# 2. 賢いAIモデル実行機能（ここが進化！）
# ==========================================
def generate_content_safe(prompt_text, image):
    # 優先して試すモデルのリスト（上から順に試します）
    # もしFlashがダメならPro、それもダメなら...と自動で切り替えます
    model_candidates = [
        "gemini-1.5-flash",       # まずは高速なFlash
        "gemini-1.5-pro",         # ダメなら高性能なPro
        "gemini-2.0-flash-exp",   # 最新の実験版
        "gemini-pro-vision"       # 旧モデル
    ]

    last_error = None

    for model_name in model_candidates:
        try:
            print(f"トライ中: {model_name}...") # ターミナルで確認用
            response = client.models.generate_content(
                model=model_name,
                contents=[prompt_text, image]
            )
            print(f"成功！使用モデル: {model_name}")
            return response.text
        except Exception as e:
            # 失敗したら次へ
            print(f"失敗 ({model_name}): {e}")
            last_error = e
            continue
    
    # 全滅した場合
    raise Exception(f"すべてのモデルで失敗しました。最後のえらー: {last_error}")

# ==========================================
# 3. Webページを表示する機能
# ==========================================
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# ==========================================
# 4. 鑑定リクエストを受け取る機能 (API)
# ==========================================
@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "画像がありません"}), 400
        
        file = request.files['file']
        mode = request.form.get('mode', 'normal')

        # 画像を読み込む
        image = Image.open(file.stream)

        # モードに応じたプロンプト
        if mode == 'veteran':
            prompt_text = """
            あなたはこの道50年の「和歌山のベテランみかん農家」です。
            和歌山弁（〜やで、〜しか、〜やなぁ）を使い、厳しくも愛情たっぷりに以下の画像を鑑定してください。
            1. 第一声（驚きや褒め言葉）
            2. 皮の状態（キメ細かさ、色ツヤ）から見る評価
            3. 味の予想（糖度やコクについて）
            4. 最後に一言（「大事に食べよしよ」など）
            画像がみかんでない場合は、「こら！これはみかんちゃうで！」とツッコミを入れて何であるかを説明してください。
            """
        else:
            prompt_text = """
            あなたはみかん鑑定士です。標準語で論理的かつ丁寧に、みかんの品質を分析してください。また「承知いたしました。」などAIぽいことは言わないでください。
            1. 外観の分析（形状、色味の濃淡）
            2. 品質評価（完熟度、鮮度）
            3. 味の推定（糖度と酸味のバランス）
            4. 最後に一言
            画像がみかんでない場合は、冷静に「これはみかんとして認識できません」と答えて何であるかを説明してください。
            """

        # ここで「賢い関数」を呼び出す
        result_text = generate_content_safe(prompt_text, image)
        
        return jsonify({"result": result_text})

    except Exception as e:
        print(f"エラー発生: {e}")
        return jsonify({"result": f"エラーが発生しました: {str(e)}"}), 500

# ==========================================
# 5. アプリ起動
# ==========================================
if __name__ == '__main__':

    app.run(debug=True, port=5000)
