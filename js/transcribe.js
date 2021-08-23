'use strict'

// Google Cloud Services
process.env.GOOGLE_APPLICATION_CREDENTIALS = "./js/hourglass-be5b24429763.json";
const speech = require('@google-cloud/speech');
const client = new speech.SpeechClient();

let recognizeStream = null;
let language = 'ja';

module.exports = {
    setlog: function(log, logf) {
        this.log = log;
        this.logf = logf;
    },
    stream: async function(chunk, locale, cb) {
        if (recognizeStream == null || language != locale) {
            if (recognizeStream) {
                recognizeStream.end();
            }
            language = locale;
            const speechContext = [{
                phrases: ['$TIME']
            }];
            const config = {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: language,
                //enableWordConfidence: true,
                profanityFilter: true,
                speechContexts: speechContext,
                //enableWordTimeOffsets: true,
                //enableAutomaticPunctuation: true,
                metadata: {
                    interactionType: 'DICTATION',
                    //microphoneDistance: 'NEARFIELD',
                    //microphoneDistance: 'MIDFIELD',
                    microphoneDistance: 'FARFIELD',
                    //originalMediaType: 'AUDIO',
                },
                //model: 'command_and_search', // 'default'
                model: 'default'
            };
            const request = {
                config,
                interimResults: true,
                //interimResults: false,
            };
            recognizeStream = client.streamingRecognize(request)
                .on('error', err => {
                    if (err.code === 11) {
                        //recognizeStream.end(); recognizeStream already destroyed
                        recognizeStream = null;
                        this.log.info('reconizeStream destoryed due to timeout');
                    } else {
                        this.log.error('API request error ' + err.code, err);
                    }
                })
                .on('data', response => {
                    if (response.results[0].isFinal) {
                        const transcription = response.results
                            .map(result => {
                                return result.alternatives[0].transcript;
                            })
                            .join('\n');
                        //
                        cb(transcription);
                    }
                });
        }
        recognizeStream.write(chunk);
    },
    end: function() {
        if (recognizeStream) {
            this.log.info('recognizeStream.end()');
            recognizeStream.end();
            recognizeStream = null;
        }
    }
}