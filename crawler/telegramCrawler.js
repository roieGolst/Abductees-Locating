const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { Api } = require("telegram/tl");

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const prompts  = require("prompts");

const configs = require("./configs.json");

async function bootstrap() {
    const client = new TelegramClient(new StringSession(configs.api.stringSession), configs.api.id, configs.api.hash, {
        connectionRetries: 5
    });

    await client.start({
        phoneNumber: async () => (await prompts({type: "text", name: "phoneNumber", message: "Phone number:"})).phoneNumber,
        password: async () => (await prompts({type: "text", name: "password", message: "Password:"})).password,
        phoneCode: async () => (await prompts({type: "text", name: "phoneCode", message: "Verification code:"})).phoneCode,
        onError: (err) => console.log(err),
    });
    
    console.log('You should now be connected.');
    console.log(client.session.save());

    return client;
}

async function downloadMedia(client, media) {
    const buffer = await client.downloadMedia(media, {
        workers: 3
    });

    let ext = undefined;

    switch(media.className) {
        case "MessageMediaDocument": {
            ext = "mp4";
            break;
        }

        case "MessageMediaPhoto": {
            ext = "jpeg";
            break;
        }
    }

    if(!ext) {
        return;
    }

    const fileName = path.join(configs.crawlerConfigs.MEDIA_DIR, `${crypto.randomBytes(32).toString('hex')}.${ext}`);

    console.log(fileName);

    fs.writeFileSync(fileName, buffer, {
        "flag": "w+"
    })

    console.log("Downloaded");
    
}

async function channelCrawler(client, channel, offset = 0) {
    
    const result = await client.invoke(
        new Api.messages.GetHistory({
            peer: channel,
            addOffset: offset,
            limit: 100,
            minId: 0,
            // hash: BigInt("-4156887774564"),
        })
    );

    if(!result.messages || !result.messages.length) {
        console.error("There's no relevant messages in this channel");
        return;
    }

    for(messageObj of result.messages) {
        if(messageObj.date <= configs.crawlerConfigs.WAR_TIME) {
            console.error("Stopping the flow in case of the limit date is smaller than the current message date");
            return;
        }
``
        if(!messageObj.media) {
            continue;
        }

        console.log(`Downloading video for message id; ${messageObj.id}`);
        
        try {
            downloadMedia(client, messageObj.media)
                .catch((error) => {
                    console.error(`Failed to download ${JSON.stringify(downloadMedia)}. Message: ${error.message}`);
                })
        }
        catch(e) {
            console.error
        } 
    }

    channelCrawler(client, channel, offset + configs.crawlerConfigs.OFFSET_LIMIT);
}

(async() => {
    const client = await bootstrap();
    channelCrawler(client, configs.crawlerConfigs.channelName);
})();