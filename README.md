# Core DEMO

全体の構成と流れについて説明します。

[APIリファレンス](README_Api.md)

## Directory

### backend
* dist/ 配布ファイル
* src/ モジュールソース
* js/ サーバーモジュールソース
* server.js サーバープログラム
* config.json 設定ファイル
* .channels チャンネル番号インクリメンタルファイル
* *.log ログファイル

### frontend
フロントはアプリ側での構成サンプルとなっています。
UIには、bootstrapを使っています。
* media/ デモ用サウンドファイル
* src/ アプリケーションソース(send.js,recv.js)
* index.html, send.html, recv.html

### framework
webpackを使ってモジュールビルドできます。
* src/index.js エントリー

## 実行手順

### Setup
必要なnodeモジュールのロード
```
$ npm i
```
bundle.js作成
```
$ npm run build
```
モジュールのデバッグする場合
```
$ npm run watch
```

### Start
サーバー起動。デフォルトポート：8000
```
$ npm start
```

## 操作

### send.html (配信)
* Channel
    - Open
        - チャンネル作成
    - Start
        - 配信開始
    - Stop
        - 配信停止
    - Close
        - チャンネル削除
* Audio
    - Transcribe
        - 文字起こし(Speech to text)
    - Music
        - ボリューム
        - ファイル選択
            - デモではスタティックファイルのリスト選択
            - 配信中のみ受信者に選択情報が送信される
* Message
    - チャットメッセージダイアログ表示
    - 言語メニューで翻訳言語を選ぶ事ができる
    - Speech On/off Male/Female
    - Channel接続されている全てに送られる

### recv.html (受信)
* Channel
    - Open
        - チャンネル接続
        - チャンネルリスト選択ダイアログ表示
    - Start
        - 受信開始
    - Stop
        - 受信停止
    - Close
        - チャンネル切断
* Audio / Music
    - ボリューム
    - Stop
        - 現在再生中の音楽を停止
* Message
    配信側と同じ
