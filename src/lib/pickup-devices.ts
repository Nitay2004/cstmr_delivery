export const PICKUP_DEVICE_FIELDS = [
  { key: "accessPoint", label: "Access Point" },
  { key: "desktop", label: "Desktop" },
  { key: "ipTelephonyEpbxDevices", label: "IP Telephony / EPBX Devices" },
  { key: "laptop", label: "Laptop" },
  { key: "mixEWaste", label: "Mix E-Waste" },
  { key: "mixPeripherals", label: "Mix Peripherals" },
  { key: "mobile", label: "Mobile" },
  { key: "router", label: "Router" },
  { key: "server", label: "Server" },
  { key: "switch", label: "Switch" },
  { key: "tablet", label: "Tablet" },
  { key: "tftMonitor", label: "TFT / Monitor" },
] as const;

export type PickupDeviceKey = (typeof PICKUP_DEVICE_FIELDS)[number]["key"];