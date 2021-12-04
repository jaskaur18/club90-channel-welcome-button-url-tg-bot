require("dotenv").config()

const { Telegraf, session, Stage, BaseScene } = require('telegraf')
const { BOT_TOKEN, button_regex } = process.env
var fs = require('fs');
const stage = new Stage();
let message_id = false

function chunkArrayInGroups(arr, size) {
    var myArray = [];
    for (var i = 0; i < arr.length; i += size) {
        myArray.push(arr.slice(i, i + size));
    }
    return myArray;
}


const init = async (bot,) => {

    /**
     * BaseScene
     */
    const welcomemsg = new BaseScene("set-welcomemsg");
    stage.register(welcomemsg);

    const welcomebutton = new BaseScene("set-welcomebutton");
    stage.register(welcomebutton);


    /**
     * Middlewares
     */
    bot.use(session())
    bot.use(stage.middleware());


    /**
     * Handlers
     */
    // bot.hears(/[\S\s]*/, hearsHandler())
    bot.on('new_chat_members', async (ctx) => {
        await ctx.deleteMessage().catch(err => console.log("errr"))
        if (message_id)
            await ctx.deleteMessage(message_id).catch(err => console.log("errr"))
        await fs.readFile('welcome.json', 'utf8', async function readFileCallback(err, data) {
            if (err) {
                console.log(err);
            } else {
                obj = JSON.parse(data); //now it an object
                button = obj.welcome[0]
                message = button.message
                url = button.url
                message = await ctx.reply(`${message}`, { reply_markup: { inline_keyboard: url } }).catch(console.log)
                message_id = message.message_id
            }
        });

    })
    // bot.on('left_chat_member', leftChatMemberHandler())


    /**
     * Commands
     */
    bot.start(async (ctx) => {
        await ctx.reply(`Welcome To The Bot`)

        await fs.readFile('welcome.json', 'utf8', async function readFileCallback(err, data) {
            if (err) {
                console.log(err);
            } else {
                obj = JSON.parse(data); //now it an object
                button = obj.welcome[0]
                message = button.message
                url = button.url
                await ctx.reply(`${message}`, { reply_markup: { inline_keyboard: url } })
            }
        });

    })

    bot.command('send', async (ctx) => {
        try {
            await ctx.reply(`Welcome To The Bot`)
            username = (ctx.message.text).split(" ")[1]
            await fs.readFile('welcome.json', 'utf8', async function readFileCallback(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    obj = JSON.parse(data); //now it an object
                    button = obj.welcome[0]
                    message = button.message
                    url = button.url
                    await ctx.telegram.sendMessage(username, `${message}`, { reply_markup: { inline_keyboard: url } }).catch(console.log)
                }
            });
        } catch (err) {
            ctx.reply(err)
        }

    })

    bot.command('setwelcome', async (ctx) => {
        await ctx.reply("Enter Welcome Text To Set")
        ctx.scene.enter("set-welcomemsg")
    })

    welcomemsg.on("message", async (ctx) => {
        ctx.session.welcomemsg = ctx.message.text;
        await ctx.reply(`
Now Enter Button Url In Each New Line ex-
buttontext1 google.com
buttontext2 google.com
buttontext3 google.com
        `).catch(console.log)
        ctx.scene.enter("set-welcomebutton")
    })

    welcomebutton.on("message", async (ctx) => {

        ctx.session.buttons = ctx.message.text
        bmessage = `${ctx.message.text}`
        buttons = String(bmessage).split("\n")

        buttonsdata = buttons.map(e => {
            text = e.split(" ")[0]
            url = e.split(" ")[1]
            return { text: text, url: `${url}` };
        })

        buttonsdata = chunkArrayInGroups(buttonsdata, 2)

        buttonsave = {
            welcome: []
        }

        buttonsave.welcome.push({ message: `${ctx.session.welcomemsg}`, url: buttonsdata })
        buttonjson = JSON.stringify(buttonsave);
        fs.writeFile('welcome.json', buttonjson, 'utf8', function (err) {
            if (err) throw err;
            console.log('complete');
        }
        );

        await ctx.reply("Welcome Welcome As Been Set Remove And ReAdd The Bot To See Message", { reply_markup: { inline_keyboard: buttonsdata } }).catch(console.log)
        ctx.scene.leave()
    })


    return bot
}

/**
 * Init bot function.
 *
 * @param {Telegraf} bot The bot instance.
 * @param {Object} dbConfig The knex connection configuration.
 * @return {Promise<Telegraf>} Bot ready to launch.
 */

init(new Telegraf(BOT_TOKEN))
    .then((bot) => {
        /**
         * Run
         */
        bot.launch(console.log("BOt Started Working"))
    })
    .catch(console.log)

module.exports = init