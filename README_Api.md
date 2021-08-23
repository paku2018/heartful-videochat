# Module API Reference

- [Core](#Core)
    - [worker.onmessage](#websocketonmessage)
- [Audio](#Audio)
    - [worker.onmessage](#opusworkeronmessage)
- [Video](#Video)
    - [worker.onmessage](#mjpegworkeronmessage)

---
### Core

##### worker Core.worker()
websocketワーカー作成。現在は`wsocket.js`
- return: ワーカーインスタンス

##### void Core.init(mw,cw)
初期化
* mw: マスターワーカー
* cw: チャンネルワーカー

##### void Core.connect(origin)
masterに接続
* origin: URL

##### origin Core.config(config)
ws接続時に送られてくるconfigデータをセットする
* config: コンフィグデータ

##### void Core.text_submit()
エレメント`_txt_name`,`_txt_text`,`_txt_language`の情報を送信

##### void Core.text_translate(json)
受信したテキストメッセージの翻訳リクエスト

##### void Core.text_append(json)
エレメント`_txt_msg`にテキストメッセージを追加

##### void Core.text_language_list(json)
受信した言語リストをエレメント`_txt_language`に追加

##### void Core.text_languages()
言語リストのリクエスト

##### void Core.text_speech(payload)
text-to-speechの音声を再生する

#### void Core.transcribe_stream(inputBuffer,locale)
transcribe 配信
* inputBuffer: audio recorder buffer
* locale: language locale

##### void Core.music(audio, music)
オーディオ再生
* audio: audioエレメント
* music: audio.srcにセット可能なオーディオファイルへのパス
musicにnullをセットすると停止

##### void Core.audio_data(payload)
エンコードされたオーディオチャンクを送信

##### void Core.video_data(payload)
エンコードされたビデオチャンクを送信

##### void Core.channel_open(id, name)
チャンネルの作成リクエスト
* id: user-id
* name: user-name
パラメータは暫定

##### void Core.channel_close(threadId)
チャンネルの停止リクエスト
* threadId: チャンネルワーカースレッドID

##### void Core.channel_start()
チャンネル配信開始

##### void Core.channel_stop()
チャンネル配信停止

##### void Core.channel_list()
チャンネルリストのリクエスト

##### void Core.channel_connect(origin)
チャンネルに接続

##### void Core.channel_disconnect()
チャンネルを切断

##### void Core.fetch_start()
フェッチ開始

##### void Core.fetch_stop()
フェッチ停止

##### void Core.get_uuid()
CookieからUUIDを取得。
/send または /recv でアクセスすることでサーバからUUIDが得られる

##### void Core.show_alert(elem,type,msg)
アラートメッセージ表示
* elem: エレメントオブジェクト
* type: 'info','warning','danger',etc..
* msg: メッセージ

#### websocket.onmessage
* type:'connect' __(mw/cw)__
    接続メッセージ
    * result:'open','close','error'
    * error: エラーメッセージ
* type:'config' __(mw)__
    設定メッセージ
    * config:設定情報
* type: 'opened' __(mw)__
    チャンネルオープン
    * threadId
    * port
* type: 'closed' __(mw)__
    チャンネルクローズ
    * threadId
* type: 'languages' __(mw)__
    ランゲージリスト
    * locale: ロケール
    * languages: 言語リスト
* type: 'list' __(cw)__
    チャンネルリスト
    * channel: チャンネルリスト
* type: 'text' __(cw)__
    テキストメッセージ
    * payload.locale: ロケール
    * payload.message: メッセージ
* type: 'translated' __(cw)__
    翻訳メッセージ
    * payload.locale: ロケール
    * payload.message: メッセージ
* type: 'transcription' __(cw)__
    文字起こしメッセージ
    * locale: ロケール
    * text: メッセージ
* type: 'listener' __(cw)__
    リスナー数（暫定）
    * num: リスナー数
* type: 'video' __(cw)__
    ビデオチャンク
    * payload: チャンクデータ
* type: 'audio' __(cw)__
    ビデオチャンク
    * payload: チャンクデータ
* type: 'music' __(cw)__
    ミュージック
    * src：ソース URL
* type: 'fetch' __(cw)__
    フェッチ
    * method: 'start','stop','none'

---
### Audio
opusエンコード、デコード ワーカーハンドラー

##### worker Audio.encoder(sample_rate, stereo, bit_rate) 
エンコードワーカー作成。現在は`opus_encoder.js`
* sample_rate: サンプルレート(Hz)
* stereo: true or false
* bit_rate: ビットレート(bps)
- return: ワーカーインスタンス

##### worker Audio.decoder(sample_rate, stereo)
デコードワーカー作成。現在は`opus_decoder.js`
* sample_rate: サンプルレート(Hz)
* stereo: true or false
- return: ワーカーインスタンス

##### recorder Audio.recorder(stream)
レコーダーノード作成
* stream: getUserMediaのstream

##### void Audio.encode(inputBuffer)
エンコードリクエスト。完了すると'data'メッセージが発生
* inputBuffer: レコーダノードのonaudioprocessに渡されるinputBuffer

##### void Audio.decode(payload)
デコードリクエスト。完了すると'data'メッセージ発生
* payload: 受信したarrayBuffer

##### time Audio.play(pcmArray, time)
スケジュール再生
time: scheduled time

#### opus(worker).onmessage
* type:'ready'
    準備完了
* type:'data'
    チャンクデータ
    * payload: チャンクデータ
* type:'error'
    エラー
    * error: メッセージ

---

### Video
mjpegワーカーハンドラー

##### worker Video.worker()
ワーカー作成。現在は`mjpeg.js`
- return: ワーカーインスタンス

##### void Video.frame(canvas,quality)
イメージエンコード
* canvas: canvasエレメント
* quality: エンコードクオリティ

##### void Video.encode(fps)
チャンクデータリクエスト。完了すると'data'メッセージ発生
* fps: FPS

##### void Video.decode(payload)
チャンクデータデコード
* payload: チャンクデータ

##### void Video.play()
チャンク再生リクエスト。fpsのタイミングで'frame'メッセージが発生

#### mjpeg(worker).onmessage
* type:'data'
    チャンクデータ
    * payload: チャンクデータ
* type:'frame'
    フレームデータ
    * blob: Blob('image/jpeg')
