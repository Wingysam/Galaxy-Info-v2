<template>
  <div>
    <v-btn
      class="ma-4"
      :loading="!guild.loaded"
      @click="reloadData"
    >
      Refresh
    </v-btn>
    <div
      v-if="error"
      class="ma-8"
    >
      <p style="color: red;">
        {{ error }}
      </p>
      <p>An error occured, please contact Wingy#3538 on Discord or reload the page.</p>
    </div>
    <GuildNav
      v-else
      :guild="guild"
    >
      <div class="mr-4">
        <div
          v-if="forceRequired"
          class="mb-4"
        >
          <p><v-icon>mdi-alert</v-icon> The configuration was updated while you were editing. Overwrite changes?</p>
          <v-btn
            color="red"
            :loading="saving"
            @click="save(true)"
          >
            <span class="mr-2">Save anyway</span>
          </v-btn>
        </div>
        <v-btn
          v-else
          color="primary"
          class="mb-4" 
          :loading="saving"
          @click="save()"
        >
          <span class="mr-2">Save</span>
          <v-icon>mdi-floppy</v-icon>
        </v-btn>
        <pre class="mb-4 d-none"><code style="display: block; overflow-x: scroll;">{{ JSON.stringify(guild, (key, value) => typeof value === "bigint" ? value.toString() + "n" : value, 2) }}</code></pre>
        <div v-if="section === 'general'">
          <h2 class="display-1 font-weight-bold mb-3">
            General
          </h2>
          <h3 class="mb-3">
            Members (one roblox id per line)
          </h3>
          <RobloxUserIdArrayInput v-model="guild.config.members" />
        </div>
        <div v-else-if="section === 'commands'">
          <h2 class="display-1 font-weight-bold mb-3">
            Commands
          </h2>
          <v-card class="pa-4">
            <h3 class="display-1 font-weight-light mb-2">
              /ship
            </h3>
            <v-radio-group
              v-model="guild.config.command_ship_image_placement"
              label="Image Placement"
            >
              <v-radio
                label="Don't show an image"
                value="none"
              />
              <v-radio
                label="Upload it above the embed"
                value="upload"
              />
              <v-radio
                label="Put it at the bottom of the embed"
                value="embed"
              />
            </v-radio-group>
          </v-card>
        </div>
        <div v-else-if="section === 'channels'">
          <h2 class="display-1 font-weight-bold mb-3">
            Channels
          </h2>
          <v-row>
            <v-col style="flex-grow: 0; white-space: nowrap;">
              <v-radio-group
                v-model="selectedChannel"
                mandatory
                class="mt-0"
              >
                <v-radio
                  v-for="channel in guild.channels"
                  :key="channel.id.toString()"
                  :label="'#' + channel.name"
                  :value="channel"
                />
              </v-radio-group>
            </v-col>
            <v-col>
              <v-card class="pa-4">
                <h3 class="display-1 font-weight-light mb-2">
                  #{{ selectedChannel.name }}
                </h3>
                <h4 class="mb-4">
                  General
                </h4>
                <v-switch
                  v-model="selectedChannel.config.commands"
                  class="mt-0"
                  label="Show command results"
                />
                <h4 class="mb-4">
                  Kill Log
                </h4>
                <v-switch
                  v-model="selectedChannel.config.kill_log_enabled"
                  class="mt-0"
                  label="This is a kill log channel"
                />
                <v-switch
                  v-model="selectedChannel.config.kill_log_embed"
                  class="mt-0"
                  label="Place the message in an embed"
                />
                <v-switch
                  v-model="selectedChannel.config.kill_log_pin_limiteds"
                  class="mt-0"
                  label="Automatically pin limited kills/deaths"
                />
                <v-switch
                  v-model="selectedChannel.config.kill_log_members"
                  class="mt-0"
                  label="Include all of your members in this kill log"
                />
                <v-switch v-if="process.env.VUE_APP_DISABLE_KILLS !== 'true'"
                  v-model="selectedChannel.config.kill_log_include_all"
                  class="mt-0"
                  label="Include everyone in this kill log"
                />
                <h5 class="mb-4">
                  Custom users
                </h5>
                <p>Include these users in this kill log (one roblox id per line)</p>
                <RobloxUserIdArrayInput v-model="selectedChannel.config.kill_log_custom_users" />
                <h5 class="mb-4">
                  Templates
                </h5>
                <v-text-field
                  v-model="selectedChannel.config.kill_log_template_normal"
                  class="mt-0"
                  label="Normal"
                />
                <v-text-field
                  v-model="selectedChannel.config.kill_log_template_nuke"
                  class="mt-0"
                  label="Nuke"
                />
                <h5 class="mb-4">
                  Classes
                </h5>
                <p class="my-4">
                  When you kill a build menu ship
                </p>
                <v-row>
                  <v-col
                    v-for="shipClass in shipClasses"
                    :key="shipClass"
                    class="pa-0 ml-2"
                    style="flex-grow: 0;"
                  >
                    <v-checkbox
                      v-model="selectedChannel.config.kill_log_bm_kill_classes"
                      :label="shipClass.replace('_', ' ')"
                      :value="shipClass"
                      style="width: 15em;"
                    />
                  </v-col>
                </v-row>
                <p class="my-4">
                  When you kill a limited ship
                </p>
                <v-row>
                  <v-col
                    v-for="shipClass in shipClasses"
                    :key="shipClass"
                    class="pa-0 ml-2"
                    style="flex-grow: 0;"
                  >
                    <v-checkbox
                      v-model="selectedChannel.config.kill_log_limited_kill_classes"
                      :label="shipClass.replace('_', ' ')"
                      :value="shipClass"
                      style="width: 15em;"
                    />
                  </v-col>
                </v-row>
                <p class="my-4">
                  When you lose a build menu ship
                </p>
                <v-row>
                  <v-col
                    v-for="shipClass in shipClasses"
                    :key="shipClass"
                    class="pa-0 ml-2"
                    style="flex-grow: 0;"
                  >
                    <v-checkbox
                      v-model="selectedChannel.config.kill_log_bm_death_classes"
                      :label="shipClass.replace('_', ' ')"
                      :value="shipClass"
                      style="width: 15em;"
                    />
                  </v-col>
                </v-row>
                <p class="my-4">
                  When you lose a limited ship
                </p>
                <v-row>
                  <v-col
                    v-for="shipClass in shipClasses"
                    :key="shipClass"
                    class="pa-0 ml-2"
                    style="flex-grow: 0;"
                  >
                    <v-checkbox
                      v-model="selectedChannel.config.kill_log_limited_death_classes"
                      :label="shipClass.replace('_', ' ')"
                      :value="shipClass"
                      style="width: 15em;"
                    />
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>
        </div>
        <div v-else>
          <span>unknown section, pick one over there ↩️</span>
        </div>
      </div>
    </GuildNav>
  </div>
