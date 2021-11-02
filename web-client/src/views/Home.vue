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
          The ultimate solution to all information about Galaxy. Service for gathering, organizing, and displaying various data. 
        </p>

        <v-btn href="/login" color="blurple" class="mx-3 my-2">Configure your server</v-btn>
        <v-btn href="/commands" color="secondary" class="mx-3 my-2">View commands</v-btn>
        <v-btn href="/ships" color="secondary" class="mx-3 my-2">See all ships</v-btn>
        <v-btn href="/ships" color="secondary" class="mx-3 my-2">Check Leaderboards</v-btn>
        <v-btn href="/ships" color="blurple" class="mx-3 my-2">Get Help <v-icon>mdi-discord</v-icon></v-btn>
      </v-col>
    </v-row>
    <v-row class="text-center">
      <v-col>
        <v-container>
          <h2 class="display-1 font-weight-bold mb-3">
            Ships
          </h2>
          <v-img
            :src="require('@/assets/marketing/ships.png')"
            max-width="650"
            class="mx-auto"
          />
        </v-container>
      </v-col>
      <v-col>
        <v-container>
          <h2 class="display-1 font-weight-bold mb-3">
            Kills
          </h2>
          <v-img
            :src="require('@/assets/marketing/kills.png')"
            max-width="650"
            class="mx-auto"
          />
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'Home',
  components: {
  }
}
</script>
