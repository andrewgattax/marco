const {Client, GatewayIntentBits, SlashCommandAssertions, SlashCommandBuilder, Interaction} = require('discord.js');
const {joinVoiceChannel, createAudioPlayer, createAudioResource} = require('@discordjs/voice');
const {createWriteStream} = require('fs');
const googleTTS = require('google-tts-api');
const prism = require('prism-media');
const {spawn} = require('child_process');
const axios = require('axios');
const {getUsername, addUsername} = require("../utilities/usernameService");
const {spacoCall} = require("../telegram/services/telegramService");
const path = require("node:path");
const {generaBestemmia, generaInsulto} = require("../utilities/botServices");

module.exports = {
    name: "insulta",
    description: "marco insulta uno di voi",
    async execute({client, interaction}) {
        try {
            // IMPORTANTE: Deferisci subito la risposta
            await interaction.deferReply();

            let finalAudio = await generaInsulto(interaction.member.voice.channel);

            if (interaction.member.voice.channel) {
                const connection = joinVoiceChannel({
                    channelId: interaction.member.voice.channel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator
                });

                const player = createAudioPlayer();
                const resource = createAudioResource(finalAudio);
                player.play(resource);
                connection.subscribe(player);
                
                // Usa editReply invece di reply
                await interaction.editReply("con piacere");
            } else {
                await interaction.editReply("marco non sa in che cazzo di canale deve entrare coglione.");
            }
        } catch (error) {
            console.error(error);
            // Usa editReply anche per gli errori
            await interaction.editReply("Marco internal error");
        }
    }
}