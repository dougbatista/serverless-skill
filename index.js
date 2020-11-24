/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const ddbAdapter = require('ask-sdk-dynamodb-persistence-adapter');
const { getPriceByTicket } = require('./utils/getFinancial');
const respository = require('./model/dynamoDB');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {

        const speakOutput = 'Olá, bem vindo ao seu assistente do financeiro. De qual ação você deseja saber a cotação?';
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

        const persistenceSessionAttributes = handlerInput.attributesManager;

        const acaoCarteira = Alexa.getSlotValue(handlerInput.requestEnvelope, 'cotacao');
        const userId = Alexa.getUserId(handlerInput.requestEnvelope);


        try {
            
            await respository.teste();

            return handlerInput.responseBuilder
                .speak('Inserido com sucesso!')
                .reprompt('Inserido com sucesso!')
                .getResponse();

        } catch (err) {
            console.log('MEU ERRO ::: ', err);
            throw err;
        }
        
    }
};

const HistoriaIbovespa = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HistoriaIbovespa';
    },
    async handle(handlerInput) {

        let messageStep = 0;
        let messageSteps = 3;

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
        sessionAttributes.messageSteps = messageSteps;

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
                sessionAttributes.messageSteps = 0;
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
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
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
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
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
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
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
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
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

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        PerguntaIndiceIntentHandler,
        AdicionarAcaoCarteiraHandler,
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
    )
    .withPersistenceAdapter(
        new ddbAdapter.DynamoDbPersistenceAdapter({
            tableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
            createTable: false,
            dynamoDBClient: new AWS.DynamoDB({ apiVersion: 'latest', region: process.env.DYNAMODB_PERSISTENCE_REGION })
        })
    )
    .lambda();