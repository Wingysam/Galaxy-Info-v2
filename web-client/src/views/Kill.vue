<template>
  <v-container>
    <h2>Kill Details</h2>
    <v-btn
      to="/kills"
      class="my-2"
    >
      &lt; Recent Kills
    </v-btn>
    <v-row>
      <v-col>
        <DataCard
          title="Killer"
          :loading="!loaded"
          :data="[
            ['Name', kill.killer_name],
            ['Ship', kill.killer_ship],
            ['Class', kill.killer_class],
            ['Nuke', kill.nuke === undefined ? undefined : kill.nuke ? 'Yes' : 'No']
          ]"
        />
      </v-col>
      <v-col>
        <DataCard
          title="Victim"
          :loading="!loaded"
          :data="[
            ['Name', kill.victim_name],
            ['Ship', kill.victim_ship],
            ['Class', kill.victim_class],
            ['Value', kill.victim_cost]
          ]"
        />
      </v-col>
      <v-col>
        <v-container>
          <v-card class="pa-4">
            <v-card-title>Info</v-card-title>
            <v-switch
              v-model="kill.refunded"
              label="Refunded"
              :loading="!loaded || savingRefund"
              :readonly="!isAdmin || !kill.refunded_override || savingRefund"
              @change="updateRefundOverride"
            />
            <v-checkbox
              v-model="kill.refunded_override"
              label="Refunded Override"
              :indeterminate="!loaded || savingRefund"
              :readonly="!isAdmin || savingRefund"
              :title="(kill && kill.refunded_override_history && kill.refunded_override_history.length) ? `Refund Override last set by ${kill.refunded_override_history[kill.refunded_override_history.length - 1].admin}` : 'Refund never overrided'"
              @change="updateRefundOverride"
            />
          </v-card>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import DataCard from '@/components/DataCard.vue'

export default {
  name: "Kill",
  components: { DataCard },
  data() {
    return {
      kill: {},
      loaded: false,
      isAdmin: false,
      savingRefund: false
    };
  },
  mounted() {
    (async () => {
      await this.updateKill();
      this.loaded = true
    })();
  },
  methods: {
    async updateKill() {
      try {
        const { kill, isAdmin } = await this.$api.http(
          `/v2/kills/${encodeURIComponent(this.$route.params.kill)}`
        );
        console.log(kill)
        kill.id = kill.id.toString()
        this.kill = kill
        this.isAdmin = isAdmin
      } catch (error) {
        console.error(error)
      }
    },

    async updateRefundOverride () {
      this.savingRefund = true
      const { kill } = await this.$api.http(`/v2/kills/${encodeURIComponent(this.$route.params.kill)}/refund`, {
        post: {
          refunded_override: this.kill.refunded_override,
          refunded: this.kill.refunded
        }
      })
      this.savingRefund = false
      this.kill = kill
    }
  }
};
</script>