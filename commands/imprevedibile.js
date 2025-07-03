const { Client, GatewayIntentBits, SlashCommandAssertions, SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const { createWriteStream } = require('fs');
const googleTTS = require('google-tts-api');
const prism = require('prism-media');
const { spawn } = require('child_process');
const axios = require('axios');
const intervalState = require('../utilities/intervalState');
const { execute } = require("./insulta")

module.exports = {
    name: "incazzato",
    description: "marco ti insulta, ma quando non te lo aspetti",
    async execute ({client, interaction}) {
        let intervalTime = 3;

        if(intervalState.getIntervalId()) {
            interaction.reply("marco è già pronto a bestemmiare");
        } else {
            if(interaction.member.voice.channel) {
                const connection = joinVoiceChannel({
                    channelId: interaction.member.voice.channel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator
                });
            }
    
            const intervalId = setInterval( () => {
                const insulta = require("./insulta");
                insulta.execute({client, interaction});
                intervalTime = Math.floor(Math.random() * 3) + 2;
            }, intervalTime * 60 * 1000); 
    
            intervalState.setIntervalId(intervalId);
            await interaction.reply("buongiorno figli di puttana");
        }     
    }
}