</template>

<script>
import GuildNav from '@/components/GuildNav.vue'
import RobloxUserIdArrayInput from '@/components/RobloxUserIdArrayInput.vue'

export default {
  name: 'Guild',
  components: { GuildNav, RobloxUserIdArrayInput },
  data () {
    return {
      guild: { config: {}, loaded: false },
      saving: false,
      error: null,
      forceRequired: false,
      selectedChannel: {
        config: {}
      },
      shipClasses: [
        'Miner',
        'Freighter',
        'Frigate',
        'Destroyer',
        'Cruiser',
        'Battlecruiser',
        'Battleship',
        'Dreadnought',
        'Carrier',
        'Super_Capital'
      ]
    }
  },
  computed: {
    section () {
      return this.$route.path.split('/')
        .filter(segment => segment) // if there's a trailing slash, filter it out
        .pop()
    }
  },
  mounted () {
    this.reloadData()
  },
  methods: {
    async reloadData () {
      this.guild.loaded = false

      const discordUser = this.$store.state.discordUser || await this.$store.state.fetchDiscordUser({ login: true })
      if (!discordUser) return console.log({ discordUser })

      const guild = await this.$api.http(`/v2/guildConfig/${this.$route.params.guildid}`)
      guild.loaded = true
      this.guild = guild

      this.error = guild.error
    },

    async save (force = false) {
      this.saving = true
      const res = await this.$api.http(`/v2/guildConfig/${this.$route.params.guildid}`, {
        post: {
          ...this.guild.config,
          channels: this.guild.channels.map(c => c.config),
          force
        }
      })

      if (res.error) return this.error = res.error
      this.forceRequired = !!res.requiresForce

      if (res.guild) {
        this.guild.config = res.guild
        for (const channel of res.channels) {
          const fullChannel = this.guild.channels.find(fullChannel => fullChannel.id === channel.id)
          if (fullChannel) fullChannel.config = channel
        }
      }

      this.saving = false
    }
  }
}
</script>