import Alexa from 'alexa-sdk';
import fetch from 'node-fetch';

const APP_ID = process.env.ALEXA_APP_ID;

const languageStrings = {
  en: {
    translation: {
      NEXT_MESSAGE: 'The next SpaceX launch will be on %s',
      NEXT_MISSION_MESSAGE: 'The next SpaceX launch will be %s on %s',
      NO_LAUNCH_MESSAGE: 'Sorry, I could not find the next SpaceX launch',
      HELP_MESSAGE:
        'You can ask me when is the next launch, or you can say exit... What can I help you with?',
      HELP_REPROMPT: 'What can I help you with?',
      STOP_MESSAGE: 'Goodbye!',
      UNHANDLED_MESSAGE: "Sorry, I didn't get that",
    },
  },
};

const handlers = {
  LaunchRequest() {
    this.emit('AMAZON.HelpIntent');
  },
  SessionEndedRequest() {
    console.log('Session ended');
  },
  Unhandled() {
    this.emit(':tell', this.t('UNHANDLED_MESSAGE'));
    this.emit('AMAZON.HelpIntent');
  },
  'AMAZON.HelpIntent'() {
    const speechOutput = this.t('HELP_MESSAGE');
    const reprompt = this.t('HELP_MESSAGE');
    this.emit(':ask', speechOutput, reprompt);
  },
  'AMAZON.CancelIntent'() {
    this.emit(':tell', this.t('STOP_MESSAGE'));
  },
  'AMAZON.StopIntent'() {
    this.emit(':tell', this.t('STOP_MESSAGE'));
  },
  LaunchDateTimeIntent() {
    console.log('Received LaunchDateTimeIntent');
    // Use launchlibrary.net to find the next SpaceX launch
    fetch(
      'https://launchlibrary.net/1.2/launch?' +
        'mode=verbose&' +
        'limit=1&' +
        'agency=spx&' +
        // Find launches today or later
        `startdate=${new Date().toISOString().slice(0, 10)}`,
    )
      .then(response => response.json())
      .then(json => {
        if (json.launches.length == 0) {
          console.error('No launches found in response');
          this.emit(':tell', this.t('NO_LAUNCH_MESSAGE'));
        } else {
          const launch = json.launches[0];

          // Use NET (no-earlier-than) date
          // Format provided is "YYYYmmddTHHMMSSZ"; use only the YYYYmmdd part
          const date = launch.isonet.slice(0, 8);

          console.error('Found next SpaceX launch:', date);
          if (launch.missions.length > 0) {
            const mission = launch.missions[0];
            this.emit(
              ':tell',
              this.t(
                'NEXT_MISSION_MESSAGE',
                mission.name,
                `<say-as interpret-as="date">${date}</say-as>`,
              ),
            );
          } else {
            this.emit(
              ':tell',
              this.t(
                'NEXT_MESSAGE',
                `<say-as interpret-as="date">${date}</say-as>`,
              ),
            );
          }
        }
      })
      .catch(error => {
        console.error('Failed to fetch next launch', error.message);
        this.emit(':tell', this.t('NO_LAUNCH_MESSAGE'));
      });
  },
};

export default function(event, context, callback) {
  const alexa = Alexa.handler(event, context, callback);
  alexa.APP_ID = APP_ID;
  alexa.resources = languageStrings;
  alexa.registerHandlers(handlers);
  alexa.execute();
}
