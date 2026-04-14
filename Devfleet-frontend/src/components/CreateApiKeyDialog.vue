<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { agentAPI } from "@/api/apis";
import { showAPIToast } from "@/composables/showApiToast";
import { handleApiError } from "@/composables/errorHandler";

const INSTALL_SCRIPT_URL =
  "https://raw.githubusercontent.com/eviltwin7648/Devfleet-agent/refs/heads/main/install.sh";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits(["update:open", "created"]);

const form = ref({
  name: "",
  expiration: "1month",
  customDate: "",
});
const submitting = ref(false);
const generatedKey = ref("");
const copiedField = ref<"apiKey" | "command" | null>(null);

const calculateExpiration = (expiration: string, customDate: string) => {
  const now = new Date();
  switch (expiration) {
    case "1day":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "1week":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "1month":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case "1year":
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    case "custom":
      return new Date(customDate);
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
};

const onboardingCommand = computed(() =>
  generatedKey.value
    ? `curl -fsSL ${INSTALL_SCRIPT_URL} | bash -s -- '${generatedKey.value}'`
    : ""
);

const resetState = () => {
  form.value = {
    name: "",
    expiration: "1month",
    customDate: "",
  };
  submitting.value = false;
  generatedKey.value = "";
  copiedField.value = null;
};

watch(
  () => props.open,
  (open) => {
    if (!open) resetState();
  }
);

const copyText = async (value: string, field: "apiKey" | "command") => {
  try {
    await navigator.clipboard.writeText(value);
    copiedField.value = field;
    window.setTimeout(() => {
      if (copiedField.value === field) copiedField.value = null;
    }, 1800);
  } catch {
    showAPIToast({ status: 500, message: "Failed to copy to clipboard" });
  }
};

const handleCreate = async () => {
  if (submitting.value) return;

  const expiresAt = calculateExpiration(
    form.value.expiration,
    form.value.customDate
  );

  if (isNaN(expiresAt.getTime())) {
    showAPIToast({ status: 400, message: "Please provide a valid expiration date" });
    return;
  }

  submitting.value = true;
  try {
    const res = await agentAPI.getApiKey(expiresAt.toISOString(), form.value.name);
    generatedKey.value = (res.data as any)?.apiKey || "";
    emit("created", generatedKey.value);
  } catch (err) {
    const normalized = handleApiError(err);
    showAPIToast(normalized);
  } finally {
    submitting.value = false;
  }
};

const closeDialog = () => emit("update:open", false);
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[720px] border-white/10 bg-[#101013]">
      <DialogHeader>
        <DialogTitle class="text-[#F5F5F5]">
          {{ generatedKey ? "Agent Key Ready" : "Create API Key" }}
        </DialogTitle>
        <DialogDescription class="text-[#8A8A8F]">
          {{
            generatedKey
              ? "Use this key once to install and register a new agent."
              : "Name the key, choose how long it stays valid, then generate the onboarding command."
          }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="!generatedKey" class="grid gap-5 py-2">
        <div class="grid gap-2">
          <Label for="keyName">Key Name</Label>
          <Input
            id="keyName"
            v-model="form.name"
            placeholder="Production runner"
            class="border-white/10 bg-[#151518] text-[#E6E6E6]"
            required
          />
        </div>

        <div class="grid gap-2">
          <Label for="expiration">Validity</Label>
          <Select v-model="form.expiration">
            <SelectTrigger id="expiration" class="border-white/10 bg-[#151518] text-[#E6E6E6]">
              <SelectValue placeholder="Select expiration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1day">1 Day</SelectItem>
              <SelectItem value="1week">1 Week</SelectItem>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
              <SelectItem value="custom">Custom Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="form.expiration === 'custom'" class="grid gap-2">
          <Label for="customDate">Custom Expiration Date</Label>
          <Input
            id="customDate"
            v-model="form.customDate"
            type="date"
            class="border-white/10 bg-[#151518] text-[#E6E6E6]"
            required
          />
        </div>
      </div>

      <div v-else class="grid gap-5 py-2">
        <div class="rounded-xl border border-[#4ADE80]/20 bg-[#4ADE80]/[0.06] p-4">
          <p class="text-[11px] uppercase tracking-[0.2em] text-[#86EFAC]">API Key</p>
          <div class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <code class="block break-all rounded-lg border border-white/8 bg-black/20 px-3 py-3 font-mono text-[12px] text-[#F5F5F5]">
              {{ generatedKey }}
            </code>
            <Button type="button" variant="outline" @click="copyText(generatedKey, 'apiKey')">
              {{ copiedField === "apiKey" ? "Copied" : "Copy Key" }}
            </Button>
          </div>
          <p class="mt-2 text-[11px] text-[#A7F3D0]">
            This key is shown once. Save it now or use the install command below immediately.
          </p>
        </div>

        <div class="rounded-xl border border-white/10 bg-[#151518] p-4">
          <p class="text-[11px] uppercase tracking-[0.2em] text-[#8A8A8F]">Install Command</p>
          <p class="mt-2 text-[12px] text-[#A1A1AA]">
            Run this on the machine you want to register as a DevFleet agent.
          </p>
          <div class="mt-3 flex flex-col gap-3">
            <code class="block overflow-x-auto rounded-lg border border-white/8 bg-black/20 px-3 py-3 font-mono text-[12px] text-[#F5F5F5]">
              {{ onboardingCommand }}
            </code>
            <div class="flex flex-wrap gap-2">
              <Button type="button" variant="outline" @click="copyText(onboardingCommand, 'command')">
                {{ copiedField === "command" ? "Copied" : "Copy Command" }}
              </Button>
              <Button type="button" @click="closeDialog">Done</Button>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter v-if="!generatedKey">
        <DialogClose as-child>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="button" :disabled="submitting" @click="handleCreate">
          {{ submitting ? "Generating..." : "Generate Key" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
