<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-img
          :src="require('../assets/logo.png')"
          class="my-3"
          contain
          height="200"
        />
      </v-col>

      <v-col class="mb-4">
        <h1 class="display-2 font-weight-bold mb-3">
          Welcome to Galaxy Info
        </h1>

        <p class="subheading font-weight-regular">
          The ultimate solution to all information about Galaxy. Platform for gathering, organizing, and displaying various data. 
        </p>

        <v-btn
          to="/guilds"
          color="blurple"
          class="mx-3 my-2"
        >
          Configure Your Server
        </v-btn>
        <v-btn
          to="/ships"
          color="secondary"
          class="mx-3 my-2"
        >
          See all Ships
        </v-btn>
        <v-btn
          to="/kills"
          color="secondary"
          class="mx-3 my-2"
        >
          See Recent Kills
        </v-btn>
        <v-btn
          to="/kills/lb"
          color="secondary"
          class="mx-3 my-2"
        >
          Check Leaderboards
        </v-btn>
        <v-btn
          href="https://discord.gg/cx2dXax"
          target="_blank"
          color="blurple"
          class="mx-3 my-2"
        >
          Get Help&nbsp;&nbsp;<v-icon>mdi-discord</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <div
      style="max-width: 70%;"
      class="mx-auto"
    >
      <h2 class="display-1 font-weight-heavy text-center">
        Why Galaxy Info?
      </h2>

      <div
        v-for="item in features"
        :key="item[0]"
      >
        <hr class="my-4">
        <v-row>
          <v-col sm="6">
            <h3 class="display-1 font-weight-bold mb-3">
              {{ item[0] }}
            </h3>
            <ul
              v-for="reason in item[2]"
              :key="reason"
            >
              <li>{{ reason }}</li>
            </ul>
          </v-col>
          <v-col sm="6">
            <v-img
              :src="item[1]"
              contain
              class="marketing-image"
              style="height: 100%;"
            />
          </v-col>
        </v-row>
      </div>
    </div>
  </v-container>
</template>

<script>
export default {
  name: 'Home',
  data () {
    return {
      features: [
        [
          'Ships',
          require('@/assets/marketing/ships.png'),
          [
            'Galaxy Info can display information on any ship in the game.',
            'All information is up-to-date and accurate, with information pulled directly from the game assets.',
            'Integrated with ship kills to provide stats such as average kill/death ratio with a given ship.',
            'Detailed DPS breakdowns: Galaxy Info calculates the damage across shield and hull of every weapon of every ship. It is the most powerful ship information solution ever created.'
          ]
        ],
        [
          'Kills',
          require('@/assets/marketing/kills.png'),
          [
            'Ingests logs from #ship-kills in the official Galaxy Discord server.',
            'Automatically handles refunds when they are accepted.',
            'When your faction member gets a kill, it logs the kill in your own server.',
            'Some creative users have set their members to people they want to kill, then configured the bot to alert them when their target gets a kill.'
          ]
        ]
      ]
    }
  }
}
</script>

<style scoped>
  @media only screen and (max-width: 959) {
    .marketing-image {
      width: 100%;
    }
  }
  @media only screen and (min-width: 960) {
    .marketing-image {
      width: 50%;
    }
  }
</style>