<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full">
      <div class="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <h2 class="text-xl font-bold text-white">API Keys</h2>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>

      <div class="p-6 space-y-4">
        <button
          @click="showCreateForm = true"
          class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
        >
          + Create New Key
        </button>

        <div v-if="showCreateForm" class="space-y-4 pt-4 border-t border-slate-700">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Key Name</label>
            <input
              v-model="newKey.name"
              type="text"
              placeholder="My API Key"
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Expiration</label>
            <select
              v-model="newKey.expiration"
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="1day">1 Day</option>
              <option value="1week">1 Week</option>
              <option value="1month">1 Month</option>
              <option value="1year">1 Year</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          <div v-if="newKey.expiration === 'custom'">
            <label class="block text-sm font-medium text-slate-300 mb-2">Custom Date</label>
            <input
              v-model="newKey.customDate"
              type="date"
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div class="flex gap-3 pt-4">
            <button
              @click="createKey"
              class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Create
            </button>
            <button
              @click="showCreateForm = false"
              class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineEmits(['close'])

const showCreateForm = ref(false)
const newKey = ref({
  name: '',
  expiration: '1month',
  customDate: ''
})

const createKey = () => {
  console.log('Creating API key:', newKey.value)
  showCreateForm.value = false
  newKey.value = { name: '', expiration: '1month', customDate: '' }
}
</script>
