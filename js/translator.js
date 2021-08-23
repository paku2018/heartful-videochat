'use strict'

// Google Cloud Services
process.env.GOOGLE_APPLICATION_CREDENTIALS = "./js/hourglass-be5b24429763.json";

// Translate
const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate();

// Text-to-Speech
const textToSpeech = require('@google-cloud/text-to-speech');
const TTS = new textToSpeech.TextToSpeechClient();

let languages = {};

module.exports = {
    setlog: function(log, logf) {
        this.log = log;
        this.logf = logf;
    },
    language_list: async function(ws, locale) {
        const hf = locale.indexOf('-');
        if (hf >= 0) locale = locale.slice(0, hf);
        if (languages[locale] === undefined) {
            [languages[locale]] = await translate.getLanguages(locale).catch((err) => {
                this.log.error('Error getLanguages', ws.client_ip_address, locale);
                return;
            });
        }
        ws.send(JSON.stringify({
            type: 'languages',
            locale: locale,
            languages: languages[locale]
        }));
        /*
        // tts
        const [result] = await TTS.listVoices({});
        const voices = result.voices;
        console.log('Voices:');
        voices.forEach(voice => {
            console.log(`Name: ${voice.name}`);
            console.log(`  SSML Voice Gender: ${voice.ssmlGender}`);
            console.log(`  Natural Sample Rate Hertz: ${voice.naturalSampleRateHertz}`);
            console.log('  Supported languages:');
            voice.languageCodes.forEach(languageCode => {
                console.log(`    ${languageCode}`);
            });
        });
        */
    },
    translate: async function(ws, payload) {
        payload.original = payload.message;
        [payload.message] = await translate.translate(payload.message, payload.locale).catch((err) => {
            this.log.error(err);
            return;
        });
        ws.send(JSON.stringify({
            type: 'translated',
            payload: payload
        }));
    },
    speech: async function(ws, payload) {
        const request = {
            input: { text: payload.message },
            voice: {
                languageCode: payload.locale,
                ssmlGender: payload.gender,
                //ssmlGender: 'SSML_VOICE_GENDER_UNSPECIFIED', //未指定の性別
                //ssmlGender: 'MALE', //	男性の声
                //ssmlGender: 'FEMALE', //	女性の声
                //ssmlGender: 'NEUTRAL', // 中立な声(unsupported yet?)
                //name: "ja-JP-Standard-A",
                //name: "ja-JP-Wavenet-A",
                //name: "en-US-Standard-B", // error
            },
            audioConfig: { audioEncoding: 'OGG_OPUS' },
        };
        const [response] = await TTS.synthesizeSpeech(request).catch((err) => {
            this.log.error('TTS.synthesizeSpeech', err);
            return;
        });
        ws.send(JSON.stringify({
            type: 'tts',
            payload: 'data:audio/ogg;codecs=opus;base64,' + response.audioContent.toString('base64')
        }));
    }
}