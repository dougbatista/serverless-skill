const Alexa = require('ask-sdk-core');
const { getPriceByTicket } = require('./utils/getFinancial');
const repository = require('./repository/dynamoDB');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {

        const speakOutput = 
            `Olá, seja bem-vindo ao seu assistente financeiro. Consigo consultar as ações do ibovespa, montar uma carteira de ações com as que você escolher e listar a sua carteira. O que vai querer pra hoje? `;
        const speakReprompt = 'Só consigo te ajudar com ações de empresas nacionais por enquanto!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakReprompt)
            .getResponse();
    }
};

const PerguntaIndiceIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PerguntaIndice';
    },
    async handle(handlerInput) {

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        const cotacaoSlotValue = Alexa.getSlotValue(handlerInput.requestEnvelope, 'cotacao');
        const message = await getPriceByTicket(cotacaoSlotValue);
        const speakOutput = message + ' Você deseja consultar o valor de mais alguma ação?';
        const reprompt = 'Me diga qual ação você quer consultar.'

        sessionAttributes.previousIntent = Alexa.getIntentName(handlerInput.requestEnvelope);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(reprompt)
            .getResponse();
    }
};

const AdicionarAcaoCarteiraHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AdicionaAcao';
    },
    async handle(handlerInput) {

        const accessToken = Alexa.getAccountLinkingAccessToken(handlerInput.requestEnvelope);
        console.log('TOKEN :: ', accessToken);

        let speakOutput = '';

        if (!accessToken) {
            speakOutput = 'Você precisa estar logado para acessar essa função. Por favor, efetue o account linking no seu aplicativo Alexa.';
        }
        else {
            try {
                
                const acao = Alexa.getSlotValue(handlerInput.requestEnvelope, 'acao');
                const userId = Alexa.getUserId(handlerInput.requestEnvelope);
                
                if (!acao) {
                    speakOutput = 'Qual ação você deseja adicionar?';
                }
                else {
                    const getData = await repository.get(userId);
    
                    if (Object.keys(getData).length !== 0) {
                        const { acoes } = getData.Item;
                        const acoesLength = acoes.length + 1;
                        await repository.update({ acao, userId, acoesLength });
                        speakOutput = 'Você atualizou a sua carteira de investimentos! Consulte agora a sua carteira atualizada ou continue adicionando ações.';
                    }
                    else {
                        let acoesArray = [];
                        acoesArray.push(acao);
                        await repository.insert({ acoesArray, userId });
                        speakOutput = 'Você criou uma carteira! Consulte agora as ações na sua carteira ou continue adicionando novas ações.';
                    }
                }

            } catch (err) {
                console.log('Mostrando erro da promise :: ', err);
                throw err;
            }
        };

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const ConsultarCarteiraAcoes = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ConsultarCarteiraAcao';
    },
    async handle(handlerInput) {

        const accessToken = Alexa.getAccountLinkingAccessToken(handlerInput.requestEnvelope);
        let speakOutput = '';

        if (!accessToken) {
            speakOutput = 'Você precisa estar logado para acessar essa função. Por favor, efetue o account linking no seu aplicativo Alexa.';
        }
        else {
            try {

                const userId = Alexa.getUserId(handlerInput.requestEnvelope);

                const getData = await repository.get(userId);

                if (Object.keys(getData).length !== 0) {
                    const { acoes } = getData.Item;

                    console.log('MOSTRANDO AÇÕES', acoes);

                    if(acoes.length === 1) {
                        speakOutput = 
                            `Você possui apenas a ação da empresa ${acoes[0]}. Deseja consultar?`
                    } else {
                        acoes.splice(acoes.length - 1, 0, 'e');                        
                        speakOutput = 
                            `Você possui as ações das empresas ${ acoes.join(' ').replace(' ', ',') }. Qual delas você deseja consultar?`
                    }                    
                }
                else {
                    speakOutput = 'Você ainda não possui nenhuma ação na sua carteira. Adicione algumas ações e tente consultar novamente!';
                }
            } catch (err) {
                throw err;
            }
        };

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HistoriaIbovespa = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HistoriaIbovespa';
    },
    async handle(handlerInput) {

        let messageStep = 0;
        let messages = [
            'O Ibov foi criado em 1968, pela Bolsa de Valores de São Paulo (que hoje é chamada de B3, após incorporar outras instituições importantes desse mercado). Quer continuar ouvindo a história?',
            'O Índice Bovespa surgiu a partir de uma série de mudanças que buscavam modernizar a estrutura do mercado financeiro do país. Quer continuar ouvindo a história?',
            'Ou seja, o Ibovespa foi criado pensando em uma forma de oferecer mais dados e informações técnicas para facilitar a avaliação dos investimentos feitos por aqui. Deseja repetir a história?'
        ];

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const speakOutput = messages[0];

        messageStep++;

        sessionAttributes.previousIntent = Alexa.getIntentName(handlerInput.requestEnvelope);
        sessionAttributes.HistoriaIbovespa = messages;
        sessionAttributes.messageStep = messageStep;


        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Você pode me pedir para retornar os valores das ações que desejar. Me diga, por exemplo: vale';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const YesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
    },
    handle(handlerInput) {

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let speakOutput = '';

        switch (sessionAttributes.previousIntent) {
            case 'PerguntaIndice':
                speakOutput = 'Me diga a ação que você deseja consultar.'
                break;
            case 'HistoriaIbovespa':
                let { HistoriaIbovespa, messageStep } = sessionAttributes;

                speakOutput = HistoriaIbovespa[messageStep];

                if (messageStep === HistoriaIbovespa.length) {
                    messageStep = 0;
                    speakOutput = HistoriaIbovespa[messageStep];
                    messageStep++;
                }
                else {
                    messageStep++;
                }
                sessionAttributes.messageStep = messageStep;
                break;
            default:
                speakOutput = 'Me desculpe, não sei do que você está falando!'
                break;
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const NoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent';
    },
    handle(handlerInput) {

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let speakOutput = '';

        switch (sessionAttributes.previousIntent) {
            case 'PerguntaIndice':
                speakOutput = 'Tudo bem então. Te aguardo para mais dúvidas.'
                sessionAttributes.previousIntent = '';
                break;
            case 'HistoriaIbovespa':
                sessionAttributes.previousIntent = '';
                sessionAttributes.HistoriaIbovespa = [];
                sessionAttributes.messageStep = 0;
                speakOutput = 'Tudo bem então. Te aguardo para mais dúvidas';
                break;
            default:
                speakOutput = 'Me desculpe, não sei do que você está falando!'
                break;
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Te vejo na hora do fechamento do mercado. Até mais tarde!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Poxa, ainda não estou pronta para te responder sobre isso! Mas não se preocupe, estou sempre evoluindo para melhor atendê-lo!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Me desculpe, estou tendo dificuldades em processar os seus pedidos! Por favor, tente novamente mais tarde.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        PerguntaIndiceIntentHandler,
        AdicionarAcaoCarteiraHandler,
        ConsultarCarteiraAcoes,
        HelpIntentHandler,
        HistoriaIbovespa,
        YesIntentHandler,
        NoIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler
    ).lambda();